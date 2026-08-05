import pandas as pd
from pandas.api.types import is_string_dtype, is_numeric_dtype

def convert_columns_to_int(path: str, columns: list[str]):

    df = pd.read_csv(path)
    for col in columns:
        col_type = is_string_dtype(df[col])
        if col_type:
            count = df[col].groupby(df[col]).count()
            items = list(count.index)
            dict_items = {}
            for i, c in enumerate(items):
                dict_items[c] = i+1

            df[col] = df[col].map(dict_items)

    df.to_csv(path, index=False, encoding="utf-8")