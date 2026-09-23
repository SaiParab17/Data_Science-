"""
DataWatch — Quality API Router
POST /api/quality/validate — Upload reference/current CSV, run GX validation and quality scoring
GET  /api/quality/latest   — Get cached latest quality validation result
"""
import io
import json
from typing import Optional
import pandas as pd
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from services.gx_validation_service import GXValidationService
from services.quality_scoring_service import QualityScoringService
from models.quality_models import DataQualityResult, ValidationRuleConfig

router = APIRouter(prefix="/api/quality", tags=["quality"])

# In-memory store for the latest quality result
_latest_quality_result: Optional[DataQualityResult] = None


def set_latest_quality_result(result: DataQualityResult) -> None:
    global _latest_quality_result
    _latest_quality_result = result


def get_stored_quality_result() -> Optional[DataQualityResult]:
    return _latest_quality_result


def _read_csv(file: UploadFile) -> pd.DataFrame:
    """Read uploaded CSV file into a pandas DataFrame."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: '{file.filename}'. Only CSV files are accepted.",
        )
    try:
        contents = file.file.read()
        df = pd.read_csv(io.BytesIO(contents))
        if len(df) == 0:
            raise HTTPException(status_code=400, detail="The uploaded dataset contains no rows.")
        return df
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="The uploaded CSV file is empty or invalid.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")


@router.post("/validate", response_model=DataQualityResult)
async def validate_quality(
    current_file: UploadFile = File(..., description="Current batch CSV dataset to validate"),
    reference_file: Optional[UploadFile] = File(None, description="Optional baseline reference CSV dataset"),
    dataset_name: str = Form(default="Dataset", description="Dataset display name"),
    weights_json: Optional[str] = Form(default=None, description="JSON string of dimension weights"),
    rules_config_json: Optional[str] = Form(default=None, description="JSON string of custom validation rules"),
):
    """
    Validate dataset against Great Expectations rules and calculate quality score (0-100).
    Infers expectations dynamically from the reference dataset or uses custom rules.
    """
    global _latest_quality_result

    current_df = _read_csv(current_file)
    reference_df = _read_csv(reference_file) if reference_file is not None else None

    # Parse optional custom weights
    weights = None
    if weights_json:
        try:
            weights = json.loads(weights_json)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid weights_json format: {str(e)}")

    # Parse optional custom validation rules
    rules_config = None
    if rules_config_json:
        try:
            rules_dict = json.loads(rules_config_json)
            rules_config = ValidationRuleConfig(**rules_dict)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid rules_config_json format: {str(e)}")

    # Run GX validation
    try:
        gx_service = GXValidationService()
        checks = gx_service.validate(
            current_df=current_df,
            reference_df=reference_df,
            rules_config=rules_config,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GX validation failed: {str(e)}")

    # Calculate deterministic quality score
    try:
        scoring_service = QualityScoringService(weights=weights)
        result = scoring_service.calculate_score(checks, dataset_name=dataset_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quality scoring failed: {str(e)}")

    # Cache latest result
    _latest_quality_result = result
    return result


@router.get("/latest", response_model=Optional[DataQualityResult])
async def get_latest_quality():
    """Return the most recently computed data quality result, or null if none exists."""
    return _latest_quality_result
