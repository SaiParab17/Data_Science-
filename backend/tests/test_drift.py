"""
DataWatch — Backend Unit Tests
"""
import pytest
import pandas as pd
import numpy as np
from services.drift_engine import DriftEngine
from utils.statistics import calculate_psi, calculate_ks_test, calculate_wasserstein, calculate_js_divergence_numeric
from models.drift_models import DriftStatus, DriftSeverity

def test_psi_identical():
    """Identical distributions should have PSI near 0."""
    ref = np.random.normal(50, 10, 1000)
    cur = np.random.normal(50, 10, 1000)
    psi = calculate_psi(ref, cur)
    assert psi < 0.05

def test_psi_drifted():
    """Drifted distributions should have PSI > 0.25."""
    ref = np.random.normal(50, 10, 1000)
    cur = np.random.normal(80, 10, 1000)
    psi = calculate_psi(ref, cur)
    assert psi > 0.25

def test_ks_test():
    """KS test on shifted distribution should give small p-value."""
    ref = np.random.normal(50, 10, 1000)
    cur = np.random.normal(60, 10, 1000)
    stat, pval = calculate_ks_test(ref, cur)
    assert pval < 0.01

def test_drift_engine_analysis():
    """DriftEngine end-to-end analysis on sample DataFrames."""
    ref_df = pd.DataFrame({
        "customerID": [f"ID-{i}" for i in range(100)],
        "MonthlyCharges": np.random.normal(60, 15, 100),
        "Contract": ["Month-to-month"] * 70 + ["Two year"] * 30,
    })
    cur_df = pd.DataFrame({
        "customerID": [f"ID-{i}" for i in range(100, 200)],
        "MonthlyCharges": np.random.normal(95, 15, 100), # strong drift
        "Contract": ["Month-to-month"] * 70 + ["Two year"] * 30, # no drift
    })

    engine = DriftEngine(psi_threshold=0.25)
    result = engine.analyze(ref_df, cur_df, dataset_name="Test Dataset")

    assert result.reference_rows == 100
    assert result.current_rows == 100
    assert result.analyzed_columns == 2
    assert result.max_psi > 0.25
    assert len(result.alerts) >= 1
    assert result.alerts[0].column_name == "MonthlyCharges"
