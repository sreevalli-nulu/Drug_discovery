import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../common';
import { Activity } from 'lucide-react';
import "./DiseaseAssociationsChart.css";

interface DiseaseAssoc {
  efo_id: string;
  name: string;
  description?: string | null;
  score: number;
}

interface DiseaseAssociationsProps {
  diseases: DiseaseAssoc[];
}

const DiseaseAssociations: React.FC<DiseaseAssociationsProps> = ({ diseases }) => {
  const navigate = useNavigate();

  if (!diseases || diseases.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No disease associations found"
        message="No Open Targets evidence scores found for this gene."
      />
    );
  }

  // Sort by score descending, take top 15
  const sorted = [...diseases]
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'var(--color-cyan)';
    if (score >= 0.4) return 'var(--color-yellow)';
    return 'var(--color-text-secondary)';
  };

  const handleClick = (efoId: string) => {
    const urlId = efoId.replace(':', '_');
    navigate(`/disease/${urlId}`);
  };

  return (
    <div className="disease-assoc">
      <div className="disease-assoc__list">
        {sorted.map((d) => (
          <div
            key={d.efo_id}
            className="disease-assoc__row"
            onClick={() => handleClick(d.efo_id)}
            title={d.description ?? d.name}
          >
            <div className="disease-assoc__label">
              <span className="disease-assoc__name">{d.name}</span>
              <span className="disease-assoc__id">{d.efo_id}</span>
            </div>
            <div className="disease-assoc__bar-wrap">
              <div
                className="disease-assoc__bar"
                style={{
                  width: `${Math.round(d.score * 100)}%`,
                  background: getScoreColor(d.score),
                }}
              />
            </div>
            <span
              className="disease-assoc__score"
              style={{ color: getScoreColor(d.score) }}
            >
              {d.score.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
      <p className="disease-assoc__legend">
        Open Targets association score (0–1). Score ≥ 0.7 = strong evidence.
        Click a disease to view its full profile.
      </p>
    </div>
  );
};

export default DiseaseAssociations;
