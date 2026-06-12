// ============================================
// Workspace Service
// ============================================

import {
  fetchWorkspace,
  saveEntityApi,
  updateNotesApi,
  deleteEntityApi,
  exportWorkspaceUrl,
} from '@/api';
import type { SaveEntityRequest, UpdateNotesRequest } from '@/types';

export const workspaceService = {
  getWorkspace: async () => {
    return fetchWorkspace();
  },

  saveEntity: async (request: SaveEntityRequest) => {
    return saveEntityApi(request);
  },

  updateNotes: async (entityId: string, request: UpdateNotesRequest) => {
    return updateNotesApi(entityId, request);
  },

  deleteEntity: async (entityId: string) => {
    return deleteEntityApi(entityId);
  },

  // Triggers CSV download in the browser
  exportCsv: () => {
    const url = exportWorkspaceUrl();
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my_workspace.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
