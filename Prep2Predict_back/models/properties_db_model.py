from datetime import datetime
from peewee import *
from db_connection import *
from .files_db_model import FilesDBModel

class PropertiesDbModel(Model):
    id: int = PrimaryKeyField()
    file_id = ForeignKeyField(FilesDBModel, field='id')
    file_column = CharField(null=False, max_length=255)
    original_text = CharField(null=False, max_length=255)
    numeric_code = IntegerField(null=False)
    created_at = DateTimeField(default=datetime.now)

    class Meta:
        database = conn
        table_name = 'properties'
        schema = 'prep2predict'