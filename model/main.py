"""
main.py

Main entry point for the Commodity Price Forecasting System.

This script:
1. Loads all CSV datasets.
2. Trains Prophet and SARIMA models.
3. Builds an ensemble forecast.
4. Evaluates model performance.
5. Saves forecasts, metrics, and plots.

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
from utils.factors import build_exogenous_frame
# -------------------------------------------------------
# Configure Logging
# -------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

# -------------------------------------------------------
# Project Directories
# -------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / "data"

OUTPUT_DIR = BASE_DIR / "output"

FORECAST_DIR = OUTPUT_DIR / "forecasts"

PLOT_DIR = OUTPUT_DIR / "plots"

METRIC_DIR = OUTPUT_DIR / "metrics"

# -------------------------------------------------------
# Create output folders
# -------------------------------------------------------

Helpers.create_project_directories(BASE_DIR)
# -------------------------------------------------------
# Initialize classes
# -------------------------------------------------------

preprocessor = DataPreprocessor()

plotter = ForecastPlotter()

metrics = ForecastMetrics()
# -------------------------------------------------------
# Find all datasets
# -------------------------------------------------------

csv_files = sorted(DATA_DIR.glob("*.csv"))

if len(csv_files) == 0:

    raise FileNotFoundError(
        f"No CSV files found in {DATA_DIR}"
    )

logging.info(
    f"Found {len(csv_files)} datasets."
)
# -------------------------------------------------------
# Process a single commodity dataset
# -------------------------------------------------------

def process_dataset(csv_file: Path):
    """
    Train Prophet, SARIMA, and Ensemble models
    for a single commodity dataset.
    """

    commodity = csv_file.stem

    logging.info("=" * 60)
    logging.info(f"Processing {commodity}")
    logging.info("=" * 60)

    try:

        # -------------------------------------------------
        # Load dataset
        # -------------------------------------------------

        df = preprocessor.load_csv(csv_file)

        # -------------------------------------------------
        # Detect columns
        # -------------------------------------------------

        date_column = df.columns[0]
        price_column = df.columns[-1]

        logging.info(
            f"Using '{date_column}' as date column "
            f"and '{price_column}' as price column."
        )

        # -------------------------------------------------
        # Preprocess
        # -------------------------------------------------

        data = preprocessor.preprocess(
            filepath=csv_file,
            date_column=date_column,
            price_column=price_column,
        )

        Helpers.summary(data)

        train, test = preprocessor.split_train_test(
            data,
            test_size=0.20,
        )

        # -------------------------------------------------
        # Market factors (fuel prices, FAO supply/demand)
        # -------------------------------------------------
        # `data.index` spans train+test; forecasting below asks Prophet for
        # exactly len(test) future periods, i.e. a future dataframe whose
        # dates match data.index, so the same exog frame covers both models.

        exog = build_exogenous_frame(commodity, data.index)
        regressor_columns = list(exog.columns)
        exog_train = exog.loc[train.index]
        exog_test = exog.loc[test.index]

        logging.info(
            f"Using {len(regressor_columns)} market-factor regressors: {regressor_columns}"
        )

        # -------------------------------------------------
        # Prophet
        # -------------------------------------------------

        prophet = ProphetForecaster(regressor_columns=regressor_columns)

        prophet_train = preprocessor.prophet_format(train)

        exog_train_ds = exog_train.reset_index().rename(columns={exog_train.index.name or "index": "ds"})
        prophet_train = prophet_train.merge(exog_train_ds, on="ds", how="left")

        prophet.fit(prophet_train)

        future_regressors = exog.reset_index().rename(columns={exog.index.name or "index": "ds"})

        prophet_prediction = prophet.predict(
            periods=len(test),
            frequency="MS",
            future_regressors=future_regressors,
        )

        prophet_forecast = prophet_prediction.tail(
            len(test)
        )["yhat"].values

        prophet_metrics = metrics.evaluate(
            test["Price"].values,
            prophet_forecast,
        )

        logging.info("Prophet training completed.")

        # -------------------------------------------------
        # SARIMA
        # -------------------------------------------------

        sarima = SARIMAForecaster(
            seasonal_period=12,
            auto_tune=True,
        )

        sarima.fit(train["Price"], exog=exog_train)

        sarima_forecast = sarima.predict(
            steps=len(test),
            exog=exog_test,
        )

        sarima_metrics = metrics.evaluate(
            test["Price"].values,
            sarima_forecast.values,
        )

        logging.info("SARIMA training completed.")

        # -------------------------------------------------
        # Ensemble
        # -------------------------------------------------

        ensemble = EnsembleForecaster()

        ensemble_forecast = ensemble.weighted_rmse(
            prophet_forecast,
            sarima_forecast.values,
            prophet_metrics["RMSE"],
            sarima_metrics["RMSE"],
        )

        ensemble_metrics = metrics.evaluate(
            test["Price"].values,
            ensemble_forecast,
        )

        ensemble.print_weights()

        logging.info("Ensemble created successfully.")

        # -------------------------------------------------
        # Build Forecast DataFrame
        # -------------------------------------------------

        forecast_df = Helpers.forecast_dataframe(
            dates=test.index,
            prophet=prophet_forecast,
            sarima=sarima_forecast.values,
            ensemble=ensemble_forecast,
        )

        # -------------------------------------------------
        # Save Forecast
        # -------------------------------------------------

        Helpers.save_dataframe(
            forecast_df,
            FORECAST_DIR / f"{commodity}_forecast.csv",
        )

        # -------------------------------------------------
        # Compare Metrics
        # -------------------------------------------------

        comparison = metrics.compare_models(
            prophet_metrics,
            sarima_metrics,
            ensemble_metrics,
        )

        metrics.save_results(
            comparison,
            METRIC_DIR / f"{commodity}_metrics.csv",
        )

        # -------------------------------------------------
        # Plot Comparison
        # -------------------------------------------------

        plotter.compare_models(
            history_dates=train.index,
            history_values=train["Price"],
            forecast_dates=test.index,
            prophet=prophet_forecast,
            sarima=sarima_forecast.values,
            ensemble=ensemble_forecast,
            actual=test["Price"],
            save_path=PLOT_DIR / f"{commodity}.png",
        )

        logging.info(
            f"{commodity} processed successfully."
        )

        return comparison

    except Exception as e:

        logging.exception(
            f"Error processing {commodity}: {e}"
        )

        return None
    # -------------------------------------------------------
# Main Function
# -------------------------------------------------------

def main():
    """
    Run the forecasting pipeline for all datasets.
    """

    all_results = []

    for csv_file in csv_files:

        result = process_dataset(csv_file)

        if result is not None:
            all_results.append(result)

    logging.info("=" * 60)
    logging.info("Forecasting completed.")
    logging.info("=" * 60)

    print("\n")
    print("=" * 60)
    print("PROJECT COMPLETED SUCCESSFULLY")
    print("=" * 60)
    print(f"Datasets processed: {len(all_results)}")


# -------------------------------------------------------
# Entry Point
# -------------------------------------------------------

if __name__ == "__main__":
    main()
    