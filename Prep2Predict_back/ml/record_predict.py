import pandas as pd
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, RandomForestRegressor, GradientBoostingRegressor
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LinearRegression, Ridge, LogisticRegression
from models.predict_record import Record
from models.properties_db_model import PropertiesDbModel
from models.files_db_model import FilesDBModel
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from typing_extensions import Any


def predict_record(record: Record):

    numeric_code = get_numeric_codes(record)
    response = train_model(path=record.path, y_column=record.y_column, code=numeric_code, model=record.model)

    return {"prediction": response}


def get_numeric_codes(record: Record):
    numeric = []
    for k in record.body.keys():
        if type(record.body[k]) == str:
            column = k
            value = record.body[k]
            file = (PropertiesDbModel
                    .select()
                    .join(FilesDBModel)
                    .where((FilesDBModel.path == record.path) &
                           (PropertiesDbModel.file_column == column) &
                           (PropertiesDbModel.original_text == value))
                    .get())

            record.body[k] = file.numeric_code

        numeric.append(record.body[k])

    return numeric


def train_model(path: str, y_column: list[str], code: list[int], model: str):
    df = pd.read_csv(path)
    x_train = df.drop(columns=y_column)
    y_train = df[y_column[0]]
    x_train, x_test, y_train, y_test = train_test_split(x_train, y_train, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    x_train = scaler.fit_transform(x_train)
    x_predict = scaler.transform([code])

    models = {'GradientBoostingRegressor': GradientBoostingRegressor(),
              'RandomForestRegressor': RandomForestRegressor(),
              'DecisionTreeRegressor': DecisionTreeRegressor(),
              'LinearRegression': LinearRegression(),
              'Ridge': Ridge(),
              'LogisticRegression': LogisticRegression(),
              'SVC': SVC(),
              'DecisionTreeClassifier': DecisionTreeClassifier(),
              'KNeighborsClassifier': KNeighborsClassifier(),
              'RandomForestClassifier': RandomForestClassifier(),
              'GradientBoostingClassifier': GradientBoostingClassifier(),}

    predict: Any = 0

    for m in models.keys():
        if m in model:
            model_selected = models[m]
            model_selected.fit(x_train, y_train)
            predict = model_selected.predict(x_predict)
            predict = round(predict[0], 2)


    return predict

