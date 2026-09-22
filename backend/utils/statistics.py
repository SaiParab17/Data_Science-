"""
DataWatch - Statistical Utilities for Drift Detection
"""
import numpy as np
import pandas as pd
from scipy import stats
from scipy.spatial.distance import jensenshannon
from typing import Tuple, Optional, List
import warnings

warnings.filterwarnings("ignore")


def calculate_psi(
    reference: np.ndarray,
    current: np.ndarray,
    n_bins: int = 10,
    epsilon: float = 1e-4,
) -> float:
    """
    Calculate Population Stability Index (PSI).
    PSI = Σ (Actual% - Expected%) × ln(Actual% / Expected%)
    
    Returns PSI score. Higher = more drift.
    """
    # Remove NaN values
    ref_clean = reference[~np.isnan(reference)]
    cur_clean = current[~np.isnan(current)]

    if len(ref_clean) == 0 or len(cur_clean) == 0:
        return 0.0

    # Create bins from reference distribution
    _, bin_edges = np.histogram(ref_clean, bins=n_bins)

    # Compute counts per bin for reference and current
    ref_counts, _ = np.histogram(ref_clean, bins=bin_edges)
    cur_counts, _ = np.histogram(cur_clean, bins=bin_edges)

    # Convert to percentages
    ref_pct = ref_counts / len(ref_clean)
    cur_pct = cur_counts / len(cur_clean)

    # Apply epsilon to avoid log(0) or division by zero
    ref_pct = np.where(ref_pct == 0, epsilon, ref_pct)
    cur_pct = np.where(cur_pct == 0, epsilon, cur_pct)

    # PSI calculation
    psi_values = (cur_pct - ref_pct) * np.log(cur_pct / ref_pct)
    psi = float(np.sum(psi_values))

    return round(max(psi, 0.0), 4)


def calculate_psi_categorical(
    reference: pd.Series,
    current: pd.Series,
    epsilon: float = 1e-4,
) -> float:
    """
    Calculate PSI for categorical columns.
    Uses category frequency distributions.
    """
    ref_clean = reference.dropna()
    cur_clean = current.dropna()

    if len(ref_clean) == 0 or len(cur_clean) == 0:
        return 0.0

    # Get all categories from both datasets
    all_cats = set(ref_clean.unique()) | set(cur_clean.unique())

    ref_freq = ref_clean.value_counts(normalize=True)
    cur_freq = cur_clean.value_counts(normalize=True)

    psi = 0.0
    for cat in all_cats:
        ref_pct = ref_freq.get(cat, epsilon)
        cur_pct = cur_freq.get(cat, epsilon)
        if ref_pct == 0:
            ref_pct = epsilon
        if cur_pct == 0:
            cur_pct = epsilon
        psi += (cur_pct - ref_pct) * np.log(cur_pct / ref_pct)

    return round(max(float(psi), 0.0), 4)


def calculate_ks_test(
    reference: np.ndarray,
    current: np.ndarray,
) -> Tuple[float, float]:
    """
    Kolmogorov-Smirnov two-sample test.
    Returns (ks_statistic, p_value).
    """
    ref_clean = reference[~np.isnan(reference)]
    cur_clean = current[~np.isnan(current)]

    if len(ref_clean) < 2 or len(cur_clean) < 2:
        return 0.0, 1.0

    result = stats.ks_2samp(ref_clean, cur_clean)
    return round(float(result.statistic), 4), round(float(result.pvalue), 4)


def calculate_wasserstein(
    reference: np.ndarray,
    current: np.ndarray,
) -> float:
    """
    Wasserstein distance (Earth Mover's Distance).
    Measures the minimum "work" to transform one distribution into another.
    """
    ref_clean = reference[~np.isnan(reference)]
    cur_clean = current[~np.isnan(current)]

    if len(ref_clean) == 0 or len(cur_clean) == 0:
        return 0.0

    distance = stats.wasserstein_distance(ref_clean, cur_clean)
    return round(float(distance), 4)


