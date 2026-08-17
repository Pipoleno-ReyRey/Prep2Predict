import { useState } from 'react'
import { CleanNulls } from './components/CleanNulls'
import { FileUpload } from './components/FileUpload'
import { TrainModels } from './components/TrainModels'
import type { UploadResponse } from './types/api'
import './App.css'

function App() {
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null)
  const [step2Complete, setStep2Complete] = useState(false)
  const [groupsColumns, setGroupsColumns] = useState<Record<string, string[]>>({})

  const handleUploadSuccess = (data: UploadResponse) => {
    setUploadData(data)
    setStep2Complete(false)
    setGroupsColumns({})
  }

  const handleClear = () => {
    setUploadData(null)
    setStep2Complete(false)
    setGroupsColumns({})
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header__brand">
          <div className="header__logo" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.15" />
              <path
                d="M8 22V10l8-4 8 4v12l-8 4-8-4z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              <path d="M16 6v20M8 10l8 4 8-4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <h1 className="header__title">Prep2Predict</h1>
            <p className="header__subtitle">Credit risk data preparation</p>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="pipeline-section">
          <div className="step-badge">Step 1</div>
          <h2 className="pipeline-section__heading">Upload your dataset</h2>
          <p className="pipeline-section__desc">
            Import a CSV file to analyze its structure and prepare it for prediction
            models.
          </p>
          <FileUpload onUploadSuccess={handleUploadSuccess} onClear={handleClear} />
        </section>

        {uploadData && (
          <>
            <div className="pipeline-divider" aria-hidden="true" />

            <section className="pipeline-section">
              <div className="step-badge">Step 2</div>
              <h2 className="pipeline-section__heading">Clean null values</h2>
              <p className="pipeline-section__desc">
                Configure how to handle missing data in each column before training.
              </p>
              <CleanNulls
                uploadData={uploadData}
                onComplete={(groups) => {
                  setStep2Complete(true)
                  setGroupsColumns(groups)
                }}
              />
            </section>

            {step2Complete && (
              <>
                <div className="pipeline-divider" aria-hidden="true" />

                <section className="pipeline-section">
                  <div className="step-badge">Step 3</div>
                  <h2 className="pipeline-section__heading">Train models</h2>
                  <p className="pipeline-section__desc">
                    Select the target column and send the prepared dataset to train
                    prediction models.
                  </p>
                  <TrainModels
                    key={uploadData.path}
                    uploadData={uploadData}
                    groupsColumns={groupsColumns}
                  />
                </section>
              </>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <p>Prep2Predict &mdash; ML data pipeline</p>
      </footer>
    </div>
  )
}

export default App
