"""
DataWatch — Drift API Router
POST /api/drift/analyze — upload reference + current CSV, run drift analysis
GET  /api/drift/latest  — get cached latest result
GET  /api/alerts        — get alerts from latest analysis
"""
import io
from typing import Optional, Annotated
import pandas as pd
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

import json
from services.drift_engine import DriftEngine
from services.gx_validation_service import GXValidationService
from services.quality_scoring_service import QualityScoringService
from models.drift_models import DriftResult, DriftAlert
from api.quality import set_latest_quality_result

router = APIRouter(prefix="/api", tags=["drift"])

# In-memory store for the latest drift result (demo-ready; swap for DB later)
_latest_result: Optional[DriftResult] = None


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


@router.post("/drift/analyze", response_model=DriftResult)
async def analyze_drift(
    reference_file: UploadFile = File(..., description="Reference/baseline CSV dataset"),
    current_file: UploadFile = File(..., description="Current batch CSV dataset"),
    psi_threshold: float = Form(default=0.25, description="PSI threshold for drift detection"),
    dataset_name: str = Form(default="Telco Customer Churn", description="Dataset display name"),
    run_quality: bool = Form(default=True, description="Run GX data quality validation alongside drift analysis"),
    quality_weights_json: Optional[str] = Form(default=None, description="Optional JSON string of dimension weights"),
):
    """
    Analyze statistical distribution drift between reference and current datasets.
    Optionally executes Great Expectations quality validation and deterministic scoring.
    
    Calculates PSI, KS test, Wasserstein distance, and Jensen-Shannon divergence
    for each column. Returns feature-level and overall drift results, plus
    generated alerts and optional data quality scoring.
    """
    global _latest_result

    # Validate threshold
    if not (0.0 < psi_threshold < 1.0):
        raise HTTPException(
            status_code=400,
            detail="psi_threshold must be between 0.0 and 1.0 (exclusive).",
        )

    # Load CSV files
    reference_df = _read_csv(reference_file)
    current_df = _read_csv(current_file)

    # Check for common columns
    common_cols = set(reference_df.columns) & set(current_df.columns)
    if not common_cols:
        raise HTTPException(
            status_code=400,
            detail="Reference and current datasets have incompatible schemas: no common columns found.",
        )

    # Run drift engine
    try:
        engine = DriftEngine(psi_threshold=psi_threshold)
        result = engine.analyze(reference_df, current_df, dataset_name=dataset_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Drift analysis failed: {str(e)}")

    # Optionally run Great Expectations quality validation & scoring
    if run_quality:
        try:
            weights = None
            if quality_weights_json:
                try:
                    weights = json.loads(quality_weights_json)
                except Exception:
                    pass

            gx_service = GXValidationService()
            checks = gx_service.validate(current_df=current_df, reference_df=reference_df)
            scoring_service = QualityScoringService(weights=weights)
            quality_result = scoring_service.calculate_score(checks, dataset_name=dataset_name)
            result.quality = quality_result
            set_latest_quality_result(quality_result)
        except Exception as e:
            # Don't break drift analysis if quality validation encounters an error
            print(f"Quality validation warning: {e}")

    # Cache for dashboard/alerts consumption
    _latest_result = result

    return result


@router.get("/drift/latest", response_model=Optional[DriftResult])
async def get_latest_drift():
    """Return the most recently computed drift result, or null if none exists."""
    return _latest_result


@router.get("/alerts", response_model=list[DriftAlert])
async def get_alerts():
    """Return drift alerts from the latest analysis, or empty list if none."""
    if _latest_result is None:
        return []
    return _latest_result.alerts


@router.get("/health")
async def health_check():
    """Backend health check."""
    return {
        "status": "ok",
        "service": "DataWatch Monitoring Engine",
        "version": "1.0.0",
        "drift_analysis_ready": True,
        "quality_validation_ready": True,
        "latest_result_available": _latest_result is not None,
        "latest_quality_available": _latest_result is not None and _latest_result.quality is not None,
    }
