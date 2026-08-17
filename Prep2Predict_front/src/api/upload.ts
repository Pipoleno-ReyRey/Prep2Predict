import type { UploadResponse } from '../types/api'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export async function uploadCsv(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file, file.name)

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { accept: 'application/json' },
    body: formData,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText)
    throw new Error(message || `Upload failed (${response.status})`)
  }

  return response.json() as Promise<UploadResponse>
}
