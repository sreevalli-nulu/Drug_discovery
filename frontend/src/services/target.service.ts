// ============================================
// Target Service
// ============================================

import {
  fetchTargetProfile,
  fetchTargetLigands,
  fetchTargetSelectivity,
  fetchTargetDiseases,
  fetchTargetEvidence,
} from '@/api';

export const targetService = {
  getProfile: async (targetId: string) => {
    return fetchTargetProfile(targetId.toUpperCase());
  },

  getLigands: async (targetId: string, limit = 50) => {
    return fetchTargetLigands(targetId.toUpperCase(), limit);
  },

  getSelectivity: async (targetId: string) => {
    return fetchTargetSelectivity(targetId.toUpperCase());
  },

  // Disease associations — uses Ensembl ID not ChEMBL ID
  getDiseases: async (ensemblId: string, limit = 20) => {
    return fetchTargetDiseases(ensemblId, limit);
  },

  getEvidence: async (ensemblId: string) => {
    return fetchTargetEvidence(ensemblId);
  },
};
