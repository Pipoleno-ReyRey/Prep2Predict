import { apiPost } from './client'

export async function predict(body: unknown): Promise<unknown> {
  return apiPost<unknown>('/predict', body)
}
