// ============================================
// ChEMBL API Layer
// ============================================
// Raw API calls for compound and target data.
// No business logic here — just HTTP calls.

import apiClient from './client';
import type {
  CompoundProfile,
  BioactivityResponse,
  CompoundTargetsResponse,
  CompoundSearchResult,
  TargetProfile,
  LigandsResponse,
  SelectivityData,
} from '@/types';

// ── Compounds ──

export const fetchCompoundProfile = async (chemblId: string): Promise<CompoundProfile> => {
  const { data } = await apiClient.get<CompoundProfile>(`/api/compounds/${chemblId}`);
  return data;
};

export const fetchCompoundActivities = async (
  chemblId: string,
  limit = 100
): Promise<BioactivityResponse> => {
  const { data } = await apiClient.get<BioactivityResponse>(
    `/api/compounds/${chemblId}/activities`,
    { params: { limit } }
  );
  return data;
};

export const fetchCompoundTargets = async (
  chemblId: string
): Promise<CompoundTargetsResponse> => {
  const { data } = await apiClient.get<CompoundTargetsResponse>(
    `/api/compounds/${chemblId}/targets`
  );
  return data;
};

export const fetchCompoundStructureUrl = (chemblId: string): string => {
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/compounds/${chemblId}/structure`;
};

export const searchCompoundsApi = async (
  query: string,
  limit = 20
): Promise<CompoundSearchResult[]> => {
  const { data } = await apiClient.get<CompoundSearchResult[]>('/api/search/compounds', {
    params: { q: query, limit },
  });
  return data;
};

// ── Targets ──

export const fetchTargetProfile = async (targetId: string): Promise<TargetProfile> => {
  const { data } = await apiClient.get<TargetProfile>(`/api/targets/${targetId}`);
  return data;
};

export const fetchTargetLigands = async (
  targetId: string,
  limit = 50
): Promise<LigandsResponse> => {
  const { data } = await apiClient.get<LigandsResponse>(
    `/api/targets/${targetId}/ligands`,
    { params: { limit } }
  );
  return data;
};

export const fetchTargetSelectivity = async (targetId: string): Promise<SelectivityData> => {
  const { data } = await apiClient.get<SelectivityData>(
    `/api/targets/${targetId}/selectivity`
  );
  return data;
};

export const fetchTargetDiseases = async (ensemblId: string, limit = 20) => {
  const { data } = await apiClient.get(`/api/targets/${ensemblId}/diseases`, {
    params: { limit },
  });
  return data;
};

export const fetchTargetEvidence = async (ensemblId: string) => {
  const { data } = await apiClient.get(`/api/targets/${ensemblId}/evidence`);
  return data;
};
