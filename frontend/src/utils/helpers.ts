// ============================================
// Helper Utilities
// ============================================

// Debounce for search input
export const debounce = <T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

// Get color based on score value (0-1)
export const getScoreColor = (score: number | null): string => {
  if (score === null) return 'var(--color-text-muted)';
  if (score >= 0.7) return 'var(--color-green)';
  if (score >= 0.4) return 'var(--color-cyan)';
  if (score >= 0.1) return 'var(--color-yellow)';
  return 'var(--color-text-muted)';
};

// Get color for approval phase
export const getPhaseColor = (phase: number | null): string => {
  if (phase === 4) return 'var(--color-green)';
  if (phase === 3) return 'var(--color-cyan)';
  if (phase === 2) return 'var(--color-yellow)';
  if (phase === 1) return 'var(--color-purple-light)';
  return 'var(--color-text-muted)';
};

// Copy text to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

// Build class names conditionally
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
