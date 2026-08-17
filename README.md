# Prep2Predict

**Prep2Predict** is a full-stack machine learning pipeline: upload a CSV, clean missing values, encode categoricals, benchmark scikit-learn models, and score a new record — all from a guided UI.

The backend is a **FastAPI** service (pandas + scikit-learn + PostgreSQL). The frontend is a **React + TypeScript + Vite** wizard that walks through the same four steps. The project is used for tabular prediction tasks (for example housing prices); the UI formats numeric predictions as USD.

---

## Table of Contents

- [Architecture](#architecture)
- [Pipeline Overview](#pipeline-overview)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Frontend](#frontend)
- [API Reference](#api-reference)
- [Data Preparation](#data-preparation)
- [Machine Learning](#machine-learning)
- [Database](#database)
- [Configuration](#configuration)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Architecture

```
┌──────────────────────────┐         Vite proxy /api → :8000
│  Prep2Predict_front      │
│  React 19 + TypeScript   │
│  Upload → Clean → Train  │
│  → Predict               │
└────────────┬─────────────┘
             │ POST /upload, /clean_nulls, /train_models, /predict
             ▼
┌──────────────────────────┐         ┌─────────────────────┐
│  Prep2Predict_back       │────────►│  PostgreSQL         │
│  FastAPI                 │         │  schema prep2predict│
│  data_prepare / ml       │         │  files, properties  │
└────────────┬─────────────┘         └─────────────────────┘
             │
             ▼
      csv_data_analysis/*.csv   (mutated in place after cleaning)
```

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **UI** | `Prep2Predict_front/` | Step wizard, CSV upload, null strategies, model comparison, prediction form |
| **API** | `Prep2Predict_back/app.py` | HTTP routing, CORS, Pydantic validation |
| **Data prep** | `Prep2Predict_back/data_prepare/` | Persist CSVs, impute/drop nulls, label-encode strings |
| **ML** | `Prep2Predict_back/ml/` | Train/test split, scaling, multi-model benchmark, single-record predict |
| **DB** | `Prep2Predict_back/db_connection.py` | Peewee + PostgreSQL: file paths and category → integer maps |

The API is **file-path-driven**. `/upload` returns a path; later endpoints reuse that path instead of re-uploading the file. Cleaning overwrites the CSV on disk.

---

## Pipeline Overview

1. **Upload** — Client sends a CSV. The server saves it under `csv_data_analysis/`, records the path in PostgreSQL, and returns columns, null columns, and row count.
2. **Clean nulls** — Per-column strategy: drop rows, fill a default, or skip. String columns are then label-encoded (1-indexed). Original text → numeric code mappings are stored in `properties`.
3. **Train models** — Client picks a target column. The server splits 70/30, scales features, auto-selects classification vs regression, and returns each model’s score and fit time.
4. **Predict** — From the best model card, the user fills a new record. Categorical fields are sent as original text; the server maps them via `properties`, retrains the chosen estimator, and returns `{ "prediction": … }`.

If the upload has **no null columns**, the UI still calls `/clean_nulls` with an empty map so encoding and category groups are produced before training.

---

## Project Structure

```
Prep2Predict/
├── README.md
├── Prep2Predict_back/                 # FastAPI backend
│   ├── app.py                         # Routes: /, /upload, /clean_nulls, /train_models, /predict
│   ├── db_connection.py               # Peewee PostgreSQL connection (.env)
│   ├── requirements.txt               # See note under Getting Started
│   ├── data_prepare/
│   │   ├── files_processor.py         # Upload, null cleaning, CSV I/O
│   │   └── convert_int.py             # Label encoding + properties persistence
│   ├── models/
│   │   ├── clean_nulls.py             # NullsColumns
│   │   ├── train_models_request.py    # TrainModel
│   │   ├── predict_record.py          # Record
│   │   ├── models_response_data.py    # ModelResponseData (name, time, score)
│   │   ├── files_db_model.py          # files table
│   │   └── properties_db_model.py     # properties table (category maps)
│   └── ml/
│       ├── ml_gateway.py              # Split, scale, classify vs regress, benchmark
│       └── record_predict.py          # Encode a new row and predict
│
└── Prep2Predict_front/                # React SPA
    ├── package.json
    ├── vite.config.ts                 # Dev proxy: /api → http://127.0.0.1:8000
    └── src/
        ├── App.tsx                    # Four-step pipeline state
        ├── api/                       # upload, cleanNulls, trainModels, predict
        ├── types/api.ts               # Shared request/response types
        └── components/
            ├── FileUpload.tsx
            ├── UploadResults.tsx
            ├── CleanNulls.tsx
            ├── CleanNullsResults.tsx
            └── TrainModels.tsx        # Training results + prediction form
```

---

## Tech Stack

| Area | Stack |
|------|--------|
| **Frontend** | React 19, TypeScript, Vite 8, React Compiler |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, python-multipart |
| **Data** | pandas, NumPy |
| **ML** | scikit-learn (trees, forests, gradient boosting, linear/ridge, SVM, KNN, logistic) |
| **Database** | PostgreSQL via Peewee |
| **Config** | python-dotenv (`POSTGRES_*`) |

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 20+ and [pnpm](https://pnpm.io)
- PostgreSQL (local or hosted). Create schema `prep2predict` and the tables in [Database](#database).

### 1. Database

Create a `.env` in `Prep2Predict_back/` (do not commit it):

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

Then create the schema and tables (see [Database](#database)).

### 2. Backend

`Prep2Predict_back/requirements.txt` currently looks like a system `pip freeze`, not the app’s dependencies. Install the packages the code actually imports:

```bash
cd Prep2Predict_back
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

pip install fastapi uvicorn python-multipart pandas numpy scikit-learn \
  pydantic peewee python-dotenv typing_extensions

uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

- Health: [http://localhost:8000/](http://localhost:8000/) → `"ALL WORKING"`
- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

Uploads are written to `Prep2Predict_back/csv_data_analysis/` (created on first upload; gitignored).

### 3. Frontend

```bash
cd Prep2Predict_front
pnpm install
pnpm dev
```

Vite serves the UI (typically [http://localhost:5173](http://localhost:5173)) and proxies `/api/*` to `http://127.0.0.1:8000`. Keep the API running on port 8000.

Optional: set `VITE_API_URL` if you are not using the proxy (see [Configuration](#configuration)).

---

## Frontend

The SPA is a linear wizard in `App.tsx`:

| Step | Component | Behavior |
|------|-----------|----------|
| **1. Upload** | `FileUpload` | Drag-and-drop or file picker; CSV only. Shows record/column/null counts. |
| **2. Clean** | `CleanNulls` | Per null column: drop rows, fill default, or skip. If there are no nulls, **Prepare data** still runs encoding. |
| **3. Train** | `TrainModels` | Choose one target column, train, compare score and time. The best model is highlighted. |
| **4. Predict** | `TrainModels` (panel) | Click the best card, fill feature values, submit. Categorical columns use the lists returned as `groups_columns`. |

Dataset tips shown in the UI:

- Drop ID columns before upload.
- Currency / price columns should be decimal (typically two places).

The UI follows `prefers-color-scheme` (light/dark).

---

## API Reference

All mutating routes are `POST`. JSON bodies use `Content-Type: application/json`. Upload uses `multipart/form-data`.

### `GET /`

Health check.

**Response:** `"ALL WORKING"`

---

### `POST /upload`

Save a CSV and return schema metadata.

**Request:** `multipart/form-data`, field `file`.

**Response:**

```json
{
  "path": "csv_data_analysis/housing.csv",
  "columns": ["city", "rooms", "price"],
  "nulls_columns": ["rooms"],
  "records": 1500
}
```

| Field | Description |
|-------|-------------|
| `path` | Relative path on the server; pass this to later endpoints |
| `columns` | Column names |
| `nulls_columns` | Columns with at least one null |
| `records` | Row count |

A row is also inserted into `prep2predict.files`. Duplicate paths fail on the unique `path` constraint.

---

### `POST /clean_nulls`

Impute or drop nulls, then label-encode all string columns. Overwrites the CSV.

**Request:**

```json
{
  "path": "csv_data_analysis/housing.csv",
  "nulls_columns": {
    "rooms": "drop",
    "neighborhood": { "default_value": "unknown" }
  }
}
```

| Strategy | Behavior |
|----------|----------|
| `"drop"` | `dropna(subset=[column])` |
| `{ "default_value": <value> }` | Fill nulls (numeric or string) |
| omit column / empty map | Leave that column’s nulls; encoding still runs |

**Response:**

```json
{
  "response": {
    "rooms": "Registros nulos borrados",
    "neighborhood": "Registros nulos reasignados a: unknown"
  },
  "groups_columns": {
    "neighborhood": ["centro", "norte", "unknown"]
  }
}
```

`groups_columns` lists original unique values per encoded string column (used by the prediction form). Messages from the backend are currently in Spanish.

---

### `POST /train_models`

Train and score several models on the cleaned CSV.

**Request:**

```json
{
  "path": "csv_data_analysis/housing.csv",
  "y_columns": ["price"]
}
```

The UI sends a **single** target column. The backend accepts a list (multi-output is squeezed to 1D).

**Response:**

```json
[
  { "model_name": "RandomForestRegressor", "time": 0.42, "score": 91.0 },
  { "model_name": "GradientBoostingRegressor", "time": 0.31, "score": 89.0 }
]
```

`score` is `model.score()` on the test set, as a percentage (`round(score, 2) * 100`). For regressors that is R²; for classifiers it is accuracy.

Task type is chosen with `sklearn.utils.multiclass.type_of_target`: **binary** → classifiers; otherwise → regressors.

---

### `POST /predict`

Map a new row to numeric features and return a prediction. The selected model is **fit again** on the current CSV (models are not persisted).

**Request:**

```json
{
  "path": "csv_data_analysis/housing.csv",
  "y_column": ["price"],
  "model": "RandomForestRegressor",
  "body": {
    "city": "Santo Domingo",
    "rooms": 3
  }
}
```

String values in `body` are resolved through `properties` (`original_text` → `numeric_code`) for that file path. Numeric values are used as-is.

**Response:**

```json
{ "prediction": 245343.0 }
```

The frontend treats a finite number as a USD price and any other string as plain text.

---

## Data Preparation

### Null handling

Cleaning is **in place**. For each key in `nulls_columns`:

- **drop** — remove rows with nulls in that column.
- **fill** — `fillna(default_value)` for string or numeric dtypes.

### Categorical encoding

`convert_columns_to_int` walks every column after cleaning:

- **String columns** — unique values mapped to integers starting at **1**. Each mapping is bulk-inserted into `properties`.
- **Numeric columns** — unchanged.

The CSV is then fully numeric for scikit-learn.

Label encoding implies an order that may not exist. High-cardinality or purely nominal features would be better with one-hot or target encoding.

---

## Machine Learning

### Split and scaling (`ml_gateway`)

| Step | Setting |
|------|---------|
| Train / test | 70% / 30%, `random_state=42` |
| Features | All columns except `y_columns` |
| Scaling | `StandardScaler` fit on **train**, `transform` on test |

### Classification (binary target)

| `model_name` | Estimator |
|--------------|-----------|
| `DecisionTreeClassifier` | Decision tree |
| `SVC` | Support vector classifier |
| `KNeighborsClassifier` | k-NN |
| `RandomForestClassifier` | Random forest |
| `GradientBoostingClassifier` | Gradient boosting |

### Regression (non-binary target)

| `model_name` | Estimator |
|--------------|-----------|
| `DecisionTreeRegressor` | Decision tree |
| `LinearRegression` | OLS |
| `RandomForestRegressor` | Forest (`max_depth=4`, `n_estimators=100`) |
| `Ridge` | L2 linear |
| `GradientBoostingRegressor` | Gradient boosting |
| `LogisticRegression` | Included in the regressor suite (meant for classification) |

Each fit is timed. Results are `ModelResponseData` objects (`model_name`, `time` seconds, `score`).

### Prediction (`record_predict`)

- Split 80/20, `random_state=42`.
- Scaler fit on that training split; the new row is transformed with the same scaler.
- The estimator whose name is contained in `model` is fit and `predict` is rounded to 2 decimals.

There is no saved `.joblib` artifact; every predict call retrains.

---

## Database

Peewee models use schema **`prep2predict`**. Tables are not created automatically; apply something equivalent to:

```sql
CREATE SCHEMA IF NOT EXISTS prep2predict;

CREATE TABLE prep2predict.files (
  id SERIAL PRIMARY KEY,
  path VARCHAR(1000) NOT NULL UNIQUE,
  uploaded_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE prep2predict.properties (
  id SERIAL PRIMARY KEY,
  file_id INTEGER NOT NULL REFERENCES prep2predict.files (id),
  file_column VARCHAR(255) NOT NULL,
  original_text VARCHAR(255) NOT NULL,
  numeric_code INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

| Table | Role |
|-------|------|
| `files` | One row per uploaded path |
| `properties` | Per-file label encoding so `/predict` can turn original category text into the same integers used at train time |

---

## Configuration

### Upload directory

Files are stored relative to the backend working directory:

```python
Path("csv_data_analysis").mkdir(parents=True, exist_ok=True)
path = Path("csv_data_analysis", str(file.filename))
```

Run `uvicorn` from `Prep2Predict_back/` so this path stays consistent.

### CORS

The API allows all origins (`allow_origins=["*"]`). Tighten this in production.

Local UI traffic usually goes through the Vite proxy, so the browser talks to the same origin as the SPA.

### Frontend API base

```ts
export const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
```

| Mode | Behavior |
|------|----------|
| Default (`pnpm dev`) | Requests to `/api/...` are proxied to `http://127.0.0.1:8000` |
| `VITE_API_URL=http://localhost:8000` | Call the API directly (CORS must allow the UI origin) |

---

## Known Limitations

| Area | Detail |
|------|--------|
| **No model persistence** | Training scores are returned; estimators are discarded. `/predict` retrains from the CSV every time. |
| **`requirements.txt`** | Not a reliable app dependency list (looks like a host `pip freeze`). Install packages listed in Getting Started. |
| **In-place CSV mutation** | Cleaning overwrites the uploaded file. |
| **Label encoding only** | No one-hot, feature selection, or outlier handling. |
| **Re-upload same name** | `files.path` is unique; uploading the same filename again can fail. |
| **LogisticRegression in regressors** | Still trained on non-binary targets. |
| **Predict split ≠ train split** | Benchmark uses 30% test; predict retrains with 20% test. |
| **No CSV validation** | Malformed or empty files can fail at runtime. |
| **No auth / rate limits** | Open API. |
| **No automated tests** | Pipeline is untested. |
| **Encoding maps accumulate** | Cleaning inserts new `properties` rows; there is no upsert/cleanup if you clean the same file twice. |

---

## Future Improvements

- [ ] Persist the best model (and scaler) with joblib; make `/predict` load instead of retrain
- [ ] Replace `requirements.txt` with a real lockfile or pinned app dependencies
- [ ] Auto-create schema/tables on startup (or ship a migration)
- [ ] Parameterize upload directory and CORS via environment variables
- [ ] Return English (or i18n) clean-null messages
- [ ] Support one-hot / ordinal encoding and optional ID-column stripping
- [ ] Cross-validation and hyperparameter search
- [ ] Authentication and rate limiting
- [ ] Unit and integration tests for upload → clean → train → predict

---

## Example workflow (curl)

```bash
# 1. Upload
curl -X POST http://localhost:8000/upload \
  -F "file=@data/housing.csv"

# 2. Clean (use path from step 1)
curl -X POST http://localhost:8000/clean_nulls \
  -H "Content-Type: application/json" \
  -d '{
    "path": "csv_data_analysis/housing.csv",
    "nulls_columns": {
      "rooms": { "default_value": 3 },
      "neighborhood": "drop"
    }
  }'

# 3. Train
curl -X POST http://localhost:8000/train_models \
  -H "Content-Type: application/json" \
  -d '{
    "path": "csv_data_analysis/housing.csv",
    "y_columns": ["price"]
  }'

# 4. Predict
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "path": "csv_data_analysis/housing.csv",
    "y_column": ["price"],
    "model": "RandomForestRegressor",
    "body": { "city": "Santo Domingo", "rooms": 3 }
  }'
```

Or use the UI at [http://localhost:5173](http://localhost:5173) with the API on port 8000.

---

## License

No license file is included. Add one before open-sourcing or distributing.
