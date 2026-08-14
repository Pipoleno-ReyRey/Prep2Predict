from pydantic import *

class Record(BaseModel):
    body: dict = Field()
    model: str = Field()
    path: str = Field()
    y_column: list[str] = Field()


