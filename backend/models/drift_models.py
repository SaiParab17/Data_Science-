"""
DataWatch - Drift Models (Pydantic schemas)
"""
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class DriftStatus(str, Enum):
    STABLE = "STABLE"
    WARNING = "WARNING"
    DRIFT = "DRIFT"


class DriftSeverity(str, Enum):
    STABLE = "Stable"
    MODERATE = "Moderate"
    HIGH = "High"
    CRITICAL = "Critical"


class OverallDriftStatus(str, Enum):
    NO_DRIFT = "NO_DRIFT"
    WARNING = "WARNING"
    DRIFT_DETECTED = "DRIFT_DETECTED"


class FeatureDriftResult(BaseModel):
    column_name: str
    data_type: str  # "numeric" or "categorical"
    psi: float
    ks_statistic: Optional[float] = None
    ks_p_value: Optional[float] = None
    wasserstein_distance: Optional[float] = None
    js_divergence: Optional[float] = None
    reference_mean: Optional[float] = None
    current_mean: Optional[float] = None
    reference_std: Optional[float] = None
    current_std: Optional[float] = None
    mean_change_percent: Optional[float] = None
    reference_missing_pct: float = 0.0
    current_missing_pct: float = 0.0
    threshold: float
    status: DriftStatus
    severity: DriftSeverity
    # For distribution chart data
    reference_histogram: Optional[List[dict]] = None
    current_histogram: Optional[List[dict]] = None
    # For categorical columns
    reference_distribution: Optional[dict] = None
    current_distribution: Optional[dict] = None


class DriftAlert(BaseModel):
    alert_id: str
    title: str
    description: str
    metric: str
    observed_value: float
    threshold: float
    severity: DriftSeverity
    dataset_name: str
    column_name: str
    run_id: str = "#1042"


class DriftResult(BaseModel):
    dataset_name: str
    reference_rows: int
    current_rows: int
    analyzed_columns: int
    drifted_columns: int
    warning_columns: int
    stable_columns: int
    max_psi: float
    overall_status: OverallDriftStatus
    psi_threshold: float
    features: List[FeatureDriftResult]
    alerts: List[DriftAlert]
    analysis_timestamp: str


class DriftAnalysisError(BaseModel):
    error: str
    detail: str
