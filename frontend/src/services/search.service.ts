// ============================================
// Search Service
// ============================================

import {
  unifiedSearchApi,
  searchCompoundsApi,
  searchTargetsApi,
  searchDiseasesApi,
  fetchTrendingSearches,
} from '@/api';

export const searchService = {
  unified: async (query: string, limit = 5) => {
    return unifiedSearchApi(query, limit);
  },

  compounds: async (query: string, limit = 20) => {
    return searchCompoundsApi(query, limit);
  },

  targets: async (query: string, limit = 20) => {
    return searchTargetsApi(query, limit);
  },

  diseases: async (query: string, limit = 20) => {
    return searchDiseasesApi(query, limit);
  },

  trending: async (limit = 10) => {
    return fetchTrendingSearches(limit);
  },
};
