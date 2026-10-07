"""
Feature engineering shared by training and (mirrored exactly in TypeScript by)
`src/lib/c1/vulnerability.ts`. If you change anything here, change the TS
mirror and regenerate the parity fixture (`python train_vulnerability.py`).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

EMPLOYMENT = ["formal", "informal", "unemployed", "retired", "deceased"]
ACCOMMODATION = ["home", "boarding", "hostel"]

FEATURES = [
    "income_per_capita",
    "household_size",
    "dependents",
    "dependency_ratio",
    "siblings_in_education",
    "single_parent",
    "has_education_loan",
    "loan_to_income",
    "expense_ratio",
    "rural_district",
    "financial_shock_last_year",
    "current_scholarship",
    "gpa",
    "year_of_study",
    *[f"emp_{e}" for e in EMPLOYMENT],
    *[f"acc_{a}" for a in ACCOMMODATION],
]


def engineer(raw: pd.DataFrame) -> pd.DataFrame:
    income = raw["monthly_household_income_lkr"].astype(float)
    size = raw["household_size"].astype(float)
    out = pd.DataFrame(index=raw.index)
    out["income_per_capita"] = income / size
    out["household_size"] = size
    out["dependents"] = raw["dependents"].astype(float)
    out["dependency_ratio"] = raw["dependents"].astype(float) / size
    out["siblings_in_education"] = raw["siblings_in_education"].astype(float)
    out["single_parent"] = raw["single_parent"].astype(float)
    out["has_education_loan"] = raw["has_education_loan"].astype(float)
    out["loan_to_income"] = raw["loan_amount_lkr"].astype(float) / (income * 12.0)
    out["expense_ratio"] = raw["monthly_expenses_lkr"].astype(float) / income
    out["rural_district"] = raw["rural_district"].astype(float)
    out["financial_shock_last_year"] = raw["financial_shock_last_year"].astype(float)
    out["current_scholarship"] = raw["current_scholarship"].astype(float)
    out["gpa"] = raw["gpa"].astype(float)
    out["year_of_study"] = raw["year_of_study"].astype(float)
    for e in EMPLOYMENT:
        out[f"emp_{e}"] = (raw["guardian_employment"] == e).astype(float)
    for a in ACCOMMODATION:
        out[f"acc_{a}"] = (raw["accommodation"] == a).astype(float)
    return out[FEATURES].astype(np.float32)
