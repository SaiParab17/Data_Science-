"""
DataWatch - Drift Engine Service
Core service responsible for loading datasets and computing drift metrics.
"""
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from typing import Optional
import uuid

from models.drift_models import (
    DriftResult,
    FeatureDriftResult,
    DriftAlert,
    DriftStatus,
    DriftSeverity,
    OverallDriftStatus,
)
from utils.statistics import (
    calculate_psi,
    calculate_psi_categorical,
    calculate_ks_test,
    calculate_wasserstein,
    calculate_js_divergence_numeric,
    calculate_js_divergence_categorical,
    build_histogram_data,
)


# ─── Configuration ────────────────────────────────────────────────────────────

PSI_THRESHOLDS = {
    "stable": 0.10,
    "warning": 0.25,
}

SEVERITY_THRESHOLDS = {
    "critical": 0.30,
    "high": 0.25,
    "moderate": 0.10,
}

# Columns to treat as identifiers (skip drift analysis)
IDENTIFIER_COLUMNS = {"customerID", "customer_id", "id", "ID"}

# Max cardinality for a column to be treated as categorical
CATEGORICAL_MAX_CARDINALITY = 30


class DriftEngine:
    """
    Core drift analysis engine.
    Loads reference and current datasets, computes statistical drift
    metrics for each column, and generates alerts for threshold breaches.
    """

    def __init__(self, psi_threshold: float = 0.25):
        self.psi_threshold = psi_threshold

    def analyze(
        self,
        reference_df: pd.DataFrame,
        current_df: pd.DataFrame,
        dataset_name: str = "Dataset",
    ) -> DriftResult:
        """
        Main entry point: analyze drift between reference and current dataframes.
        Returns a complete DriftResult.
        """
        # Validate inputs
        self._validate_dataframes(reference_df, current_df)

        # Find common columns (excluding identifiers)
        common_cols = self._get_analyzable_columns(reference_df, current_df)

        feature_results = []
        alerts = []

        for col in common_cols:
            result = self._analyze_column(reference_df[col], current_df[col], col)
            feature_results.append(result)

            # Generate alert if drift or warning
            if result.status in (DriftStatus.DRIFT, DriftStatus.WARNING):
                if result.psi >= self.psi_threshold:
                    alert = self._generate_alert(result, dataset_name)
                    alerts.append(alert)

        # Sort features by PSI descending
        feature_results.sort(key=lambda x: x.psi, reverse=True)

        # Compute overall statistics
        drifted = sum(1 for r in feature_results if r.status == DriftStatus.DRIFT)
        warning = sum(1 for r in feature_results if r.status == DriftStatus.WARNING)
        stable = sum(1 for r in feature_results if r.status == DriftStatus.STABLE)
        max_psi = max((r.psi for r in feature_results), default=0.0)

        if drifted > 0:
            overall_status = OverallDriftStatus.DRIFT_DETECTED
        elif warning > 0:
            overall_status = OverallDriftStatus.WARNING
        else:
            overall_status = OverallDriftStatus.NO_DRIFT

        return DriftResult(
            dataset_name=dataset_name,
            reference_rows=len(reference_df),
            current_rows=len(current_df),
            analyzed_columns=len(feature_results),
            drifted_columns=drifted,
            warning_columns=warning,
            stable_columns=stable,
            max_psi=round(max_psi, 4),
            overall_status=overall_status,
            psi_threshold=self.psi_threshold,
            features=feature_results,
            alerts=alerts,
            analysis_timestamp=datetime.now(timezone.utc).isoformat(),
        )

    def _validate_dataframes(
        self, reference_df: pd.DataFrame, current_df: pd.DataFrame
    ) -> None:
        if len(reference_df) == 0:
            raise ValueError("Reference dataset contains no rows.")
        if len(current_df) == 0:
            raise ValueError("Current dataset contains no rows.")

        common = set(reference_df.columns) & set(current_df.columns)
        analyzable = common - IDENTIFIER_COLUMNS
        if len(analyzable) == 0:
            raise ValueError(
                "No common analyzable columns found between reference and current datasets."
            )

    def _get_analyzable_columns(
        self, reference_df: pd.DataFrame, current_df: pd.DataFrame
    ) -> list:
        common = set(reference_df.columns) & set(current_df.columns)
        return [c for c in reference_df.columns if c in common and c not in IDENTIFIER_COLUMNS]

    def _analyze_column(
        self,
        ref_series: pd.Series,
        cur_series: pd.Series,
        col_name: str,
    ) -> FeatureDriftResult:
        """Analyze drift for a single column."""
        is_numeric = self._is_numeric(ref_series)

        ref_missing = round(ref_series.isna().mean() * 100, 2)
        cur_missing = round(cur_series.isna().mean() * 100, 2)

        if is_numeric:
            return self._analyze_numeric(ref_series, cur_series, col_name, ref_missing, cur_missing)
        else:
            return self._analyze_categorical(ref_series, cur_series, col_name, ref_missing, cur_missing)

    def _is_numeric(self, series: pd.Series) -> bool:
        """Determine if a column is numeric (not categorical)."""
        if pd.api.types.is_numeric_dtype(series):
            # Even numeric columns with few unique values are categorical
            n_unique = series.nunique()
            if n_unique <= CATEGORICAL_MAX_CARDINALITY and n_unique < len(series) * 0.05:
                return False
            return True
        return False

    def _analyze_numeric(
        self,
        ref_series: pd.Series,
        cur_series: pd.Series,
        col_name: str,
        ref_missing: float,
        cur_missing: float,
    ) -> FeatureDriftResult:
        ref_arr = ref_series.dropna().values.astype(float)
        cur_arr = cur_series.dropna().values.astype(float)

        # Core metrics
        psi = calculate_psi(ref_arr, cur_arr)
        ks_stat, ks_pval = calculate_ks_test(ref_arr, cur_arr)
        wasserstein = calculate_wasserstein(ref_arr, cur_arr)
        js_div = calculate_js_divergence_numeric(ref_arr, cur_arr)

        # Descriptive stats
        ref_mean = float(np.mean(ref_arr)) if len(ref_arr) > 0 else None
        cur_mean = float(np.mean(cur_arr)) if len(cur_arr) > 0 else None
        ref_std = float(np.std(ref_arr)) if len(ref_arr) > 0 else None
        cur_std = float(np.std(cur_arr)) if len(cur_arr) > 0 else None

        mean_change_pct = None
        if ref_mean is not None and cur_mean is not None and ref_mean != 0:
            mean_change_pct = round((cur_mean - ref_mean) / abs(ref_mean) * 100, 2)

        # Histogram data for charts
        ref_hist, cur_hist = build_histogram_data(ref_arr, cur_arr)

        # Classification
        status = self._classify_status(psi)
        severity = self._classify_severity(psi)

        return FeatureDriftResult(
            column_name=col_name,
            data_type="numeric",
            psi=psi,
            ks_statistic=round(ks_stat, 4),
            ks_p_value=round(ks_pval, 4),
            wasserstein_distance=round(wasserstein, 4),
            js_divergence=round(js_div, 4),
            reference_mean=round(ref_mean, 4) if ref_mean is not None else None,
            current_mean=round(cur_mean, 4) if cur_mean is not None else None,
            reference_std=round(ref_std, 4) if ref_std is not None else None,
            current_std=round(cur_std, 4) if cur_std is not None else None,
            mean_change_percent=mean_change_pct,
            reference_missing_pct=ref_missing,
            current_missing_pct=cur_missing,
            threshold=self.psi_threshold,
            status=status,
            severity=severity,
            reference_histogram=ref_hist,
            current_histogram=cur_hist,
        )

    def _analyze_categorical(
        self,
        ref_series: pd.Series,
        cur_series: pd.Series,
        col_name: str,
        ref_missing: float,
        cur_missing: float,
    ) -> FeatureDriftResult:
        ref_series = ref_series.astype(str).replace("nan", pd.NA).dropna()
        cur_series = cur_series.astype(str).replace("nan", pd.NA).dropna()

        psi = calculate_psi_categorical(ref_series, cur_series)
        js_div = calculate_js_divergence_categorical(ref_series, cur_series)

        # Build distributions for chart
        ref_dist = ref_series.value_counts(normalize=True).round(4).to_dict()
        cur_dist = cur_series.value_counts(normalize=True).round(4).to_dict()

        status = self._classify_status(psi)
        severity = self._classify_severity(psi)

        return FeatureDriftResult(
            column_name=col_name,
            data_type="categorical",
            psi=psi,
            ks_statistic=None,
            ks_p_value=None,
            wasserstein_distance=None,
            js_divergence=round(js_div, 4),
            reference_mean=None,
            current_mean=None,
            reference_std=None,
            current_std=None,
            mean_change_percent=None,
            reference_missing_pct=ref_missing,
            current_missing_pct=cur_missing,
            threshold=self.psi_threshold,
            status=status,
            severity=severity,
            reference_distribution=ref_dist,
            current_distribution=cur_dist,
        )

    def _classify_status(self, psi: float) -> DriftStatus:
        if psi < PSI_THRESHOLDS["stable"]:
            return DriftStatus.STABLE
        elif psi < PSI_THRESHOLDS["warning"]:
            return DriftStatus.WARNING
        else:
            return DriftStatus.DRIFT

    def _classify_severity(self, psi: float) -> DriftSeverity:
        if psi < SEVERITY_THRESHOLDS["moderate"]:
            return DriftSeverity.STABLE
        elif psi < SEVERITY_THRESHOLDS["high"]:
            return DriftSeverity.MODERATE
        elif psi < SEVERITY_THRESHOLDS["critical"]:
            return DriftSeverity.HIGH
        else:
            return DriftSeverity.CRITICAL

    def _generate_alert(
        self, result: FeatureDriftResult, dataset_name: str
    ) -> DriftAlert:
        alert_id = f"DRIFT-PSI-{int(self.psi_threshold * 100):03d}-{result.column_name[:8].upper()}"
        
        return DriftAlert(
            alert_id=alert_id,
            title=f"{result.column_name} distribution drift detected",
            description=(
                f"Feature '{result.column_name}' PSI score of {result.psi:.3f} "
                f"exceeds the configured threshold of {self.psi_threshold:.3f}. "
                f"Severity classified as {result.severity.value}."
            ),
            metric="PSI",
            observed_value=result.psi,
            threshold=self.psi_threshold,
            severity=result.severity,
            dataset_name=dataset_name,
            column_name=result.column_name,
        )
