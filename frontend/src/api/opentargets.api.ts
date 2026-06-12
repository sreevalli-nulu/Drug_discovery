// ============================================
// Open Targets API Layer
// ============================================

import apiClient from './client';
import type {
  DiseaseProfile,
  GeneAssociationsResponse,
  DrugPipelineResponse,
  EvidenceHeatmapResponse,
  DiseaseSearchResult,
} from '@/types';

export const fetchDiseaseProfile = async (efoId: string): Promise<DiseaseProfile> => {
  const { data } = await apiClient.get<DiseaseProfile>(`/api/diseases/${efoId}`);
  return data;
};

export const fetchDiseaseGenes = async (
  efoId: string,
  limit = 50
): Promise<GeneAssociationsResponse> => {
  const { data } = await apiClient.get<GeneAssociationsResponse>(
    `/api/diseases/${efoId}/genes`,
    { params: { limit } }
  );
  return data;
};

export const fetchDiseaseDrugs = async (efoId: string): Promise<DrugPipelineResponse> => {
  const { data } = await apiClient.get<DrugPipelineResponse>(`/api/diseases/${efoId}/drugs`);
  return data;
};

export const fetchEvidenceHeatmap = async (
  efoId: string,
  limit = 20
): Promise<EvidenceHeatmapResponse> => {
  const { data } = await apiClient.get<EvidenceHeatmapResponse>(
    `/api/diseases/${efoId}/evidence-heatmap`,
    { params: { limit } }
  );
  return data;
};

export const searchDiseasesApi = async (
  query: string,
  limit = 20
): Promise<DiseaseSearchResult[]> => {
  const { data } = await apiClient.get<DiseaseSearchResult[]>('/api/search/diseases', {
    params: { q: query, limit },
  });
  return data;
};
