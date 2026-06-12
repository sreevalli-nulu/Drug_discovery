import { useQuery, useMutation } from '@tanstack/react-query';
import { aiService } from '@/services';
import type { AIExplainRequest, AICompareRequest } from '@/types';

export const useAIStatus = () => {
  return useQuery({
    queryKey: ['ai', 'status'],
    queryFn: aiService.getStatus,
    staleTime: 1000 * 60 * 10,
  });
};

export const useAIExplanation = (request: AIExplainRequest | null) => {
  return useQuery({
    queryKey: ['ai', 'explain', request],
    queryFn: () => aiService.explain(request!),
    enabled: !!request,
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days — matches backend cache
  });
};

export const useAIComparison = () => {
  return useMutation({
    mutationFn: (request: AICompareRequest) => aiService.compare(request),
  });
};
