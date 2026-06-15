// ============================================
// AI Types
// ============================================

export type QuestionType = 'mechanism' | 'ic50' | 'druglike' | 'disease_gene';
export type EntityType = 'compound' | 'target' | 'disease';

export interface AIExplainRequest {
  entity_type: EntityType;
  entity_id: string;
  entity_name?: string;
  question_type: QuestionType;
}

export interface AIExplainResponse {
  entity_id: string;
  question_type: QuestionType;
  explanation: string;
  from_cache: boolean;
  ai_enabled: boolean;
}

export interface AICompareRequest {
  chembl_ids: string[];
}

export interface AICompareResponse {
  explanation: string;
  from_cache: boolean;
  ai_enabled: boolean;
}

export interface AIStatusResponse {
  ai_enabled: boolean;
  model: string;
  message: string;
}
