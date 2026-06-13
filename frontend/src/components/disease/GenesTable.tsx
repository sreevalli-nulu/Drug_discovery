import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../common';
import { Dna } from 'lucide-react';
import type { GeneAssociation } from '../../types';
import './GenesTable.css';

interface GenesTableProps {
  genes: GeneAssociation[];
}

const ScoreCell = ({ value }: { value: number | null }) => {
  if (value === null) return <span className="genes-table__muted">—</span>;
  const pct = Math.round(value * 100);
  const color =
    value >= 0.7 ? 'var(--color-cyan)' :
    value >= 0.4 ? 'var(--color-yellow)' :
    'var(--color-text-secondary)';
  return (
    <div className="genes-table__score-cell">
      <div className="genes-table__score-bar-wrap">
        <div
          className="genes-table__score-bar"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="genes-table__score-num" style={{ color }}>
        {value.toFixed(2)}
      </span>
    </div>
  );
};

const GenesTable: React.FC<GenesTableProps> = ({ genes }) => {
  const navigate = useNavigate();

  if (!genes || genes.length === 0) {
    return (
      <EmptyState
        icon={Dna}
        title="No gene associations found"
        message="No Open Targets gene associations found for this disease."
      />
    );
  }

  const sorted = [...genes].sort(
    (a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0)
  );

  return (
    <div className="genes-table__wrapper">
      <table className="genes-table">
        <thead>
          <tr>
            <th>Gene</th>
            <th>Overall</th>
            <th className="genes-table__th--hide-sm">Genetic</th>
            <th className="genes-table__th--hide-sm">Somatic</th>
            <th className="genes-table__th--hide-sm">Drug</th>
            <th className="genes-table__th--hide-sm">Pathway</th>
            <th className="genes-table__th--hide-sm">Literature</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((g) => (
            <tr
              key={g.gene_id}
              className="genes-table__row"
              onClick={() => navigate(`/target/${g.gene_id}`)}
              title="View target profile"
            >
              <td>
                <div className="genes-table__gene">
                  <span className="genes-table__symbol">{g.gene_symbol ?? g.gene_id}</span>
                  {g.gene_name && (
                    <span className="genes-table__gene-name">{g.gene_name}</span>
                  )}
                </div>
              </td>
              <td><ScoreCell value={g.overall_score} /></td>
              <td className="genes-table__td--hide-sm"><ScoreCell value={g.genetic_score} /></td>
              <td className="genes-table__td--hide-sm"><ScoreCell value={g.somatic_score} /></td>
              <td className="genes-table__td--hide-sm"><ScoreCell value={g.drug_score} /></td>
              <td className="genes-table__td--hide-sm"><ScoreCell value={g.pathway_score} /></td>
              <td className="genes-table__td--hide-sm"><ScoreCell value={g.text_mining_score} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GenesTable;
