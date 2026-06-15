import { useState } from 'react';
import { GitCompare, Plus, X, Loader2 } from 'lucide-react';
import { Card, EmptyState } from '../components/common';
import ComparisonTable from '../components/comparison/ComparisonTable';
import ComparisonRadar from '../components/comparison/ComparisonRadar';
import { useCreateComparison } from '../hooks/useComparison';
import { comparisonService } from '../services';
import type { ComparisonResponse } from '../types';
import './ComparisonPage.css';

const MAX_COMPOUNDS = 4;

const ComparisonPage = () => {
  const [ids, setIds] = useState<string[]>(['', '']);
  const [result, setResult] = useState<ComparisonResponse | null>(null);
  const [inputError, setInputError] = useState('');

  const { mutate: createComparison, isPending } = useCreateComparison();

  const handleIdChange = (index: number, value: string) => {
    const updated = [...ids];
    updated[index] = value.toUpperCase().trim();
    setIds(updated);
    setInputError('');
  };

  const handleAddSlot = () => {
    if (ids.length < MAX_COMPOUNDS) setIds([...ids, '']);
  };

  const handleRemoveSlot = (index: number) => {
    if (ids.length <= 2) return; // minimum 2
    setIds(ids.filter((_, i) => i !== index));
  };

  const handleCompare = () => {
    const filled = ids.filter((id) => id.length > 0);
    if (filled.length < 2) {
      setInputError('Enter at least 2 ChEMBL IDs to compare.');
      return;
    }
    const invalid = filled.filter((id) => !id.startsWith('CHEMBL'));
    if (invalid.length > 0) {
      setInputError(`Invalid IDs: ${invalid.join(', ')}. IDs must start with CHEMBL.`);
      return;
    }

    createComparison(
      { entity_ids: filled, name: filled.join(' vs ') },
      {
        onSuccess: (data) => setResult(data),
        onError: () => setInputError('Comparison failed. Check the IDs and try again.'),
      }
    );
  };

  const radarData = result
    ? comparisonService.toRadarData(result.compounds)
    : [];

  return (
    <div className="comparison-page">
      <div className="comparison-page__header">
        <h1 className="comparison-page__title">
          <GitCompare size={22} />
          Compare Compounds
        </h1>
        <p className="comparison-page__subtitle">
          Enter up to 4 ChEMBL IDs to compare molecular properties side by side.
        </p>
      </div>

      {/* Input section */}
      <Card title="Select Compounds" className="comparison-page__input-card">
        <div className="comparison-page__slots">
          {ids.map((id, index) => (
            <div key={index} className="comparison-page__slot">
              <span className="comparison-page__slot-num">{index + 1}</span>
              <input
                type="text"
                className="comparison-page__input"
                value={id}
                placeholder="e.g. CHEMBL941"
                onChange={(e) => handleIdChange(index, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
              />
              {ids.length > 2 && (
                <button
                  type="button"
                  className="comparison-page__remove"
                  onClick={() => handleRemoveSlot(index)}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {ids.length < MAX_COMPOUNDS && (
          <button
            type="button"
            className="comparison-page__add-btn"
            onClick={handleAddSlot}
          >
            <Plus size={14} />
            Add compound
          </button>
        )}

        {inputError && (
          <p className="comparison-page__error">{inputError}</p>
        )}

        <div className="comparison-page__actions">
          <p className="comparison-page__hint">
            Try: CHEMBL941 (Imatinib) vs CHEMBL1421 (Dasatinib)
          </p>
          <button
            type="button"
            className="comparison-page__compare-btn"
            onClick={handleCompare}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 size={15} className="comparison-page__spinner" />
                Comparing…
              </>
            ) : (
              <>
                <GitCompare size={15} />
                Compare
              </>
            )}
          </button>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <>
          <Card
            title="Property Comparison"
            subtitle={`Comparing ${result.compounds.length} compounds`}
            className="comparison-page__results-card"
          >
            <ComparisonTable compounds={result.compounds} />
          </Card>

          <Card
            title="Radar Chart"
            subtitle="Normalised property values — larger area = more drug-like"
            className="comparison-page__radar-card"
          >
            <ComparisonRadar
              data={radarData}
              compounds={result.compounds}
            />
          </Card>
        </>
      )}

      {!result && !isPending && (
        <EmptyState
          icon={GitCompare}
          title="No comparison yet"
          message="Enter 2–4 ChEMBL IDs above and click Compare to see a side-by-side analysis."
        />
      )}
    </div>
  );
};

export default ComparisonPage;
