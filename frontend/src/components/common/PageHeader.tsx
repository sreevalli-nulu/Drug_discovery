import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import Badge, { BadgeVariant } from './Badge';
import { copyToClipboard, cn } from '../../utils/helpers';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Entity type label shown above the title, e.g. "Compound" */
  badgeLabel?: string;
  badgeVariant?: BadgeVariant;
  /** Mono identifier (CHEMBL941, ENSG…, EFO_…) — click to copy */
  monoId?: string;
  /** Right-side slot — Save to Workspace, Export, etc. */
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badgeLabel,
  badgeVariant = 'neutral',
  monoId,
  actions,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!monoId) return;
    await copyToClipboard(monoId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className={cn('page-header', className)}>
      <div className="page-header__main">
        {(badgeLabel || monoId) && (
          <div className="page-header__meta">
            {badgeLabel && <Badge variant={badgeVariant}>{badgeLabel}</Badge>}
            {monoId && (
              <button
                type="button"
                className="page-header__id"
                onClick={handleCopy}
                title="Copy ID"
              >
                {monoId}
                {copied ? (
                  <Check size={13} className="page-header__id-icon page-header__id-icon--ok" />
                ) : (
                  <Copy size={13} className="page-header__id-icon" />
                )}
              </button>
            )}
          </div>
        )}
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
};

export default PageHeader;
