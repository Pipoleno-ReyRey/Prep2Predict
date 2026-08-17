import { apiPost } from './client'
import type { TrainModelsRequest, TrainModelsResponse } from '../types/api'

export async function trainModels(body: TrainModelsRequest): Promise<TrainModelsResponse> {
  return apiPost<TrainModelsResponse>('/train_models', body)
}
