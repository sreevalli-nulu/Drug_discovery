// ============================================
// AI Service
// ============================================

import { fetchAIExplanation, fetchAIComparison, fetchAIStatus } from '@/api';
import type { AIExplainRequest, AICompareRequest } from '@/types';

export const aiService = {
  explain: async (request: AIExplainRequest) => {
    return fetchAIExplanation(request);
  },

  compare: async (request: AICompareRequest) => {
    return fetchAIComparison(request);
  },

  getStatus: async () => {
    return fetchAIStatus();
  },
};
