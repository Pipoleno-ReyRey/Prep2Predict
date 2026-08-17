import datetime
from peewee import *
from db_connection import conn

class FilesDBModel(Model):
    id: int = PrimaryKeyField()
    path: str = CharField(max_length=1000, unique=True)
    uploaded_at: datetime.datetime = DateField(default=datetime.datetime.now)

    class Meta:
        table_name = 'files'
        schema = 'prep2predict'
        database = conn