import { useEffect, useMemo, useState } from 'react'
import { cleanNulls } from '../api/cleanNulls'
import type {
  CleanNullsRequest,
  CleanNullsResponse,
  ColumnConfig,
  UploadResponse,
} from '../types/api'
import { CleanNullsResults } from './CleanNullsResults'
import './CleanNulls.css'
import './UploadResults.css'

interface CleanNullsProps {
  uploadData: UploadResponse
  onComplete: (groupsColumns: Record<string, string[]>) => void
}

type CleanState = 'idle' | 'cleaning' | 'success' | 'error'

function buildInitialConfig(nullColumns: string[]): Record<string, ColumnConfig> {
  return Object.fromEntries(
    nullColumns.map((col) => [col, { strategy: 'drop', defaultValue: '' }]),
  )
}

function parseDefaultValue(raw: string): number | string {
  const trimmed = raw.trim()
  if (trimmed === '') return 0
  const num = Number(trimmed)
  return Number.isNaN(num) ? trimmed : num
}

export function CleanNulls({ uploadData, onComplete }: CleanNullsProps) {
  const nullColumns = uploadData.nulls_columns

  const [config, setConfig] = useState<Record<string, ColumnConfig>>(() =>
    buildInitialConfig(nullColumns),
  )
  const [state, setState] = useState<CleanState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CleanNullsResponse | null>(null)

  useEffect(() => {
    setConfig(buildInitialConfig(nullColumns))
    setResult(null)
    setError(null)
    setState('idle')
  }, [uploadData.path, nullColumns.join('|')])

  const activeColumns = useMemo(
    () => nullColumns.filter((col) => config[col]?.strategy !== 'skip'),
    [nullColumns, config],
  )

  const updateColumn = (column: string, patch: Partial<ColumnConfig>) => {
    setConfig((prev) => ({
      ...prev,
      [column]: { ...prev[column], ...patch },
    }))
    setResult(null)
    setError(null)
    setState('idle')
  }

  const handleClean = async () => {
    const invalidFill = activeColumns.find(
      (col) => config[col].strategy === 'fill' && config[col].defaultValue.trim() === '',
    )
    if (invalidFill) {
      setError(`Enter a default value for "${invalidFill}" or choose another action.`)
      return
    }

    const nulls_columns: CleanNullsRequest['nulls_columns'] = {}
    for (const col of activeColumns) {
      const { strategy, defaultValue } = config[col]
      nulls_columns[col] =
        strategy === 'drop'
          ? 'drop'
          : { default_value: parseDefaultValue(defaultValue) }
    }

    setState('cleaning')
    setError(null)

    try {
      const data = await cleanNulls({ path: uploadData.path, nulls_columns })
      setResult(data)
      setState('success')
      onComplete(data.groups_columns)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clean failed')
      setState('error')
    }
  }

  const handlePrepare = async () => {
    setState('cleaning')
    setError(null)

    try {
      const data = await cleanNulls({ path: uploadData.path, nulls_columns: {} })
      setResult(data)
      setState('success')
      onComplete(data.groups_columns)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prepare failed')
      setState('error')
    }
  }

  if (nullColumns.length === 0) {
    return (
      <div className="clean-nulls clean-nulls--empty">
        <div className="empty-state empty-state--success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No columns with null values detected. Your dataset is already clean.</p>
        </div>

        <div className="upload-actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={state === 'cleaning'}
            onClick={handlePrepare}
          >
            {state === 'cleaning' ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Preparing…
              </>
            ) : (
              'Prepare data'
            )}
          </button>
        </div>

        {error && (
          <div className="alert alert--error" role="alert">
            {error}
          </div>
        )}

        {result && <CleanNullsResults data={result} />}
      </div>
    )
  }

  return (
    <div className="clean-nulls">
      <div className="clean-nulls__info">
        <span className="clean-nulls__label">Dataset path</span>
        <code className="clean-nulls__path">{uploadData.path}</code>
      </div>

      <p className="clean-nulls__desc">
        Choose how to handle null values in each column. Drop removes rows with nulls;
        Fill replaces nulls with a default value.
      </p>

      <div className="column-config-list">
        {nullColumns.map((column) => {
          const colConfig = config[column] ?? { strategy: 'drop', defaultValue: '' }
          return (
            <div key={column} className="column-config">
              <span className="column-config__name">{column}</span>

              <div className="column-config__controls">
                <select
                  className="column-config__select"
                  value={colConfig.strategy}
                  onChange={(e) =>
                    updateColumn(column, { strategy: e.target.value as ColumnConfig['strategy'] })
                  }
                >
                  <option value="drop">Drop rows</option>
                  <option value="fill">Fill with default</option>
                  <option value="skip">Skip</option>
                </select>

                {colConfig.strategy === 'fill' && (
                  <input
                    type="text"
                    className="column-config__input"
                    placeholder="Default value"
                    value={colConfig.defaultValue}
                    onChange={(e) => updateColumn(column, { defaultValue: e.target.value })}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="upload-actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={state === 'cleaning' || activeColumns.length === 0}
          onClick={handleClean}
        >
          {state === 'cleaning' ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Cleaning…
            </>
          ) : (
            'Clean nulls'
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}

      {result && <CleanNullsResults data={result} />}
    </div>
  )
}
