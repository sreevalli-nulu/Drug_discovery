import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, ChevronRight } from 'lucide-react';
import { Card, Badge } from '../common';
import { formatMolecularWeight, formatPhase } from '../../utils/formatters';
import './ResultCard.css';

interface CompoundResult {
  chembl_id: string;
  name: string;
  molecular_weight: number | null;
  max_phase: number | null;
  molecular_formula?: string | null;
  indication?: string | null;
}

interface CompoundResultCardProps {
  compound: CompoundResult;
}

const CompoundResultCard: React.FC<CompoundResultCardProps> = ({ compound }) => {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      onClick={() => navigate(`/compound/${compound.chembl_id}`)}
      className="result-card"
    >
      <div className="result-card__inner">
        <div className="result-card__icon result-card__icon--compound">
          <FlaskConical size={18} />
        </div>
        <div className="result-card__body">
          <div className="result-card__header">
            <span className="result-card__name">{compound.name}</span>
            <div className="result-card__badges">
              <Badge variant="compound" mono>{compound.chembl_id}</Badge>
              {compound.max_phase !== null && compound.max_phase > 0 && (
                <Badge variant={compound.max_phase === 4 ? 'success' : 'warning'}>
                  {formatPhase(compound.max_phase)}
                </Badge>
              )}
            </div>
          </div>
          <div className="result-card__meta">
            {compound.molecular_weight && (
              <span className="result-card__detail">
                MW: {formatMolecularWeight(compound.molecular_weight)}
              </span>
            )}
            {compound.indication && (
              <span className="result-card__detail">{compound.indication}</span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="result-card__arrow" />
      </div>
    </Card>
  );
};

export default CompoundResultCard;
