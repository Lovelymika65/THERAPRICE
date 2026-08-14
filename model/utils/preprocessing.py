"""
preprocessing.py

Data preprocessing utilities for commodity price forecasting.

Author: Your Name
"""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import pandas as pd

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


class DataPreprocessor:
    """
    Data preprocessing utilities.
    """

    # -----------------------------------------------------

    @staticmethod
    def load_csv(filepath: str | Path) -> pd.DataFrame:
        """
        Load a CSV file.
        """

        filepath = Path(filepath)

        if not filepath.exists():
            raise FileNotFoundError(filepath)

        df = pd.read_csv(filepath)

        logging.info(f"Loaded {filepath.name}")

        return df

    # -----------------------------------------------------

    @staticmethod
    def standardize_columns(
        df: pd.DataFrame,
        date_column: str,
        price_column: str,
    ) -> pd.DataFrame:
        """
        Rename columns to Date and Price.
        """

        data = df.copy()

        data = data.rename(
            columns={
                date_column: "Date",
                price_column: "Price",
            }
        )

        return data

    # -----------------------------------------------------

    @staticmethod
    def convert_dates(
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        data = df.copy()

        data["Date"] = pd.to_datetime(
            data["Date"],
            errors="coerce",
        )

        data = data.dropna(subset=["Date"])

        return data

    # -----------------------------------------------------

    @staticmethod
    def sort_data(
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        return df.sort_values("Date").reset_index(drop=True)

    # -----------------------------------------------------

    @staticmethod
    def remove_duplicates(
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        return df.drop_duplicates()

    # -----------------------------------------------------

    @staticmethod
    def handle_missing_values(
        df: pd.DataFrame,
        method="interpolate",
    ) -> pd.DataFrame:

        data = df.copy()

        if method == "drop":

            data = data.dropna()

        elif method == "ffill":

            data = data.ffill()

        elif method == "bfill":

            data = data.bfill()

        elif method == "interpolate":

            data = data.interpolate(
                method="linear"
            )

        return data

    # -----------------------------------------------------

    @staticmethod
    def remove_negative_prices(
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        data = df.copy()

        data = data[data["Price"] >= 0]

        return data

    # -----------------------------------------------------

    @staticmethod
    def remove_outliers(
        df: pd.DataFrame,
        z_threshold=3,
    ) -> pd.DataFrame:

        data = df.copy()

        z_scores = (
            data["Price"] - data["Price"].mean()
        ) / data["Price"].std()

        data = data[np.abs(z_scores) < z_threshold]

        return data

    # -----------------------------------------------------

    @staticmethod
    def set_datetime_index(
        df: pd.DataFrame,
    ) -> pd.DataFrame:

        data = df.copy()

        data.set_index(
            "Date",
            inplace=True,
        )

        return data

    # -----------------------------------------------------

    @staticmethod
    def resample(
        df: pd.DataFrame,
        frequency="M",
    ) -> pd.DataFrame:
        """
        Monthly by default.
        """

        data = df.copy()

        data = (
            data
            .resample(frequency)
            .mean()
        )

        return data

    # -----------------------------------------------------

    @staticmethod
    def normalize(
        df: pd.DataFrame,
    ):

        data = df.copy()

        minimum = data["Price"].min()

        maximum = data["Price"].max()

        data["Price"] = (
            data["Price"] - minimum
        ) / (maximum - minimum)

        return data

    # -----------------------------------------------------

    @staticmethod
    def log_transform(
        df: pd.DataFrame,
    ):

        data = df.copy()

        data["Price"] = np.log1p(
            data["Price"]
        )

        return data

    # -----------------------------------------------------

    @staticmethod
    def split_train_test(
        df: pd.DataFrame,
        test_size=0.2,
    ):

        split = int(
            len(df) * (1 - test_size)
        )

        train = df.iloc[:split]

        test = df.iloc[split:]

        return train, test

    # -----------------------------------------------------

    @staticmethod
    def prophet_format(
        df: pd.DataFrame,
    ) -> pd.DataFrame:
        """
        Convert to Prophet format.
        """

        data = df.reset_index()

        return data.rename(
            columns={
                "Date": "ds",
                "Price": "y",
            }
        )

    # -----------------------------------------------------

    @staticmethod
    def save_clean_data(
        df: pd.DataFrame,
        filepath: str | Path,
    ):

        filepath = Path(filepath)

        filepath.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        df.to_csv(
            filepath,
            index=True,
        )

        logging.info(
            f"Saved cleaned data to {filepath}"
        )

    # -----------------------------------------------------

    def preprocess(
        self,
        filepath,
        date_column,
        price_column,
    ):
        """
        Complete preprocessing pipeline.
        """

        df = self.load_csv(filepath)

        df = self.standardize_columns(
            df,
            date_column,
            price_column,
        )

        df = self.convert_dates(df)

        df = self.remove_duplicates(df)

        df = self.handle_missing_values(df)

        df = self.remove_negative_prices(df)

        df = self.sort_data(df)

        df = self.set_datetime_index(df)

        return df


# ============================================================
# Example
# ============================================================