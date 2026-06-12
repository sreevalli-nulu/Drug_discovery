import { useQuery, useMutation } from '@tanstack/react-query';
import { comparisonService } from '@/services';
import type { CreateComparisonRequest } from '@/types';

export const useCreateComparison = () => {
  return useMutation({
    mutationFn: (request: CreateComparisonRequest) => comparisonService.create(request),
  });
};

export const useComparison = (id: string) => {
  return useQuery({
    queryKey: ['comparison', id],
    queryFn: () => comparisonService.getById(id),
    enabled: !!id,
  });
};
