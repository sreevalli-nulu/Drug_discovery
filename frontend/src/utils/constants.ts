// ============================================
// App Constants
// ============================================

export const APP_NAME = 'Drug Discovery Dashboard';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Approval phase labels
export const PHASE_LABELS: Record<number, string> = {
  4: 'Approved',
  3: 'Phase 3',
  2: 'Phase 2',
  1: 'Phase 1',
  0: 'Preclinical',
};

// Approval phase colors
export const PHASE_COLORS: Record<number, string> = {
  4: 'var(--color-green)',
  3: 'var(--color-cyan)',
  2: 'var(--color-yellow)',
  1: 'var(--color-purple-light)',
  0: 'var(--color-text-muted)',
};

// Evidence type labels for heatmap
export const EVIDENCE_LABELS: Record<string, string> = {
  genetic: 'Genetic Association',
  somatic: 'Somatic Mutation',
  drug: 'Known Drug',
  pathway: 'Affected Pathway',
  text_mining: 'Literature',
};

// Radar chart colors for comparison
export const COMPARISON_COLORS = [
  '#00D4FF',
  '#7B2FBE',
  '#1ED760',
  '#FFB800',
];

// Quick example searches for home page
export const EXAMPLE_SEARCHES = [
  { label: 'Imatinib', type: 'compound' as const },
  { label: 'EGFR', type: 'target' as const },
  { label: 'Lung Cancer', type: 'disease' as const },
  { label: 'Dasatinib', type: 'compound' as const },
  { label: 'BRAF', type: 'target' as const },
];

// Glossary terms for tooltips
export const GLOSSARY: Record<string, string> = {
  IC50: 'The concentration of a drug required to inhibit 50% of a biological process. Lower values indicate stronger potency.',
  Ki: 'Inhibition constant — the affinity of a drug for its target. Lower Ki = higher affinity.',
  EC50: 'The concentration producing 50% of the maximum response in a functional assay.',
  pChEMBL: 'The negative log10 of the molar activity value — higher is more potent (e.g. pChEMBL 7 = IC50 100nM).',
  LogP: 'Measure of lipophilicity — how much a compound prefers oil over water. Affects membrane permeability.',
  TPSA: 'Topological Polar Surface Area — predicts intestinal absorption and blood-brain barrier penetration.',
  HBD: 'Hydrogen Bond Donors — NH and OH groups. Lipinski Rule of 5 limit: ≤5.',
  HBA: 'Hydrogen Bond Acceptors — N and O atoms. Lipinski Rule of 5 limit: ≤10.',
  'Rule of 5': "Lipinski's Rule of 5 predicts oral bioavailability: MW ≤500, LogP ≤5, HBD ≤5, HBA ≤10.",
  EFO: 'Experimental Factor Ontology — standardised disease classification system used by Open Targets.',
  'Open Targets': 'A public-private partnership providing gene-disease association data with evidence scoring.',
};
