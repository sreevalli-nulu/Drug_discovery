// ============================================
// useCompound Hook
// ============================================
// Wraps React Query + compound service.
// Components call this hook — never services directly.

import { useQuery } from '@tanstack/react-query';
import { compoundService } from '@/services';

// Query key factory — keeps cache keys consistent
export const compoundKeys = {
  all: ['compounds'] as const,
  profile: (id: string) => [...compoundKeys.all, 'profile', id] as const,
  activities: (id: string) => [...compoundKeys.all, 'activities', id] as const,
  targets: (id: string) => [...compoundKeys.all, 'targets', id] as const,
};

export const useCompoundProfile = (chemblId: string) => {
  return useQuery({
    queryKey: compoundKeys.profile(chemblId),
    queryFn: () => compoundService.getProfile(chemblId),
    enabled: !!chemblId,
    staleTime: 1000 * 60 * 60 * 24, // 24h — matches backend cache TTL
  });
};

export const useCompoundActivities = (chemblId: string, limit = 100) => {
  return useQuery({
    queryKey: compoundKeys.activities(chemblId),
    queryFn: () => compoundService.getActivities(chemblId, limit),
    enabled: !!chemblId,
    staleTime: 1000 * 60 * 60 * 24,
  });
};

export const useCompoundTargets = (chemblId: string) => {
  return useQuery({
    queryKey: compoundKeys.targets(chemblId),
    queryFn: () => compoundService.getTargets(chemblId),
    enabled: !!chemblId,
    staleTime: 1000 * 60 * 60 * 24,
  });
};
