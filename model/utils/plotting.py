"""
plotting.py

Visualization utilities for commodity price forecasting.

Author: Your Name
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import matplotlib.pyplot as plt
import pandas as pd


class ForecastPlotter:
    """
    Utility class for plotting forecasts.
    """

    def __init__(self, figsize=(12, 6), dpi=300):
        self.figsize = figsize
        self.dpi = dpi

    # ==========================================================
    # Internal
    # ==========================================================

    @staticmethod
    def _prepare_output(save_path: str | Path):

        if save_path is None:
            return

        save_path = Path(save_path)

        save_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        return save_path

    # ==========================================================
    # Historical Data
    # ==========================================================

    def plot_history(
        self,
        data: pd.DataFrame,
        save_path: Optional[str] = None,
    ):

        plt.figure(figsize=self.figsize)

        plt.plot(
            data.index,
            data["Price"],
            label="Historical Price",
            linewidth=2,
        )

        plt.title("Historical Prices")

        plt.xlabel("Date")

        plt.ylabel("Price")

        plt.grid(True)

        plt.legend()

        if save_path:

            save_path = self._prepare_output(save_path)

            plt.savefig(
                save_path,
                dpi=self.dpi,
                bbox_inches="tight",
            )

        plt.show()

    # ==========================================================
    # Prophet
    # ==========================================================

    def plot_prophet(
        self,
        history,
        forecast,
        save_path=None,
    ):

        plt.figure(figsize=self.figsize)

        plt.plot(
            history["ds"],
            history["y"],
            label="Historical",
        )

        plt.plot(
            forecast["ds"],
            forecast["yhat"],
            label="Prophet Forecast",
            linewidth=2,
        )

        plt.fill_between(

            forecast["ds"],

            forecast["yhat_lower"],

            forecast["yhat_upper"],

            alpha=0.2,
        )

        plt.title("Prophet Forecast")

        plt.xlabel("Date")

        plt.ylabel("Price")

        plt.grid(True)

        plt.legend()

        if save_path:

            save_path = self._prepare_output(save_path)

            plt.savefig(
                save_path,
                dpi=self.dpi,
                bbox_inches="tight",
            )

        plt.show()

    # ==========================================================
    # SARIMA
    # ==========================================================

    def plot_sarima(
        self,
        train,
        test,
        forecast,
        lower,
        upper,
        save_path=None,
    ):

        plt.figure(figsize=self.figsize)

        plt.plot(
            train.index,
            train,
            label="Training",
        )

        plt.plot(
            test.index,
            test,
            label="Actual",
        )

        plt.plot(
            forecast.index,
            forecast,
            label="SARIMA Forecast",
            linewidth=2,
        )

        plt.fill_between(

            forecast.index,

            lower,

            upper,

            alpha=0.2,
        )

        plt.title("SARIMA Forecast")

        plt.xlabel("Date")

        plt.ylabel("Price")

        plt.grid(True)

        plt.legend()

        if save_path:

            save_path = self._prepare_output(save_path)

            plt.savefig(
                save_path,
                dpi=self.dpi,
                bbox_inches="tight",
            )

        plt.show()

    # ==========================================================
    # Ensemble
    # ==========================================================

    def plot_ensemble(
        self,
        history_dates,
        history_values,
        forecast_dates,
        ensemble,
        actual=None,
        save_path=None,
    ):

        plt.figure(figsize=self.figsize)

        plt.plot(
            history_dates,
            history_values,
            label="Historical",
        )

        if actual is not None:

            plt.plot(
                forecast_dates,
                actual,
                label="Actual",
            )

        plt.plot(
            forecast_dates,
            ensemble,
            label="Ensemble Forecast",
            linewidth=2,
        )

        plt.title("Ensemble Forecast")

        plt.xlabel("Date")

        plt.ylabel("Price")

        plt.grid(True)

        plt.legend()

        if save_path:

            save_path = self._prepare_output(save_path)

            plt.savefig(
                save_path,
                dpi=self.dpi,
                bbox_inches="tight",
            )

        plt.show()

    # ==========================================================
    # Model Comparison
    # ==========================================================

    def compare_models(
        self,
        history_dates,
        history_values,
        forecast_dates,
        prophet,
        sarima,
        ensemble,
        actual=None,
        save_path=None,
    ):

        plt.figure(figsize=(14, 7))

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
                linewidth=2,
            )

        plt.plot(
            forecast_dates,
            prophet,
            label="Prophet",
        )

        plt.plot(
            forecast_dates,
            sarima,
            label="SARIMA",
        )

        plt.plot(
            forecast_dates,
            ensemble,
            label="Ensemble",
            linewidth=3,
        )

        plt.title("Forecast Comparison")

        plt.xlabel("Date")

        plt.ylabel("Price")

        plt.grid(True)

        plt.legend()

        if save_path:

            save_path = self._prepare_output(save_path)

            plt.savefig(
                save_path,
                dpi=self.dpi,
                bbox_inches="tight",
            )

        plt.show()

    # ==========================================================
    # Evaluation Metrics
    # ==========================================================

    def plot_metrics(
        self,
        metrics_df: pd.DataFrame,
        metric="RMSE",
        save_path=None,
    ):

        plt.figure(figsize=(8, 5))

        values = metrics_df.loc[metric]

        plt.bar(
            values.index,
            values.values,
        )

        plt.title(f"{metric} Comparison")

        plt.ylabel(metric)

        plt.grid(axis="y")

        if save_path:

            save_path = self._prepare_output(save_path)

            plt.savefig(
                save_path,
                dpi=self.dpi,
                bbox_inches="tight",
            )

        plt.show()


# ==========================================================
# Example
# ==========================================================

