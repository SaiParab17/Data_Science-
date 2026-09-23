"""
DataWatch — Data Quality Scoring Service
Calculates deterministic data quality scores (0-100) across 4 core dimensions:
Completeness, Uniqueness, Validity, and Schema Compliance.
Computes dimensional scores, normalized overall score, and major deductions breakdown.
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from models.quality_models import (
    QualityDimension,
    ValidationCheckStatus,
    QualityStatus,
    QualityCheckResult,
    DimensionScore,
    ScoreDeduction,
    DataQualityResult,
)

DEFAULT_DIMENSION_WEIGHTS: Dict[QualityDimension, float] = {
    QualityDimension.COMPLETENESS: 0.30,
    QualityDimension.VALIDITY: 0.30,
    QualityDimension.SCHEMA_COMPLIANCE: 0.25,
    QualityDimension.UNIQUENESS: 0.15,
}

DEFAULT_STATUS_THRESHOLDS = {
    "good": 85.0,
    "warning": 70.0,
}


class QualityScoringService:
    """
    Dedicated service for scoring data quality results.
    Separated from GX execution and drift analysis.
    """

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        good_threshold: float = 85.0,
        warning_threshold: float = 70.0,
    ):
        """
        :param weights: Optional dictionary of weights for each dimension.
        :param good_threshold: Overall score threshold for GOOD status (default 85.0).
        :param warning_threshold: Overall score threshold for NEEDS_ATTENTION status (default 70.0).
        """
        self.weights = self._parse_weights(weights)
        self.good_threshold = good_threshold
        self.warning_threshold = warning_threshold

    def _parse_weights(self, custom_weights: Optional[Dict[str, float]]) -> Dict[QualityDimension, float]:
        """Normalize weights to sum to 1.0."""
        base = dict(DEFAULT_DIMENSION_WEIGHTS)
        if custom_weights:
            for k, v in custom_weights.items():
                try:
                    dim = QualityDimension(k.lower())
                    base[dim] = max(0.0, float(v))
                except (ValueError, TypeError):
                    continue

        total = sum(base.values())
        if total > 0:
            return {k: v / total for k, v in base.items()}
        return dict(DEFAULT_DIMENSION_WEIGHTS)

    def calculate_score(
        self,
        checks: List[QualityCheckResult],
        dataset_name: str = "Dataset",
    ) -> DataQualityResult:
        """
        Calculate overall and dimensional quality scores from validation checks.
        Handles empty checks, missing dimensions, and deductions cleanly.
        """
        if not checks:
            # Handle empty checks gracefully
            empty_dims = {
                dim.value: DimensionScore(
                    dimension=dim,
                    score=0.0,
                    weight=self.weights.get(dim, 0.25),
                    passed_checks=0,
                    failed_checks=0,
                    total_checks=0,
                )
                for dim in QualityDimension
            }
            return DataQualityResult(
                dataset_name=dataset_name,
                overall_score=0.0,
                status=QualityStatus.POOR,
                dimensions=empty_dims,
                passed_checks=0,
                failed_checks=0,
                total_checks=0,
                checks=[],
                major_deductions=[
                    ScoreDeduction(
                        dimension=QualityDimension.SCHEMA_COMPLIANCE,
                        column_name=None,
                        check_name="no_checks_configured",
                        reason="No quality validation checks were configured or evaluated.",
                        points_deducted=100.0,
                    )
                ],
                validation_timestamp=datetime.now(timezone.utc).isoformat(),
            )

        # 1. Group checks by dimension
        dim_checks: Dict[QualityDimension, List[QualityCheckResult]] = {
            dim: [] for dim in QualityDimension
        }
        for chk in checks:
            dim_checks.setdefault(chk.dimension, []).append(chk)

        # 2. Identify active dimensions (those with at least 1 check)
        active_dims = [dim for dim, chk_list in dim_checks.items() if len(chk_list) > 0]

        # Calculate sum of base weights for active dimensions
        active_weight_sum = sum(self.weights.get(dim, 0.0) for dim in active_dims)
        
        # 3. Calculate dimension scores and normalized weights
        dimension_scores: Dict[str, DimensionScore] = {}
        normalized_active_weights: Dict[QualityDimension, float] = {}

        for dim in QualityDimension:
            chk_list = dim_checks.get(dim, [])
            total_checks = len(chk_list)
            passed = sum(1 for c in chk_list if c.status == ValidationCheckStatus.PASSED)
            failed = total_checks - passed

            if total_checks > 0:
                dim_score = round(sum(c.score for c in chk_list) / total_checks, 1)
                # Re-normalized weight among active dimensions
                norm_w = (self.weights.get(dim, 0.0) / active_weight_sum) if active_weight_sum > 0 else 0.0
            else:
                dim_score = 100.0  # Unavailable dimension has no failures
                norm_w = 0.0

            normalized_active_weights[dim] = norm_w
            dimension_scores[dim.value] = DimensionScore(
                dimension=dim,
                score=dim_score,
                weight=round(self.weights.get(dim, 0.0), 3),
                passed_checks=passed,
                failed_checks=failed,
                total_checks=total_checks,
            )

        # 4. Calculate overall weighted score
        if active_dims and active_weight_sum > 0:
            overall_score = sum(
                dimension_scores[dim.value].score * normalized_active_weights[dim]
                for dim in active_dims
            )
            overall_score = round(max(0.0, min(100.0, overall_score)), 1)
        else:
            overall_score = 0.0

        # 5. Classify overall quality status
        if overall_score >= self.good_threshold:
            status = QualityStatus.GOOD
        elif overall_score >= self.warning_threshold:
            status = QualityStatus.NEEDS_ATTENTION
        else:
            status = QualityStatus.POOR

        # 6. Compute score deductions and explanations
        deductions: List[ScoreDeduction] = []
        for dim in active_dims:
            chk_list = dim_checks[dim]
            norm_w = normalized_active_weights[dim]
            n_checks = len(chk_list)

            for chk in chk_list:
                if chk.status != ValidationCheckStatus.PASSED or chk.score < 100.0:
                    pts_lost_in_check = 100.0 - chk.score
                    # Impact on overall score: norm_w * (pts_lost / n_checks)
                    overall_pts_deducted = round(norm_w * (pts_lost_in_check / n_checks), 2)

                    reason = chk.failure_message or f"{chk.check_name} failed expected condition: {chk.expected_condition}"
                    deductions.append(
                        ScoreDeduction(
                            dimension=chk.dimension,
                            column_name=chk.column_name,
                            check_name=chk.check_name,
                            reason=reason,
                            points_deducted=overall_pts_deducted,
                        )
                    )

        # Sort deductions by impact on overall score descending
        deductions.sort(key=lambda d: d.points_deducted, reverse=True)

        total_passed = sum(1 for c in checks if c.status == ValidationCheckStatus.PASSED)
        total_failed = len(checks) - total_passed

        return DataQualityResult(
            dataset_name=dataset_name,
            overall_score=overall_score,
            status=status,
            dimensions=dimension_scores,
            passed_checks=total_passed,
            failed_checks=total_failed,
            total_checks=len(checks),
            checks=checks,
            major_deductions=deductions,
            validation_timestamp=datetime.now(timezone.utc).isoformat(),
        )
