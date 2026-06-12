import React from 'react';
import { cn } from '../../utils/helpers';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  /** Optional header title (Space Grotesk) */
  title?: string;
  /** Optional small text right of / under the title */
  subtitle?: string;
  /** Optional header right-side slot (buttons, badges) */
  actions?: React.ReactNode;
  /** Lift + cyan border on hover — use for clickable cards */
  hoverable?: boolean;
  onClick?: () => void;
  /** Remove inner padding (e.g. for tables / heatmaps that bleed to edges) */
  flush?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  actions,
  hoverable = false,
  onClick,
  flush = false,
  className,
}) => {
  const clickable = Boolean(onClick);

  return (
    <div
      className={cn(
        'card',
        hoverable && 'card--hoverable',
        clickable && 'card--clickable',
        flush && 'card--flush',
        className
      )}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {(title || actions) && (
        <div className="card__header">
          <div className="card__heading">
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card__actions">{actions}</div>}
        </div>
      )}
      <div className="card__body">{children}</div>
    </div>
  );
};

export default Card;
