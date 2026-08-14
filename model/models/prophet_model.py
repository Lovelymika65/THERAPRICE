"""
prophet_model.py

Train and forecast commodity prices using Facebook Prophet.

Author: Your Name
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional, Tuple

import matplotlib.pyplot as plt
import pandas as pd
from prophet import Prophet
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


class ProphetForecaster:
    """
    Prophet forecasting model.

    Parameters
    ----------
    yearly_seasonality : bool
    weekly_seasonality : bool
    daily_seasonality : bool
    changepoint_prior_scale : float
    seasonality_mode : str
    """

    def __init__(
        self,
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
        seasonality_mode="additive",
        regressor_columns: Optional[list] = None,
    ):

        self.model = Prophet(
            yearly_seasonality=yearly_seasonality,
            weekly_seasonality=weekly_seasonality,
            daily_seasonality=daily_seasonality,
            changepoint_prior_scale=changepoint_prior_scale,
            seasonality_mode=seasonality_mode,
        )

        # Market-factor regressors (fuel pump prices, FAO supply/demand
        # indicators - see utils/factors.build_exogenous_frame) must be
        # registered with Prophet before fit() is called, and the same
        # column names must be present in every DataFrame passed to fit()
        # and predict().
        self.regressor_columns = list(regressor_columns) if regressor_columns else []
        for column in self.regressor_columns:
            self.model.add_regressor(column)

        self.forecast = None
        self.fitted = False

    # ----------------------------------------------------

    @staticmethod
    def prepare_dataframe(
        df: pd.DataFrame,
        date_column: str,
        price_column: str,
    ) -> pd.DataFrame:
        """
        Prepare dataframe for Prophet.

        Prophet requires:

            ds -> datetime
            y  -> target
        """

        data = df.copy()

        data[date_column] = pd.to_datetime(data[date_column])

        data = data.rename(
            columns={
                date_column: "ds",
                price_column: "y",
            }
        )

        data = data[["ds", "y"]]

        data = data.sort_values("ds")

        data = data.dropna()

        return data

    # ----------------------------------------------------

    def fit(self, data: pd.DataFrame):
        """`data` must contain 'ds', 'y', and - when this instance was built
        with `regressor_columns` - one column per regressor name (e.g. via
        DataPreprocessor.prophet_format(train).merge(exog_train, on='ds')).
        """

        logging.info("Training Prophet model...")

        missing = [c for c in self.regressor_columns if c not in data.columns]
        if missing:
            raise ValueError(f"Missing regressor columns in training data: {missing}")

        self.model.fit(data)

        self.fitted = True

        logging.info("Training complete.")

    # ----------------------------------------------------

    def predict(
        self,
        periods: int = 12,
        frequency: str = "MS",
        future_regressors: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        """`future_regressors`, required when this instance has
        `regressor_columns`, must supply a 'ds' column plus every regressor
        column, covering the full span returned by `make_future_dataframe`
        (i.e. the training history's dates plus `periods` new ones)."""

        if not self.fitted:
            raise RuntimeError("Model has not been fitted.")

        future = self.model.make_future_dataframe(
            periods=periods,
            freq=frequency,
        )

        if self.regressor_columns:
            if future_regressors is None:
                raise ValueError("future_regressors is required when regressor_columns is set.")
            future = future.merge(future_regressors, on="ds", how="left")
            future[self.regressor_columns] = future[self.regressor_columns].ffill().bfill()
            missing = [c for c in self.regressor_columns if future[c].isna().any()]
            if missing:
                raise ValueError(f"future_regressors is missing values for: {missing}")

        self.forecast = self.model.predict(future)

        return self.forecast

    # ----------------------------------------------------

    def get_forecast(self):

        if self.forecast is None:
            raise RuntimeError("Forecast not generated.")

        return self.forecast[
            [
                "ds",
                "yhat",
                "yhat_lower",
                "yhat_upper",
            ]
        ]

    # ----------------------------------------------------

    def evaluate(
        self,
        actual: pd.Series,
        predicted: pd.Series,
    ) -> dict:

        mae = mean_absolute_error(actual, predicted)

        rmse = mean_squared_error(
            actual,
            predicted,
            squared=False,
        )

        mape = (
            (
                abs(actual - predicted)
                / actual
            ).mean()
            * 100
        )

        return {
            "MAE": mae,
            "RMSE": rmse,
            "MAPE": mape,
        }

    # ----------------------------------------------------

    def save_forecast(
        self,
        output_path: str,
    ):

        if self.forecast is None:
            raise RuntimeError("Forecast has not been generated.")

        Path(output_path).parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.get_forecast().to_csv(
            output_path,
            index=False,
        )

        logging.info(
            f"Forecast saved to {output_path}"
        )

    # ----------------------------------------------------

    def plot(
        self,
        save_path: Optional[str] = None,
    ):

        if self.forecast is None:
            raise RuntimeError("Forecast unavailable.")

        fig = self.model.plot(self.forecast)

        plt.title("Prophet Forecast")

        plt.xlabel("Date")

        plt.ylabel("Price")

        plt.grid(True)

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

    # ----------------------------------------------------

    def plot_components(
        self,
        save_path: Optional[str] = None,
    ):

        if self.forecast is None:
            raise RuntimeError("Forecast unavailable.")

        fig = self.model.plot_components(
            self.forecast
        )

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

    # ----------------------------------------------------

    @staticmethod
    def train_test_split(
        data: pd.DataFrame,
        test_size: float = 0.2,
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:

        split = int(
            len(data) * (1 - test_size)
        )

        train = data.iloc[:split]

        test = data.iloc[split:]

        return train, test


# ==========================================================

