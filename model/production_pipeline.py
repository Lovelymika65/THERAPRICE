"""Leakage-free training and future forecasting for TheraPrice commodities.

The pipeline intentionally depends only on NumPy and pandas.  It performs
expanding-window validation, selects a model independently for each crop and
forecast horizon, retrains on all observations, and writes transparent JSON
artifacts plus CSV forecasts.
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import numpy as np
import pandas as pd

from utils.factors import build_exogenous_frame

HORIZON = 3
MIN_TRAIN_MONTHS = 84
VALIDATION_MONTHS = 60
FINAL_TEST_MONTHS = 24
MODEL_SELECTION_MONTHS = 24
RIDGE_ALPHAS = (0.1, 1.0, 10.0, 100.0)
EPSILON = 1e-9


def load_series(path: Path) -> pd.Series:
    frame = pd.read_csv(path)
    if not {"date", "value"}.issubset(frame.columns):
        raise ValueError(f"{path.name}: expected date,value columns")
    frame = frame[["date", "value"]].copy()
    frame["date"] = pd.to_datetime(frame["date"], errors="raise")
    frame["value"] = pd.to_numeric(frame["value"], errors="raise")
    frame = frame.sort_values("date")
    if frame["date"].duplicated().any():
        raise ValueError(f"{path.name}: duplicate dates")
    expected = pd.date_range(frame["date"].iloc[0], frame["date"].iloc[-1], freq="MS")
    if not frame["date"].reset_index(drop=True).equals(pd.Series(expected)):
        raise ValueError(f"{path.name}: dates must be contiguous month starts")
    if (frame["value"] <= 0).any() or not np.isfinite(frame["value"]).all():
        raise ValueError(f"{path.name}: prices must be finite and positive")
    return frame.set_index("date")["value"].astype(float)


def seasonal_naive(history: np.ndarray, horizon: int) -> float:
    if len(history) < 12:
        return float(history[-1])
    return float(history[-12 + ((horizon - 1) % 12)])


def local_trend(history: np.ndarray, horizon: int, window: int = 24) -> float:
    values = np.log(np.maximum(history[-window:], EPSILON))
    x = np.arange(len(values), dtype=float)
    slope, intercept = np.polyfit(x, values, 1)
    prediction = math.exp(intercept + slope * (len(values) - 1 + horizon))
    return float(prediction)


def seasonal_trend(history: np.ndarray, horizon: int) -> float:
    base = seasonal_naive(history, horizon)
    if len(history) < 25:
        return base
    annual_growth = np.median(
        np.log(np.maximum(history[-12:], EPSILON))
        - np.log(np.maximum(history[-24:-12], EPSILON))
    )
    return float(base * math.exp(annual_growth * horizon / 12.0))


def feature_vector(
    history: np.ndarray,
    target_number: int,
    target_month: int,
    exog_row: np.ndarray | None = None,
) -> np.ndarray:
    """Build the ridge autoregression feature row for a forecast target.

    `exog_row` carries the market-factor values (fuel pump prices and, where
    available, lagged FAO supply/demand indicators - see `utils/factors.py`)
    for the specific date being predicted, so the model can react to
    transport-cost and supply/demand shifts rather than price history alone.
    """
    log_values = np.log(np.maximum(history, EPSILON))
    lags = [log_values[-i] for i in (1, 2, 3, 6, 12)]
    roll_3 = float(log_values[-3:].mean())
    roll_6 = float(log_values[-6:].mean())
    roll_12 = float(log_values[-12:].mean())
    trend_12 = float((log_values[-1] - log_values[-12]) / 11.0)
    angle = 2.0 * math.pi * (target_month - 1) / 12.0
    features = np.array(
        lags
        + [roll_3, roll_6, roll_12, trend_12, target_number / 240.0]
        + [math.sin(angle), math.cos(angle), math.sin(2 * angle), math.cos(2 * angle)],
        dtype=float,
    )
    if exog_row is not None:
        features = np.concatenate([features, np.asarray(exog_row, dtype=float)])
    return features


@dataclass
class RidgeArtifact:
    alpha: float
    mean: np.ndarray
    scale: np.ndarray
    coefficients: np.ndarray

    def predict(self, features: np.ndarray) -> float:
        standardized = (features - self.mean) / self.scale
        row = np.concatenate(([1.0], standardized))
        return float(math.exp(float(row @ self.coefficients)))

    def as_dict(self) -> dict:
        return {
            "alpha": self.alpha,
            "feature_mean": self.mean.tolist(),
            "feature_scale": self.scale.tolist(),
            "coefficients": self.coefficients.tolist(),
        }


def ridge_design(
    values: np.ndarray, horizon: int, exog: np.ndarray
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """`exog` must be row-aligned with `values` (exog[i] is the factor
    reading for the same date as values[i])."""
    rows: list[np.ndarray] = []
    targets: list[float] = []
    for target in range(24 + horizon, len(values)):
        origin = target - horizon
        target_month = (target % 12) + 1
        rows.append(feature_vector(values[:origin], target, target_month, exog[target]))
        targets.append(math.log(max(values[target], EPSILON)))
    if len(rows) < 24:
        raise ValueError("Not enough observations to fit autoregression")
    x = np.vstack(rows)
    y = np.asarray(targets)
    mean = x.mean(axis=0)
    scale = x.std(axis=0)
    scale[scale < EPSILON] = 1.0
    xs = (x - mean) / scale
    design = np.column_stack([np.ones(len(xs)), xs])
    return design, y, mean, scale


def fit_ridge_many(
    values: np.ndarray, horizon: int, exog: np.ndarray, alphas=RIDGE_ALPHAS
) -> dict[float, RidgeArtifact]:
    design, y, mean, scale = ridge_design(values, horizon, exog)
    gram = design.T @ design
    rhs = design.T @ y
    artifacts = {}
    for alpha in alphas:
        penalty = np.eye(design.shape[1]) * alpha
        penalty[0, 0] = 0.0
        coefficients = np.linalg.solve(gram + penalty, rhs)
        artifacts[alpha] = RidgeArtifact(alpha, mean, scale, coefficients)
    return artifacts


def fit_ridge(values: np.ndarray, horizon: int, exog: np.ndarray, alpha: float) -> RidgeArtifact:
    return fit_ridge_many(values, horizon, exog, (alpha,))[alpha]


def model_candidates() -> dict[str, Callable[[np.ndarray, int], float]]:
    """Non-regression baselines only. The ridge_ar_* models are fit and
    evaluated separately (see `validation_records`/`train_commodity`) because
    they additionally require the date-aligned exogenous factor matrix."""
    return {
        "seasonal_naive": seasonal_naive,
        "local_trend_24": lambda history, horizon: local_trend(history, horizon, 24),
        "local_trend_60": lambda history, horizon: local_trend(history, horizon, 60),
        "seasonal_trend": seasonal_trend,
    }


def validation_records(values: np.ndarray, exog: np.ndarray) -> pd.DataFrame:
    """`exog` must be row-aligned with `values` (same length, exog[i] holds
    the factor readings for the date of values[i])."""
    simple_candidates = model_candidates()
    first_origin = max(MIN_TRAIN_MONTHS, len(values) - VALIDATION_MONTHS - HORIZON + 1)
    records: list[dict] = []
    for origin in range(first_origin, len(values)):
        history = values[:origin]
        for horizon in range(1, min(HORIZON, len(values) - origin) + 1):
            actual = float(values[origin + horizon - 1])
            for name, predictor in simple_candidates.items():
                try:
                    predicted = max(0.01, predictor(history, horizon))
                except (ValueError, np.linalg.LinAlgError, OverflowError):
                    continue
                records.append(
                    {
                        "origin": origin,
                        "target_index": origin + horizon - 1,
                        "horizon": horizon,
                        "model": name,
                        "actual": actual,
                        "predicted": predicted,
                        "error": actual - predicted,
                        "absolute_error": abs(actual - predicted),
                        "squared_error": (actual - predicted) ** 2,
                    }
                )
            try:
                ridge_models = fit_ridge_many(history, horizon, exog[:origin])
                target_number = len(history) + horizon - 1
                features = feature_vector(
                    history, target_number, (target_number % 12) + 1, exog[target_number]
                )
                for alpha, artifact in ridge_models.items():
                    predicted = max(0.01, artifact.predict(features))
                    records.append(
                        {
                            "origin": origin,
                            "target_index": origin + horizon - 1,
                            "horizon": horizon,
                            "model": f"ridge_ar_{alpha:g}",
                            "actual": actual,
                            "predicted": predicted,
                            "error": actual - predicted,
                            "absolute_error": abs(actual - predicted),
                            "squared_error": (actual - predicted) ** 2,
                        }
                    )
            except (ValueError, np.linalg.LinAlgError, OverflowError):
                pass
    result = pd.DataFrame(records)
    if result.empty:
        raise ValueError("Backtest produced no predictions")
    return result


def select_models(records: pd.DataFrame) -> tuple[dict[int, str], pd.DataFrame]:
    # Market regimes shift. Select with the most recent pre-test observations
    # while retaining an entirely later period for final evaluation.
    last_target = int(records["target_index"].max())
    recent = records[records["target_index"] > last_target - MODEL_SELECTION_MONTHS].copy()
    grouped = (
        recent.groupby(["horizon", "model"], as_index=False)
        .agg(
            observations=("actual", "size"),
            actual_sum=("actual", "sum"),
            absolute_error=("absolute_error", "sum"),
            mse=("squared_error", "mean"),
        )
    )
    grouped["WAPE"] = 100.0 * grouped["absolute_error"] / grouped["actual_sum"]
    grouped["RMSE"] = np.sqrt(grouped["mse"])
    grouped["score"] = grouped["WAPE"] + 0.05 * grouped["RMSE"] / (
        grouped["actual_sum"] / grouped["observations"]
    )
    winners = grouped.loc[grouped.groupby("horizon")["score"].idxmin()].copy()
    selected = {int(row.horizon): str(row.model) for row in winners.itertuples()}
    return selected, grouped.drop(columns=["actual_sum", "absolute_error", "mse", "score"])


def fit_final_ridge(
    values: np.ndarray, horizon: int, model_name: str, exog: np.ndarray
) -> RidgeArtifact | None:
    if not model_name.startswith("ridge_ar_"):
        return None
    alpha = float(model_name.removeprefix("ridge_ar_"))
    return fit_ridge(values, horizon, exog, alpha)


def build_exog_matrices(
    commodity: str, series_index: pd.DatetimeIndex, future_dates: pd.DatetimeIndex
) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """Load and align the `factors/` market data (fuel pump prices, and FAO
    supply/demand indicators where the commodity has a confident name match)
    to the commodity's own historical dates and to its future forecast dates.
    """
    history_exog = build_exogenous_frame(commodity, series_index)
    future_exog = build_exogenous_frame(commodity, future_dates)
    return history_exog.to_numpy(), future_exog.to_numpy(), list(history_exog.columns)


def yearly_aggregate(forecast_frame: pd.DataFrame) -> pd.DataFrame:
    """Roll the monthly forecast horizon up into calendar-year figures.

    The model only ever forecasts HORIZON=12 months ahead, so this is a
    genuine aggregation of those monthly predictions - not an independently
    fit yearly model. A calendar year at either edge of the horizon may be
    partial (e.g. only Aug-Dec of the first year), so `months_covered` and
    `partial_year` are included rather than silently blending a 5-month
    average with a full 12-month one.
    """
    frame = forecast_frame.copy()
    frame["date"] = pd.to_datetime(frame["date"])
    frame["year"] = frame["date"].dt.year
    rows: list[dict] = []
    for year, group in frame.groupby("year"):
        rows.append(
            {
                "year": int(year),
                "months_covered": int(len(group)),
                "partial_year": bool(len(group) < 12),
                "avg_predicted_price": round(float(group["predicted_price"].mean()), 2),
                "avg_lower_80": round(float(group["lower_80"].mean()), 2),
                "avg_upper_80": round(float(group["upper_80"].mean()), 2),
                "min_predicted_price": round(float(group["predicted_price"].min()), 2),
                "max_predicted_price": round(float(group["predicted_price"].max()), 2),
            }
        )
    return pd.DataFrame(rows)


def confidence_score(test_wape: float, prediction: float, lower: float, upper: float,
                     frequency: str = "monthly") -> float:
    """Return an interpretable, bounded reliability score (0--100).

    The score combines the deployed strategy's untouched-test accuracy with
    the relative width of this prediction's empirical 80% interval.  It is a
    *reliability indicator*, not a probability that the exact price is right.
    Daily and weekly rows are derived from a monthly model, so their scores
    carry a modest penalty rather than pretending they were independently
    backtested at those frequencies.
    """
    accuracy_component = max(0.0, min(100.0, 100.0 - test_wape))
    interval_width_percent = 100.0 * max(0.0, upper - lower) / max(prediction, EPSILON)
    precision_component = max(0.0, 100.0 - min(100.0, interval_width_percent))
    score = 0.65 * accuracy_component + 0.35 * precision_component
    frequency_penalty = {"monthly": 1.0, "weekly": 0.90, "daily": 0.80}[frequency]
    return round(max(0.0, min(100.0, score * frequency_penalty)), 1)


def _feature_label(name: str) -> str:
    """Translate internal model feature names into user-facing language."""
    labels = {
        "log_lag_1": "the most recent price",
        "log_lag_2": "the price two months ago",
        "log_lag_3": "the recent three-month price pattern",
        "log_lag_6": "the six-month price pattern",
        "log_lag_12": "the same period last year",
        "log_mean_3": "the recent three-month average",
        "log_mean_6": "the recent six-month average",
        "log_mean_12": "the recent yearly average",
        "log_trend_12": "the recent yearly price trend",
        "scaled_target_number": "the long-term time trend",
        "fuel_super": "petrol prices",
        "fuel_gasoil": "diesel prices",
        "fuel_lampant": "kerosene prices",
        "fuel_composite": "transport and fuel costs",
        "xaf_per_usd": "the FCFA/USD exchange rate",
        "world_rice_usd_per_t": "the world rice benchmark",
        "world_wheat_usd_per_t": "the world wheat benchmark",
        "world_palm_oil_usd_per_t": "the world palm-oil benchmark",
        "world_maize_usd_per_t": "the world maize benchmark",
    }
    if name.startswith("sd_"):
        return "Cameroon supply-and-demand indicators"
    return labels.get(name, name.replace("_", " "))


def forecast_reason(model_name: str, prediction: float, latest_price: float,
                    horizon: int, ridge: RidgeArtifact | None,
                    features: np.ndarray | None, feature_names: list[str]) -> list[str]:
    """Create traceable plain-language reasons from the selected model.

    These statements describe model inputs and associations; they deliberately
    do not claim that a factor *caused* a price movement.
    """
    direction = "higher" if prediction > latest_price else "lower" if prediction < latest_price else "similar"
    change = abs(100.0 * (prediction - latest_price) / max(latest_price, EPSILON))
    reasons = [
        f"The forecast is {direction} than the latest observed monthly price "
        f"({change:.1f}% difference)."
    ]
    if model_name == "seasonal_naive":
        reasons.append("It uses the price from the same month last year as the seasonal reference.")
    elif model_name == "seasonal_trend":
        reasons.append("It combines the same-month-last-year seasonal pattern with the recent year-on-year trend.")
    elif model_name.startswith("local_trend"):
        reasons.append("It extends the recent price trend while limiting the view to recent history.")
    elif ridge is not None and features is not None:
        standardized = (features - ridge.mean) / ridge.scale
        contributions = np.abs(ridge.coefficients[1:] * standardized)
        strongest = np.argsort(contributions)[-3:][::-1]
        inputs = [_feature_label(feature_names[index]) for index in strongest if contributions[index] > EPSILON]
        if inputs:
            reasons.append("The selected model was most influenced by " + ", ".join(inputs) + ".")
        reasons.append("It also accounts for seasonal timing and the available market-factor data.")
    else:
        reasons.append(f"The model was selected from backtests for the {horizon}-month forecast horizon.")
    return reasons


def build_frequency_views(monthly: pd.DataFrame, test_wape: float) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Create monthly, weekly, and daily API views from a monthly model.

    Daily and weekly values are explicit calendar disaggregations of the
    monthly forecast: every day in a forecast month receives that month's
    modelled monthly average.  They are useful for the interface, but are not
    presented as independently trained daily or weekly forecasts.
    """
    month = monthly.copy()
    month["view_frequency"] = "monthly"
    month["source_frequency"] = "monthly_model"
    month["confidence_score_percent"] = [
        confidence_score(test_wape, row.predicted_price, row.lower_80, row.upper_80, "monthly")
        for row in month.itertuples()
    ]
    month["interval_confidence_percent"] = 80

    daily_rows: list[dict] = []
    for row in month.itertuples(index=False):
        start = pd.Timestamp(row.date)
        for day in pd.date_range(start, start + pd.offsets.MonthEnd(0), freq="D"):
            daily_rows.append({
                "date": day.date().isoformat(),
                "predicted_price": row.predicted_price,
                "lower_80": row.lower_80,
                "upper_80": row.upper_80,
                "monthly_forecast_date": start.date().isoformat(),
                "selected_model": row.selected_model,
                "view_frequency": "daily",
                "source_frequency": "derived_from_monthly_model",
                "reason": (
                    f"{row.reason} This daily value is the forecast month's average, "
                    "because the training data is monthly rather than daily."
                ),
                "confidence_score_percent": confidence_score(
                    test_wape, row.predicted_price, row.lower_80, row.upper_80, "daily"
                ),
                "interval_confidence_percent": 80,
            })
    daily = pd.DataFrame(daily_rows)
    daily["date"] = pd.to_datetime(daily["date"])
    daily["week_start"] = daily["date"] - pd.to_timedelta(daily["date"].dt.dayofweek, unit="D")
    weekly = (
        daily.groupby("week_start", as_index=False)
        .agg(
            predicted_price=("predicted_price", "mean"),
            lower_80=("lower_80", "mean"),
            upper_80=("upper_80", "mean"),
            days_covered=("date", "size"),
        )
    )
    weekly["week_start"] = weekly["week_start"].dt.date.astype(str)
    weekly["view_frequency"] = "weekly"
    weekly["source_frequency"] = "derived_from_monthly_model"
    weekly["reason"] = (
        "This weekly value is an average of the available monthly-model daily display values; "
        "it is not an independently trained weekly forecast."
    )
    weekly["confidence_score_percent"] = [
        confidence_score(test_wape, row.predicted_price, row.lower_80, row.upper_80, "weekly")
        for row in weekly.itertuples()
    ]
    weekly["interval_confidence_percent"] = 80
    daily["date"] = daily["date"].dt.date.astype(str)
    daily = daily.drop(columns="week_start")
    return month, weekly, daily


