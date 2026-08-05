from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from data_prepare import files_processor as fp
from models.clean_nulls import NullsColumns
from models.train_models_request import TrainModel
from ml.ml_gateway import train_models

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
)

@app.get("/")
async def root():
    return 'ALL WORKING'

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    return await fp.save_file(file)

@app.post("/clean_nulls")
async def predict(body: NullsColumns):
    return fp.clean_nulls_columns(body.path, body.nulls_columns)

@app.post("/train_models")
async def train_models_endpoint(body: TrainModel):
    return train_models(body.path, body.y_columns)