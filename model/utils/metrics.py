"""
metrics.py

Evaluation metrics for time series forecasting.

Author: Your Name
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict

import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


class ForecastMetrics:
    """
    Evaluation metrics for forecasting models.
    """

    @staticmethod
    def mae(actual, predicted) -> float:
        """Mean Absolute Error."""
        return mean_absolute_error(actual, predicted)

    # ---------------------------------------------------------

    @staticmethod
    def mse(actual, predicted) -> float:
        """Mean Squared Error."""
        return mean_squared_error(actual, predicted)

    # ---------------------------------------------------------

    @staticmethod
    def rmse(actual, predicted) -> float:
        """Root Mean Squared Error."""
        return np.sqrt(
            mean_squared_error(actual, predicted)
        )

    # ---------------------------------------------------------

    @staticmethod
    def mape(actual, predicted) -> float:
        """
        Mean Absolute Percentage Error.
        """

        actual = np.array(actual)
        predicted = np.array(predicted)

        mask = actual != 0

        return (
            np.mean(
                np.abs(
                    (
                        actual[mask]
                        - predicted[mask]
                    )
                    / actual[mask]
                )
            )
            * 100
        )

    # ---------------------------------------------------------

    @staticmethod
    def smape(actual, predicted) -> float:
        """
        Symmetric Mean Absolute Percentage Error.
        """

        actual = np.array(actual)
        predicted = np.array(predicted)

        denominator = (
            np.abs(actual)
            + np.abs(predicted)
        ) / 2

        mask = denominator != 0

        return (
            np.mean(
                np.abs(
                    actual[mask]
                    - predicted[mask]
                )
                / denominator[mask]
            )
            * 100
        )

    # ---------------------------------------------------------

    @staticmethod
    def r2(actual, predicted) -> float:
        """
        Coefficient of Determination.
        """
        return r2_score(
            actual,
            predicted,
        )

    # ---------------------------------------------------------

    @staticmethod
    def bias(actual, predicted) -> float:
        """
        Forecast Bias.
        Positive = overestimation.
        Negative = underestimation.
        """

        return np.mean(
            predicted - actual
        )

    # ---------------------------------------------------------

    @staticmethod
    def evaluate(
        actual,
        predicted,
    ) -> Dict[str, float]:
        """
        Calculate all metrics.
        """

        return {

            "MAE":
                ForecastMetrics.mae(
                    actual,
                    predicted,
                ),

            "MSE":
                ForecastMetrics.mse(
                    actual,
                    predicted,
                ),

            "RMSE":
                ForecastMetrics.rmse(
                    actual,
                    predicted,
                ),

            "MAPE":
                ForecastMetrics.mape(
                    actual,
                    predicted,
                ),

            "SMAPE":
                ForecastMetrics.smape(
                    actual,
                    predicted,
                ),

            "R2":
                ForecastMetrics.r2(
                    actual,
                    predicted,
                ),

            "Bias":
                ForecastMetrics.bias(
                    actual,
                    predicted,
                ),
        }

    # ---------------------------------------------------------

    @staticmethod
    def compare_models(
        prophet_metrics: Dict,
        sarima_metrics: Dict,
        ensemble_metrics: Dict,
    ) -> pd.DataFrame:
        """
        Create comparison table.
        """

        return pd.DataFrame(
            {
                "Prophet": prophet_metrics,
                "SARIMA": sarima_metrics,
                "Ensemble": ensemble_metrics,
            }
        )

    # ---------------------------------------------------------

    @staticmethod
    def best_model(
        comparison: pd.DataFrame,
        metric="RMSE",
    ):
        """
        Return the model with the
        lowest selected error metric.
        """

        return comparison.loc[
            metric
        ].idxmin()

    # ---------------------------------------------------------

    @staticmethod
    def save_results(
        comparison: pd.DataFrame,
        output_path,
    ):
        """
        Save metrics table.
        """

        output_path = Path(output_path)

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        comparison.to_csv(output_path)

        logging.info(
            f"Metrics saved to {output_path}"
        )


# ==========================================================
# Example
# ==========================================================
