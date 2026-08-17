import { useCallback, useRef, useState } from 'react'
import { uploadCsv } from '../api/upload'
import type { UploadResponse } from '../types/api'
import { UploadResults } from './UploadResults'
import './FileUpload.css'

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface FileUploadProps {
  onUploadSuccess: (data: UploadResponse) => void
  onClear: () => void
}

export function FileUpload({ onUploadSuccess, onClear }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [state, setState] = useState<UploadState>('idle')
  const [result, setResult] = useState<UploadResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pickFile = useCallback((file: File | null) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file.')
      setSelectedFile(null)
      return
    }
    setSelectedFile(file)
    setError(null)
    setResult(null)
    setState('idle')
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setDragOver(false)
      pickFile(event.dataTransfer.files[0] ?? null)
    },
    [pickFile],
  )

  const handleUpload = async () => {
    if (!selectedFile) return

    setState('uploading')
    setError(null)

    try {
      const data = await uploadCsv(selectedFile)
      setResult(data)
      setState('success')
      onUploadSuccess(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setState('error')
    }
  }

  const reset = () => {
    setSelectedFile(null)
    setResult(null)
    setError(null)
    setState('idle')
    if (inputRef.current) inputRef.current.value = ''
    onClear()
  }

  return (
    <div className="upload-panel">
      <div
        className={`dropzone${dragOver ? ' dropzone--active' : ''}${selectedFile ? ' dropzone--has-file' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />

        <div className="dropzone__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16V4m0 0l-4 4m4-4l4 4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            />
          </svg>
        </div>

        {selectedFile ? (
          <div className="dropzone__file">
            <span className="dropzone__filename">{selectedFile.name}</span>
            <span className="dropzone__filesize">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </span>
          </div>
        ) : (
          <>
            <p className="dropzone__title">Drop your CSV here</p>
            <p className="dropzone__hint">or click to browse</p>
          </>
        )}
      </div>

      <div className="upload-notes">
        <div className="upload-note" role="note">
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p>
              💡 For better precision, remove ID columns from your dataset. Currency
              columns should be identified as <code>price</code> and use decimal values
              (usually 2 decimals), even if they are 0.
            </p>
            <p className="upload-note__alt">
              💡 Para mayor precisión, elimina las columnas de ID. Las columnas de moneda
              deben identificarse como <code>price</code> y usar valores decimales
              (normalmente 2 después del punto), aunque sean 0.
            </p>
          </div>
        </div>

        <div className="upload-note upload-note--warn" role="alert">
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
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <div>
            <p>
              ⚠️ Not following these recommendations could result in deficient or
              inaccurate model precision.
            </p>
            <p className="upload-note__alt">
              ⚠️ De no seguirse estas recomendaciones, la precisión de los modelos podría
              ser deficiente o errónea en algunos casos.
            </p>
          </div>
        </div>
      </div>

      <div className="upload-actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!selectedFile || state === 'uploading'}
          onClick={handleUpload}
        >
          {state === 'uploading' ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Uploading…
            </>
          ) : (
            'Upload dataset'
          )}
        </button>

        {(selectedFile || result) && state !== 'uploading' && (
          <button type="button" className="btn btn--ghost" onClick={reset}>
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}

      {result && <UploadResults data={result} />}
    </div>
  )
}
