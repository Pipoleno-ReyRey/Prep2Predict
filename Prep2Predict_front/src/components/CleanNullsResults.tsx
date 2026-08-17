import type { CleanNullsResponse, CleanResultItem } from '../types/api'

function parseCleanResult(data: CleanNullsResponse): CleanResultItem[] {
  return Object.entries(data.response ?? {}).map(([column, message]) => {
    const fillMatch = message.match(/reasignados a:\s*(.+)$/i)
    if (fillMatch) {
      return {
        column,
        message,
        action: 'filled' as const,
        fillValue: fillMatch[1].trim(),
      }
    }
    return { column, message, action: 'dropped' as const }
  })
}

interface CleanNullsResultsProps {
  data: CleanNullsResponse
}

export function CleanNullsResults({ data }: CleanNullsResultsProps) {
  const items = parseCleanResult(data)
  const droppedCount = items.filter((i) => i.action === 'dropped').length
  const filledCount = items.filter((i) => i.action === 'filled').length

  return (
    <div className="clean-result">
      <div className="results__header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2>Null cleaning complete</h2>
      </div>

      <div className="results__stats">
        <div className="stat-card">
          <span className="stat-card__value">{items.length}</span>
          <span className="stat-card__label">Columns processed</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{droppedCount}</span>
          <span className="stat-card__label">Rows dropped</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{filledCount}</span>
          <span className="stat-card__label">Values filled</span>
        </div>
      </div>

      <div className="results__section">
        <h3>Column results</h3>
        <ul className="clean-result-list">
          {items.map((item) => (
            <li
              key={item.column}
              className={`clean-result-item clean-result-item--${item.action}`}
            >
              <div className="clean-result-item__icon" aria-hidden="true">
                {item.action === 'dropped' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </div>

              <div className="clean-result-item__body">
                <div className="clean-result-item__top">
                  <span className="clean-result-item__column">{item.column}</span>
                  <span className={`clean-result-item__badge clean-result-item__badge--${item.action}`}>
                    {item.action === 'dropped' ? 'Dropped' : 'Filled'}
                  </span>
                </div>
                <p className="clean-result-item__message">{item.message}</p>
                {item.fillValue !== undefined && (
                  <span className="clean-result-item__value">
                    Default: <code>{item.fillValue}</code>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
