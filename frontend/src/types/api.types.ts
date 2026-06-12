// ============================================
// Generic API Response Types
// ============================================

export interface ApiError {
  message: string;
  status?: number;
  detail?: string | ApiErrorDetail[];
}

export interface ApiErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
