// ============================================
// Workspace API Layer
// ============================================

import apiClient from './client';
import type {
  SaveEntityRequest,
  SavedEntity,
  WorkspaceResponse,
  UpdateNotesRequest,
} from '@/types';

export const fetchWorkspace = async (): Promise<WorkspaceResponse> => {
  const { data } = await apiClient.get<WorkspaceResponse>('/api/workspace');
  return data;
};

export const saveEntityApi = async (request: SaveEntityRequest): Promise<SavedEntity> => {
  const { data } = await apiClient.post<SavedEntity>('/api/workspace', request);
  return data;
};

export const updateNotesApi = async (
  entityId: string,
  request: UpdateNotesRequest
): Promise<SavedEntity> => {
  const { data } = await apiClient.put<SavedEntity>(`/api/workspace/${entityId}`, request);
  return data;
};

export const deleteEntityApi = async (entityId: string): Promise<void> => {
  await apiClient.delete(`/api/workspace/${entityId}`);
};

export const exportWorkspaceUrl = (): string => {
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/workspace/export`;
};
