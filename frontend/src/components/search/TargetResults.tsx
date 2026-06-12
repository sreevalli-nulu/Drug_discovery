import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dna, ChevronRight } from 'lucide-react';
import { Card, Badge } from '../common';
import type { TargetSearchResult } from '../../types';
import './ResultCard.css';

interface TargetResultCardProps {
  target: TargetSearchResult;
}

const TargetResultCard: React.FC<TargetResultCardProps> = ({ target }) => {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      onClick={() => navigate(`/target/${target.target_chembl_id}`)}
      className="result-card"
    >
      <div className="result-card__inner">
        <div className="result-card__icon result-card__icon--target">
          <Dna size={18} />
        </div>
        <div className="result-card__body">
          <div className="result-card__header">
            <span className="result-card__name">{target.pref_name}</span>
            <div className="result-card__badges">
              <Badge variant="target" mono>{target.target_chembl_id}</Badge>
              {target.target_type && (
                <Badge variant="neutral">{target.target_type}</Badge>
              )}
            </div>
          </div>
          <div className="result-card__meta">
            {target.gene_name && (
              <span className="result-card__detail">Gene: {target.gene_name}</span>
            )}
            {target.organism && (
              <span className="result-card__detail">{target.organism}</span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="result-card__arrow" />
      </div>
    </Card>
  );
};

export default TargetResultCard;
