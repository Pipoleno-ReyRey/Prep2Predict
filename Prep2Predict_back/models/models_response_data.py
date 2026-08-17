from pydantic import BaseModel, Field
import time

class ModelResponseData(BaseModel):
    model_name: str = Field(...)
    time: float = Field(...)
    score: float = Field(...)