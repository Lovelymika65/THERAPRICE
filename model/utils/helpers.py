"""
helpers.py

General helper functions for commodity price forecasting.

Author: Your Name
"""

from __future__ import annotations

import logging
import random
from datetime import datetime
from pathlib import Path
from typing import List

import numpy as np
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


class Helpers:
    """
    General utility functions.
    """

    # ======================================================
    # Directories
    # ======================================================

    @staticmethod
    def create_directory(path):

        Path(path).mkdir(
            parents=True,
            exist_ok=True,
        )

    # ------------------------------------------------------

    @staticmethod
    def create_project_directories(base_dir="."):

        folders = [

            "data",

            "models",

            "utils",

            "output",

            "output/plots",

            "output/metrics",

            "output/forecasts",

            "output/logs",

        ]

        for folder in folders:

            Helpers.create_directory(
                Path(base_dir) / folder
            )

    # ======================================================
    # Files
    # ======================================================

    @staticmethod
    def get_csv_files(directory):

        directory = Path(directory)

        return sorted(directory.glob("*.csv"))

    # ------------------------------------------------------

    @staticmethod
    def file_name(path):

        return Path(path).stem

    # ------------------------------------------------------

    @staticmethod
    def save_dataframe(
        dataframe,
        filepath,
    ):

        filepath = Path(filepath)

        filepath.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        dataframe.to_csv(
            filepath,
            index=False,
        )

    # ======================================================
    # Logging
    # ======================================================

    @staticmethod
    def log(message):

        logging.info(message)

    # ======================================================
    # Date Utilities
    # ======================================================

    @staticmethod
    def today():

        return datetime.today()

    # ------------------------------------------------------

    @staticmethod
    def current_timestamp():

        return datetime.now().strftime(
            "%Y%m%d_%H%M%S"
        )

    # ======================================================
    # Random Seed
    # ======================================================

    @staticmethod
    def set_seed(seed=42):

        random.seed(seed)

        np.random.seed(seed)

    # ======================================================
    # Time Series Utilities
    # ======================================================

    @staticmethod
    def infer_frequency(df):

        freq = pd.infer_freq(df.index)

        if freq is None:

            return "M"

        return freq

    # ------------------------------------------------------

    @staticmethod
    def future_dates(
        last_date,
        periods,
        frequency="M",
    ):

        return pd.date_range(

            start=last_date,

            periods=periods + 1,

            freq=frequency,

        )[1:]

    # ======================================================
    # Validation
    # ======================================================

    @staticmethod
    def validate_columns(
        dataframe,
        columns: List[str],
    ):

        missing = [
            c
            for c in columns
            if c not in dataframe.columns
        ]

        if missing:

            raise ValueError(
                f"Missing columns: {missing}"
            )

    # ------------------------------------------------------

    @staticmethod
    def validate_not_empty(
        dataframe,
    ):

        if dataframe.empty:

            raise ValueError(
                "DataFrame is empty."
            )

    # ======================================================
    # Printing
    # ======================================================

    @staticmethod
    def print_header(title):

        print("\n")

        print("=" * 60)

        print(title)

        print("=" * 60)

    # ------------------------------------------------------

    @staticmethod
    def print_metrics(metrics):

        for key, value in metrics.items():

            print(f"{key:10s}: {value:.4f}")

    # ======================================================
    # Forecast Table
    # ======================================================

    @staticmethod
    def forecast_dataframe(
        dates,
        prophet,
        sarima,
        ensemble,
    ):

        return pd.DataFrame({

            "Date": dates,

            "Prophet": prophet,

            "SARIMA": sarima,

            "Ensemble": ensemble,
        })

    # ======================================================
    # Weight Calculation
    # ======================================================

    @staticmethod
    def inverse_error_weights(
        prophet_error,
        sarima_error,
    ):

        wp = 1 / prophet_error

        ws = 1 / sarima_error

        total = wp + ws

        return {

            "Prophet": wp / total,

            "SARIMA": ws / total,
        }

    # ======================================================
    # Summary
    # ======================================================

    @staticmethod
    def summary(
        dataframe,
    ):

        print("\nDataset Summary")

        print("--------------------------")

        print(f"Rows      : {len(dataframe)}")

        print(f"Columns   : {len(dataframe.columns)}")

        print()

        print(dataframe.describe())

    # ======================================================
    # Model Ranking
    # ======================================================

    @staticmethod
    def rank_models(metrics_df):

        rmse = metrics_df.loc["RMSE"]

        return rmse.sort_values()

    # ======================================================
    # Forecast Horizon
    # ======================================================

    @staticmethod
    def forecast_horizon(
        dataframe,
        months=12,
    ):

        last = dataframe.index.max()

        return Helpers.future_dates(
            last,
            months,
        )


# ==========================================================
# Example
# ==========================================================

