"""
DataWatch — API Integration Tests
Tests /api/drift/analyze, /api/quality/validate, /api/quality/latest, and /api/health using TestClient.
Uses temporary synthetic CSVs to avoid altering any user data.
"""
import io
import pytest
import pandas as pd
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def _df_to_csv_bytes(df: pd.DataFrame) -> io.BytesIO:
    buf = io.BytesIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return buf


def test_health_endpoint():
    """Health check endpoint returns ok and flags for drift and quality readiness."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["drift_analysis_ready"] is True
    assert data["quality_validation_ready"] is True


def test_drift_analyze_without_quality():
    """Existing drift endpoint functions with run_quality=False."""
    ref_df = pd.DataFrame({
        "id": [f"ID-{i}" for i in range(100)],
        "val": [10.0 + i for i in range(100)],
    })
    cur_df = pd.DataFrame({
        "id": [f"ID-{i}" for i in range(100, 200)],
        "val": [15.0 + i for i in range(100)],
    })

    files = {
        "reference_file": ("ref.csv", _df_to_csv_bytes(ref_df), "text/csv"),
        "current_file": ("cur.csv", _df_to_csv_bytes(cur_df), "text/csv"),
    }
    data = {
        "psi_threshold": "0.25",
        "dataset_name": "API Test Dataset",
        "run_quality": "false",
    }

    res = client.post("/api/drift/analyze", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["dataset_name"] == "API Test Dataset"
    assert res_data["reference_rows"] == 100
    assert res_data["current_rows"] == 100
    assert "features" in res_data
    assert res_data["quality"] is None


def test_combined_drift_and_quality_analyze():
    """POST /api/drift/analyze executes both statistical drift and GX quality validation."""
    ref_df = pd.DataFrame({
        "id": [f"ID-{i}" for i in range(50)],
        "feature_x": [10.0 + i for i in range(50)],
        "category_y": ["A"] * 25 + ["B"] * 25,
    })
    cur_df = pd.DataFrame({
        "id": [f"ID-{i}" for i in range(50, 100)],
        "feature_x": [12.0 + i for i in range(50)],
        "category_y": ["A"] * 25 + ["B"] * 25,
    })

    files = {
        "reference_file": ("ref.csv", _df_to_csv_bytes(ref_df), "text/csv"),
        "current_file": ("cur.csv", _df_to_csv_bytes(cur_df), "text/csv"),
    }
    data = {
        "psi_threshold": "0.25",
        "dataset_name": "Combined Test",
        "run_quality": "true",
    }

    res = client.post("/api/drift/analyze", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["quality"] is not None
    quality = res_data["quality"]
    assert "overall_score" in quality
    assert 0.0 <= quality["overall_score"] <= 100.0
    assert "dimensions" in quality
    assert "completeness" in quality["dimensions"]
    assert "validity" in quality["dimensions"]
    assert "schema_compliance" in quality["dimensions"]
    assert "uniqueness" in quality["dimensions"]


def test_standalone_quality_validate_endpoint():
    """POST /api/quality/validate validates CSV directly and returns DataQualityResult."""
    ref_df = pd.DataFrame({
        "account_id": [f"ACC-{i}" for i in range(30)],
        "balance": [100.0 * (i + 1) for i in range(30)],
        "status": ["Active"] * 20 + ["Inactive"] * 10,
    })
    # Current has null in balance and duplicate account_id
    cur_df = pd.DataFrame({
        "account_id": [f"ACC-{i}" for i in range(29)] + ["ACC-0"],  # 1 duplicate
        "balance": [100.0 * (i + 1) for i in range(28)] + [None, None],  # 2 nulls
        "status": ["Active"] * 20 + ["Inactive"] * 10,
    })

    files = {
        "current_file": ("current.csv", _df_to_csv_bytes(cur_df), "text/csv"),
        "reference_file": ("reference.csv", _df_to_csv_bytes(ref_df), "text/csv"),
    }
    data = {
        "dataset_name": "Standalone Quality Test",
    }

    res = client.post("/api/quality/validate", files=files, data=data)
    assert res.status_code == 200
    data = res.json()
    assert data["dataset_name"] == "Standalone Quality Test"
    assert data["failed_checks"] > 0
    assert data["overall_score"] < 100.0
    assert len(data["major_deductions"]) > 0

    # Also test GET /api/quality/latest returns this result
    latest_res = client.get("/api/quality/latest")
    assert latest_res.status_code == 200
    assert latest_res.json()["dataset_name"] == "Standalone Quality Test"
