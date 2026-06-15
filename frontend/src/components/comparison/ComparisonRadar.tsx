import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { CompoundComparisonData, RadarDataPoint } from '../../types';
import './ComparisonRadar.css';

interface ComparisonRadarProps {
  data: RadarDataPoint[];
  compounds: CompoundComparisonData[];
}

const COLORS = ['#00D4FF', '#7B2FBE', '#1ED760', '#FFB800'];

const ComparisonRadar: React.FC<ComparisonRadarProps> = ({ data, compounds }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="comparison-radar">
      <ResponsiveContainer width="100%" height={380}>
        <RadarChart data={data} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="property"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }}
            tickCount={4}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              color: 'var(--color-text-primary)',
            }}
            formatter={(value: number) => [`${value.toFixed(1)}`, '']}
          />
          {compounds.map((c, i) => (
            <Radar
              key={c.chembl_id}
              name={c.name || c.chembl_id}
              dataKey={c.name || c.chembl_id}
              stroke={COLORS[i]}
              fill={COLORS[i]}
              fillOpacity={0.12}
              strokeWidth={2}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: '0.82rem', fontFamily: 'var(--font-display)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="comparison-radar__note">
        Values normalised to 0–100 scale. MW max=1000 Da, LogP max=10,
        HBD max=10, HBA max=15, TPSA max=200 Å².
      </p>
    </div>
  );
};

export default ComparisonRadar;
