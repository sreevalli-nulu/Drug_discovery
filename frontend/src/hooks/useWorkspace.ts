import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '@/services';
import type { SaveEntityRequest, UpdateNotesRequest } from '@/types';

const WORKSPACE_KEY = ['workspace'] as const;

export const useWorkspace = () => {
  return useQuery({
    queryKey: WORKSPACE_KEY,
    queryFn: workspaceService.getWorkspace,
    staleTime: 1000 * 60 * 5,
  });
};

export const useSaveEntity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: SaveEntityRequest) => workspaceService.saveEntity(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKSPACE_KEY }),
  });
};

export const useUpdateNotes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: UpdateNotesRequest }) =>
      workspaceService.updateNotes(id, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKSPACE_KEY }),
  });
};

export const useDeleteEntity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entityId: string) => workspaceService.deleteEntity(entityId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKSPACE_KEY }),
  });
};
