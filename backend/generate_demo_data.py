"""
DataWatch — Demo Dataset Generator
Generates reference_data.csv and current_data.csv for the Telco Customer Churn demo.

Reference: 7,043 rows — Jan–Jun 2026 — stable distributions
Current:   6,981 rows — Batch #1042 — MonthlyCharges intentionally shifted +41%
"""
import numpy as np
import pandas as pd
import os

np.random.seed(42)

N_REFERENCE = 7043
N_CURRENT = 6981


def generate_reference():
    """Generate reference (baseline) dataset — stable, Jan–Jun 2026."""
    n = N_REFERENCE

    customer_ids = [f"CUST-{str(i).zfill(7)}" for i in range(1, n + 1)]
    gender = np.random.choice(["Male", "Female"], size=n, p=[0.505, 0.495])
    senior_citizen = np.random.choice([0, 1], size=n, p=[0.838, 0.162])
    partner = np.random.choice(["Yes", "No"], size=n, p=[0.483, 0.517])
    dependents = np.random.choice(["Yes", "No"], size=n, p=[0.298, 0.702])

    tenure = np.clip(np.random.exponential(scale=32, size=n), 0, 72).astype(int)

    phone_service = np.random.choice(["Yes", "No"], size=n, p=[0.903, 0.097])
    multiple_lines = np.where(
        phone_service == "No",
        "No phone service",
        np.random.choice(["Yes", "No"], size=n, p=[0.421, 0.579]),
    )
    internet_service = np.random.choice(
        ["DSL", "Fiber optic", "No"], size=n, p=[0.342, 0.439, 0.219]
    )

    def internet_addon(no_val, p_yes):
        return np.where(
            internet_service == "No",
            no_val,
            np.random.choice(["Yes", "No"], size=n, p=[p_yes, 1 - p_yes]),
        )

    online_security = internet_addon("No internet service", 0.285)
    online_backup = internet_addon("No internet service", 0.344)
    device_protection = internet_addon("No internet service", 0.344)
    tech_support = internet_addon("No internet service", 0.289)
    streaming_tv = internet_addon("No internet service", 0.382)
    streaming_movies = internet_addon("No internet service", 0.389)

    contract = np.random.choice(
        ["Month-to-month", "One year", "Two year"], size=n, p=[0.550, 0.209, 0.241]
    )
    paperless_billing = np.random.choice(["Yes", "No"], size=n, p=[0.593, 0.407])
    payment_method = np.random.choice(
        [
            "Electronic check",
            "Mailed check",
            "Bank transfer (automatic)",
            "Credit card (automatic)",
        ],
        size=n,
        p=[0.336, 0.228, 0.217, 0.219],
    )

    # MonthlyCharges — reference mean ~64.70
    monthly_charges = np.clip(
        np.random.normal(loc=64.70, scale=30.0, size=n), 18.25, 118.75
    ).round(2)

    # TotalCharges (tenure × monthly + some noise, NaN for new customers)
    total_charges_raw = (tenure * monthly_charges + np.random.normal(0, 20, n)).round(2)
    total_charges = np.where(tenure == 0, np.nan, total_charges_raw)

    churn = np.random.choice(["Yes", "No"], size=n, p=[0.265, 0.735])

    df = pd.DataFrame(
        {
            "customerID": customer_ids,
            "gender": gender,
            "SeniorCitizen": senior_citizen,
            "Partner": partner,
            "Dependents": dependents,
            "tenure": tenure,
            "PhoneService": phone_service,
            "MultipleLines": multiple_lines,
            "InternetService": internet_service,
            "OnlineSecurity": online_security,
            "OnlineBackup": online_backup,
            "DeviceProtection": device_protection,
            "TechSupport": tech_support,
            "StreamingTV": streaming_tv,
            "StreamingMovies": streaming_movies,
            "Contract": contract,
            "PaperlessBilling": paperless_billing,
            "PaymentMethod": payment_method,
            "MonthlyCharges": monthly_charges,
            "TotalCharges": total_charges,
            "Churn": churn,
        }
    )
    return df


