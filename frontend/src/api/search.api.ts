// ============================================
// Search API Layer
// ============================================

import apiClient from './client';
import type { UnifiedSearchResponse, TrendingSearchesResponse, TargetSearchResult } from '@/types';

export const unifiedSearchApi = async (
  query: string,
  limit = 5
): Promise<UnifiedSearchResponse> => {
  const { data } = await apiClient.get<UnifiedSearchResponse>('/api/search/unified', {
    params: { q: query, limit },
  });
  return data;
};

export const searchTargetsApi = async (
  query: string,
  limit = 20
): Promise<TargetSearchResult[]> => {
  const { data } = await apiClient.get<TargetSearchResult[]>('/api/search/targets', {
    params: { q: query, limit },
  });
  return data;
};

export const fetchTrendingSearches = async (limit = 10): Promise<TrendingSearchesResponse> => {
  const { data } = await apiClient.get<TrendingSearchesResponse>('/api/search/trending', {
    params: { limit },
  });
  return data;
};
