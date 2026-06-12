import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/helpers';
import './EmptyState.css';

interface EmptyStateProps {
  /** Pass a lucide-react icon component, e.g. icon={SearchX} */
  icon?: LucideIcon;
  title: string;
  /** Tell the user what to DO, not just that nothing is here */
  message?: string;
  /** Optional action slot — usually a button or link */
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  action,
  className,
}) => {
  return (
    <div className={cn('empty-state', className)}>
      {Icon && (
        <div className="empty-state__icon" aria-hidden="true">
          <Icon size={28} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="empty-state__title">{title}</h3>
      {message && <p className="empty-state__message">{message}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
};

export default EmptyState;
