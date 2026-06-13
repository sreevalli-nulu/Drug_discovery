import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { EmptyState } from '../common';
import { Activity } from 'lucide-react';
import type { BioactivityRecord } from '../../types';
import './ActivityChart.css';

interface ActivityChartProps {
  activities: BioactivityRecord[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="activity-chart__tooltip">
      <p className="activity-chart__tooltip-name">{d.target_name}</p>
      <p className="activity-chart__tooltip-value">
        pChEMBL: <strong>{d.pchembl_value.toFixed(2)}</strong>
      </p>
      <p className="activity-chart__tooltip-meta">
        Best IC50: {d.best_value} {d.best_units}
      </p>
      <p className="activity-chart__tooltip-id">{d.target_chembl_id}</p>
    </div>
  );
};

const ActivityChart: React.FC<ActivityChartProps> = ({ activities }) => {
  const withValues = activities.filter(
    (a) => a.pchembl_value !== null && a.target_name
  );

  if (withValues.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No potency data available"
        message="No activities with pChEMBL values found for this compound."
      />
    );
  }

  // Group by target — keep best (highest) pChEMBL per target
  const byTarget = new Map<string, BioactivityRecord>();
  for (const a of withValues) {
    const key = a.target_chembl_id ?? a.target_name ?? '';
    const existing = byTarget.get(key);
    if (!existing || (a.pchembl_value! > existing.pchembl_value!)) {
      byTarget.set(key, a);
    }
  }

  const chartData = Array.from(byTarget.values())
    .sort((a, b) => (b.pchembl_value ?? 0) - (a.pchembl_value ?? 0))
    .slice(0, 12)
    .map((a) => ({
      target_name: a.target_name ?? 'Unknown',
      target_short:
        (a.target_name ?? 'Unknown').length > 22
          ? (a.target_name ?? '').slice(0, 22) + '…'
          : (a.target_name ?? 'Unknown'),
      target_chembl_id: a.target_chembl_id ?? '',
      pchembl_value: a.pchembl_value!,
      best_value: a.standard_value ?? '—',
      best_units: a.standard_units ?? '',
    }));

  const getColor = (val: number) => {
    if (val >= 8) return '#00D4FF';
    if (val >= 7) return '#00AACC';
    if (val >= 6) return '#007A99';
    return '#1A3A52';
  };

  return (
    <div className="activity-chart">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 0, bottom: 80 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />
          <XAxis
            dataKey="target_short"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
            angle={-40}
            textAnchor="end"
            interval={0}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: 'pChEMBL',
              angle: -90,
              position: 'insideLeft',
              fill: 'var(--color-text-secondary)',
              fontSize: 11,
              dx: -4,
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,212,255,0.05)' }} />
          <Bar dataKey="pchembl_value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.pchembl_value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="activity-chart__legend">
        Showing top {chartData.length} targets by pChEMBL value (best per target).
        pChEMBL ≥ 7 = IC50 ≤ 100 nM (potent).
      </p>
    </div>
  );
};

export default ActivityChart;
