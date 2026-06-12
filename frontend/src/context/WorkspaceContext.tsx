import { createContext, useContext, type ReactNode } from 'react';
import { useWorkspace, useSaveEntity, useDeleteEntity } from '@/hooks';
import type { SaveEntityRequest } from '@/types';

interface WorkspaceContextValue {
  totalCount: number;
  saveEntity: (request: SaveEntityRequest) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading } = useWorkspace();
  const saveMutation = useSaveEntity();
  const deleteMutation = useDeleteEntity();

  const saveEntity = async (request: SaveEntityRequest) => {
    await saveMutation.mutateAsync(request);
  };

  const deleteEntity = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <WorkspaceContext.Provider value={{
      totalCount: data?.total_count ?? 0,
      saveEntity,
      deleteEntity,
      isLoading,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspaceContext = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspaceContext must be used within WorkspaceProvider');
  return context;
};
