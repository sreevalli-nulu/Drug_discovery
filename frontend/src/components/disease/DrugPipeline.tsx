import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../common';
import { FlaskConical } from 'lucide-react';
import type { DrugPipelineEntry } from '../../types';
import './DrugPipeline.css';

interface DrugPipelineProps {
  drugs: DrugPipelineEntry[];
}

const PHASE_CONFIG: Record<number, { label: string; className: string }> = {
  4: { label: 'Approved', className: 'drug-pipeline__phase--approved' },
  3: { label: 'Phase 3', className: 'drug-pipeline__phase--phase3' },
  2: { label: 'Phase 2', className: 'drug-pipeline__phase--phase2' },
  1: { label: 'Phase 1', className: 'drug-pipeline__phase--phase1' },
  0: { label: 'Preclinical', className: 'drug-pipeline__phase--preclinical' },
};

const DrugPipeline: React.FC<DrugPipelineProps> = ({ drugs }) => {
  const navigate = useNavigate();

  if (!drugs || drugs.length === 0) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="No drugs found"
        message="No drugs in clinical development found for this disease."
      />
    );
  }

  // Group drugs by phase
  const grouped = new Map<number, DrugPipelineEntry[]>();
  for (const drug of drugs) {
    const phase = drug.max_phase ?? 0;
    if (!grouped.has(phase)) grouped.set(phase, []);
    grouped.get(phase)!.push(drug);
  }

  // Sort phases descending (4 first)
  const phases = Array.from(grouped.keys()).sort((a, b) => b - a);

  return (
    <div className="drug-pipeline">
      {phases.map((phase) => {
        const config = PHASE_CONFIG[phase] ?? PHASE_CONFIG[0];
        const phaseDrugs = grouped.get(phase) ?? [];
        return (
          <div key={phase} className="drug-pipeline__group">
            <div className={`drug-pipeline__phase-header ${config.className}`}>
              <span className="drug-pipeline__phase-label">{config.label}</span>
              <span className="drug-pipeline__phase-count">{phaseDrugs.length}</span>
            </div>
            <div className="drug-pipeline__drug-list">
              {phaseDrugs.map((drug) => (
                <div
                  key={drug.chembl_id}
                  className="drug-pipeline__drug"
                  onClick={() => navigate(`/compound/${drug.chembl_id}`)}
                  title="View compound profile"
                >
                  <span className="drug-pipeline__drug-name">{drug.name}</span>
                  <span className="drug-pipeline__drug-id">{drug.chembl_id}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DrugPipeline;
