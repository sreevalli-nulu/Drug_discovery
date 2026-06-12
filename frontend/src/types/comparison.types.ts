// ============================================
// Comparison Types
// ============================================

export interface CreateComparisonRequest {
  entity_ids: string[];
  name?: string;
}

export interface CompoundComparisonData {
  chembl_id: string;
  name: string;
  molecular_weight: number | null;
  logp: number | null;
  hbd: number | null;
  hba: number | null;
  tpsa: number | null;
  ro5_violations: number | null;
  approval_status: string | null;
}

export interface ComparisonResponse {
  id: string;
  name: string | null;
  compounds: CompoundComparisonData[];
  created_at: string;
}

export interface RadarDataPoint {
  property: string;
  [key: string]: string | number;
}
