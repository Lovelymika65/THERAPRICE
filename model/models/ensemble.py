"""
ensemble.py

Combine Prophet and SARIMA forecasts into a single ensemble forecast.

Author: Your Name
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, Optional

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


class EnsembleForecaster:
    """
    Combines Prophet and SARIMA forecasts.

    Methods
    -------
    equal_weight()
    weighted_rmse()
    weighted_mae()
    weighted_mape()
    evaluate()
    plot()
    save()
    """

    def __init__(self):

        self.forecast = None

        self.weights = {
            "prophet": 0.5,
            "sarima": 0.5,
        }

    # -------------------------------------------------------------

    @staticmethod
    def normalize_weights(
        prophet_weight: float,
        sarima_weight: float,
    ):

        total = prophet_weight + sarima_weight

        return (
            prophet_weight / total,
            sarima_weight / total,
        )

    # -------------------------------------------------------------

    def equal_weight(
        self,
        prophet_forecast,
        sarima_forecast,
    ):

        self.weights = {
            "prophet": 0.5,
            "sarima": 0.5,
        }

        self.forecast = (
            0.5 * prophet_forecast
            + 0.5 * sarima_forecast
        )

        return self.forecast

    # -------------------------------------------------------------

    def weighted_rmse(
        self,
        prophet_forecast,
        sarima_forecast,
        prophet_rmse,
        sarima_rmse,
    ):

        wp = 1 / prophet_rmse
        ws = 1 / sarima_rmse

        wp, ws = self.normalize_weights(
            wp,
            ws,
        )

        self.weights = {
            "prophet": wp,
            "sarima": ws,
        }

        self.forecast = (
            wp * prophet_forecast
            + ws * sarima_forecast
        )

        return self.forecast

    # -------------------------------------------------------------

    def weighted_mae(
        self,
        prophet_forecast,
        sarima_forecast,
        prophet_mae,
        sarima_mae,
    ):

        wp = 1 / prophet_mae
        ws = 1 / sarima_mae

        wp, ws = self.normalize_weights(
            wp,
            ws,
        )

        self.weights = {
            "prophet": wp,
            "sarima": ws,
        }

        self.forecast = (
            wp * prophet_forecast
            + ws * sarima_forecast
        )

        return self.forecast

    # -------------------------------------------------------------

    def weighted_mape(
        self,
        prophet_forecast,
        sarima_forecast,
        prophet_mape,
        sarima_mape,
    ):

        wp = 1 / prophet_mape
        ws = 1 / sarima_mape

        wp, ws = self.normalize_weights(
            wp,
            ws,
        )

        self.weights = {
            "prophet": wp,
            "sarima": ws,
        }

        self.forecast = (
            wp * prophet_forecast
            + ws * sarima_forecast
        )

        return self.forecast

    # -------------------------------------------------------------

    @staticmethod
    def evaluate(
        actual,
        predicted,
    ) -> Dict:

        mae = mean_absolute_error(
            actual,
            predicted,
        )

        rmse = mean_squared_error(
            actual,
            predicted,
            squared=False,
        )

        mape = (
            np.mean(
                np.abs(
                    (actual - predicted)
                    / actual
                )
            )
            * 100
        )

        return {

            "MAE": mae,

            "RMSE": rmse,

            "MAPE": mape,
        }

    # -------------------------------------------------------------

    def forecast_dataframe(
        self,
        dates,
    ):

        return pd.DataFrame({

            "Date": dates,

            "Forecast": self.forecast,
        })

    # -------------------------------------------------------------

    def save(
        self,
        dates,
        output_path,
    ):

        Path(output_path).parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        df = self.forecast_dataframe(dates)

        df.to_csv(
            output_path,
            index=False,
        )

        logging.info(
            f"Saved ensemble forecast to {output_path}"
        )

    # -------------------------------------------------------------

    def plot(
        self,
        history_dates,
        history_values,
        forecast_dates,
        actual=None,
        save_path: Optional[str] = None,
    ):

        plt.figure(figsize=(12, 6))

        plt.plot(
            history_dates,
            history_values,
            label="Historical",
            linewidth=2,
        )

        if actual is not None:

            plt.plot(
                forecast_dates,
                actual,
                label="Actual",
            )

        plt.plot(
            forecast_dates,
            self.forecast,
            label="Ensemble Forecast",
            linewidth=2,
        )

        plt.title("Ensemble Forecast")

        plt.xlabel("Date")

        plt.ylabel("Price")

        plt.grid(True)

        plt.legend()

        if save_path:

            Path(save_path).parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            plt.savefig(
                save_path,
                dpi=300,
                bbox_inches="tight",
            )

        plt.show()

    # -------------------------------------------------------------

    def print_weights(self):

        print("\nModel Weights")
        print("-------------------------")
        print(
            f"Prophet : {self.weights['prophet']:.3f}"
        )
        print(
            f"SARIMA  : {self.weights['sarima']:.3f}"
        )


# ===============================================================
# Example
# ===============================================================


