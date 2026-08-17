import { useState } from 'react'
import { trainModels } from '../api/trainModels'
import { predict } from '../api/predict'
import type { TrainModelResult, TrainModelsResponse, UploadResponse } from '../types/api'
import './TrainModels.css'
import './UploadResults.css'

interface TrainModelsProps {
  uploadData: UploadResponse
  groupsColumns: Record<string, string[]>
}

type TrainState = 'idle' | 'training' | 'success' | 'error'

type PredictionValue = { kind: 'price'; value: number } | { kind: 'text'; value: string } | null

function extractPrediction(response: unknown): PredictionValue {
  if (typeof response === 'number' && Number.isFinite(response)) {
    return { kind: 'price', value: response }
  }
  if (typeof response === 'string' && response.trim() !== '') {
    return { kind: 'text', value: response }
  }
  if (response && typeof response === 'object') {
    const value = (response as Record<string, unknown>).prediction
    if (typeof value === 'number' && Number.isFinite(value)) {
      return { kind: 'price', value }
    }
    if (typeof value === 'string' && value.trim() !== '') {
      return { kind: 'text', value }
    }
  }
  return null
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function PriceResult({ value }: { value: number }) {
  return (
    <div className="prediction-result prediction-result--price" role="status">
      <div className="prediction-result__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div className="prediction-result__body">
        <span className="prediction-result__label">Predicted value</span>
        <span className="prediction-result__value">{formatPrice(value)}</span>
      </div>
    </div>
  )
}

function TextResult({ value }: { value: string }) {
  return (
    <div className="prediction-result prediction-result--text" role="status">
      <div className="prediction-result__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </div>
      <div className="prediction-result__body">
        <span className="prediction-result__label">Predicted value</span>
        <span className="prediction-result__text">{value}</span>
      </div>
    </div>
  )
}

export function TrainModels({ uploadData, groupsColumns }: TrainModelsProps) {
  const [selectedColumn, setSelectedColumn] = useState('')
  const [state, setState] = useState<TrainState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TrainModelsResponse | null>(null)

  const [recordOpen, setRecordOpen] = useState(false)
  const [recordModel, setRecordModel] = useState<string | null>(null)
  const [recordValues, setRecordValues] = useState<Record<string, string>>({})
  const [createdBody, setCreatedBody] = useState<{
    body: Record<string, string | number>
    model: string
    path: string
    y_column: string[]
  } | null>(null)
  const [predictState, setPredictState] = useState<'idle' | 'sending' | 'success' | 'error'>(
    'idle',
  )
  const [predictError, setPredictError] = useState<string | null>(null)
  const [predictResponse, setPredictResponse] = useState<unknown>(null)

  const prediction = predictResponse !== null ? extractPrediction(predictResponse) : null

  const selectColumn = (column: string) => {
    setSelectedColumn(column)
    setResult(null)
    setError(null)
    setState('idle')
    setRecordOpen(false)
    setRecordModel(null)
    setRecordValues({})
    setCreatedBody(null)
    setPredictState('idle')
    setPredictError(null)
    setPredictResponse(null)
  }

  const bestScore = result
    ? result.reduce((max, model) => Math.max(max, model.score), -Infinity)
    : null

  const toggleRecordPanel = (modelName: string) => {
    setRecordModel(modelName)
    setRecordOpen((open) => !open)
  }

  const updateRecord = (column: string, value: string) => {
    setRecordValues((prev) => ({ ...prev, [column]: value }))
  }

  const handleCreateRecord = async () => {
    const record: Record<string, string | number> = {}
    for (const column of uploadData.columns) {
      if (column === selectedColumn) continue
      const value = recordValues[column] ?? ''
      const categoricalValues = groupsColumns[column]
      if (categoricalValues && categoricalValues.length > 0) {
        if (value !== '') record[column] = value
      } else {
        const num = Number(value)
        record[column] = Number.isNaN(num) ? 0 : Math.trunc(num)
      }
    }
    const body = {
      body: record,
      model: recordModel ?? 'unknown',
      path: uploadData.path,
      y_column: [selectedColumn],
    }
    setCreatedBody(body)

    setPredictState('sending')
    setPredictError(null)
    setPredictResponse(null)
    try {
      const data = await predict(body)
      setPredictResponse(data)
      setPredictState('success')
    } catch (err) {
      setPredictError(err instanceof Error ? err.message : 'Prediction failed')
      setPredictState('error')
    }
  }

  const handleTrain = async () => {
    if (!selectedColumn) return

    setState('training')
    setError(null)
    setRecordOpen(false)
    setRecordModel(null)
    setCreatedBody(null)
    setPredictState('idle')
    setPredictError(null)
    setPredictResponse(null)

    try {
      const data = await trainModels({
        path: uploadData.path,
        y_columns: [selectedColumn],
      })
      setResult(data)
      setState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed')
      setState('error')
    }
  }

  return (
    <div className="train-models">
      <div className="train-models__info">
        <span className="train-models__label">Dataset path</span>
        <code className="train-models__path">{uploadData.path}</code>
      </div>

      <div className="train-models__field">
        <label className="train-models__label" htmlFor="train-models-target">
          Target column (y)
        </label>
        <select
          id="train-models-target"
          className="train-models__select"
          value={selectedColumn}
          onChange={(e) => selectColumn(e.target.value)}
          disabled={state === 'training'}
        >
          <option value="">Select a column…</option>
          {uploadData.columns.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
        <p className="train-models__hint">
          Only one target column can be sent to the training endpoint.
        </p>
      </div>

      <div className="upload-actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!selectedColumn || state === 'training'}
          onClick={handleTrain}
        >
          {state === 'training' ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Training…
            </>
          ) : (
            'Train models'
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="results">
          <div className="results__header">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2>Training complete</h2>
          </div>

          <div className="results__section">
            <h3>Target column</h3>
            <code className="train-models__target">{selectedColumn}</code>
          </div>

          <div className="results__section">
            <h3>Model results</h3>
            <ul className="model-card-list">
              {result.map((model: TrainModelResult) => {
                const isBest = model.score === bestScore
                return (
                  <li
                    key={model.model_name}
                    className={`model-card${isBest ? ' model-card--best' : ''}`}
                    role={isBest ? 'button' : undefined}
                    tabIndex={isBest ? 0 : undefined}
                    aria-expanded={isBest ? recordOpen : undefined}
                    aria-controls={isBest ? 'record-panel' : undefined}
                    onClick={isBest ? () => toggleRecordPanel(model.model_name) : undefined}
                    onKeyDown={
                      isBest
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              toggleRecordPanel(model.model_name)
                            }
                          }
                        : undefined
                    }
                  >
                    <div className="model-card__top">
                      <span className="model-card__name">{model.model_name}</span>
                      {isBest && <span className="model-card__badge">Best</span>}
                    </div>

                    <div className="model-card__stats">
                      <div className="model-card__stat">
                        <span className="model-card__value">{model.score.toFixed(2)}</span>
                        <span className="model-card__label">Score</span>
                      </div>
                      <div className="model-card__stat">
                        <span className="model-card__value">{model.time.toFixed(2)}s</span>
                        <span className="model-card__label">Time</span>
                      </div>
                    </div>

                    {isBest && (
                      <span
                        className={`model-card__chevron${
                          recordOpen ? ' model-card__chevron--open' : ''
                        }`}
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {recordOpen && (
            <div className="record-panel" id="record-panel">
              <h3 className="record-panel__title">Create a record</h3>
              <p className="train-models__hint">
                Fill in the values for a new record using{' '}
                <code className="train-models__target">{recordModel ?? 'the best model'}</code>.
                Categorical columns only accept values from their assigned list. Columns
                without a list are treated as integers. The target column (
                <code className="train-models__target">{selectedColumn}</code>) is sent
                automatically as <code className="train-models__target">y_column</code> and
                cannot be edited.
              </p>

              <div className="record-form">
                {uploadData.columns
                  .filter((column) => column !== selectedColumn)
                  .map((column) => {
                  const categoricalValues = groupsColumns[column]
                  const fieldId = `record-${column}`
                  return (
                    <div key={column} className="record-field">
                      <label className="train-models__label" htmlFor={fieldId}>
                        {column}
                      </label>
                      {categoricalValues && categoricalValues.length > 0 ? (
                        <select
                          id={fieldId}
                          className="train-models__select"
                          value={recordValues[column] ?? ''}
                          onChange={(e) => updateRecord(column, e.target.value)}
                        >
                          <option value="">Select…</option>
                          {categoricalValues.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={fieldId}
                          type="number"
                          step="1"
                          className="record-field__input"
                          placeholder="0"
                          value={recordValues[column] ?? ''}
                          onChange={(e) => updateRecord(column, e.target.value)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="upload-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleCreateRecord}
                  disabled={predictState === 'sending'}
                >
                  {predictState === 'sending' ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Predicting…
                    </>
                  ) : (
                    'Create record'
                  )}
                </button>
              </div>

              {predictError && (
                <div className="alert alert--error" role="alert">
                  {predictError}
                </div>
              )}

              {createdBody && (
                <div className="results__section">
                  <h3>Generated body</h3>
                  <pre className="record-json">{JSON.stringify(createdBody, null, 2)}</pre>
                </div>
              )}

              {predictResponse !== null && (
                <div className="results__section">
                  <h3>Prediction result</h3>
                  {prediction?.kind === 'price' ? (
                    <PriceResult value={prediction.value} />
                  ) : prediction?.kind === 'text' ? (
                    <TextResult value={prediction.value} />
                  ) : (
                    <pre className="record-json">
                      {JSON.stringify(predictResponse, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
