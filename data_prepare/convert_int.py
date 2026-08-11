import pandas as pd
from pandas.api.types import is_string_dtype
from db_connection import *
from models.files_db_model import *
from models.properties_db_model import *
import time

def convert_columns_to_int(path: str, columns: list[str]):

    try:
        file = FilesDBModel.get(FilesDBModel.path == path)
        print(columns)
        with conn.atomic() as t:
            df = pd.read_csv(path)
            for col in columns:
                col_type = is_string_dtype(df[col])
                if col_type:
                    print(col)
                    properties = []
                    count = df[col].groupby(df[col]).count()
                    items = list(count.index)
                    dict_items = {}
                    for i, c in enumerate(items, start=1):
                        propertie = PropertiesDbModel()
                        propertie.file_id = file
                        propertie.file_column = col
                        propertie.original_text = c
                        propertie.numeric_code = i
                        properties.append(propertie)
                        dict_items[c] = i

                    PropertiesDbModel.bulk_create(properties, batch_size=100)
                    df[col] = df[col].map(dict_items)

        df.to_csv(path, index=False, encoding="utf-8")
    except Exception as e:
        print(e)