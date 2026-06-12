// ============================================
// Workspace Types
// ============================================

export interface SaveEntityRequest {
  entity_type: 'compound' | 'target' | 'disease';
  entity_id: string;
  entity_name: string;
  notes?: string;
}

export interface SavedEntity {
  id: string;
  entity_type: 'compound' | 'target' | 'disease';
  entity_id: string;
  entity_name: string;
  notes: string | null;
  saved_at: string;
}

export interface WorkspaceResponse {
  compounds: SavedEntity[];
  targets: SavedEntity[];
  diseases: SavedEntity[];
  total_count: number;
}

export interface UpdateNotesRequest {
  notes: string;
}
