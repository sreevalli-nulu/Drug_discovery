import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../common';
import type { CompoundProfile } from '../../types';
import './LipinskiPanel.css';

interface LipinskiPanelProps {
  profile: CompoundProfile;
}

interface Rule {
  label: string;
  value: number | null;
  threshold: string;
  passes: boolean | null;
}

const LipinskiPanel: React.FC<LipinskiPanelProps> = ({ profile }) => {
  const rules: Rule[] = [
    {
      label: 'Molecular Weight',
      value: profile.molecular_weight,
      threshold: '≤ 500 Da',
      passes: profile.molecular_weight !== null ? profile.molecular_weight <= 500 : null,
    },
    {
      label: 'LogP (lipophilicity)',
      value: profile.logp,
      threshold: '≤ 5',
      passes: profile.logp !== null ? profile.logp <= 5 : null,
    },
    {
      label: 'H-Bond Donors',
      value: profile.hbd,
      threshold: '≤ 5',
      passes: profile.hbd !== null ? profile.hbd <= 5 : null,
    },
    {
      label: 'H-Bond Acceptors',
      value: profile.hba,
      threshold: '≤ 10',
      passes: profile.hba !== null ? profile.hba <= 10 : null,
    },
  ];

  const passCount = rules.filter((r) => r.passes === true).length;
  const allPass = passCount === rules.length;

  return (
    <Card
      title="Lipinski Rule of Five"
      subtitle={
        allPass
          ? 'All rules pass — good oral bioavailability predicted'
          : `${passCount}/4 rules pass`
      }
    >
      <div className="lipinski__summary">
        <span
          className={`lipinski__badge ${allPass ? 'lipinski__badge--pass' : 'lipinski__badge--fail'}`}
        >
          {allPass ? '✓ Drug-like' : `${passCount}/4 Passed`}
        </span>
      </div>
      <div className="lipinski__rules">
        {rules.map((rule) => (
          <div key={rule.label} className="lipinski__rule">
            <div className="lipinski__rule-left">
              {rule.passes === true ? (
                <CheckCircle size={16} className="lipinski__icon lipinski__icon--pass" />
              ) : rule.passes === false ? (
                <XCircle size={16} className="lipinski__icon lipinski__icon--fail" />
              ) : (
                <span className="lipinski__icon lipinski__icon--unknown">?</span>
              )}
              <span className="lipinski__rule-label">{rule.label}</span>
            </div>
            <div className="lipinski__rule-right">
              <span className="lipinski__rule-value">
                {rule.value !== null ? rule.value.toFixed(2) : '—'}
              </span>
              <span className="lipinski__rule-threshold">{rule.threshold}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default LipinskiPanel;
