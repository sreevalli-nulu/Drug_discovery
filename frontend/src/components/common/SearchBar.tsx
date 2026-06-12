import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/helpers';
import './SearchBar.css';

interface SearchBarProps {
  /** Called with the trimmed query when the user presses Enter or clicks search */
  onSearch: (query: string) => void;
  placeholder?: string;
  /** lg = Home hero, md = Navbar / results page */
  size?: 'md' | 'lg';
  /** Pre-fill (e.g. from URL ?q= on the results page) */
  initialValue?: string;
  autoFocus?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search compounds, targets, or diseases…',
  size = 'md',
  initialValue = '',
  autoFocus = false,
  className,
}) => {
  const [value, setValue] = useState(initialValue);

  const submit = () => {
    const q = value.trim();
    if (q.length > 0) onSearch(q);
  };

  return (
    <div className={cn('searchbar', `searchbar--${size}`, className)}>
      <Search className="searchbar__icon" aria-hidden="true" />
      <input
        type="text"
        className="searchbar__input"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') setValue('');
        }}
        aria-label="Search"
      />
      {value && (
        <button
          type="button"
          className="searchbar__clear"
          onClick={() => setValue('')}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
      <button type="button" className="searchbar__submit" onClick={submit}>
        Search
      </button>
    </div>
  );
};

export default SearchBar;
