import { useParams, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft } from 'lucide-react';
import { PageHeader, Card, Badge, EmptyState } from '../components/common';
import GenesTable from '../components/disease/GenesTable';
import DrugPipeline from '../components/disease/DrugPipeline';
import {
  useDiseaseProfile,
  useDiseaseGenes,
  useDiseaseDrugs,
} from '../hooks/useDisease';
import './DiseasePage.css';

const DiseasePage = () => {
  const { efoId } = useParams<{ efoId: string }>();
  const navigate = useNavigate();

  // URL uses underscores (EFO_0001071) — API uses same format
  const id = efoId ?? '';

  const { data: profile, isLoading: profileLoading, isError: profileError } =
    useDiseaseProfile(id);
  const { data: genesData, isLoading: genesLoading } = useDiseaseGenes(id);
  const { data: drugsData, isLoading: drugsLoading } = useDiseaseDrugs(id);

  if (profileLoading) {
    return (
      <div className="disease-page">
        <div className="disease-page__loading">
          <div className="disease-page__skeleton disease-page__skeleton--header" />
          <div className="disease-page__skeleton disease-page__skeleton--card" />
          <div className="disease-page__skeleton disease-page__skeleton--chart" />
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="disease-page">
        <EmptyState
          icon={Activity}
          title="Disease not found"
          message={`No disease found with ID "${id}". Check the EFO ID and try again.`}
          action={
            <button className="disease-page__back-btn" onClick={() => navigate(-1)}>
              ← Go back
            </button>
          }
        />
      </div>
    );
  }

  const pipelineSummary = drugsData?.pipeline_summary;

  return (
    <div className="disease-page">
      <button className="disease-page__back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Back to results
      </button>

      <PageHeader
        title={profile.name}
        subtitle={profile.description ?? undefined}
        badgeLabel="Disease"
        badgeVariant="disease"
        monoId={profile.efo_id}
      />

      {/* Disease Info Card */}
      <Card title="Disease Information" className="disease-page__info-card">
        {profile.description && (
          <p className="disease-page__description">{profile.description}</p>
        )}

        {profile.synonyms && profile.synonyms.length > 0 && (
          <div className="disease-page__synonyms">
            <span className="disease-page__synonyms-label">Also known as:</span>
            <div className="disease-page__synonym-list">
              {profile.synonyms.slice(0, 8).map((syn) => (
                <Badge key={syn} variant="neutral">{syn}</Badge>
              ))}
            </div>
          </div>
        )}

        {pipelineSummary && (
          <div className="disease-page__pipeline-summary">
            <span className="disease-page__summary-label">Drug Pipeline:</span>
            <div className="disease-page__summary-chips">
              {pipelineSummary.approved > 0 && (
                <span className="disease-page__summary-chip disease-page__summary-chip--approved">
                  {pipelineSummary.approved} Approved
                </span>
              )}
              {pipelineSummary.phase_3 > 0 && (
                <span className="disease-page__summary-chip disease-page__summary-chip--phase3">
                  {pipelineSummary.phase_3} Phase 3
                </span>
              )}
              {pipelineSummary.phase_2 > 0 && (
                <span className="disease-page__summary-chip disease-page__summary-chip--phase2">
                  {pipelineSummary.phase_2} Phase 2
                </span>
              )}
              {pipelineSummary.phase_1 > 0 && (
                <span className="disease-page__summary-chip disease-page__summary-chip--phase1">
                  {pipelineSummary.phase_1} Phase 1
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Associated Genes */}
      <Card
        title="Associated Genes"
        subtitle="Ranked by Open Targets overall evidence score"
        className="disease-page__genes-card"
      >
        {genesLoading ? (
          <div className="disease-page__skeleton disease-page__skeleton--chart" />
        ) : (
          <GenesTable genes={genesData?.associations ?? []} />
        )}
      </Card>

      {/* Drug Pipeline */}
      <Card
        title="Drug Pipeline"
        subtitle="Drugs in clinical development or approved for this disease"
        className="disease-page__drugs-card"
      >
        {drugsLoading ? (
          <div className="disease-page__skeleton disease-page__skeleton--chart" />
        ) : (
          <DrugPipeline drugs={drugsData?.drugs ?? []} />
        )}
      </Card>
    </div>
  );
};

export default DiseasePage;
