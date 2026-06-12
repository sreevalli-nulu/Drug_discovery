import { useQuery } from '@tanstack/react-query';
import { diseaseService } from '@/services';

export const diseaseKeys = {
  all: ['diseases'] as const,
  profile: (id: string) => [...diseaseKeys.all, 'profile', id] as const,
  genes: (id: string) => [...diseaseKeys.all, 'genes', id] as const,
  drugs: (id: string) => [...diseaseKeys.all, 'drugs', id] as const,
  heatmap: (id: string) => [...diseaseKeys.all, 'heatmap', id] as const,
};

export const useDiseaseProfile = (efoId: string) => {
  return useQuery({
    queryKey: diseaseKeys.profile(efoId),
    queryFn: () => diseaseService.getProfile(efoId),
    enabled: !!efoId,
    staleTime: 1000 * 60 * 60 * 24,
  });
};

export const useDiseaseGenes = (efoId: string, limit = 50) => {
  return useQuery({
    queryKey: diseaseKeys.genes(efoId),
    queryFn: () => diseaseService.getGenes(efoId, limit),
    enabled: !!efoId,
    staleTime: 1000 * 60 * 60 * 24,
  });
};

export const useDiseaseDrugs = (efoId: string) => {
  return useQuery({
    queryKey: diseaseKeys.drugs(efoId),
    queryFn: () => diseaseService.getDrugPipeline(efoId),
    enabled: !!efoId,
    staleTime: 1000 * 60 * 60 * 24,
  });
};

export const useEvidenceHeatmap = (efoId: string, limit = 20) => {
  return useQuery({
    queryKey: diseaseKeys.heatmap(efoId),
    queryFn: () => diseaseService.getEvidenceHeatmap(efoId, limit),
    enabled: !!efoId,
    staleTime: 1000 * 60 * 60 * 24,
  });
};
