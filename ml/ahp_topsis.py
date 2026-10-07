"""
AHP-TOPSIS explainable need score (the "MCDM" part of the C1 vulnerability model).

AHP derives criterion weights from a pairwise-comparison matrix (Saaty 1-9 scale)
and checks consistency (CR < 0.10). TOPSIS then scores each student by relative
closeness to the "most vulnerable" ideal point.

PROVISIONAL JUDGEMENTS: the pairwise matrix below was drafted by the research
team. It must be reviewed/validated with SLIIT welfare officers (interview
evidence, proposal Section 5.1.1) before being reported as an expert judgement.

Normalisation uses FIXED, documented domain bounds (not data-derived), so the
score for one student never depends on who else is in the cohort and there is
no train/test leakage. The TypeScript mirror (`src/lib/c1/vulnerability.ts`)
uses the same bounds and weights (exported to model JSON).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

# (feature column in engineered frame, lower_bound, upper_bound, higher_means_more_vulnerable)
CRITERIA = [
    ("income_per_capita", 5_000.0, 60_000.0, False),  # lower per-capita income => more vulnerable
    ("dependency_ratio", 0.0, 0.8, True),
    ("loan_to_income", 0.0, 1.0, True),
    ("expense_ratio", 0.2, 1.5, True),
    ("financial_shock_last_year", 0.0, 1.0, True),
    ("rural_district", 0.0, 1.0, True),
    ("single_parent", 0.0, 1.0, True),
    ("siblings_in_education", 0.0, 3.0, True),
]

# Saaty pairwise matrix, upper triangle (row criterion vs column criterion).
_UPPER = {
    (0, 1): 3, (0, 2): 3, (0, 3): 2, (0, 4): 3, (0, 5): 5, (0, 6): 4, (0, 7): 5,
    (1, 2): 1, (1, 3): 1 / 2, (1, 4): 1, (1, 5): 2, (1, 6): 2, (1, 7): 3,
    (2, 3): 1 / 2, (2, 4): 1, (2, 5): 2, (2, 6): 1, (2, 7): 2,
    (3, 4): 2, (3, 5): 3, (3, 6): 2, (3, 7): 3,
    (4, 5): 2, (4, 6): 1, (4, 7): 2,
    (5, 6): 1 / 2, (5, 7): 1,
    (6, 7): 2,
}

# Saaty random consistency index by matrix size
_RI = {1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45}


def pairwise_matrix() -> np.ndarray:
    n = len(CRITERIA)
    m = np.ones((n, n))
    for (i, j), v in _UPPER.items():
        m[i, j] = v
        m[j, i] = 1.0 / v
    return m


def ahp_weights() -> tuple[np.ndarray, float, float]:
    """Return (weights, lambda_max, consistency_ratio) via the principal eigenvector."""
    m = pairwise_matrix()
    vals, vecs = np.linalg.eig(m)
    k = int(np.argmax(vals.real))
    w = np.abs(vecs[:, k].real)
    w = w / w.sum()
    lam = float(vals[k].real)
    n = m.shape[0]
    ci = (lam - n) / (n - 1)
    cr = ci / _RI[n]
    return w, lam, float(cr)


def normalise(frame: pd.DataFrame) -> np.ndarray:
    """Map each criterion to [0, 1] where 1 = most vulnerable, using fixed bounds."""
    cols = []
    for name, lo, hi, higher_is_worse in CRITERIA:
        x = np.clip((frame[name].to_numpy(dtype=float) - lo) / (hi - lo), 0.0, 1.0)
        cols.append(x if higher_is_worse else 1.0 - x)
    return np.column_stack(cols)


def topsis_scores(frame: pd.DataFrame) -> np.ndarray:
    """Relative closeness C in [0, 1] to the ideal (all criteria maximally vulnerable)."""
    w, _, _ = ahp_weights()
    v = normalise(frame) * w  # weighted normalised matrix
    ideal = w  # n_j = 1 for every criterion
    d_plus = np.sqrt(((v - ideal) ** 2).sum(axis=1))
    d_minus = np.sqrt((v**2).sum(axis=1))
    return d_minus / (d_plus + d_minus + 1e-12)


def export_spec() -> dict:
    w, lam, cr = ahp_weights()
    return {
        "criteria": [
            {"feature": n, "lower": lo, "upper": hi, "higherIsWorse": hw, "weight": float(wt)}
            for (n, lo, hi, hw), wt in zip(CRITERIA, w)
        ],
        "lambdaMax": lam,
        "consistencyRatio": cr,
        "note": "Provisional team judgements - validate with SLIIT welfare officers.",
    }


if __name__ == "__main__":
    w, lam, cr = ahp_weights()
    for (name, *_), wt in zip(CRITERIA, w):
        print(f"{name:28s} {wt:.3f}")
    print(f"lambda_max={lam:.3f}  CR={cr:.3f}  ({'OK' if cr < 0.10 else 'INCONSISTENT'})")
