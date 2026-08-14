"""
sarima_model.py

Train and forecast commodity prices using SARIMA.

Author: Your Name
"""

from __future__ import annotations

import itertools
import logging
import warnings
from pathlib import Path
from typing import Dict, Optional, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
)
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.stattools import adfuller

warnings.filterwarnings("ignore")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)


class SARIMAForecaster:
    """
    Seasonal ARIMA Forecaster with automatic parameter search.
    """

    def __init__(
        self,
        seasonal_period: int = 12,
        auto_tune: bool = True,
    ):

        self.seasonal_period = seasonal_period
        self.auto_tune = auto_tune

        self.order = None
        self.seasonal_order = None
        self.exog = None

        self.model = None
        self.results = None

        self.forecast = None
        self.conf_int = None

    # ----------------------------------------------------------------

    @staticmethod
    def prepare_dataframe(
        df: pd.DataFrame,
        date_column: str,
        price_column: str,
    ) -> pd.DataFrame:

        data = df.copy()

        data[date_column] = pd.to_datetime(data[date_column])

        data = data.sort_values(date_column)

        data = data[[date_column, price_column]]

        data.columns = ["Date", "Price"]

        data = data.dropna()

        data.set_index("Date", inplace=True)

        return data

    # ----------------------------------------------------------------

    @staticmethod
    def train_test_split(
        data: pd.DataFrame,
        test_size: float = 0.2,
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:

        split = int(len(data) * (1 - test_size))

        train = data.iloc[:split]

        test = data.iloc[split:]

        return train, test

    # ----------------------------------------------------------------

    @staticmethod
    def adf_test(series: pd.Series):

        result = adfuller(series)

        logging.info(
            f"ADF Statistic : {result[0]:.4f}"
        )

        logging.info(
            f"P-value : {result[1]:.4f}"
        )

        return result[1]

    # ----------------------------------------------------------------

    def determine_d(self, series):

        p = self.adf_test(series)

        return 0 if p < 0.05 else 1

    # ----------------------------------------------------------------

    def auto_search(
        self,
        train: pd.Series,
        exog: Optional[pd.DataFrame] = None,
    ):

        logging.info("Searching for best SARIMA model...")

        d = self.determine_d(train)

        p = q = range(0, 3)

        pdq = list(itertools.product(p, [d], q))

        seasonal_pdq = list(
            itertools.product(
                p,
                [1],
                q,
                [self.seasonal_period],
            )
        )

        best_aic = np.inf

        best_order = None

        best_seasonal = None

        for order in pdq:

            for seasonal in seasonal_pdq:

                try:

                    model = SARIMAX(
                        train,
                        exog=exog,
                        order=order,
                        seasonal_order=seasonal,
                        enforce_stationarity=False,
                        enforce_invertibility=False,
                    )

                    results = model.fit(disp=False)

                    if results.aic < best_aic:

                        best_aic = results.aic

                        best_order = order

                        best_seasonal = seasonal

                except Exception:

                    continue

        logging.info(f"Best AIC : {best_aic:.2f}")

        logging.info(f"Order : {best_order}")

        logging.info(f"Seasonal : {best_seasonal}")

        return best_order, best_seasonal

    # ----------------------------------------------------------------

    def fit(
        self,
        train: pd.Series,
        order=None,
        seasonal_order=None,
        exog: Optional[pd.DataFrame] = None,
    ):
        """`exog` (optional) is a DataFrame of market-factor regressors -
        e.g. `utils.factors.build_exogenous_frame(...)` - row-aligned with
        `train`'s DatetimeIndex, letting SARIMAX react to fuel prices and
        FAO supply/demand shifts on top of the price series' own dynamics.
        """

        self.exog = exog

        if self.auto_tune:

            order, seasonal_order = self.auto_search(train, exog=exog)

        self.order = order

        self.seasonal_order = seasonal_order

        logging.info("Training SARIMA...")

        self.model = SARIMAX(
            train,
            exog=exog,
            order=self.order,
            seasonal_order=self.seasonal_order,
            enforce_stationarity=False,
            enforce_invertibility=False,
        )

        self.results = self.model.fit()

        logging.info("Training completed.")

    # ----------------------------------------------------------------

    def predict(
        self,
        steps: int,
        exog: Optional[pd.DataFrame] = None,
    ):
        """`exog` must supply `steps` rows of the same regressor columns
        used in `fit`, covering the forecast horizon's dates."""

        pred = self.results.get_forecast(
            steps=steps,
            exog=exog,
        )

        self.forecast = pred.predicted_mean

        self.conf_int = pred.conf_int()

        return self.forecast

    # ----------------------------------------------------------------

    def evaluate(
        self,
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

        mape = np.mean(
            np.abs(
                (actual - predicted) / actual
            )
        ) * 100

        return {
            "MAE": mae,
            "RMSE": rmse,
            "MAPE": mape,
        }

    # ----------------------------------------------------------------

    def save_forecast(
        self,
        output_path: str,
    ):

        if self.forecast is None:

            raise RuntimeError(
                "Forecast has not been generated."
            )

        Path(output_path).parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        forecast_df = pd.DataFrame({

            "Forecast": self.forecast,

            "Lower":
                self.conf_int.iloc[:, 0],

            "Upper":
                self.conf_int.iloc[:, 1],
        })

        forecast_df.to_csv(
            output_path,
            index=True,
        )

        logging.info(
            f"Saved forecast to {output_path}"
        )

    # ----------------------------------------------------------------

    def plot(
        self,
        train,
        test=None,
        save_path: Optional[str] = None,
    ):

        plt.figure(figsize=(12, 6))

        plt.plot(
            train.index,
            train,
            label="Training",
        )

        if test is not None:

            plt.plot(
                test.index,
                test,
                label="Actual",
            )

        plt.plot(
            self.forecast.index,
            self.forecast,
            label="Forecast",
            linewidth=2,
        )

        plt.fill_between(

            self.conf_int.index,

            self.conf_int.iloc[:, 0],

            self.conf_int.iloc[:, 1],

            alpha=0.2,
        )

        plt.title("SARIMA Forecast")

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

    # ----------------------------------------------------------------

    def forecast_dataframe(self):

        if self.forecast is None:

            raise RuntimeError(
                "Forecast not available."
            )

        return pd.DataFrame({

            "Forecast":
                self.forecast,

            "Lower":
                self.conf_int.iloc[:, 0],

            "Upper":
                self.conf_int.iloc[:, 1],
        })

