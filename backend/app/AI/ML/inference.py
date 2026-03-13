import json
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

warnings.filterwarnings("ignore")

MODEL_PATH_REGRET = "kaggle/working/mlruns/1/models/FINAL_StackingEnsemble__regret_level/artifacts/StackingEnsemble_regret_lv.pkl"
MODEL_PATH_TOLERANCE = "kaggle/working/mlruns/1/models/FINAL_StackingEnsemble__tolerance_level/artifacts/StackingEnsemble_tolerance_lv.pkl"
TEST_PATH = "finance_behavior_dataset/test.csv"
TRAIN_PATH = "finance_behavior_dataset/train.csv"
OUTPUT_PATH = "target_output.json"

CATEGORIES = ["food", "shopping", "entertainment", "investment", "transport", "subscription", "other"]
MONTHS = ["m0", "m1", "m2"]
LAMBDA_DECAY = 0.8
THETA_MONEY = 0.6
THETA_FREQ = 0.4
GAMMA_TREND = 0.3
EPS = 1e-8

ESSENTIAL_SCORE = {
    "food": 1.0, "transport": 0.9, "investment": 0.7, "other": 0.5,
    "subscription": 0.4, "shopping": 0.3, "entertainment": 0.2,
}

KNOWN_PRODUCT_CATEGORIES = ["entertainment", "food", "investment", "other", "shopping", "subscription", "transport"]
KNOWN_PAYMENT_METHODS = ["card", "cash", "e_wallet"]

NUMERICAL_COLS = [
    "age", "gender", "monthly_income", "total_current_savings",
    "total_target_savings", "total_expense_this_month", "days_remaining_until_target",
    *[f"monthly_total_expense_{m}" for m in MONTHS],
    *[f"category_expense_{cat}_{m}" for cat in CATEGORIES for m in MONTHS],
    *[f"category_frequency_{cat}_{m}" for cat in CATEGORIES for m in MONTHS],
    *[f"average_order_value_{m}" for m in MONTHS],
    *[f"median_order_value_{m}" for m in MONTHS],
    "product_price", "discount_percent",
    *[f"budget_{cat}" for cat in CATEGORIES],
    "budget_discipline_score", "time_spent_considering",
    "expense_stress", "goal_disruption_ratio", "velocity_shock", "spending_velocity",
    *[f"category_weight_{cat}" for cat in CATEGORIES],
    "is_special_day", "time_of_day",
]

CATEGORICAL_COLS = ["product_category", "payment_method"]


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -500, 500)))


def load_model(model_path):
    return joblib.load(Path(model_path))


def load_train_data(train_path):
    return pd.read_csv(train_path)


def load_test_data(test_path, time_spent_mean):
    df = pd.read_csv(test_path)
    df["time_spent_considering"] = float(time_spent_mean)
    df["payment_method"] = "cash"

    return df


