from typing import Dict, Any
from pydantic import BaseModel, Field

class NullsColumns(BaseModel):
    path: str
    nulls_columns: Dict[str, Any]