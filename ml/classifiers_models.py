from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier

def try_models(x_train, y_train, x_test, y_test):
    tree = DecisionTreeClassifier(random_state=0)
    svc = SVC(random_state=0)
    knn = KNeighborsClassifier()
    rf = RandomForestClassifier(random_state=0)
    gbr = GradientBoostingClassifier(random_state=0)
    lr = LogisticRegression(random_state=0)

    models = {"tree": tree, "svc": svc, "knn": knn, "rf": rf, "gbr": gbr, "lr": lr}

    for m in models.keys():
        models[m].fit(x_train, y_train)
        score = models[m].score(x_test, y_test)
        print(f"el modelo: {m} tuvo un score de {score}")