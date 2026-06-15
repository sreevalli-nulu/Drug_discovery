import { useParams, useNavigate } from 'react-router-dom';
import { FlaskConical, ArrowLeft } from 'lucide-react';
import { PageHeader, Card, Badge, EmptyState } from '../components/common';
import LipinskiPanel from '../components/compound/LipinskiPanel';
import ActivityChart from '../components/compound/ActivityChart';
import TargetsTable from '../components/compound/TargetsTable';
import AIInsightsPanel from '../components/ai/AIInsightsPanel';
import { useCompoundProfile, useCompoundActivities, useCompoundTargets } from '../hooks/useCompound';
import { formatMolecularWeight, formatPhase } from '../utils/formatters';
import './CompoundPage.css';
import SaveButton from '../components/common/SaveButton';

const CompoundPage = () => {
  const { chemblId } = useParams<{ chemblId: string }>();
  const navigate = useNavigate();

  const id = chemblId ?? '';

  const { data: profile, isLoading: profileLoading, isError: profileError } = useCompoundProfile(id);
  const { data: activitiesData, isLoading: activitiesLoading } = useCompoundActivities(id);
  const { data: targetsData, isLoading: targetsLoading } = useCompoundTargets(id);

  const phase = profile?.max_phase ?? null;
  const phaseLabel = phase !== null && phase > 0 ? formatPhase(phase) : null;
  const phaseVariant = phase === 4 ? 'success' : (phase !== null && phase >= 3 ? 'warning' : 'neutral');

  if (profileLoading) {
    return (
      <div className="compound-page">
        <div className="compound-page__loading">
          <div className="compound-page__skeleton compound-page__skeleton--header" />
          <div className="compound-page__skeleton-grid">
            <div className="compound-page__skeleton compound-page__skeleton--card" />
            <div className="compound-page__skeleton compound-page__skeleton--card" />
          </div>
          <div className="compound-page__skeleton compound-page__skeleton--chart" />
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="compound-page">
        <EmptyState
          icon={FlaskConical}
          title="Compound not found"
          message={`No compound found with ID "${id}". Check the ChEMBL ID and try again.`}
          action={
            <button className="compound-page__back-btn" onClick={() => navigate(-1)}>
              ← Go back
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="compound-page">
      <button className="compound-page__back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Back to results
      </button>

      <PageHeader
  title={profile.name}
  subtitle={
    profile.smiles
      ? `SMILES: ${profile.smiles.slice(0, 60)}${profile.smiles.length > 60 ? '…' : ''}`
      : undefined
  }
  badgeLabel="Compound"
  badgeVariant="compound"
  monoId={profile.chembl_id}
  actions={
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {phaseLabel && <Badge variant={phaseVariant}>{phaseLabel}</Badge>}
      <SaveButton entityType="compound" entityId={profile.chembl_id} entityName={profile.name} />
    </div>
  }
/>

      <AIInsightsPanel
        entityType="compound"
        entityId={profile.chembl_id}
        entityName={profile.name}
      />

      <div className="compound-page__overview">
        <Card title="Molecular Properties">
          <div className="compound-page__props">
            <PropRow label="Molecular Formula" value={profile.molecular_formula ?? '—'} mono />
            <PropRow
              label="Molecular Weight"
              value={profile.molecular_weight ? formatMolecularWeight(profile.molecular_weight) : '—'}
              mono
            />
            <PropRow
              label="LogP (lipophilicity)"
              value={profile.logp !== null ? profile.logp.toFixed(2) : '—'}
              mono
            />
            <PropRow
              label="TPSA"
              value={profile.tpsa !== null ? `${profile.tpsa.toFixed(1)} Å²` : '—'}
              mono
            />
            <PropRow
              label="H-Bond Donors"
              value={profile.hbd !== null ? String(profile.hbd) : '—'}
              mono
            />
            <PropRow
              label="H-Bond Acceptors"
              value={profile.hba !== null ? String(profile.hba) : '—'}
              mono
            />
          </div>
        </Card>

        <LipinskiPanel profile={profile} />
      </div>

      <Card
        title="Bioactivity Profile"
        subtitle="pChEMBL values by target — higher values indicate greater potency"
        className="compound-page__chart-card"
      >
        {activitiesLoading ? (
          <div className="compound-page__skeleton compound-page__skeleton--chart" />
        ) : (
          <ActivityChart activities={activitiesData?.activities ?? []} />
        )}
      </Card>

      <Card
        title="Known Targets"
        subtitle="Targets with recorded bioactivity data"
        className="compound-page__targets-card"
      >
        {targetsLoading ? (
          <div className="compound-page__skeleton compound-page__skeleton--chart" />
        ) : (
          <TargetsTable targets={targetsData?.targets ?? []} />
        )}
      </Card>
    </div>
  );
};

const PropRow = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="prop-row">
    <span className="prop-row__label">{label}</span>
    <span className={`prop-row__value${mono ? ' prop-row__value--mono' : ''}`}>{value}</span>
  </div>
);

export default CompoundPage;
