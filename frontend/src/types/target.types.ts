// ============================================
// Target Types
// ============================================

export interface TargetSearchResult {
  target_chembl_id: string;
  pref_name: string;
  target_type: string | null;
  organism: string | null;
  gene_name: string | null;
}

export interface TargetProfile {
  target_chembl_id: string;
  pref_name: string;
  target_type: string | null;
  organism: string | null;
  gene_name: string | null;
  uniprot_id: string | null;
  target_class: string | null;
  description: string | null;
}

export interface LigandRecord {
  chembl_id: string;
  name: string | null;
  standard_type: string | null;
  standard_value: number | null;
  standard_units: string | null;
  pchembl_value: number | null;
}

export interface LigandsResponse {
  target_chembl_id: string;
  ligands: LigandRecord[];
  total_count: number;
}

export interface TargetDiseaseAssociation {
  efo_id: string | null;
  name: string | null;
  description: string | null;
  score: number | null;
}

export interface TargetDiseasesResponse {
  target_id: string;
  diseases: TargetDiseaseAssociation[];
  total_count: number;
}

export interface SelectivityData {
  target_id: string;
  total_ligands: number;
  avg_pchembl_value: number | null;
  top_ligands: LigandRecord[];
}
