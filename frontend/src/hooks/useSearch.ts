import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services';

export const searchKeys = {
  unified: (q: string) => ['search', 'unified', q] as const,
  trending: () => ['search', 'trending'] as const,
};

export const useUnifiedSearch = (query: string, limit = 5) => {
  return useQuery({
    queryKey: searchKeys.unified(query),
    queryFn: () => searchService.unified(query, limit),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes for search results
  });
};

export const useTrendingSearches = (limit = 10) => {
  return useQuery({
    queryKey: searchKeys.trending(),
    queryFn: () => searchService.trending(limit),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};