def generate_current():
    """Generate current batch dataset — MonthlyCharges shifted +41%, Contract changed."""
    np.random.seed(99)
    n = N_CURRENT

    customer_ids = [f"CUST-{str(i).zfill(7)}" for i in range(N_REFERENCE + 1, N_REFERENCE + n + 1)]
    gender = np.random.choice(["Male", "Female"], size=n, p=[0.508, 0.492])
    senior_citizen = np.random.choice([0, 1], size=n, p=[0.821, 0.179])
    partner = np.random.choice(["Yes", "No"], size=n, p=[0.469, 0.531])
    dependents = np.random.choice(["Yes", "No"], size=n, p=[0.302, 0.698])

    tenure = np.clip(np.random.exponential(scale=28, size=n), 0, 72).astype(int)

    phone_service = np.random.choice(["Yes", "No"], size=n, p=[0.912, 0.088])
    multiple_lines = np.where(
        phone_service == "No",
        "No phone service",
        np.random.choice(["Yes", "No"], size=n, p=[0.448, 0.552]),
    )
    internet_service = np.random.choice(
        ["DSL", "Fiber optic", "No"], size=n, p=[0.298, 0.512, 0.190]
    )

    def internet_addon(no_val, p_yes):
        return np.where(
            internet_service == "No",
            no_val,
            np.random.choice(["Yes", "No"], size=n, p=[p_yes, 1 - p_yes]),
        )

    online_security = internet_addon("No internet service", 0.271)
    online_backup = internet_addon("No internet service", 0.329)
    device_protection = internet_addon("No internet service", 0.358)
    tech_support = internet_addon("No internet service", 0.274)
    streaming_tv = internet_addon("No internet service", 0.401)
    streaming_movies = internet_addon("No internet service", 0.412)

    # DRIFT: Contract shifted toward Month-to-month (more churn-prone customers)
    contract = np.random.choice(
        ["Month-to-month", "One year", "Two year"], size=n, p=[0.685, 0.178, 0.137]
    )
    paperless_billing = np.random.choice(["Yes", "No"], size=n, p=[0.631, 0.369])
    payment_method = np.random.choice(
        [
            "Electronic check",
            "Mailed check",
            "Bank transfer (automatic)",
            "Credit card (automatic)",
        ],
        size=n,
        p=[0.381, 0.201, 0.208, 0.210],
    )

    # DRIFT: MonthlyCharges shifted — current mean ~91.20 (+41%)
    monthly_charges = np.clip(
        np.random.normal(loc=91.20, scale=22.0, size=n), 18.25, 118.75
    ).round(2)

    # TotalCharges (moderate drift due to higher monthly charges)
    total_charges_raw = (tenure * monthly_charges + np.random.normal(0, 25, n)).round(2)
    # Add some NaN values (data quality issue)
    null_mask = np.random.choice([True, False], size=n, p=[0.048, 0.952])
    total_charges = np.where(null_mask | (tenure == 0), np.nan, total_charges_raw)

    churn = np.random.choice(["Yes", "No"], size=n, p=[0.312, 0.688])

    df = pd.DataFrame(
        {
            "customerID": customer_ids,
            "gender": gender,
            "SeniorCitizen": senior_citizen,
            "Partner": partner,
            "Dependents": dependents,
            "tenure": tenure,
            "PhoneService": phone_service,
            "MultipleLines": multiple_lines,
            "InternetService": internet_service,
            "OnlineSecurity": online_security,
            "OnlineBackup": online_backup,
            "DeviceProtection": device_protection,
            "TechSupport": tech_support,
            "StreamingTV": streaming_tv,
            "StreamingMovies": streaming_movies,
            "Contract": contract,
            "PaperlessBilling": paperless_billing,
            "PaymentMethod": payment_method,
            "MonthlyCharges": monthly_charges,
            "TotalCharges": total_charges,
            "Churn": churn,
        }
    )
    return df


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)

    print("Generating reference dataset...")
    ref_df = generate_reference()
    ref_path = os.path.join("data", "reference_data.csv")
    ref_df.to_csv(ref_path, index=False)
    print(f"  Saved: {ref_path} ({len(ref_df)} rows, {len(ref_df.columns)} columns)")
    print(f"  MonthlyCharges mean: ${ref_df['MonthlyCharges'].mean():.2f}")

    print("\nGenerating current batch dataset...")
    cur_df = generate_current()
    cur_path = os.path.join("data", "current_data.csv")
    cur_df.to_csv(cur_path, index=False)
    print(f"  Saved: {cur_path} ({len(cur_df)} rows, {len(cur_df.columns)} columns)")
    print(f"  MonthlyCharges mean: ${cur_df['MonthlyCharges'].mean():.2f}")
    
    monthly_shift = (cur_df['MonthlyCharges'].mean() - ref_df['MonthlyCharges'].mean()) / ref_df['MonthlyCharges'].mean() * 100
    print(f"\n  MonthlyCharges shift: +{monthly_shift:.1f}%")
    print("\nDemo datasets ready!")
