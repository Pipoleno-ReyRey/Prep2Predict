export interface UploadResponse {
  path: string
  columns: string[]
  nulls_columns: string[]
  records: number
}

export type NullColumnAction = 'drop' | { default_value: number | string }

export interface CleanNullsRequest {
  path: string
  nulls_columns: Record<string, NullColumnAction>
}

export interface CleanNullsResponse {
  response: Record<string, string> | null
  groups_columns: Record<string, string[]>
}

export type ColumnStrategy = 'drop' | 'fill' | 'skip'

export interface ColumnConfig {
  strategy: ColumnStrategy
  defaultValue: string
}

export type CleanActionType = 'dropped' | 'filled'

export interface CleanResultItem {
  column: string
  message: string
  action: CleanActionType
  fillValue?: string
}

export interface TrainModelsRequest {
  path: string
  y_columns: string[]
}

export interface TrainModelResult {
  model_name: string
  time: number
  score: number
}

export type TrainModelsResponse = TrainModelResult[]
