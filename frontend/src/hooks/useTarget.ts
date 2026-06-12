import { useQuery } from '@tanstack/react-query';
import { targetService } from '@/services';

export const targetKeys = {
  all: ['targets'] as const,
  profile: (id: string) => [...targetKeys.all, 'profile', id] as const,
  ligands: (id: string) => [...targetKeys.all, 'ligands', id] as const,
  selectivity: (id: string) => [...targetKeys.all, 'selectivity', id] as const,
  diseases: (id: string) => [...targetKeys.all, 'diseases', id] as const,
  evidence: (id: string) => [...targetKeys.all, 'evidence', id] as const,
};

export const useTargetProfile = (targetId: string) => {
  return useQuery({
    queryKey: targetKeys.profile(targetId),
    queryFn: () => targetService.getProfile(targetId),
    enabled: !!targetId,
    staleTime: 1000 * 60 * 60 * 24,
  });
};

export const useTargetLigands = (targetId: string, limit = 50) => {
  return useQuery({
    queryKey: targetKeys.ligands(targetId),
    queryFn: () => targetService.getLigands(targetId, limit),
    enabled: !!targetId,
    staleTime: 1000 * 60 * 60 * 24,
  });
};

export const useTargetSelectivity = (targetId: string) => {
  return useQuery({
    queryKey: targetKeys.selectivity(targetId),
    queryFn: () => targetService.getSelectivity(targetId),
    enabled: !!targetId,
    staleTime: 1000 * 60 * 60 * 24,
  });
};

export const useTargetDiseases = (ensemblId: string) => {
  return useQuery({
    queryKey: targetKeys.diseases(ensemblId),
    queryFn: () => targetService.getDiseases(ensemblId),
    enabled: !!ensemblId,
    staleTime: 1000 * 60 * 60 * 24,
  });
};

export const useTargetEvidence = (ensemblId: string) => {
  return useQuery({
    queryKey: targetKeys.evidence(ensemblId),
    queryFn: () => targetService.getEvidence(ensemblId),
    enabled: !!ensemblId,
    staleTime: 1000 * 60 * 60 * 24,
  });
};