def feature_engineering(df):
    df = df.copy()

    df["expense_stress"] = (df["total_expense_this_month"] / np.maximum(df["monthly_income"], EPS)).clip(0, 5)

    remaining_goal_after = df["total_target_savings"] - (df["total_current_savings"] - df["product_price"])
    df["goal_disruption_ratio"] = (df["product_price"] / np.maximum(np.abs(remaining_goal_after), EPS)).clip(0, 10)

    remaining_before = df["total_target_savings"] - df["total_current_savings"]
    daily_before = remaining_before / np.maximum(df["days_remaining_until_target"].astype(float), EPS)
    daily_after = remaining_goal_after / np.maximum(df["days_remaining_until_target"].astype(float), EPS)
    df["velocity_shock"] = (daily_after / np.maximum(np.abs(daily_before), EPS)).clip(0, 10)

    df["spending_velocity"] = ((df["monthly_total_expense_m0"] - df["monthly_total_expense_m2"]) /
                               np.maximum(df["monthly_total_expense_m2"], EPS)).clip(-2, 5)

    E_tilde, F_tilde = {}, {}
    for cat in CATEGORIES:
        E_tilde[cat] = (df[f"category_expense_{cat}_m0"] + LAMBDA_DECAY * df[f"category_expense_{cat}_m1"] +
                        (LAMBDA_DECAY ** 2) * df[f"category_expense_{cat}_m2"])
        F_tilde[cat] = (df[f"category_frequency_{cat}_m0"].astype(float) +
                        LAMBDA_DECAY * df[f"category_frequency_{cat}_m1"].astype(float) +
                        (LAMBDA_DECAY ** 2) * df[f"category_frequency_{cat}_m2"].astype(float))

    total_E = sum(E_tilde[c] for c in CATEGORIES) + EPS
    total_F = sum(F_tilde[c] for c in CATEGORIES) + EPS
    M = {c: E_tilde[c] / total_E for c in CATEGORIES}
    T = {c: F_tilde[c] / total_F for c in CATEGORIES}

    A = {}
    for cat in CATEGORIES:
        trend = (df[f"category_expense_{cat}_m1"] - df[f"category_expense_{cat}_m2"]) / (df[f"category_expense_{cat}_m2"] + EPS)
        A[cat] = 1 + GAMMA_TREND * np.tanh(trend)

    saving_pressure = (df["total_target_savings"] - df["total_current_savings"]) / (df["days_remaining_until_target"].astype(float) + EPS)
    income_left = df["monthly_income"] - df["total_expense_this_month"]
    S = sigmoid((saving_pressure - income_left) / (df["monthly_income"] + EPS))
    C = {cat: 1 - S * (1 - ESSENTIAL_SCORE[cat]) for cat in CATEGORIES}

    U = {cat: (THETA_MONEY * M[cat] + THETA_FREQ * T[cat]) * A[cat] * C[cat] for cat in CATEGORIES}
    U_stack = np.column_stack([U[c] for c in CATEGORIES])
    U_stack = U_stack - np.max(U_stack, axis=1, keepdims=True)
    exp_U = np.exp(U_stack)
    softmax_U = exp_U / (np.sum(exp_U, axis=1, keepdims=True) + EPS)

    for i, cat in enumerate(CATEGORIES):
        df[f"category_weight_{cat}"] = softmax_U[:, i]

    if "budget_discipline_score" not in df.columns or df["budget_discipline_score"].isna().all():
        total_budget = sum(df[f"budget_{cat}"] for cat in CATEGORIES)
        df["budget_discipline_score"] = (1 - (df["monthly_total_expense_m0"] - total_budget) / np.maximum(total_budget, EPS)).clip(0, 1)

    if "date_and_time" in df.columns:
        dt = pd.to_datetime(df["date_and_time"], errors="coerce")
        special_dates = {(1, 1), (4, 30), (5, 1), (9, 2)}
        is_weekend = dt.dt.dayofweek >= 5
        is_holiday = dt.apply(lambda x: (x.month, x.day) in special_dates if pd.notnull(x) else False)
        df["is_special_day"] = (is_weekend | is_holiday).astype(int)
        hour = dt.dt.hour
        df["time_of_day"] = np.select([(hour >= 6) & (hour < 12), (hour >= 12) & (hour < 14), (hour >= 14) & (hour < 18)], [1, 2, 3], default=4)
        df = df.drop(columns=["date_and_time"], errors="ignore")
    else:
        df["is_special_day"] = 0
        df["time_of_day"] = 1

    df = df.drop(columns=["regret_level", "tolerance_level"], errors="ignore")
    return df


def build_preprocessor():
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]), NUMERICAL_COLS),
            ("cat", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")),
                              ("encoder", OneHotEncoder(categories=[KNOWN_PRODUCT_CATEGORIES, KNOWN_PAYMENT_METHODS],
                                                        handle_unknown="ignore", sparse_output=False))]), CATEGORICAL_COLS),
        ],
        remainder="drop",
    )
    return preprocessor


def adjust_predictions(regret_pred, tolerance_pred, adjustment=0.25):
    regret_adjusted = np.clip(regret_pred + adjustment * np.std(regret_pred), 0.0, 1.0)
    tolerance_adjusted = np.clip(tolerance_pred - adjustment * np.std(tolerance_pred), 0.0, 1.0)
    return regret_adjusted, tolerance_adjusted


def save_json(regret_pred, tolerance_pred, output_path):
    results = [{"id": i, "regret_level": float(regret_pred[i]), "tolerance_level": float(tolerance_pred[i])}
               for i in range(len(regret_pred))]
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)


def pipeline():
    model_regret = load_model(MODEL_PATH_REGRET)
    model_tolerance = load_model(MODEL_PATH_TOLERANCE)

    train_df = load_train_data(TRAIN_PATH)
    time_spent_mean = train_df["time_spent_considering"].mean()

    df = load_test_data(TEST_PATH, time_spent_mean)

    train_df = feature_engineering(train_df)
    df = feature_engineering(df)

    preprocessor = build_preprocessor()
    preprocessor.fit(train_df)
    X = preprocessor.transform(df)

    regret_pred = model_regret.predict(X)
    tolerance_pred = model_tolerance.predict(X)

    regret_final, tolerance_final = adjust_predictions(regret_pred, tolerance_pred)

    save_json(regret_final, tolerance_final, OUTPUT_PATH)


if __name__ == "__main__":
    pipeline()