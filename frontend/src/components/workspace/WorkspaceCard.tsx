import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, FileText, ExternalLink } from 'lucide-react';
import { Badge } from '../common';
import { useDeleteEntity, useUpdateNotes } from '../../hooks/useWorkspace';
import type { SavedEntity } from '../../types';
import './WorkspaceCard.css';

interface WorkspaceCardProps {
  entity: SavedEntity;
}

const ENTITY_ROUTES: Record<string, string> = {
  compound: '/compound',
  target: '/target',
  disease: '/disease',
};

const ENTITY_VARIANTS: Record<string, 'compound' | 'target' | 'disease'> = {
  compound: 'compound',
  target: 'target',
  disease: 'disease',
};

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ entity }) => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState(entity.notes ?? '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesChanged, setNotesChanged] = useState(false);

  const { mutate: deleteEntity, isPending: isDeleting } = useDeleteEntity();
  const { mutate: updateNotes, isPending: isSavingNotes } = useUpdateNotes();

  const handleNotesChange = (val: string) => {
    setNotes(val);
    setNotesChanged(val !== (entity.notes ?? ''));
  };

  const handleSaveNotes = () => {
    updateNotes(
      { id: entity.id, notes: { notes } },
      { onSuccess: () => { setNotesChanged(false); setIsEditingNotes(false); } }
    );
  };

  const handleNavigate = () => {
    const base = ENTITY_ROUTES[entity.entity_type] ?? '/';
    navigate(`${base}/${entity.entity_id}`);
  };

  const savedDate = new Date(entity.saved_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="workspace-card">
      <div className="workspace-card__header">
        <div className="workspace-card__info">
          <Badge variant={ENTITY_VARIANTS[entity.entity_type]}>
            {entity.entity_type}
          </Badge>
          <span className="workspace-card__id">{entity.entity_id}</span>
        </div>
        <div className="workspace-card__actions">
          <span className="workspace-card__date">{savedDate}</span>
          <button
            type="button"
            className="workspace-card__btn workspace-card__btn--view"
            onClick={handleNavigate}
            title="View profile"
          >
            <ExternalLink size={14} />
          </button>
          <button
            type="button"
            className="workspace-card__btn workspace-card__btn--delete"
            onClick={() => deleteEntity(entity.id)}
            disabled={isDeleting}
            title="Remove from workspace"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <h3
        className="workspace-card__name"
        onClick={handleNavigate}
        title="View profile"
      >
        {entity.entity_name}
      </h3>

      {/* Notes section */}
      <div className="workspace-card__notes">
        {isEditingNotes ? (
          <div className="workspace-card__notes-editor">
            <textarea
              className="workspace-card__textarea"
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add your notes here…"
              rows={3}
              autoFocus
            />
            <div className="workspace-card__notes-footer">
              <button
                type="button"
                className="workspace-card__notes-btn workspace-card__notes-btn--cancel"
                onClick={() => { setIsEditingNotes(false); setNotes(entity.notes ?? ''); setNotesChanged(false); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="workspace-card__notes-btn workspace-card__notes-btn--save"
                onClick={handleSaveNotes}
                disabled={!notesChanged || isSavingNotes}
              >
                {isSavingNotes ? 'Saving…' : 'Save notes'}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="workspace-card__notes-trigger"
            onClick={() => setIsEditingNotes(true)}
          >
            <FileText size={13} />
            {notes ? notes : 'Add notes…'}
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkspaceCard;
