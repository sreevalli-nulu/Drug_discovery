import { useParams, useNavigate } from 'react-router-dom';
import { Dna, ArrowLeft, ExternalLink } from 'lucide-react';
import { PageHeader, Card, Badge, EmptyState } from '../components/common';
import LigandsTable from '../components/target/LigandsTable';
import DiseaseAssociations from '../components/target/DiseaseAssociationsChart';
import {
  useTargetProfile,
  useTargetLigands,
  useTargetDiseases,
} from '../hooks/useTarget';
import './TargetPage.css';

const TargetPage = () => {
  const { targetId } = useParams<{ targetId: string }>();
  const navigate = useNavigate();

  const id = targetId ?? '';

  // Detect if the URL param is an Ensembl ID (starts with ENSG)
  const isEnsembl = id.startsWith('ENSG');
  const chemblId = isEnsembl ? '' : id;
  const ensemblId = isEnsembl ? id : '';

  const { data: profile, isLoading: profileLoading, isError: profileError } =
    useTargetProfile(chemblId || id);

  const { data: ligandsData, isLoading: ligandsLoading } =
    useTargetLigands(chemblId || id);

  // Diseases need an Ensembl ID — only fetch if we have one
  const { data: diseasesData, isLoading: diseasesLoading } =
    useTargetDiseases(ensemblId);

  if (profileLoading) {
    return (
      <div className="target-page">
        <div className="target-page__loading">
          <div className="target-page__skeleton target-page__skeleton--header" />
          <div className="target-page__skeleton target-page__skeleton--card" />
          <div className="target-page__skeleton target-page__skeleton--chart" />
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="target-page">
        <EmptyState
          icon={Dna}
          title="Target not found"
          message={`No target found with ID "${id}". Check the ChEMBL ID and try again.`}
          action={
            <button className="target-page__back-btn" onClick={() => navigate(-1)}>
              ← Go back
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="target-page">
      <button className="target-page__back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} />
        Back to results
      </button>

      <PageHeader
        title={profile.pref_name}
        subtitle={profile.gene_name ? `Gene: ${profile.gene_name}` : undefined}
        badgeLabel="Target"
        badgeVariant="target"
        monoId={profile.target_chembl_id}
        actions={
          <div className="target-page__header-badges">
            {profile.target_type && (
              <Badge variant="neutral">{profile.target_type}</Badge>
            )}
            {profile.organism && (
              <Badge variant="neutral">{profile.organism}</Badge>
            )}
          </div>
        }
      />

      {/* Target Info Card */}
      <Card title="Target Information" className="target-page__info-card">
        <div className="target-page__props">
          <PropRow label="Gene Name" value={profile.gene_name ?? '—'} mono />
          <PropRow label="Target Type" value={profile.target_type ?? '—'} />
          <PropRow label="Organism" value={profile.organism ?? '—'} />
          <PropRow label="Target Class" value={profile.target_class ?? '—'} />
          {profile.uniprot_id && (
            <div className="prop-row">
              <span className="prop-row__label">UniProt ID</span>
              <a
                href={`https://www.uniprot.org/uniprot/${profile.uniprot_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="target-page__uniprot-link"
              >
                <span className="prop-row__value prop-row__value--mono">
                  {profile.uniprot_id}
                </span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Known Ligands */}
      <Card
        title="Known Ligands"
        subtitle="Compounds with recorded binding activity for this target"
        className="target-page__ligands-card"
      >
        {ligandsLoading ? (
          <div className="target-page__skeleton target-page__skeleton--chart" />
        ) : (
          <LigandsTable ligands={ligandsData?.ligands ?? []} />
        )}
      </Card>

      {/* Disease Associations — only when Ensembl ID is available */}
      {ensemblId ? (
        <Card
          title="Disease Associations"
          subtitle="Diseases associated with this target via Open Targets evidence scores"
          className="target-page__diseases-card"
        >
          {diseasesLoading ? (
            <div className="target-page__skeleton target-page__skeleton--chart" />
          ) : (
            <DiseaseAssociations
              diseases={diseasesData?.diseases ?? diseasesData ?? []}
            />
          )}
        </Card>
      ) : (
        <Card title="Disease Associations" className="target-page__diseases-card">
          <EmptyState
            icon={Dna}
            title="Ensembl ID required"
            message="Disease associations are available when navigating via an Ensembl gene ID (ENSG…). Try searching for the gene name to find the Ensembl-linked target."
          />
        </Card>
      )}
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
    <span className={`prop-row__value${mono ? ' prop-row__value--mono' : ''}`}>
      {value}
    </span>
  </div>
);

export default TargetPage;
