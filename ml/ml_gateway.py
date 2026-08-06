from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LinearRegression, Ridge, LogisticRegression

def train_models(path: str, y_columns: list[str]):

    df = pd.read_csv(path)
    x_train_scaled, x_test_scaled, y_train, y_test = prepare_data(df, y_columns)

    try:
        return try_models_classifier(x_train_scaled, y_train, x_test_scaled, y_test)
    except Exception as e:
        return try_models_regressor(x_train_scaled, y_train, x_test_scaled, y_test)


def prepare_data(df: pd.DataFrame, y_columns):
    np.set_printoptions(suppress=True, precision=2)
    x = df.drop(columns=y_columns)
    y = df[y_columns]
    if len(y.shape) == 2:
        y = y.squeeze()

    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.3, random_state=42)
    x_train_scaled = StandardScaler().fit_transform(x_train)
    x_test_scaled = StandardScaler().fit_transform(x_test)
    return x_train_scaled, x_test_scaled, y_train, y_test


def try_models_classifier(x_train, y_train, x_test, y_test):
    tree = DecisionTreeClassifier(random_state=0)
    svc = SVC(random_state=0)
    knn = KNeighborsClassifier()
    rf = RandomForestClassifier(random_state=0)
    gbr = GradientBoostingClassifier(random_state=0)
    lr = LinearRegression()

    models = {"tree": tree, "svc": svc, "knn": knn, "rf": rf, "gbr": gbr, "lr": lr}
    responses = []

    for m in models.keys():
        models[m].fit(x_train, y_train)
        score = models[m].score(x_test, y_test)
        score = round(score, 2) * 100
        response = f"el modelo: {m} tuvo un score de {score}"
        if "el modelo" in response:
            responses.append(response)

    return responses


def try_models_regressor(x_train, y_train, x_test, y_test):
    tree = DecisionTreeRegressor(random_state=0)
    linear = LinearRegression()
    rf = RandomForestRegressor(random_state=0)
    rd = Ridge(random_state=0)
    gbr = GradientBoostingRegressor(random_state=0)
    lr = LogisticRegression()

    models = {"tree": tree, "linear": linear, "rf": rf, "rd": rd, "gbr": gbr, "lr": lr}
    responses = []

    for m in models.keys():
        models[m].fit(x_train, y_train)
        score = models[m].score(x_test, y_test)
        score = round(score, 2) * 100
        response = f"el modelo: {m} tuvo un score de {score}"
        if "el modelo" in response:
            responses.append(response)

    return responses