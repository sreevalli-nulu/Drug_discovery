import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useSaveEntity, useDeleteEntity, useWorkspace } from '../../hooks/useWorkspace';
import type { SaveEntityRequest } from '../../types';
import './SaveButton.css';

interface SaveButtonProps {
  entityType: 'compound' | 'target' | 'disease';
  entityId: string;
  entityName: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({ entityType, entityId, entityName }) => {
  const [justSaved, setJustSaved] = useState(false);

  const { data: workspace } = useWorkspace();
  const { mutate: saveEntity, isPending: isSaving } = useSaveEntity();
  const { mutate: deleteEntity, isPending: isDeleting } = useDeleteEntity();

  // Check if this entity is already saved
  const savedList = workspace?.[`${entityType}s` as keyof typeof workspace] as any[] ?? [];
  const savedEntry = savedList.find((e: any) => e.entity_id === entityId);
  const isSaved = !!savedEntry;

  const handleClick = () => {
    if (isSaved && savedEntry) {
      deleteEntity(savedEntry.id);
    } else {
      const request: SaveEntityRequest = {
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
      };
      saveEntity(request, {
        onSuccess: () => {
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 2000);
        },
      });
    }
  };

  const isPending = isSaving || isDeleting;

  return (
    <button
      type="button"
      className={`save-btn ${isSaved ? 'save-btn--saved' : ''}`}
      onClick={handleClick}
      disabled={isPending}
      title={isSaved ? 'Remove from workspace' : 'Save to workspace'}
    >
      {isPending ? (
        <Loader2 size={15} className="save-btn__spinner" />
      ) : isSaved ? (
        <BookmarkCheck size={15} />
      ) : (
        <Bookmark size={15} />
      )}
      {justSaved ? 'Saved!' : isSaved ? 'Saved' : 'Save'}
    </button>
  );
};

export default SaveButton;
