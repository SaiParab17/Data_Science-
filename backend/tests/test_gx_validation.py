"""
DataWatch — Great Expectations Validation Service Tests
Tests all required GX validation conditions without hardcoded dataset-specific column names.
"""
import pytest
import pandas as pd
import numpy as np

from services.gx_validation_service import GXValidationService
from models.quality_models import (
    QualityDimension,
    ValidationCheckStatus,
    ValidationRuleConfig,
)


def test_gx_fully_valid_dataset():
    """When current dataset matches reference schema, bounds, and values, all checks pass."""
    ref_df = pd.DataFrame({
        "num_a": [10.0, 20.0, 30.0, 40.0],
        "cat_b": ["alpha", "beta", "alpha", "beta"],
        "id_col": ["ID-1", "ID-2", "ID-3", "ID-4"],
    })
    cur_df = pd.DataFrame({
        "num_a": [15.0, 25.0, 35.0, 20.0],
        "cat_b": ["beta", "alpha", "beta", "alpha"],
        "id_col": ["ID-5", "ID-6", "ID-7", "ID-8"],
    })

    service = GXValidationService(numeric_margin_pct=0.20)
    checks = service.validate(current_df=cur_df, reference_df=ref_df)

    assert len(checks) > 0
    failed_checks = [c for c in checks if c.status != ValidationCheckStatus.PASSED]
    assert len(failed_checks) == 0, f"Expected 0 failures, got: {[f.check_name for f in failed_checks]}"


def test_gx_missing_required_column():
    """Detects when a required column from reference dataset is missing in current."""
    ref_df = pd.DataFrame({
        "feature_1": [1, 2, 3],
        "feature_2": [10, 20, 30],
    })
    cur_df = pd.DataFrame({
        "feature_1": [1, 2, 3],
        # feature_2 is missing
    })

    service = GXValidationService()
    checks = service.validate(current_df=cur_df, reference_df=ref_df)

    missing_col_check = [
        c for c in checks
        if c.check_name == "expect_column_to_exist" and c.column_name == "feature_2"
    ]
    assert len(missing_col_check) == 1
    assert missing_col_check[0].status == ValidationCheckStatus.FAILED
    assert "missing" in missing_col_check[0].failure_message.lower()


def test_gx_null_values_in_required_fields():
    """Detects null values in fields that were 100% complete in the reference dataset."""
    ref_df = pd.DataFrame({
        "feature_clean": [10, 20, 30, 40, 50],
    })
    cur_df = pd.DataFrame({
        "feature_clean": [10, np.nan, 30, np.nan, 50],  # 2 nulls (40%)
    })

    service = GXValidationService()
    checks = service.validate(current_df=cur_df, reference_df=ref_df)

    null_check = [
        c for c in checks
        if c.check_name == "expect_column_values_to_not_be_null"
        and c.column_name == "feature_clean"
    ]
    assert len(null_check) == 1
    assert null_check[0].status == ValidationCheckStatus.FAILED
    assert null_check[0].unexpected_count == 2
    assert null_check[0].unexpected_percent == 40.0
    assert null_check[0].dimension == QualityDimension.COMPLETENESS


def test_gx_invalid_numeric_values_range():
    """Detects values falling outside expected reference numeric ranges."""
    ref_df = pd.DataFrame({
        "metric_score": [10.0, 20.0, 30.0, 40.0, 50.0],  # range 10-50, with 10% margin [6, 54]
    })
    cur_df = pd.DataFrame({
        "metric_score": [20.0, 30.0, 999.0, -100.0, 40.0],  # 2 out of range
    })

    service = GXValidationService(numeric_margin_pct=0.10)
    checks = service.validate(current_df=cur_df, reference_df=ref_df)

    range_check = [
        c for c in checks
        if c.check_name == "expect_column_values_to_be_between"
        and c.column_name == "metric_score"
    ]
    assert len(range_check) == 1
    assert range_check[0].status == ValidationCheckStatus.FAILED
    assert range_check[0].unexpected_count == 2
    assert range_check[0].dimension == QualityDimension.VALIDITY


