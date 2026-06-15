import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { CompoundComparisonData } from '../../types';
import './ComparisonTable.css';

interface ComparisonTableProps {
  compounds: CompoundComparisonData[];
}

// Colors for each compound column header
const COLUMN_COLORS = ['#00D4FF', '#7B2FBE', '#1ED760', '#FFB800'];

interface PropertyRow {
  label: string;
  key: keyof CompoundComparisonData;
  format: (v: any) => string;
  better: 'lower' | 'higher' | 'none';
  lipinski?: { max: number };
}

const PROPERTIES: PropertyRow[] = [
  {
    label: 'Molecular Weight',
    key: 'molecular_weight',
    format: (v) => (v !== null ? `${v.toFixed(2)} Da` : '—'),
    better: 'lower',
    lipinski: { max: 500 },
  },
  {
    label: 'LogP',
    key: 'logp',
    format: (v) => (v !== null ? v.toFixed(2) : '—'),
    better: 'lower',
    lipinski: { max: 5 },
  },
  {
    label: 'H-Bond Donors',
    key: 'hbd',
    format: (v) => (v !== null ? String(v) : '—'),
    better: 'lower',
    lipinski: { max: 5 },
  },
  {
    label: 'H-Bond Acceptors',
    key: 'hba',
    format: (v) => (v !== null ? String(v) : '—'),
    better: 'lower',
    lipinski: { max: 10 },
  },
  {
    label: 'TPSA',
    key: 'tpsa',
    format: (v) => (v !== null ? `${v.toFixed(1)} Å²` : '—'),
    better: 'lower',
  },
  {
    label: 'Ro5 Violations',
    key: 'ro5_violations',
    format: (v) => (v !== null ? String(v) : '—'),
    better: 'lower',
  },
  {
    label: 'Approval Status',
    key: 'approval_status',
    format: (v) => v ?? '—',
    better: 'none',
  },
];

const ComparisonTable: React.FC<ComparisonTableProps> = ({ compounds }) => {
  const navigate = useNavigate();

  // Find best value per row for highlighting
  const getBestIndex = (row: PropertyRow): number => {
    if (row.better === 'none') return -1;
    const values = compounds.map((c) => c[row.key] as number | null);
    const nums = values.map((v, i) => ({ v, i })).filter((x) => x.v !== null);
    if (nums.length === 0) return -1;
    if (row.better === 'lower') {
      return nums.reduce((a, b) => (a.v! < b.v! ? a : b)).i;
    }
    return nums.reduce((a, b) => (a.v! > b.v! ? a : b)).i;
  };

  return (
    <div className="comparison-table__wrapper">
      <table className="comparison-table">
        <thead>
          <tr>
            <th className="comparison-table__prop-col">Property</th>
            {compounds.map((c, i) => (
              <th key={c.chembl_id} className="comparison-table__compound-col">
                <button
                  type="button"
                  className="comparison-table__compound-btn"
                  style={{ color: COLUMN_COLORS[i] }}
                  onClick={() => navigate(`/compound/${c.chembl_id}`)}
                  title="View compound profile"
                >
                  {c.name || c.chembl_id}
                </button>
                <span className="comparison-table__chembl-id">{c.chembl_id}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PROPERTIES.map((row) => {
            const bestIndex = getBestIndex(row);
            return (
              <tr key={row.key}>
                <td className="comparison-table__label">
                  {row.label}
                  {row.lipinski && (
                    <span className="comparison-table__limit">
                      ≤ {row.lipinski.max}
                    </span>
                  )}
                </td>
                {compounds.map((c, i) => {
                  const val = c[row.key];
                  const isBest = i === bestIndex;
                  const overLimit =
                    row.lipinski && val !== null
                      ? (val as number) > row.lipinski.max
                      : false;

                  return (
                    <td
                      key={c.chembl_id}
                      className={`comparison-table__value ${isBest ? 'comparison-table__value--best' : ''} ${overLimit ? 'comparison-table__value--over' : ''}`}
                      style={isBest ? { color: COLUMN_COLORS[i] } : undefined}
                    >
                      {row.format(val)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;
