from sklearn.linear_model import LinearRegression, Ridge, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.tree import DecisionTreeRegressor

def try_models(x_train, y_train, x_test, y_test):
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

