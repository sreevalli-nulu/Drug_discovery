import { useState, useMemo } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { GLOSSARY } from '../utils/constants';
import './GlossaryPage.css';

const GlossaryPage = () => {
  const [query, setQuery] = useState('');

  // Convert Record to array and filter in real time
  const allTerms = useMemo(
    () =>
      Object.entries(GLOSSARY).map(([term, definition]) => ({
        term,
        definition,
      })),
    []
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allTerms;
    const q = query.toLowerCase();
    return allTerms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
    );
  }, [query, allTerms]);

  // Group by first letter for alphabetical dividers
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const letter = item.term[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(item);
    }
    // Sort letters
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const highlightMatch = (text: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="glossary__highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="glossary-page">
      <div className="glossary-page__header">
        <h1 className="glossary-page__title">
          <BookOpen size={22} />
          Drug Discovery Glossary
        </h1>
        <p className="glossary-page__subtitle">
          Plain-English definitions of terms used throughout the dashboard.
        </p>
      </div>

      {/* Search */}
      <div className="glossary-page__search">
        <Search size={16} className="glossary-page__search-icon" />
        <input
          type="text"
          className="glossary-page__search-input"
          placeholder="Search terms or definitions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            type="button"
            className="glossary-page__clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Result count */}
      {query && (
        <p className="glossary-page__count">
          {filtered.length === 0
            ? 'No terms found'
            : `${filtered.length} term${filtered.length === 1 ? '' : 's'} found`}
        </p>
      )}

      {/* Terms */}
      {filtered.length === 0 ? (
        <div className="glossary-page__empty">
          <p>No terms match "<strong>{query}</strong>".</p>
          <button
            type="button"
            className="glossary-page__reset"
            onClick={() => setQuery('')}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="glossary-page__groups">
          {grouped.map(([letter, terms]) => (
            <div key={letter} className="glossary-page__group">
              {/* Only show letter divider if not filtering */}
              {!query && (
                <div className="glossary-page__divider">
                  <span className="glossary-page__letter">{letter}</span>
                  <div className="glossary-page__divider-line" />
                </div>
              )}
              <div className="glossary-page__terms">
                {terms.map(({ term, definition }) => (
                  <div key={term} className="glossary-card">
                    <dt className="glossary-card__term">
                      {highlightMatch(term)}
                    </dt>
                    <dd className="glossary-card__definition">
                      {highlightMatch(definition)}
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlossaryPage;
