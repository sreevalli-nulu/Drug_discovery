import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Search, Beaker, BookMarked, GitCompare, HelpCircle } from 'lucide-react';

const Navbar = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 'var(--navbar-height)',
      backgroundColor: 'var(--color-bg-card)',
      borderBottom: '1px solid var(--color-border)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      padding: '0 var(--space-6)',
      gap: 'var(--space-6)',
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none' }}>
        <Beaker size={22} color="var(--color-cyan)" />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text-primary)' }}>
          DrugDiscovery
        </span>
      </Link>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '480px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search compounds, targets, diseases..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: 'var(--color-bg-input)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
            }}
          />
        </div>
      </form>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginLeft: 'auto' }}>
        <NavLink to="/workspace" icon={<BookMarked size={16} />} label="Workspace" />
        <NavLink to="/compare" icon={<GitCompare size={16} />} label="Compare" />
        <NavLink to="/glossary" icon={<HelpCircle size={16} />} label="Glossary" />
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) => (
  <Link to={to} style={{
    display: 'flex', alignItems: 'center', gap: '6px',
    color: 'var(--color-text-secondary)', textDecoration: 'none',
    fontSize: 'var(--text-sm)', fontWeight: 500,
    transition: 'color var(--transition-fast)',
  }}
  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
  >
    {icon}
    {label}
  </Link>
);

export default Navbar;
