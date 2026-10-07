"""
Synthetic data generator for UniCare Connect - Component C1.

!!! IMPORTANT - READ BEFORE QUOTING ANY RESULT !!!
-------------------------------------------------
The real, anonymised SLIIT student dataset requested from the supervisors
(proposal Section 5.1.5) has NOT been received yet. Until it arrives, the
pipeline is developed and validated on SYNTHETIC data produced here.

* Feature distributions are loosely inspired by the statistics in the proposal
  (e.g. Jaffna 2025: ~97% rely on parental support, mean spend ~LKR 32k/month)
  but they are NOT real measurements of any student.
* The "vulnerable" label is generated from a hidden latent-need rubric plus
  expert-style label noise. It stands in for expert-validated labels.
* Because label and features come from the same generator, metrics measured on
  this data demonstrate that the PIPELINE WORKS (training, CV, export, parity,
  serving). They are NOT evidence of real-world accuracy and must never be
  reported as the research result. Re-run `train_vulnerability.py` on the real
  data when it is available.

Everything is seeded so results are exactly reproducible.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 42
N_STUDENTS = 3000
DATA_DIR = Path(__file__).parent / "data"

EMPLOYMENT = ["formal", "informal", "unemployed", "retired", "deceased"]
ACCOMMODATION = ["home", "boarding", "hostel"]

# Raw (pre-engineering) columns that a student profile / TAF questionnaire provides.
RAW_COLUMNS = [
    "monthly_household_income_lkr",
    "household_size",
    "dependents",
    "siblings_in_education",
    "guardian_employment",
    "single_parent",
    "has_education_loan",
    "loan_amount_lkr",
    "monthly_expenses_lkr",
    "accommodation",
    "rural_district",
    "financial_shock_last_year",
    "current_scholarship",
    "gpa",
    "year_of_study",
]


def _zscore(x: np.ndarray) -> np.ndarray:
    return (x - x.mean()) / (x.std() + 1e-9)


def generate_students(n: int = N_STUDENTS, seed: int = SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    rural = rng.random(n) < 0.42
    single_parent = rng.random(n) < 0.14
    employment = rng.choice(EMPLOYMENT, size=n, p=[0.36, 0.32, 0.09, 0.14, 0.09])

    income = rng.lognormal(mean=np.log(88_000), sigma=0.55, size=n)
    income *= np.where(rural, 0.78, 1.0)
    income *= np.where(single_parent, 0.72, 1.0)
    income *= np.select(
        [employment == "unemployed", employment == "deceased", employment == "retired", employment == "informal"],
        [0.38, 0.55, 0.62, 0.82],
        default=1.0,
    )
    income = np.clip(income, 12_000, 600_000).round(-2)

    household_size = np.clip(2 + rng.poisson(2.4, n) + single_parent.astype(int) * 0, 2, 9)
    dependents = np.minimum(household_size - 1, rng.poisson(1.1, n) + single_parent.astype(int))
    siblings_in_edu = np.minimum(dependents, rng.binomial(3, 0.38, n))

    accommodation = rng.choice(ACCOMMODATION, size=n, p=[0.45, 0.33, 0.22])
    acc_cost = np.select([accommodation == "hostel", accommodation == "boarding"], [21_000, 14_500], default=3_000)
    monthly_expenses = np.clip(rng.normal(27_000, 5_500, n) + acc_cost, 15_000, 90_000).round(-2)

    p_loan = np.clip(0.07 + 0.30 * (income < 55_000) + 0.06 * rural, 0, 0.9)
    has_loan = rng.random(n) < p_loan
    loan_amount = np.where(has_loan, rng.lognormal(np.log(320_000), 0.5, n), 0.0).round(-3)

    p_shock = np.clip(0.08 + 0.14 * (employment == "unemployed") + 0.07 * single_parent + 0.04 * rural, 0, 0.8)
    shock = rng.random(n) < p_shock

    gpa = np.clip(rng.normal(3.05, 0.42, n) - 0.10 * shock, 1.6, 4.0).round(2)
    year = rng.choice([3, 4], size=n, p=[0.55, 0.45])
    current_scholarship = rng.random(n) < 0.07

    df = pd.DataFrame(
        {
            "monthly_household_income_lkr": income,
            "household_size": household_size,
            "dependents": dependents,
            "siblings_in_education": siblings_in_edu,
            "guardian_employment": employment,
            "single_parent": single_parent.astype(int),
            "has_education_loan": has_loan.astype(int),
            "loan_amount_lkr": loan_amount,
            "monthly_expenses_lkr": monthly_expenses,
            "accommodation": accommodation,
            "rural_district": rural.astype(int),
            "financial_shock_last_year": shock.astype(int),
            "current_scholarship": current_scholarship.astype(int),
            "gpa": gpa,
            "year_of_study": year,
        }
    )

    # ---- hidden "expert rubric" (stand-in for expert-validated labels) --------
    percap = income / household_size
    expense_ratio = np.clip(monthly_expenses / income, 0, 3)
    loan_burden = np.clip(loan_amount / (income * 12), 0, 2)
    dep_ratio = dependents / household_size

    latent = (
        1.55 * _zscore(-np.log(percap))
        + 0.55 * _zscore(dep_ratio)
        + 0.50 * _zscore(loan_burden)
        + 0.60 * _zscore(expense_ratio)
        + 0.60 * shock
        + 0.30 * rural
        + 0.42 * single_parent
        + 0.30 * _zscore(siblings_in_edu)
        - 0.35 * current_scholarship
        # non-linear interactions a single income cut-off cannot capture
        + 0.55 * ((percap < 14_000) & has_loan)
        + 0.45 * ((expense_ratio > 0.6) & shock)
    )
    expert_noise = rng.normal(0, 0.55, n)
    df["latent_need"] = (latent + expert_noise).round(4)  # hidden column - never a model input
    cutoff = np.quantile(df["latent_need"], 0.72)  # ~28% prevalence
    df["vulnerable"] = (df["latent_need"] > cutoff).astype(int)
    df.insert(0, "student_id", [f"SYN-{i:04d}" for i in range(n)])
    return df


# ---------------------------------------------------------------------------
# Scholarship catalogue + graded relevance judgements for matching evaluation
# ---------------------------------------------------------------------------

def scholarship_catalogue() -> list[dict]:
    """24 ILLUSTRATIVE scholarships. Names/providers are fictional, not real schemes."""
    rng = np.random.default_rng(SEED + 1)
    types = ["need", "merit", "mixed"]
    providers = [
        "Illustrative Alumni Fund",
        "Illustrative CSR Foundation",
        "Illustrative Bank Education Trust",
        "Illustrative NGO Programme",
        "Illustrative Telecom Scholars",
        "Illustrative Faculty Endowment",
    ]
    out = []
    for i in range(24):
        kind = types[i % 3]
        out.append(
            {
                "id": f"SCH-{i + 1:02d}",
                "title": f"{kind.title()} Scholarship {i + 1:02d} (illustrative)",
                "provider": providers[i % len(providers)],
                "type": kind,
                "amount_lkr": int(rng.choice([60_000, 90_000, 120_000, 180_000, 240_000, 360_000])),
                "min_gpa": float(np.round(rng.choice([2.0, 2.5, 2.8, 3.0, 3.3]) if kind != "need" else rng.choice([0.0, 2.0, 2.3]), 1)),
                "max_monthly_income_lkr": int(rng.choice([60_000, 90_000, 120_000, 1_000_000]) if kind != "merit" else 1_000_000),
                "min_vulnerability": int(rng.choice([55, 65, 75]) if kind == "need" else (45 if kind == "mixed" else 0)),
                "eligible_years": [3, 4] if i % 4 else [4],
                "rural_only": bool(kind == "need" and i % 6 == 0),
                "deadline_days": int(rng.integers(7, 120)),
            }
        )
    return out


def graded_relevance(student: pd.Series, sch: dict, rng: np.random.Generator) -> int:
    """
    Simulated expert relevance (0-3) for a (student, scholarship) pair.
    0 = ineligible / irrelevant, 3 = ideal match. Includes judgement noise.
    Uses the HIDDEN latent need, not the features the rankers see.
    """
    income = student["monthly_household_income_lkr"]
    eligible = (
        student["gpa"] >= sch["min_gpa"]
        and income <= sch["max_monthly_income_lkr"]
        and student["year_of_study"] in sch["eligible_years"]
        and (student["rural_district"] == 1 or not sch["rural_only"])
    )
    if not eligible:
        return 0

    need = student["latent_need"]  # roughly N(0, ~2)
    rel = 1
    if sch["type"] in ("need", "mixed") and need > 0.9:
        rel += 1
    if sch["type"] == "need" and need > 2.0:
        rel += 1
    if sch["type"] in ("merit", "mixed") and student["gpa"] >= sch["min_gpa"] + 0.5:
        rel += 1
    if sch["amount_lkr"] >= 180_000 and need > 1.4:
        rel += 1  # large awards matter most for the neediest
    if sch["type"] == "need" and need < 0.0:
        rel -= 1  # need-based award is a poor fit for a financially secure student
    rel = int(np.clip(rel, 0, 3))
    if rng.random() < 0.10:  # expert disagreement
        rel = int(np.clip(rel + rng.choice([-1, 1]), 0, 3))
    return rel


def split_indices(y: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """The single train/hold-out split used by BOTH vulnerability training and matching evaluation."""
    from sklearn.model_selection import train_test_split

    return train_test_split(np.arange(len(y)), test_size=0.2, stratify=y, random_state=SEED)


PROFILE_FIELDS = [c for c in RAW_COLUMNS]


def build_matching_eval(students: pd.DataFrame, n_eval: int = 300, seed: int = SEED + 2) -> dict:
    """Graded-relevance ground truth for ranking evaluation, sampled ONLY from hold-out students."""
    rng = np.random.default_rng(seed)
    catalogue = scholarship_catalogue()
    _, holdout = split_indices(students["vulnerable"].to_numpy())
    idx = rng.choice(holdout, size=min(n_eval, len(holdout)), replace=False)
    items = []
    for i in idx:
        s = students.iloc[int(i)]
        profile = {k: (s[k].item() if hasattr(s[k], "item") else s[k]) for k in PROFILE_FIELDS}
        items.append(
            {
                "student_id": s["student_id"],
                "profile": profile,
                "relevance": {sch["id"]: graded_relevance(s, sch, rng) for sch in catalogue},
            }
        )
    return {"scholarships": catalogue, "items": items}


def main() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    students = generate_students()
    students.to_csv(DATA_DIR / "synthetic_students.csv", index=False)
    matching = build_matching_eval(students)
    (DATA_DIR / "matching_eval.json").write_text(json.dumps(matching, indent=1), encoding="utf-8")
    print(f"students: {len(students)}  vulnerable prevalence: {students['vulnerable'].mean():.3f}")
    print(f"matching eval: {len(matching['items'])} students x {len(matching['scholarships'])} scholarships")
    print(f"wrote {DATA_DIR / 'synthetic_students.csv'}")


if __name__ == "__main__":
    main()
