// ============================================
// Data Formatters
// ============================================

import { PHASE_LABELS } from './constants';

export const formatMolecularWeight = (mw: number | null): string => {
  if (mw === null) return '—';
  return `${mw.toFixed(2)} Da`;
};

export const formatPChEMBL = (value: number | null): string => {
  if (value === null) return '—';
  return value.toFixed(2);
};

export const formatActivityValue = (
  value: number | null,
  units: string | null
): string => {
  if (value === null) return '—';
  const formatted = value < 0.01 ? value.toExponential(2) : value.toFixed(2);
  return units ? `${formatted} ${units}` : formatted;
};

export const formatScore = (score: number | null): string => {
  if (score === null) return '—';
  return score.toFixed(3);
};

export const formatPhase = (phase: number | null): string => {
  if (phase === null) return 'Unknown';
  return PHASE_LABELS[phase] ?? 'Unknown';
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
};

export const formatChemblId = (id: string): string => {
  return id.toUpperCase().startsWith('CHEMBL') ? id.toUpperCase() : `CHEMBL${id}`;
};
