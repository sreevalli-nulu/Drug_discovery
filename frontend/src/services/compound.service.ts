// ============================================
// Compound Service — Business Logic Layer
// ============================================
// Sits between hooks and API calls.
// Handles data transformation, formatting, derived values.

import {
  fetchCompoundProfile,
  fetchCompoundActivities,
  fetchCompoundTargets,
  fetchCompoundStructureUrl,
} from '@/api';
import type { CompoundProfile, BioactivityRecord } from '@/types';

export const compoundService = {

  // Get full compound profile
  getProfile: async (chemblId: string): Promise<CompoundProfile> => {
    return fetchCompoundProfile(chemblId.toUpperCase());
  },

  // Get bioactivity data — filters out records with no value
  getActivities: async (chemblId: string, limit = 100) => {
    const response = await fetchCompoundActivities(chemblId.toUpperCase(), limit);
    const filtered = response.activities.filter(
      (a) => a.standard_value !== null && a.pchembl_value !== null
    );
    return { ...response, activities: filtered };
  },

  // Get known targets
  getTargets: async (chemblId: string) => {
    return fetchCompoundTargets(chemblId.toUpperCase());
  },

  // Get structure image URL — no async needed, just builds the URL
  getStructureUrl: (chemblId: string): string => {
    return fetchCompoundStructureUrl(chemblId.toUpperCase());
  },

  // Derive Lipinski compliance summary from profile
  getLipinskiSummary: (profile: CompoundProfile): {
    passes: boolean;
    violations: number;
    details: { property: string; value: string | number | null; passes: boolean }[];
  } => {
    const violations = profile.ro5_violations ?? 0;
    return {
      passes: violations === 0,
      violations,
      details: [
        {
          property: 'Molecular Weight',
          value: profile.molecular_weight ? `${profile.molecular_weight} Da` : null,
          passes: (profile.molecular_weight ?? 0) <= 500,
        },
        {
          property: 'LogP',
          value: profile.logp,
          passes: (profile.logp ?? 0) <= 5,
        },
        {
          property: 'H-Bond Donors',
          value: profile.hbd,
          passes: (profile.hbd ?? 0) <= 5,
        },
        {
          property: 'H-Bond Acceptors',
          value: profile.hba,
          passes: (profile.hba ?? 0) <= 10,
        },
      ],
    };
  },

  // Group bioactivity by assay type for chart display
  groupActivitiesByType: (activities: BioactivityRecord[]) => {
    const groups: Record<string, BioactivityRecord[]> = {};
    for (const activity of activities) {
      const type = activity.standard_type ?? 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(activity);
    }
    return groups;
  },
};
