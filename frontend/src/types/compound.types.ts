// ============================================
// Compound Types
// ============================================

export interface CompoundSearchResult {
  chembl_id: string;
  name: string;
  molecular_formula: string | null;
  molecular_weight: number | null;
  max_phase: number | null;
  indication: string | null;
}

export interface CompoundProfile {
  chembl_id: string;
  name: string;
  molecular_formula: string | null;
  molecular_weight: number | null;
  logp: number | null;
  hbd: number | null;
  hba: number | null;
  tpsa: number | null;
  ro5_violations: number | null;
  smiles: string | null;
  max_phase: number | null;
  approval_status: string | null;
}

export interface BioactivityRecord {
  activity_id: number | null;
  target_name: string | null;
  target_chembl_id: string | null;
  assay_type: string | null;
  standard_type: string | null;
  standard_value: number | null;
  standard_units: string | null;
  pchembl_value: number | null;
  document_year: number | null;
}

export interface BioactivityResponse {
  chembl_id: string;
  activities: BioactivityRecord[];
  total_count: number;
}

export interface CompoundTarget {
  target_chembl_id: string;
  target_name: string | null;
  best_activity_type: string | null;
  best_activity_value: number | null;
  best_activity_units: string | null;
  best_pchembl_value: number | null;
}

export interface CompoundTargetsResponse {
  chembl_id: string;
  targets: CompoundTarget[];
  total_count: number;
}

export type ApprovalStatus = 'Approved' | 'Phase 3' | 'Phase 2' | 'Phase 1' | 'Preclinical' | 'Unknown';
