// ============================================
// Comparison API Layer
// ============================================

import apiClient from './client';
import type {
  CreateComparisonRequest,
  ComparisonResponse,
} from '@/types';

export const createComparisonApi = async (
  request: CreateComparisonRequest
): Promise<ComparisonResponse> => {
  const { data } = await apiClient.post<ComparisonResponse>('/api/comparison', request);
  return data;
};

export const fetchComparisonApi = async (id: string): Promise<ComparisonResponse> => {
  const { data } = await apiClient.get<ComparisonResponse>(`/api/comparison/${id}`);
  return data;
};

export const fetchUserComparisons = async (): Promise<ComparisonResponse[]> => {
  const { data } = await apiClient.get<ComparisonResponse[]>('/api/comparison');
  return data;
};
