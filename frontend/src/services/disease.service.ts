// ============================================
// Disease Service
// ============================================

import {
  fetchDiseaseProfile,
  fetchDiseaseGenes,
  fetchDiseaseDrugs,
  fetchEvidenceHeatmap,
} from '@/api';
import type { DrugPipelineEntry } from '@/types';

export const diseaseService = {
  getProfile: async (efoId: string) => {
    return fetchDiseaseProfile(efoId);
  },

  getGenes: async (efoId: string, limit = 50) => {
    return fetchDiseaseGenes(efoId, limit);
  },

  getDrugPipeline: async (efoId: string) => {
    return fetchDiseaseDrugs(efoId);
  },

  getEvidenceHeatmap: async (efoId: string, limit = 20) => {
    return fetchEvidenceHeatmap(efoId, limit);
  },

  // Group drugs by phase for the funnel chart
  groupDrugsByPhase: (drugs: DrugPipelineEntry[]) => ({
    approved: drugs.filter((d) => d.max_phase === 4),
    phase3: drugs.filter((d) => d.max_phase === 3),
    phase2: drugs.filter((d) => d.max_phase === 2),
    phase1: drugs.filter((d) => d.max_phase === 1),
    preclinical: drugs.filter((d) => !d.max_phase || d.max_phase === 0),
  }),
};
