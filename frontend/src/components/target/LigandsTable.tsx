import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../common';
import { FlaskConical } from 'lucide-react';
import type { LigandRecord } from '../../types';
import './LigandsTable.css';

interface LigandsTableProps {
  ligands: LigandRecord[];
}

const LigandsTable: React.FC<LigandsTableProps> = ({ ligands }) => {
  const navigate = useNavigate();

  // Show ligands with pChEMBL first, then rest
  const sorted = [...ligands].sort(
    (a, b) => (b.pchembl_value ?? 0) - (a.pchembl_value ?? 0)
  );

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="No ligands found"
        message="No known ligands with bioactivity data for this target."
      />
    );
  }

  return (
    <div className="ligands-table__wrapper">
      <table className="ligands-table">
        <thead>
          <tr>
            <th>Compound</th>
            <th>ChEMBL ID</th>
            <th>Activity Type</th>
            <th>Value</th>
            <th>pChEMBL</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((l) => (
            <tr
              key={l.chembl_id}
              className="ligands-table__row"
              onClick={() => navigate(`/compound/${l.chembl_id}`)}
              title="View compound profile"
            >
              <td className="ligands-table__name">
                {l.name ?? <span className="ligands-table__muted">{l.chembl_id}</span>}
              </td>
              <td>
                <span className="ligands-table__id">{l.chembl_id}</span>
              </td>
              <td className="ligands-table__type">
                {l.standard_type ?? <span className="ligands-table__muted">—</span>}
              </td>
              <td className="ligands-table__value">
                {l.standard_value !== null ? (
                  <span className="ligands-table__mono">
                    {l.standard_value.toLocaleString()} {l.standard_units ?? ''}
                  </span>
                ) : (
                  <span className="ligands-table__muted">—</span>
                )}
              </td>
              <td>
                {l.pchembl_value !== null ? (
                  <span
                    className={`ligands-table__pchembl ${
                      l.pchembl_value >= 7
                        ? 'ligands-table__pchembl--strong'
                        : 'ligands-table__pchembl--weak'
                    }`}
                  >
                    {l.pchembl_value.toFixed(2)}
                  </span>
                ) : (
                  <span className="ligands-table__muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LigandsTable;
