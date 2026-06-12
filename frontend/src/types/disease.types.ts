// ============================================
// Disease Types
// ============================================

export interface DiseaseSearchResult {
  efo_id: string;
  name: string;
  description: string | null;
  synonyms: string[];
}

export interface DiseaseProfile {
  efo_id: string;
  name: string;
  description: string | null;
  synonyms: string[];
  ontology_path: string[];
}

export interface GeneAssociation {
  gene_id: string;
  gene_symbol: string | null;
  gene_name: string | null;
  overall_score: number | null;
  genetic_score: number | null;
  somatic_score: number | null;
  drug_score: number | null;
  pathway_score: number | null;
  text_mining_score: number | null;
}

export interface GeneAssociationsResponse {
  efo_id: string;
  associations: GeneAssociation[];
  total_count: number;
}

export interface DrugPipelineEntry {
  chembl_id: string;
  name: string;
  max_phase: number | null;
  approval_status: string | null;
  mechanism_of_action: string | null;
}

export interface DrugPipelineResponse {
  efo_id: string;
  total_count: number;
  pipeline_summary: {
    approved: number;
    phase_3: number;
    phase_2: number;
    phase_1: number;
    preclinical: number;
  };
  drugs: DrugPipelineEntry[];
}

export interface EvidenceHeatmapGene {
  gene_symbol: string;
  gene_id: string;
  overall_score: number | null;
  scores: {
    genetic: number;
    somatic: number;
    drug: number;
    pathway: number;
    text_mining: number;
  };
}

export interface EvidenceHeatmapResponse {
  efo_id: string;
  evidence_types: string[];
  genes: EvidenceHeatmapGene[];
  total_genes: number;
}
