import React from 'react';
import { cn } from '../../utils/helpers';
import './Badge.css';

/**
 * App-wide color convention:
 *   compound → cyan   | target → green | disease → yellow
 *   ai       → purple | success → green | warning → yellow
 *   neutral  → muted border pill (default)
 */
export type BadgeVariant =
  | 'neutral'
  | 'compound'
  | 'target'
  | 'disease'
  | 'ai'
  | 'success'
  | 'warning';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  /** Render content in JetBrains Mono — use for ChEMBL/Ensembl/EFO IDs */
  mono?: boolean;
  /** Small leading dot, useful for status badges */
  dot?: boolean;
  className?: string;
  title?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  mono = false,
  dot = false,
  className,
  title,
}) => {
  return (
    <span
      className={cn('badge', `badge--${variant}`, mono && 'badge--mono', className)}
      title={title}
    >
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
};

export default Badge;
