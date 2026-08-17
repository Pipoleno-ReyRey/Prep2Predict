import peewee as pw
import dotenv
import os

dotenv.load_dotenv()

host = os.getenv('POSTGRES_HOST', 'localhost')
port = os.getenv('POSTGRES_PORT', '5432')
user = os.getenv('POSTGRES_USER', 'postgres')
password = os.getenv('POSTGRES_PASSWORD', '')
database = os.getenv('POSTGRES_DB', 'postgres')

conn = pw.PostgresqlDatabase(
    database=database,
    host=host,
    user=user,
    password=password,
    port=int(port),
)