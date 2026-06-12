// ============================================
// Comparison Service
// ============================================

import { createComparisonApi, fetchComparisonApi, fetchUserComparisons } from '@/api';
import type { CreateComparisonRequest, CompoundComparisonData, RadarDataPoint } from '@/types';

export const comparisonService = {
  create: async (request: CreateComparisonRequest) => {
    return createComparisonApi(request);
  },

  getById: async (id: string) => {
    return fetchComparisonApi(id);
  },

  getAll: async () => {
    return fetchUserComparisons();
  },

  // Transform comparison data into radar chart format for Recharts
  toRadarData: (compounds: CompoundComparisonData[]): RadarDataPoint[] => {
    const properties = [
      { key: 'molecular_weight', label: 'MW', max: 1000 },
      { key: 'logp', label: 'LogP', max: 10 },
      { key: 'hbd', label: 'HBD', max: 10 },
      { key: 'hba', label: 'HBA', max: 15 },
      { key: 'tpsa', label: 'TPSA', max: 200 },
    ] as const;

    return properties.map(({ key, label, max }) => {
      const point: RadarDataPoint = { property: label };
      compounds.forEach((compound) => {
        const value = compound[key];
        // Normalise to 0-100 scale for radar chart
        point[compound.name] = value !== null ? Math.min((value / max) * 100, 100) : 0;
      });
      return point;
    });
  },
};
