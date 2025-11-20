export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
