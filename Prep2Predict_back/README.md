# Prep2Predict

**Prep2Predict** is a REST API that automates the path from raw CSV data to trained machine learning models. It exposes a three-stage pipeline—upload, clean, and train—so a client application can ingest tabular datasets, handle missing values and categorical encoding, and benchmark multiple scikit-learn models without writing boilerplate preprocessing code.

Built with **FastAPI** and **scikit-learn**, the service is designed as a lightweight ML experimentation backend: upload a dataset, configure null handling, select target columns, and receive comparative model scores in a single workflow.

---

## Table of Contents

- [Architecture](#architecture)
- [Pipeline Overview](#pipeline-overview)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Data Preparation Details](#data-preparation-details)
- [Machine Learning Pipeline](#machine-learning-pipeline)
- [Configuration Notes](#configuration-notes)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Architecture

```
┌─────────────┐     POST /upload       ┌──────────────────┐
│   Client    │ ─────────────────────► │  data_prepare/   │
│  (frontend) │                        │  files_processor │
└─────────────┘                        └────────┬─────────┘
       │                                        │ CSV saved + schema metadata
       │         POST /clean_nulls              ▼
       └──────────────────────────────► ┌──────────────────┐
                                        │  Null imputation │
                                        │  + label encode  │
                                        └────────┬─────────┘
       │         POST /train_models              │
       └──────────────────────────────► ┌───────▼──────────┐
                                        │   ml/ml_gateway  │
                                        │  train + evaluate│
                                        └──────────────────┘
```

The API follows a **stateless, file-path-driven** design. Each endpoint receives a filesystem path to the CSV (returned by `/upload`) rather than re-uploading the file. The server mutates the CSV in place during cleaning and reads it again for training.

| Layer | Responsibility |
|-------|----------------|
| **API** (`app.py`) | HTTP routing, CORS, request validation via Pydantic |
| **Data preparation** (`data_prepare/`) | File persistence, null handling, categorical → integer encoding |
| **Schemas** (`models/`) | Request body contracts for cleaning and training |
| **ML** (`ml/`) | Feature scaling, train/test split, multi-model benchmarking |

---

## Pipeline Overview

1. **Upload** — Client sends a CSV file. The server saves it, parses column names, detects columns with nulls, and returns row count and metadata.
2. **Clean nulls** — Client specifies per-column strategies (`drop` or impute with a default value). String columns are label-encoded to integers afterward.
3. **Train models** — Client specifies target column(s). The server splits the data, scales features, trains several regressors, and returns R² scores.

---

## Project Structure

```
Prep2Predict/
├── app.py                          # FastAPI application entry point
├── requirements.txt                # Pinned Python dependencies
├── data_prepare/
│   ├── files_processor.py          # Upload, null cleaning, CSV I/O
│   └── convert_int.py              # Label encoding for string columns
├── models/
│   ├── clean_nulls.py              # Pydantic schema: NullsColumns
│   └── train_models_request.py     # Pydantic schema: TrainModel
└── ml/
    ├── ml_gateway.py               # Orchestrates split, scale, and training
    ├── regressors_models.py        # Regression model suite (active)
    └── classifiers_models.py       # Classification model suite (available, not wired)
```

---

## Tech Stack

| Category | Libraries |
|----------|-----------|
| **Web framework** | FastAPI, Uvicorn, python-multipart |
| **Validation** | Pydantic v2 |
| **Data manipulation** | pandas, NumPy |
| **Machine learning** | scikit-learn (Linear/Ridge/Logistic Regression, Decision Trees, Random Forest, Gradient Boosting, SVM, KNN) |
| **Serialization** | joblib (listed; model persistence not yet implemented) |

---

## Getting Started

### Prerequisites

- Python 3.10+
- A directory for uploaded CSVs (see [Configuration Notes](#configuration-notes))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Prep2Predict

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # Linux/macOS/WSL
# .venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt
```

### Run the Server

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Interactive API docs are available at:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Health Check

```bash
curl http://localhost:8000/
# "ALL WORKING"
```

---

## API Reference

### `GET /`

Health check endpoint.

**Response:** `"ALL WORKING"`

---

### `POST /upload`

Upload a CSV file for analysis.

**Request:** `multipart/form-data` with field `file` (CSV).

**Response:**

```json
{
  "path": "/mnt/d/csv_data_analysis/your_file.csv",
  "columns": ["col_a", "col_b", "target"],
  "nulls_columns": ["col_b"],
  "records": 1500
}
```

| Field | Description |
|-------|-------------|
| `path` | Absolute path where the file was saved (use in subsequent calls) |
| `columns` | All column names detected in the CSV |
| `nulls_columns` | Columns containing at least one null value |
| `records` | Total row count |

---

### `POST /clean_nulls`

Apply missing-value strategies and encode categorical columns.

**Request body:**

```json
{
  "path": "/mnt/d/csv_data_analysis/your_file.csv",
  "nulls_columns": {
    "col_b": "drop",
    "col_c": {
      "default_value": 0
    },
    "category_col": {
      "default_value": "unknown"
    }
  }
}
```

| Strategy | Behavior |
|----------|----------|
| `"drop"` | Remove rows where the column has a null |
| `{ "default_value": <value> }` | Impute nulls with the given value (works for numeric and string columns) |

After cleaning, **all string columns are label-encoded** to integers (1-indexed) and the CSV is overwritten in place.

**Response:** `null` (204-style; no structured response body)

---

### `POST /train_models`

Train and evaluate multiple regression models on the prepared dataset.

**Request body:**

```json
{
  "path": "/mnt/d/csv_data_analysis/your_file.csv",
  "y_columns": ["target"]
}
```

| Field | Description |
|-------|-------------|
| `path` | Path to the cleaned CSV |
| `y_columns` | Column name(s) to use as the prediction target (supports multi-output) |

**Response:**

```json
[
  "el modelo: tree tuvo un score de 85.0",
  "el modelo: linear tuvo un score de 72.0",
  "el modelo: rf tuvo un score de 91.0",
  "el modelo: rd tuvo un score de 73.0",
  "el modelo: gbr tuvo un score de 89.0",
  "el modelo: lr tuvo un score de 68.0"
]
```

Scores are **R² (coefficient of determination)** expressed as a percentage (0–100). Higher is better for regression tasks.

---

## Data Preparation Details

### Null Handling

The cleaning step operates **in place** on the CSV file. For each column listed in `nulls_columns`:

- **Drop strategy** — Rows with nulls in that column are removed (`dropna(subset=[column])`).
- **Imputation strategy** — Nulls are filled with `default_value`, regardless of whether the column is numeric or categorical.

### Categorical Encoding

After null handling, `convert_columns_to_int` scans every column:

- **String columns** — Unique values are mapped to integers starting at 1 (label encoding).
- **Numeric columns** — Left unchanged.

This produces a fully numeric feature matrix suitable for scikit-learn estimators that expect continuous inputs.

> **Note:** Label encoding introduces an ordinal relationship where none may exist. For high-cardinality or nominal features, consider one-hot encoding or target encoding in a future iteration.

---

## Machine Learning Pipeline

### Data Split & Scaling

| Step | Configuration |
|------|---------------|
| Train/test split | 70% / 30% (`test_size=0.3`) |
| Random seed | `random_state=42` |
| Feature scaling | `StandardScaler` (zero mean, unit variance) |
| Target separation | All columns in `y_columns` are dropped from features |

### Active Models (Regression)

The training endpoint currently invokes `regressors_models.try_models`, which fits and scores:

| Key | Algorithm |
|-----|-----------|
| `tree` | Decision Tree Regressor |
| `linear` | Ordinary Least Squares (Linear Regression) |
| `rf` | Random Forest Regressor |
| `rd` | Ridge Regression (L2 regularization) |
| `gbr` | Gradient Boosting Regressor |
| `lr` | Logistic Regression *(included but intended for classification)* |

Each model is trained on the scaled training set and evaluated with `model.score()` (R²) on the held-out test set.

### Available but Inactive (Classification)

`classifiers_models.py` defines a parallel suite for classification tasks:

- Decision Tree, SVC, K-Nearest Neighbors, Random Forest, Gradient Boosting, Logistic Regression

The gateway currently has the classifier path **commented out** and always routes to the regressor suite. To enable classification, uncomment the try/except block in `ml/ml_gateway.py` and add target-type detection logic.

---

## Configuration Notes

### Upload Directory

Uploaded files are saved to a **hardcoded path** in `data_prepare/files_processor.py`:

```python
path = Path("/mnt") / "d" / "csv_data_analysis" / str(file.filename)
```

This maps to `D:\csv_data_analysis\` when running under WSL. Adjust this path for your environment before deploying:

```python
# Example: project-local uploads directory
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
path = UPLOAD_DIR / file.filename
```

### CORS

CORS is configured to allow all origins (`allow_origins=["*"]`). Restrict this in production to your frontend domain(s).

---

## Known Limitations

| Area | Detail |
|------|--------|
| **No model persistence** | Trained models are not saved to disk; scores are returned but models are discarded after the request |
| **No inference endpoint** | There is no `/predict` route for scoring new rows with a trained model |
| **Regression-only path** | Classification models exist but are not wired into the active training flow |
| **In-place file mutation** | Cleaning overwrites the original CSV; keep backups if you need the raw file |
| **Label encoding only** | No support for one-hot encoding, feature selection, or outlier handling |
| **Scaler fit on test set** | Test features are scaled with a separate `StandardScaler` instance rather than the training scaler — this can leak distribution information and should be refactored to `scaler.fit_transform(X_train)` / `scaler.transform(X_test)` |
| **No input validation on CSV content** | Upload accepts any CSV; malformed or empty files may cause runtime errors |
| **Unused dependency** | `ollama` is listed in `requirements.txt` but not referenced in the codebase |

---

## Future Improvements

- [ ] Persist best model with joblib and expose a `/predict` endpoint
- [ ] Auto-detect regression vs. classification based on target column dtype/cardinality
- [ ] Fix scaler leakage by fitting once on training data and transforming test data
- [ ] Parameterize upload directory via environment variable or `.env`
- [ ] Add cross-validation and hyperparameter tuning (GridSearchCV / Optuna)
- [ ] Return structured JSON scores instead of formatted strings
- [ ] Support additional encodings (one-hot, ordinal) and feature engineering hooks
- [ ] Add authentication and rate limiting for production use
- [ ] Write unit and integration tests for the pipeline

---

## Example Workflow

```bash
# 1. Upload a dataset
curl -X POST http://localhost:8000/upload \
  -F "file=@data/housing.csv"

# 2. Clean nulls (using path from step 1)
curl -X POST http://localhost:8000/clean_nulls \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/mnt/d/csv_data_analysis/housing.csv",
    "nulls_columns": {
      "bedrooms": {"default_value": 3},
      "neighborhood": "drop"
    }
  }'

# 3. Train models
curl -X POST http://localhost:8000/train_models \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/mnt/d/csv_data_analysis/housing.csv",
    "y_columns": ["price"]
  }'
```

---

## License

No license file is included. Add one before open-sourcing or distributing.
