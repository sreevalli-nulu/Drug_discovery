import React from 'react';
import { cn } from '../../utils/helpers';
import './SearchChip.css';

type ChipType = 'compound' | 'target' | 'disease' | 'unified' | string;

interface SearchChipProps {
  /** Visible text — also used as the search query */
  label: string;
  /** Drives the accent color; unknown types fall back to neutral */
  type?: ChipType;
  /** Optional small trailing number (used for trending counts) */
  count?: number;
  onClick: (query: string) => void;
}

const SearchChip: React.FC<SearchChipProps> = ({ label, type, count, onClick }) => {
  // Only compound/target/disease get accent colors; anything else is neutral
  const variant =
    type === 'compound' || type === 'target' || type === 'disease'
      ? type
      : 'neutral';

  return (
    <button
      type="button"
      className={cn('search-chip', `search-chip--${variant}`)}
      onClick={() => onClick(label)}
    >
      <span className="search-chip__label">{label}</span>
      {count !== undefined && count > 1 && (
        <span className="search-chip__count">{count}</span>
      )}
    </button>
  );
};

export default SearchChip;
