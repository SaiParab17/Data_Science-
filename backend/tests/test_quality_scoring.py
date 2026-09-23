"""
DataWatch — Quality Scoring Service Tests
Verifies deterministic quality scoring, dimensional calculations, configurable weights,
deduction explanations, and edge cases.
"""
import pytest
from services.quality_scoring_service import QualityScoringService
from models.quality_models import (
    QualityDimension,
    ValidationCheckStatus,
    QualityStatus,
    QualityCheckResult,
)


def _make_check(
    check_id: str,
    dimension: QualityDimension,
    status: ValidationCheckStatus,
    score: float,
    unexpected_percent: float = 0.0,
    column_name: str = "col",
    failure_message: str = None,
) -> QualityCheckResult:
    return QualityCheckResult(
        check_id=check_id,
        check_name=f"test_{dimension.value}_check",
        dimension=dimension,
        column_name=column_name,
        status=status,
        observed_value="test_val",
        expected_condition="test_condition",
        failure_message=failure_message,
        unexpected_count=int(unexpected_percent),
        unexpected_percent=unexpected_percent,
        score=score,
    )


def test_score_all_checks_pass():
    """When all checks pass (score 100), overall score is 100 and status is Good."""
    checks = [
        _make_check("c1", QualityDimension.COMPLETENESS, ValidationCheckStatus.PASSED, 100.0),
        _make_check("c2", QualityDimension.VALIDITY, ValidationCheckStatus.PASSED, 100.0),
        _make_check("c3", QualityDimension.SCHEMA_COMPLIANCE, ValidationCheckStatus.PASSED, 100.0),
        _make_check("c4", QualityDimension.UNIQUENESS, ValidationCheckStatus.PASSED, 100.0),
    ]

    scorer = QualityScoringService()
    result = scorer.calculate_score(checks, dataset_name="Test")

    assert result.overall_score == 100.0
    assert result.status == QualityStatus.GOOD
    assert result.passed_checks == 4
    assert result.failed_checks == 0
    assert len(result.major_deductions) == 0
    for dim_score in result.dimensions.values():
        assert dim_score.score == 100.0


def test_score_predictable_decrease_on_failure():
    """Score decreases predictably according to formula and dimension weights."""
    # Default weights: Completeness=0.30, Validity=0.30, Schema=0.25, Uniqueness=0.15
    # If 1 Completeness check fails completely (score 0), Completeness dimension drops to 0.
    # Total deduction should be 30.0 points -> overall score 70.0.
    checks = [
        _make_check("c1", QualityDimension.COMPLETENESS, ValidationCheckStatus.FAILED, 0.0, 100.0, "null_col", "100% nulls"),
        _make_check("c2", QualityDimension.VALIDITY, ValidationCheckStatus.PASSED, 100.0),
        _make_check("c3", QualityDimension.SCHEMA_COMPLIANCE, ValidationCheckStatus.PASSED, 100.0),
        _make_check("c4", QualityDimension.UNIQUENESS, ValidationCheckStatus.PASSED, 100.0),
    ]

    scorer = QualityScoringService()
    result = scorer.calculate_score(checks)

    assert result.overall_score == 70.0
    assert result.status == QualityStatus.NEEDS_ATTENTION
    assert result.dimensions["completeness"].score == 0.0
    assert result.dimensions["validity"].score == 100.0
    assert len(result.major_deductions) == 1
    assert result.major_deductions[0].points_deducted == 30.0
    assert "100% nulls" in result.major_deductions[0].reason


def test_score_all_checks_fail():
    """When all checks fail with 0 score, overall score is 0.0 and status is Poor."""
    checks = [
        _make_check("c1", QualityDimension.COMPLETENESS, ValidationCheckStatus.FAILED, 0.0, 100.0),
        _make_check("c2", QualityDimension.VALIDITY, ValidationCheckStatus.FAILED, 0.0, 100.0),
        _make_check("c3", QualityDimension.SCHEMA_COMPLIANCE, ValidationCheckStatus.FAILED, 0.0, 100.0),
        _make_check("c4", QualityDimension.UNIQUENESS, ValidationCheckStatus.FAILED, 0.0, 100.0),
    ]

    scorer = QualityScoringService()
    result = scorer.calculate_score(checks)

    assert result.overall_score == 0.0
    assert result.status == QualityStatus.POOR
    assert result.passed_checks == 0
    assert result.failed_checks == 4


def test_score_configurable_weights():
    """Custom weights change the final score proportionally."""
    # Let Validity be 80% and Completeness be 20%
    custom_weights = {
        "validity": 0.80,
        "completeness": 0.20,
        "schema_compliance": 0.0,
        "uniqueness": 0.0,
    }
    # Completeness fails (score 0), Validity passes (score 100)
    checks = [
        _make_check("c1", QualityDimension.COMPLETENESS, ValidationCheckStatus.FAILED, 0.0, 100.0),
        _make_check("c2", QualityDimension.VALIDITY, ValidationCheckStatus.PASSED, 100.0),
    ]

    scorer = QualityScoringService(weights=custom_weights)
    result = scorer.calculate_score(checks)

    # Score should be 0.80 * 100 + 0.20 * 0 = 80.0
    assert result.overall_score == 80.0
    assert result.status == QualityStatus.NEEDS_ATTENTION


def test_score_missing_or_unavailable_dimensions():
    """If some dimensions have no checks, active dimension weights are re-normalized without error."""
    # Only Completeness and Validity checks exist
    checks = [
        _make_check("c1", QualityDimension.COMPLETENESS, ValidationCheckStatus.PASSED, 100.0),
        _make_check("c2", QualityDimension.VALIDITY, ValidationCheckStatus.PASSED, 100.0),
    ]

    scorer = QualityScoringService()
    result = scorer.calculate_score(checks)

    assert result.overall_score == 100.0
    assert result.status == QualityStatus.GOOD
    assert result.dimensions["uniqueness"].total_checks == 0


def test_score_empty_dataset_handling():
    """Handling an empty checks list returns score 0 without raising exceptions."""
    scorer = QualityScoringService()
    result = scorer.calculate_score([])

    assert result.overall_score == 0.0
    assert result.status == QualityStatus.POOR
    assert result.total_checks == 0


def test_score_consistent_across_runs():
    """Repeated runs on the same checks produce identical results."""
    checks = [
        _make_check("c1", QualityDimension.COMPLETENESS, ValidationCheckStatus.PASSED, 100.0),
        _make_check("c2", QualityDimension.VALIDITY, ValidationCheckStatus.FAILED, 85.0, 15.0),
        _make_check("c3", QualityDimension.SCHEMA_COMPLIANCE, ValidationCheckStatus.PASSED, 100.0),
    ]

    scorer = QualityScoringService()
    r1 = scorer.calculate_score(checks)
    r2 = scorer.calculate_score(checks)

    assert r1.overall_score == r2.overall_score
    assert r1.status == r2.status
    assert len(r1.major_deductions) == len(r2.major_deductions)
