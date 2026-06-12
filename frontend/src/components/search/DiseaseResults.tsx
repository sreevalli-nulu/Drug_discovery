import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ChevronRight } from 'lucide-react';
import { Card, Badge } from '../common';
import './ResultCard.css';

interface DiseaseResult {
  efo_id: string;
  name: string;
  description?: string | null;
}

interface DiseaseResultCardProps {
  disease: DiseaseResult;
}

const DiseaseResultCard: React.FC<DiseaseResultCardProps> = ({ disease }) => {
  const navigate = useNavigate();

  // EFO IDs use underscores in the API but colons in URLs — keep underscore form
  const urlId = disease.efo_id.replace(':', '_');

  return (
    <Card
      hoverable
      onClick={() => navigate(`/disease/${urlId}`)}
      className="result-card"
    >
      <div className="result-card__inner">
        <div className="result-card__icon result-card__icon--disease">
          <Activity size={18} />
        </div>
        <div className="result-card__body">
          <div className="result-card__header">
            <span className="result-card__name">{disease.name}</span>
            <div className="result-card__badges">
              <Badge variant="disease" mono>{disease.efo_id}</Badge>
            </div>
          </div>
          {disease.description && (
            <p className="result-card__description">
              {disease.description.length > 160
                ? disease.description.slice(0, 160) + '…'
                : disease.description}
            </p>
          )}
        </div>
        <ChevronRight size={16} className="result-card__arrow" />
      </div>
    </Card>
  );
};

export default DiseaseResultCard;
