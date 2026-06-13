import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../common';
import { Dna } from 'lucide-react';
import type { CompoundTarget } from '../../types';
import './TargetsTable.css';

interface TargetsTableProps {
  targets: CompoundTarget[];
}

const TargetsTable: React.FC<TargetsTableProps> = ({ targets }) => {
  const navigate = useNavigate();

  if (targets.length === 0) {
    return (
      <EmptyState
        icon={Dna}
        title="No targets found"
        message="No known targets with bioactivity data for this compound."
      />
    );
  }

  return (
    <div className="targets-table__wrapper">
      <table className="targets-table">
        <thead>
          <tr>
            <th>Target Name</th>
            <th>ChEMBL ID</th>
            <th>Best Activity</th>
            <th>pChEMBL</th>
          </tr>
        </thead>
        <tbody>
          {targets.map((t) => (
            <tr
              key={t.target_chembl_id}
              className="targets-table__row"
              onClick={() => navigate(`/target/${t.target_chembl_id}`)}
              title="View target profile"
            >
              <td className="targets-table__name">
                {t.target_name ?? t.target_chembl_id}
              </td>
              <td>
                <span className="targets-table__id">{t.target_chembl_id}</span>
              </td>
              <td className="targets-table__activity">
                {t.best_activity_value !== null && t.best_activity_type ? (
                  <span className="targets-table__mono">
                    {t.best_activity_type} {t.best_activity_value}{' '}
                    {t.best_activity_units ?? ''}
                  </span>
                ) : (
                  <span className="targets-table__muted">—</span>
                )}
              </td>
              <td>
                {t.best_pchembl_value !== null ? (
                  <span
                    className={`targets-table__pchembl ${
                      t.best_pchembl_value >= 7
                        ? 'targets-table__pchembl--strong'
                        : 'targets-table__pchembl--weak'
                    }`}
                  >
                    {t.best_pchembl_value.toFixed(2)}
                  </span>
                ) : (
                  <span className="targets-table__muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TargetsTable;