def test_gx_invalid_categorical_values():
    """Detects category values outside the allowed categorical set."""
    ref_df = pd.DataFrame({
        "tier": ["Bronze", "Silver", "Gold"],
    })
    cur_df = pd.DataFrame({
        "tier": ["Silver", "Platinum", "Gold", "Diamond"],  # Platinum and Diamond invalid
    })

    service = GXValidationService()
    checks = service.validate(current_df=cur_df, reference_df=ref_df)

    set_check = [
        c for c in checks
        if c.check_name == "expect_column_values_to_be_in_set"
        and c.column_name == "tier"
    ]
    assert len(set_check) == 1
    assert set_check[0].status == ValidationCheckStatus.FAILED
    assert set_check[0].unexpected_count == 2
    assert set_check[0].dimension == QualityDimension.VALIDITY


def test_gx_duplicate_rows_and_keys():
    """Detects duplicate rows and duplicate primary key values."""
    ref_df = pd.DataFrame({
        "entity_id": ["E1", "E2", "E3", "E4"],  # 100% unique in ref
        "val": [1, 2, 3, 4],
    })
    cur_df = pd.DataFrame({
        "entity_id": ["E1", "E2", "E2", "E4"],  # duplicate E2
        "val": [1, 2, 2, 4],  # duplicate row (E2, 2)
    })

    service = GXValidationService()
    checks = service.validate(current_df=cur_df, reference_df=ref_df)

    key_check = [
        c for c in checks
        if c.check_name == "expect_column_values_to_be_unique"
        and c.column_name == "entity_id"
    ]
    assert len(key_check) == 1
    assert key_check[0].status == ValidationCheckStatus.FAILED
    assert key_check[0].dimension == QualityDimension.UNIQUENESS

    row_check = [
        c for c in checks
        if c.check_name == "expect_compound_columns_to_be_unique"
    ]
    assert len(row_check) == 1
    assert row_check[0].status == ValidationCheckStatus.FAILED
    assert row_check[0].dimension == QualityDimension.UNIQUENESS


def test_gx_empty_dataset_handling():
    """Validating an empty DataFrame returns a structured failed check without crashing."""
    service = GXValidationService()
    empty_df = pd.DataFrame()
    checks = service.validate(current_df=empty_df)

    assert len(checks) == 1
    assert checks[0].status == ValidationCheckStatus.FAILED
    assert "0 rows" in checks[0].failure_message


def test_gx_explicit_rules_configuration():
    """Custom explicit rules override or supplement reference dataset expectations."""
    cur_df = pd.DataFrame({
        "code": ["A1", "B2", "INVALID"],
        "amount": [10.0, 50.0, 150.0],
    })

    rules = ValidationRuleConfig(
        required_columns=["code", "amount", "missing_flag"],
        numeric_ranges={"amount": {"min": 0.0, "max": 100.0}},
        allowed_categories={"code": ["A1", "B2"]},
        check_duplicate_rows=True,
    )

    service = GXValidationService()
    checks = service.validate(current_df=cur_df, rules_config=rules)

    missing_check = [c for c in checks if c.column_name == "missing_flag"][0]
    assert missing_check.status == ValidationCheckStatus.FAILED

    range_check = [c for c in checks if c.column_name == "amount" and c.check_name == "expect_column_values_to_be_between"][0]
    assert range_check.status == ValidationCheckStatus.FAILED
    assert range_check.unexpected_count == 1  # 150.0 is out of range

    cat_check = [c for c in checks if c.column_name == "code" and c.check_name == "expect_column_values_to_be_in_set"][0]
    assert cat_check.status == ValidationCheckStatus.FAILED
    assert cat_check.unexpected_count == 1  # 'INVALID'
