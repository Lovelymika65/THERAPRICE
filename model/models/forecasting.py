"""
forecasting.py

Forecasting pipeline using Prophet, SARIMA and Ensemble Learning.

Author: Your Name
"""

from pathlib import Path
import logging

import pandas as pd

from models.prophet_model import ProphetForecaster
from models.sarima_model import SARIMAForecaster
from models.ensemble import EnsembleForecaster

from utils.preprocessing import DataPreprocessor
from utils.metrics import ForecastMetrics
from utils.plotting import ForecastPlotter
from utils.helpers import Helpers



logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


class ForecastPipeline:
    """
    Complete forecasting pipeline.
    """

    def __init__(
        self,
        data_directory,
        output_directory="output",
        seasonal_period=12,
        test_size=0.20,
    ):

        self.data_directory = Path(data_directory)

        self.output_directory = Path(output_directory)

        self.forecast_directory = (
            self.output_directory / "forecasts"
        )

        self.metric_directory = (
            self.output_directory / "metrics"
        )

        self.plot_directory = (
            self.output_directory / "plots"
        )

        self.seasonal_period = seasonal_period

        self.test_size = test_size

        Helpers.create_project_directories()

        self.preprocessor = DataPreprocessor()

        self.metrics = ForecastMetrics()

        self.plotter = ForecastPlotter()
            # --------------------------------------------------------

    def create_output_directories(self):

        self.forecast_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.metric_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        self.plot_directory.mkdir(
            parents=True,
            exist_ok=True,
        )
            # --------------------------------------------------------

    def discover_datasets(self):

        csv_files = sorted(
            self.data_directory.glob("*.csv")
        )

        if len(csv_files) == 0:

            raise FileNotFoundError(
                "No CSV files found."
            )

        logging.info(
            f"{len(csv_files)} datasets found."
        )

        return csv_files
        # --------------------------------------------------------

    def load_dataset(self, csv_file):

        df = pd.read_csv(csv_file)

        date_column = df.columns[0]

        price_column = df.columns[-1]

        logging.info(
            f"{csv_file.stem}"
        )

        logging.info(
            f"Date column : {date_column}"
        )

        logging.info(
            f"Price column : {price_column}"
        )

        return (

            df,

            date_column,

            price_column,
        )
        # --------------------------------------------------------

    def preprocess_dataset(
        self,
        csv_file,
        date_column,
        price_column,
    ):

        data = self.preprocessor.preprocess(

            filepath=csv_file,

            date_column=date_column,

            price_column=price_column,
        )

        train, test = self.preprocessor.split_train_test(

            data,

            self.test_size,
        )

        return train, test
        # --------------------------------------------------------
    # Prophet
    # --------------------------------------------------------

    def train_prophet(
        self,
        train,
        test,
    ):
        """
        Train Prophet model and return forecasts and metrics.
        """

        prophet = ProphetForecaster()

        prophet_train = self.preprocessor.prophet_format(
            train
        )

        prophet.fit(prophet_train)

        forecast = prophet.predict(
            periods=len(test),
            frequency="M",
        )

        forecast = forecast.tail(len(test))

        predictions = forecast["yhat"].values

        scores = self.metrics.evaluate(
            test["Price"].values,
            predictions,
        )

        return {

            "model": prophet,

            "forecast": forecast,

            "predictions": predictions,

            "metrics": scores,
        }
        # --------------------------------------------------------
    # SARIMA
    # --------------------------------------------------------

    def train_sarima(
        self,
        train,
        test,
    ):
        """
        Train SARIMA model.
        """

        sarima = SARIMAForecaster(

            seasonal_period=self.seasonal_period,

            auto_tune=True,
        )

        sarima.fit(train["Price"])

        predictions = sarima.predict(
            steps=len(test)
        )

        scores = self.metrics.evaluate(

            test["Price"].values,

            predictions.values,
        )

        return {

            "model": sarima,

            "forecast": predictions,

            "predictions": predictions.values,

            "metrics": scores,
        }
        # --------------------------------------------------------
    # Train all models
    # --------------------------------------------------------

    def train_models(
        self,
        train,
        test,
    ):
        """
        Train Prophet and SARIMA.
        """

        prophet_results = self.train_prophet(
            train,
            test,
        )

        sarima_results = self.train_sarima(
            train,
            test,
        )

        return prophet_results, sarima_results
        # --------------------------------------------------------
    # Compare Prophet and SARIMA
    # --------------------------------------------------------

    def compare_models(
        self,
        prophet_results,
        sarima_results,
    ):

        comparison = self.metrics.compare_models(

            prophet_results["metrics"],

            sarima_results["metrics"],

            {},
        )

        return comparison
        # --------------------------------------------------------
    # Print model performance
    # --------------------------------------------------------

    def print_model_results(
        self,
        prophet_results,
        sarima_results,
    ):

        print("\n")

        print("=" * 60)

        print("PROPHET")

        print("=" * 60)

        Helpers.print_metrics(
            prophet_results["metrics"]
        )

        print("\n")

        print("=" * 60)

        print("SARIMA")

        print("=" * 60)

        Helpers.print_metrics(
            sarima_results["metrics"]
        )
