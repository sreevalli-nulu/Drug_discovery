// ============================================
// Search Types
// ============================================

import type { CompoundSearchResult } from './compound.types';
import type { TargetSearchResult } from './target.types';
import type { DiseaseSearchResult } from './disease.types';

export interface UnifiedSearchResponse {
  query: string;
  compounds: CompoundSearchResult[];
  targets: TargetSearchResult[];
  diseases: DiseaseSearchResult[];
  counts: {
    compounds: number;
    targets: number;
    diseases: number;
    total: number;
  };
}

export interface TrendingSearch {
  term: string;
  type: string;
  count: number;
}

export interface TrendingSearchesResponse {
  trending: TrendingSearch[];
}

export type SearchTab = 'all' | 'compounds' | 'targets' | 'diseases';