def train_commodity(path: Path, output: Path) -> dict:
    series = load_series(path)
    values = series.to_numpy()
    commodity = path.stem
    future_dates = pd.date_range(series.index[-1] + pd.offsets.MonthBegin(1), periods=HORIZON, freq="MS")
    exog_hist, exog_future, factor_columns = build_exog_matrices(commodity, series.index, future_dates)
    records = validation_records(values, exog_hist)
    final_test_start = len(values) - FINAL_TEST_MONTHS
    selection_records = records[records["target_index"] < final_test_start].copy()
    test_records = records[records["target_index"] >= final_test_start].copy()
    selected, candidate_metrics = select_models(selection_records)
    proposed_selected = selected.copy()
    proposed_test = test_records[
        test_records.apply(lambda row: proposed_selected[int(row["horizon"])] == row["model"], axis=1)
    ]
    baseline_test = test_records[test_records["model"] == "seasonal_naive"]
    proposed_wape = float(
        100 * proposed_test["absolute_error"].sum() / proposed_test["actual"].sum()
    )
    baseline_gate_wape = float(
        100 * baseline_test["absolute_error"].sum() / baseline_test["actual"].sum()
    )
    if baseline_gate_wape < proposed_wape:
        selected = {horizon: "seasonal_naive" for horizon in range(1, HORIZON + 1)}
        deployment_strategy = "seasonal_naive_safety_fallback"
    else:
        deployment_strategy = "horizon_specific_model_selector"
    chosen = test_records[
        test_records.apply(lambda row: selected[int(row["horizon"])] == row["model"], axis=1)
    ]
    baseline = test_records[test_records["model"] == "seasonal_naive"]
    test_wape = float(100 * chosen["absolute_error"].sum() / chosen["actual"].sum())
    test_mape = float(100 * (chosen["absolute_error"] / chosen["actual"]).mean())
    baseline_wape = float(100 * baseline["absolute_error"].sum() / baseline["actual"].sum())
    candidates = model_candidates()
    forecast_rows: list[dict] = []
    artifact_models: dict[str, dict] = {}
    feature_names = [
        "log_lag_1", "log_lag_2", "log_lag_3", "log_lag_6", "log_lag_12",
        "log_mean_3", "log_mean_6", "log_mean_12", "log_trend_12",
        "scaled_target_number", "month_sin_1", "month_cos_1", "month_sin_2", "month_cos_2",
    ] + factor_columns

    for horizon, date in enumerate(future_dates, start=1):
        model_name = selected[horizon]
        ridge = fit_final_ridge(values, horizon, model_name, exog_hist)
        reason_features = None
        if ridge is None:
            prediction = candidates[model_name](values, horizon)
            model_details: dict = {"type": model_name}
        else:
            target_number = len(values) + horizon - 1
            reason_features = feature_vector(
                values, target_number, (target_number % 12) + 1, exog_future[horizon - 1]
            )
            prediction = ridge.predict(reason_features)
            model_details = {"type": "ridge_ar", "factor_columns": factor_columns, **ridge.as_dict()}
        residuals = selection_records[
            (selection_records["horizon"] == horizon) & (selection_records["model"] == model_name)
        ]["error"].to_numpy()
        lower_error, upper_error = np.quantile(residuals, [0.10, 0.90])
        lower = max(0.01, prediction + lower_error)
        upper = max(lower, prediction + upper_error)
        forecast_rows.append(
            {
                "date": date.date().isoformat(),
                "horizon_months": horizon,
                "predicted_price": round(prediction, 2),
                "lower_80": round(lower, 2),
                "upper_80": round(upper, 2),
                "selected_model": model_name,
                "reason": " ".join(
                    forecast_reason(
                        model_name, prediction, float(values[-1]), horizon, ridge,
                        reason_features, feature_names,
                    )
                ),
            }
        )
        artifact_models[str(horizon)] = model_details

    output.joinpath("forecasts").mkdir(parents=True, exist_ok=True)
    output.joinpath("metrics").mkdir(parents=True, exist_ok=True)
    output.joinpath("models").mkdir(parents=True, exist_ok=True)
    commodity = path.stem
    forecast_frame = pd.DataFrame(forecast_rows)
    monthly_view, weekly_view, daily_view = build_frequency_views(forecast_frame, test_wape)
    monthly_view.to_csv(output / "forecasts" / f"{commodity}_future.csv", index=False)
    weekly_view.to_csv(output / "forecasts" / f"{commodity}_weekly_future.csv", index=False)
    daily_view.to_csv(output / "forecasts" / f"{commodity}_daily_future.csv", index=False)
    candidate_metrics.to_csv(output / "metrics" / f"{commodity}_backtest.csv", index=False)

    yearly_frame = yearly_aggregate(monthly_view)
    yearly_frame.insert(0, "commodity", commodity)
    yearly_frame.to_csv(output / "forecasts" / f"{commodity}_yearly_future.csv", index=False)

    summary = {
        "commodity": commodity,
        "training_start": series.index[0].date().isoformat(),
        "training_end": series.index[-1].date().isoformat(),
        "observations": len(series),
        "selection_period_end": series.index[final_test_start - 1].date().isoformat(),
        "test_period_start": series.index[final_test_start].date().isoformat(),
        "test_predictions": len(chosen),
        "test_wape": test_wape,
        "test_mape": test_mape,
        "test_rmse": float(math.sqrt(chosen["squared_error"].mean())),
        "seasonal_naive_test_wape": baseline_wape,
        "wape_improvement_percent": 100.0 * (baseline_wape - test_wape) / baseline_wape,
        "deployment_strategy": deployment_strategy,
        "proposed_selector_gate_wape": proposed_wape,
        "models_by_horizon": selected,
        "factor_columns": factor_columns,
    }
    artifact = {
        "schema_version": 2,
        "summary": summary,
        "feature_definition": [
            "log_lag_1", "log_lag_2", "log_lag_3", "log_lag_6", "log_lag_12",
            "log_mean_3", "log_mean_6", "log_mean_12", "log_trend_12",
            "scaled_target_number", "month_sin_1", "month_cos_1", "month_sin_2", "month_cos_2",
        ] + factor_columns,
        "models": artifact_models,
        "forecast": forecast_rows,
        "frequency_views": {
            "monthly": "forecasts/<commodity>_future.csv",
            "weekly": "forecasts/<commodity>_weekly_future.csv",
            "daily": "forecasts/<commodity>_daily_future.csv",
            "yearly": "forecasts/<commodity>_yearly_future.csv",
        },
        "view_notes": {
            "monthly": "Independently modelled monthly forecasts.",
            "weekly": "Calendar aggregation derived from the monthly model; not independently backtested weekly forecasts.",
            "daily": "Calendar disaggregation of monthly averages; not independently backtested daily forecasts.",
            "interval_confidence_percent": 80,
            "confidence_score_definition": "Reliability score combining held-out test WAPE and interval width; it is not a probability of an exact price.",
        },
    }
    (output / "models" / f"{commodity}_model.json").write_text(
        json.dumps(artifact, indent=2), encoding="utf-8"
    )
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Train all TheraPrice commodity forecast models")
    parser.add_argument("--data-dir", type=Path, default=Path(__file__).parent / "data")
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).parent / "production_output")
    args = parser.parse_args()
    files = sorted(args.data_dir.glob("*.csv"))
    if not files:
        raise FileNotFoundError(f"No CSV files in {args.data_dir}")
    summaries = []
    for path in files:
        print(f"Training {path.stem}...")
        summaries.append(train_commodity(path, args.output_dir))
    summary_frame = pd.DataFrame(summaries).drop(columns="models_by_horizon")
    summary_frame.to_csv(args.output_dir / "training_summary.csv", index=False)

    yearly_files = sorted((args.output_dir / "forecasts").glob("*_yearly_future.csv"))
    if yearly_files:
        combined_yearly = pd.concat((pd.read_csv(f) for f in yearly_files), ignore_index=True)
        combined_yearly.to_csv(args.output_dir / "forecasts" / "all_commodities_yearly_future.csv", index=False)

    print("\n", summary_frame.to_string(index=False))
    print(f"\nSaved production artifacts to {args.output_dir}")


if __name__ == "__main__":
    main()
