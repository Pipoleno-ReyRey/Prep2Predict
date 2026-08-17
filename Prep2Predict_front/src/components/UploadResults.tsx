import type { UploadResponse } from '../types/api'
import './UploadResults.css'

interface UploadResultsProps {
  data: UploadResponse
}

export function UploadResults({ data }: UploadResultsProps) {
  return (
    <div className="results">
      <div className="results__header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2>Upload successful</h2>
      </div>

      <div className="results__stats">
        <div className="stat-card">
          <span className="stat-card__value">{data.records.toLocaleString()}</span>
          <span className="stat-card__label">Records</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{data.columns.length}</span>
          <span className="stat-card__label">Columns</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{data.nulls_columns.length}</span>
          <span className="stat-card__label">Null columns</span>
        </div>
      </div>

      <div className="results__section">
        <h3>File path</h3>
        <code className="results__path">{data.path}</code>
      </div>

      <div className="results__section">
        <h3>Columns</h3>
        <ul className="column-list">
          {data.columns.map((col) => (
            <li
              key={col}
              className={`column-tag${data.nulls_columns.includes(col) ? ' column-tag--null' : ''}`}
            >
              {col}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
