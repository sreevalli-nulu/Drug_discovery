import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { SearchBar } from '../components/common';
import MoleculeBackground from '../components/common/MoleculeBackground';
import SearchChip from '../components/search/SearchChip';
import { useTrendingSearches } from '../hooks/useSearch';
import { EXAMPLE_SEARCHES } from '../utils/constants';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useTrendingSearches(10);

  // Page owns navigation — components stay dumb
  const goToSearch = (query: string) => {
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  // Defensive: handle both { trending: [...] } and a bare array
  const rawTrending = Array.isArray(data) ? data : data?.trending ?? [];

  // Drop malformed terms left over from raw API testing (e.g. "compounds?q=imatinib")
  const trending = rawTrending
    .filter((t) => t?.term && !t.term.includes('?') && !t.term.includes('/'))
    .slice(0, 6);

  const showTrending = !isLoading && trending.length > 0;

  return (
    <div className="home">
      <section className="home__hero">
        <MoleculeBackground />

        <div className="home__hero-content">
          <h1 className="home__title">
            Make sense of <span className="home__title-accent">drug discovery</span> data
          </h1>
          <p className="home__subtitle">
            Search compounds, gene targets, and diseases. See bioactivity, molecular
            structures, and AI explanations in plain English.
          </p>

          <div className="home__search">
            <SearchBar onSearch={goToSearch} size="lg" autoFocus />
          </div>

          {/* Example searches — always present, gives first-timers a starting point */}
          <div className="home__chips">
            <span className="home__chips-label">Try:</span>
            {EXAMPLE_SEARCHES.map((ex) => (
              <SearchChip
                key={ex.label}
                label={ex.label}
                type={ex.type}
                onClick={goToSearch}
              />
            ))}
          </div>

          {/* Live trending — hides itself while loading or if empty */}
          {showTrending && (
            <div className="home__trending">
              <span className="home__chips-label">
                <TrendingUp size={14} /> Trending this week
              </span>
              <div className="home__chips home__chips--inline">
                {trending.map((t, i) => (
                  <SearchChip
                    key={`${t.term}-${i}`}
                    label={t.term}
                    type={t.type}
                    count={t.count}
                    onClick={goToSearch}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
