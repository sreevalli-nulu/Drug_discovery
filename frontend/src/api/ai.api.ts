// ============================================
// AI API Layer
// ============================================

import apiClient from './client';
import type {
  AIExplainRequest,
  AIExplainResponse,
  AICompareRequest,
  AICompareResponse,
  AIStatusResponse,
} from '@/types';

export const fetchAIExplanation = async (
  request: AIExplainRequest
): Promise<AIExplainResponse> => {
  const { data } = await apiClient.post<AIExplainResponse>('/api/ai/explain', request);
  return data;
};

export const fetchAIComparison = async (
  request: AICompareRequest
): Promise<AICompareResponse> => {
  const { data } = await apiClient.post<AICompareResponse>('/api/ai/compare', request);
  return data;
};

export const fetchAIStatus = async (): Promise<AIStatusResponse> => {
  const { data } = await apiClient.get<AIStatusResponse>('/api/ai/status');
  return data;
};
