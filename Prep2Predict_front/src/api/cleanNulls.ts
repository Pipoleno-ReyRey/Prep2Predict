import { apiPost } from './client'
import type { CleanNullsRequest, CleanNullsResponse } from '../types/api'

export async function cleanNulls(body: CleanNullsRequest): Promise<CleanNullsResponse> {
  return apiPost<CleanNullsResponse>('/clean_nulls', body)
}