def calculate_js_divergence_numeric(
    reference: np.ndarray,
    current: np.ndarray,
    n_bins: int = 10,
    epsilon: float = 1e-8,
) -> float:
    """
    Jensen-Shannon divergence for numeric columns.
    Returns JS divergence in [0, 1].
    """
    ref_clean = reference[~np.isnan(reference)]
    cur_clean = current[~np.isnan(current)]

    if len(ref_clean) == 0 or len(cur_clean) == 0:
        return 0.0

    all_values = np.concatenate([ref_clean, cur_clean])
    _, bin_edges = np.histogram(all_values, bins=n_bins)

    ref_hist, _ = np.histogram(ref_clean, bins=bin_edges)
    cur_hist, _ = np.histogram(cur_clean, bins=bin_edges)

    # Normalize to probability distributions
    ref_prob = (ref_hist + epsilon) / (ref_hist.sum() + epsilon * len(ref_hist))
    cur_prob = (cur_hist + epsilon) / (cur_hist.sum() + epsilon * len(cur_hist))

    js = jensenshannon(ref_prob, cur_prob)
    return round(float(js ** 2), 4)  # Return JS divergence (squared distance)


def calculate_js_divergence_categorical(
    reference: pd.Series,
    current: pd.Series,
    epsilon: float = 1e-8,
) -> float:
    """
    Jensen-Shannon divergence for categorical columns.
    """
    ref_clean = reference.dropna()
    cur_clean = current.dropna()

    if len(ref_clean) == 0 or len(cur_clean) == 0:
        return 0.0

    all_cats = sorted(set(ref_clean.unique()) | set(cur_clean.unique()))

    ref_freq = ref_clean.value_counts()
    cur_freq = cur_clean.value_counts()

    ref_prob = np.array([ref_freq.get(c, 0) + epsilon for c in all_cats], dtype=float)
    cur_prob = np.array([cur_freq.get(c, 0) + epsilon for c in all_cats], dtype=float)

    ref_prob /= ref_prob.sum()
    cur_prob /= cur_prob.sum()

    js = jensenshannon(ref_prob, cur_prob)
    return round(float(js ** 2), 4)


def build_histogram_data(
    reference: np.ndarray,
    current: np.ndarray,
    n_bins: int = 20,
) -> Tuple[List[dict], List[dict]]:
    """
    Build histogram bin data for chart visualization.
    Returns (reference_histogram, current_histogram) as lists of {bin, count, pct}.
    """
    ref_clean = reference[~np.isnan(reference)]
    cur_clean = current[~np.isnan(current)]

    if len(ref_clean) == 0 or len(cur_clean) == 0:
        return [], []

    all_values = np.concatenate([ref_clean, cur_clean])
    _, bin_edges = np.histogram(all_values, bins=n_bins)

    ref_hist, _ = np.histogram(ref_clean, bins=bin_edges)
    cur_hist, _ = np.histogram(cur_clean, bins=bin_edges)

    ref_data = []
    cur_data = []

    for i in range(len(bin_edges) - 1):
        bin_label = f"{bin_edges[i]:.1f}"
        ref_data.append({
            "bin": bin_label,
            "binStart": round(float(bin_edges[i]), 2),
            "binEnd": round(float(bin_edges[i + 1]), 2),
            "count": int(ref_hist[i]),
            "pct": round(float(ref_hist[i]) / max(len(ref_clean), 1) * 100, 2),
        })
        cur_data.append({
            "bin": bin_label,
            "binStart": round(float(bin_edges[i]), 2),
            "binEnd": round(float(bin_edges[i + 1]), 2),
            "count": int(cur_hist[i]),
            "pct": round(float(cur_hist[i]) / max(len(cur_clean), 1) * 100, 2),
        })

    return ref_data, cur_data
