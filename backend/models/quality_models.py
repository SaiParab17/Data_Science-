"""
DataWatch — Data Quality Models (Pydantic schemas)
Defines structured schemas for Great Expectations validation results,
individual dimensions, scoring breakdowns, and status classifications.
"""
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class QualityDimension(str, Enum):
    COMPLETENESS = "completeness"
    UNIQUENESS = "uniqueness"
    VALIDITY = "validity"
    SCHEMA_COMPLIANCE = "schema_compliance"


class ValidationCheckStatus(str, Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    WARNING = "WARNING"


class QualityStatus(str, Enum):
    GOOD = "Good"
    NEEDS_ATTENTION = "Needs Attention"
    POOR = "Poor"


class QualityCheckResult(BaseModel):
    check_id: str
    check_name: str
    dimension: QualityDimension
    column_name: Optional[str] = None
    status: ValidationCheckStatus
    observed_value: Optional[Any] = None
    expected_condition: str
    failure_message: Optional[str] = None
    unexpected_count: int = 0
    unexpected_percent: float = 0.0
    score: float = 100.0


class DimensionScore(BaseModel):
    dimension: QualityDimension
    score: float
    weight: float
    passed_checks: int
    failed_checks: int
    total_checks: int


class ScoreDeduction(BaseModel):
    dimension: QualityDimension
    column_name: Optional[str] = None
    check_name: str
    reason: str
    points_deducted: float


class DataQualityResult(BaseModel):
    dataset_name: str = "Dataset"
    overall_score: float
    status: QualityStatus
    dimensions: Dict[str, DimensionScore]
    passed_checks: int
    failed_checks: int
    total_checks: int
    checks: List[QualityCheckResult]
    major_deductions: List[ScoreDeduction] = Field(default_factory=list)
    validation_timestamp: str


class ValidationRuleConfig(BaseModel):
    """Optional explicit rule overrides for GX validation."""
    required_columns: Optional[List[str]] = None
    column_types: Optional[Dict[str, str]] = None
    not_null_columns: Optional[List[str]] = None
    numeric_ranges: Optional[Dict[str, Dict[str, float]]] = None  # {col: {"min": x, "max": y}}
    allowed_categories: Optional[Dict[str, List[str]]] = None
    unique_columns: Optional[List[str]] = None
    check_duplicate_rows: bool = True
