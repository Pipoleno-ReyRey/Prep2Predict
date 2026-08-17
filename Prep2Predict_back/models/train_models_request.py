from pydantic import BaseModel

class TrainModel(BaseModel):
    path: str
    y_columns: list[str]