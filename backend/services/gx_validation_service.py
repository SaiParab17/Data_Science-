"""
DataWatch — Great Expectations Validation Service
Executes data quality checks using Great Expectations 1.x in-memory context.
Infers expectations dynamically from a reference dataset or consumes explicit rules.
No dataset-specific column names are hardcoded.
"""
from typing import Optional, List, Dict, Any, Tuple
import pandas as pd
import numpy as np
import uuid

import great_expectations as gx
from models.quality_models import (
    QualityDimension,
    ValidationCheckStatus,
    QualityCheckResult,
    ValidationRuleConfig,
)


class GXValidationService:
    """
    Dedicated service for running Great Expectations validation.
    Operates completely in-memory with ephemeral DataContext.
    """

    def __init__(self, numeric_margin_pct: float = 0.10, max_category_cardinality: int = 30):
        """
        :param numeric_margin_pct: Margin added to reference min/max (e.g. 0.10 = 10% padding).
        :param max_category_cardinality: Maximum distinct values for allowed categorical sets.
        """
        self.numeric_margin_pct = numeric_margin_pct
        self.max_category_cardinality = max_category_cardinality

    def validate(
        self,
        current_df: pd.DataFrame,
        reference_df: Optional[pd.DataFrame] = None,
        rules_config: Optional[ValidationRuleConfig] = None,
    ) -> List[QualityCheckResult]:
        """
        Execute GX validation on current_df against expectations derived from
        reference_df and/or explicit rules_config.
        Returns a list of normalized QualityCheckResult objects.
        """
        if current_df is None or len(current_df) == 0:
            return [
                QualityCheckResult(
                    check_id="empty-dataset-check",
                    check_name="expect_table_row_count_to_be_greater_than_zero",
                    dimension=QualityDimension.SCHEMA_COMPLIANCE,
                    column_name=None,
                    status=ValidationCheckStatus.FAILED,
                    observed_value=0,
                    expected_condition="Dataset must contain at least 1 row",
                    failure_message="The dataset contains 0 rows.",
                    unexpected_count=0,
                    unexpected_percent=100.0,
                    score=0.0,
                )
            ]

        # 1. Initialize ephemeral GX context
        context = gx.get_context(mode="ephemeral")
        suite_id = f"suite_{uuid.uuid4().hex[:8]}"
        suite = context.suites.add(gx.ExpectationSuite(name=suite_id))

        # 2. Build expectations from reference dataset and/or explicit rules
        # Keep track of metadata mapping: expectation_type + column -> (dimension, expected_condition)
        expectations_meta: Dict[Tuple[str, Optional[str]], Dict[str, Any]] = {}

        self._build_expectations(
            suite=suite,
            expectations_meta=expectations_meta,
            reference_df=reference_df,
            current_df=current_df,
            rules_config=rules_config,
        )

        if not suite.expectations:
            return []

        # 3. Create data source, asset, batch definition and run validation
        ds_name = f"pandas_{uuid.uuid4().hex[:8]}"
        data_source = context.data_sources.add_pandas(ds_name)
        asset = data_source.add_dataframe_asset("current_asset")
        batch_def = asset.add_batch_definition_whole_dataframe("batch_all")

        val_def = context.validation_definitions.add(
            gx.ValidationDefinition(name=f"val_{uuid.uuid4().hex[:8]}", data=batch_def, suite=suite)
        )

        try:
            val_results = val_def.run(batch_parameters={"dataframe": current_df})
        except Exception as e:
            # Handle catastrophic validation execution failure gracefully
            return [
                QualityCheckResult(
                    check_id="gx-init-error",
                    check_name="gx_execution_engine",
                    dimension=QualityDimension.SCHEMA_COMPLIANCE,
                    column_name=None,
                    status=ValidationCheckStatus.FAILED,
                    observed_value="Execution Error",
                    expected_condition="Successful GX execution",
                    failure_message=f"GX validation engine failed: {str(e)}",
                    unexpected_count=len(current_df),
                    unexpected_percent=100.0,
                    score=0.0,
                )
            ]

        # 4. Normalize GX results into uniform QualityCheckResult models
        results: List[QualityCheckResult] = []
        for i, res in enumerate(val_results.results):
            cfg = res.expectation_config
            exp_type = cfg.type
            kwargs = cfg.kwargs or {}
            col = kwargs.get("column")
            if not col and "column_list" in kwargs:
                col = ", ".join(kwargs["column_list"][:3]) + ("..." if len(kwargs["column_list"]) > 3 else "")

            meta = expectations_meta.get((exp_type, col), {})
            dimension = meta.get("dimension", QualityDimension.VALIDITY)
            expected_condition = meta.get("expected_condition", str(kwargs))

            success = bool(res.success)
            res_dict = res.result or {}

            # Calculate unexpected count and percent
            unexpected_count = 0
            unexpected_percent = 0.0
            observed_val = None

            if "unexpected_count" in res_dict:
                unexpected_count = int(res_dict.get("unexpected_count", 0))
                unexpected_percent = float(res_dict.get("unexpected_percent", 0.0) or 0.0)
            elif "observed_value" in res_dict:
                observed_val = res_dict.get("observed_value")
            
            # Format observed value and failure message
            failure_message = None
            if success:
                status = ValidationCheckStatus.PASSED
                score = 100.0
                if observed_val is None:
                    observed_val = "0 violations (100% valid)"
            else:
                status = ValidationCheckStatus.FAILED
                if unexpected_percent > 0:
                    score = max(0.0, round(100.0 - unexpected_percent, 1))
                else:
                    score = 0.0

                # Check if failure was due to missing column
                if res.exception_info and res.exception_info.get("raised_exception"):
                    exc_msg = res.exception_info.get("exception_message", "")
                    failure_message = f"Check could not be evaluated: {exc_msg}"
                    observed_val = "Missing column or eval error"
                    score = 0.0
                elif exp_type == "expect_column_to_exist":
                    observed_val = "Column missing"
                    failure_message = f"Required column '{col}' is missing from current dataset."
                    score = 0.0
                elif exp_type == "expect_column_values_to_not_be_null":
                    observed_val = f"{unexpected_count} nulls ({unexpected_percent:.1f}%)"
                    failure_message = f"Column '{col}' has {unexpected_count} null values ({unexpected_percent:.1f}%)."
                elif exp_type == "expect_column_values_to_be_between":
                    observed_val = f"{unexpected_count} out of range ({unexpected_percent:.1f}%)"
                    failure_message = f"Column '{col}' has {unexpected_count} values outside expected bounds {expected_condition}."
                elif exp_type == "expect_column_values_to_be_in_set":
                    observed_val = f"{unexpected_count} unexpected values ({unexpected_percent:.1f}%)"
                    failure_message = f"Column '{col}' has {unexpected_count} values not in configured allowed set."
                elif exp_type in ("expect_column_values_to_be_unique", "expect_compound_columns_to_be_unique"):
                    observed_val = f"{unexpected_count} duplicates ({unexpected_percent:.1f}%)"
                    failure_message = f"Found {unexpected_count} duplicate values ({unexpected_percent:.1f}%)."
                elif exp_type == "expect_column_values_to_be_of_type":
                    observed_val = str(res_dict.get("observed_value", "mismatched type"))
                    failure_message = f"Column '{col}' has type '{observed_val}' instead of expected '{kwargs.get('type_')}'."
                    score = 0.0
                else:
                    observed_val = f"{unexpected_count} violations" if unexpected_count > 0 else "Failed"
                    failure_message = f"Expectation {exp_type} failed."

            check_id = f"chk_{i+1:03d}_{exp_type}_{col or 'table'}"
            results.append(
                QualityCheckResult(
                    check_id=check_id,
                    check_name=exp_type,
                    dimension=dimension,
                    column_name=col,
                    status=status,
                    observed_value=observed_val,
                    expected_condition=expected_condition,
                    failure_message=failure_message,
                    unexpected_count=unexpected_count,
                    unexpected_percent=round(unexpected_percent, 2),
                    score=score,
                )
            )

        return results

    def _build_expectations(
        self,
        suite: gx.ExpectationSuite,
        expectations_meta: Dict[Tuple[str, Optional[str]], Dict[str, Any]],
        reference_df: Optional[pd.DataFrame],
        current_df: pd.DataFrame,
        rules_config: Optional[ValidationRuleConfig],
    ) -> None:
        """
        Dynamically construct GX expectations based on reference dataset
        and/or explicit rules config.
        """
        # Determine columns to inspect
        expected_cols: List[str] = []
        if rules_config and rules_config.required_columns:
            expected_cols = list(rules_config.required_columns)
        elif reference_df is not None:
            expected_cols = list(reference_df.columns)
        else:
            expected_cols = list(current_df.columns)

        # ─── 1. Schema Compliance: Required Columns ─────────────────────────────
        for col in expected_cols:
            suite.add_expectation(gx.expectations.ExpectColumnToExist(column=col))
            expectations_meta[("expect_column_to_exist", col)] = {
                "dimension": QualityDimension.SCHEMA_COMPLIANCE,
                "expected_condition": "Column must exist",
            }

        # ─── 2. Schema Compliance: Data Types ────────────────────────────────────
        explicit_types = rules_config.column_types if rules_config else None
        for col in expected_cols:
            expected_dtype = None
            if explicit_types and col in explicit_types:
                expected_dtype = explicit_types[col]
            elif reference_df is not None and col in reference_df.columns:
                expected_dtype = str(reference_df[col].dtype)

            if expected_dtype:
                # Map pandas dtypes to normalized names GX expects or handles
                gx_type = expected_dtype
                if "int" in expected_dtype:
                    gx_type = "int64"
                elif "float" in expected_dtype:
                    gx_type = "float64"
                elif "object" in expected_dtype or "str" in expected_dtype:
                    gx_type = "str"

                suite.add_expectation(
                    gx.expectations.ExpectColumnValuesToBeOfType(column=col, type_=gx_type)
                )
                expectations_meta[("expect_column_values_to_be_of_type", col)] = {
                    "dimension": QualityDimension.SCHEMA_COMPLIANCE,
                    "expected_condition": f"Data type should be {gx_type}",
                }

        # ─── 3. Completeness: Not-Null Checks ───────────────────────────────────
        not_null_cols: List[str] = []
        if rules_config and rules_config.not_null_columns is not None:
            not_null_cols = rules_config.not_null_columns
        elif reference_df is not None:
            # Columns that have 0 nulls in reference dataset are expected to remain complete
            for col in expected_cols:
                if col in reference_df.columns and reference_df[col].isna().sum() == 0:
                    not_null_cols.append(col)
        else:
            # Current columns with 0 nulls
            for col in current_df.columns:
                if current_df[col].isna().sum() == 0:
                    not_null_cols.append(col)

        for col in not_null_cols:
            suite.add_expectation(gx.expectations.ExpectColumnValuesToNotBeNull(column=col))
            expectations_meta[("expect_column_values_to_not_be_null", col)] = {
                "dimension": QualityDimension.COMPLETENESS,
                "expected_condition": "0% null values",
            }

        # ─── 4. Validity: Numeric Ranges ────────────────────────────────────────
        explicit_ranges = rules_config.numeric_ranges if rules_config else None
        for col in expected_cols:
            min_val = None
            max_val = None

            if explicit_ranges and col in explicit_ranges:
                bounds = explicit_ranges[col]
                min_val = bounds.get("min")
                max_val = bounds.get("max")
            elif reference_df is not None and col in reference_df.columns:
                if pd.api.types.is_numeric_dtype(reference_df[col]):
                    series = reference_df[col].dropna()
                    if len(series) > 0:
                        ref_min = float(series.min())
                        ref_max = float(series.max())
                        span = ref_max - ref_min
                        margin = span * self.numeric_margin_pct if span > 0 else max(1.0, abs(ref_max) * 0.1)
                        min_val = round(ref_min - margin, 4)
                        max_val = round(ref_max + margin, 4)
            elif reference_df is None and col in current_df.columns:
                if pd.api.types.is_numeric_dtype(current_df[col]):
                    series = current_df[col].dropna()
                    if len(series) > 0:
                        min_val = float(series.min())
                        max_val = float(series.max())

            if min_val is not None and max_val is not None:
                suite.add_expectation(
                    gx.expectations.ExpectColumnValuesToBeBetween(
                        column=col, min_value=min_val, max_value=max_val
                    )
                )
                expectations_meta[("expect_column_values_to_be_between", col)] = {
                    "dimension": QualityDimension.VALIDITY,
                    "expected_condition": f"Range [{min_val:.2f}, {max_val:.2f}]",
                }

        # ─── 5. Uniqueness: Key Columns & Duplicate Rows ─────────────────────────
        unique_cols: List[str] = []
        if rules_config and rules_config.unique_columns is not None:
            unique_cols = list(rules_config.unique_columns)
        elif reference_df is not None:
            # Auto-detect primary key candidate (100% unique in reference, and either named like an ID or >= 10 rows)
            for col in expected_cols:
                if col in reference_df.columns:
                    s = reference_df[col].dropna()
                    if len(s) == len(reference_df) and len(s) > 0 and s.nunique() == len(reference_df):
                        col_lower = col.lower()
                        is_id_name = any(k in col_lower for k in ("id", "key", "uuid", "hash"))
                        if is_id_name or (len(reference_df) >= 10 and len(expected_cols) > 1):
                            unique_cols.append(col)

        for col in unique_cols:
            suite.add_expectation(gx.expectations.ExpectColumnValuesToBeUnique(column=col))
            expectations_meta[("expect_column_values_to_be_unique", col)] = {
                "dimension": QualityDimension.UNIQUENESS,
                "expected_condition": "Unique key (100% distinct values)",
            }

        # ─── 6. Validity: Allowed Categorical Sets ──────────────────────────────
        explicit_cats = rules_config.allowed_categories if rules_config else None
        for col in expected_cols:
            # Skip unique identifier columns from categorical set check
            if col in unique_cols:
                continue

            allowed_set = None
            if explicit_cats and col in explicit_cats:
                allowed_set = explicit_cats[col]
            elif reference_df is not None and col in reference_df.columns:
                if not pd.api.types.is_numeric_dtype(reference_df[col]):
                    cats = reference_df[col].dropna().unique()
                    # Only treat as categorical if cardinality is reasonable and not an ID
                    if len(cats) <= self.max_category_cardinality and (len(reference_df) <= 3 or len(cats) < len(reference_df) * 0.8):
                        allowed_set = [str(c) for c in cats]

            if allowed_set:
                suite.add_expectation(
                    gx.expectations.ExpectColumnValuesToBeInSet(column=col, value_set=allowed_set)
                )
                summary_set = ", ".join(allowed_set[:4]) + ("..." if len(allowed_set) > 4 else "")
                expectations_meta[("expect_column_values_to_be_in_set", col)] = {
                    "dimension": QualityDimension.VALIDITY,
                    "expected_condition": f"Allowed: {{{summary_set}}}",
                }

        # Whole row uniqueness check (if configured or default true)
        check_dups = rules_config.check_duplicate_rows if rules_config else True
        if check_dups:
            # Check duplicate rows across analyzable columns
            common_cols = [c for c in expected_cols if (reference_df is None or c in reference_df.columns)]
            if len(common_cols) >= 2:
                suite.add_expectation(
                    gx.expectations.ExpectCompoundColumnsToBeUnique(column_list=common_cols)
                )
                col_key = ", ".join(common_cols[:3]) + ("..." if len(common_cols) > 3 else "")
                expectations_meta[("expect_compound_columns_to_be_unique", col_key)] = {
                    "dimension": QualityDimension.UNIQUENESS,
                    "expected_condition": "0 duplicate rows across dataset",
                }
            elif len(common_cols) == 1:
                # If only one column exists in the dataset, row uniqueness is column uniqueness
                col_name = common_cols[0]
                if col_name not in unique_cols:
                    suite.add_expectation(
                        gx.expectations.ExpectColumnValuesToBeUnique(column=col_name)
                    )
                    expectations_meta[("expect_column_values_to_be_unique", col_name)] = {
                        "dimension": QualityDimension.UNIQUENESS,
                        "expected_condition": "0 duplicate rows across dataset",
                    }
