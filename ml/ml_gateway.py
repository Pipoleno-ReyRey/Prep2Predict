from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import pandas as pd
import numpy as np
from ml import regressors_models as rm
from ml import classifiers_models as cm

def train_models(path: str, y_columns: list[str]):

    df = pd.read_csv(path)
    x_train_scaled, x_test_scaled, y_train, y_test = prepare_data(df, y_columns)
    # try:
    #     cm.try_models(x_train_scaled, y_train, x_test_scaled, y_test)
    # except Exception as e:
    #     rm.try_models(x_train_scaled, y_train, x_test_scaled, y_test)

    return rm.try_models(x_train_scaled, y_train, x_test_scaled, y_test)


def prepare_data(df: pd.DataFrame, y_columns):
    np.set_printoptions(suppress=True, precision=2)
    x = df.drop(columns=y_columns)
    y = df[y_columns]
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.3, random_state=42)
    x_train_scaled = StandardScaler().fit_transform(x_train)
    x_test_scaled = StandardScaler().fit_transform(x_test)
    return x_train_scaled, x_test_scaled, y_train, y_test

