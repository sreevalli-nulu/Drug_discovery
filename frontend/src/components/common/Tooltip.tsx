import React from 'react';
import { cn } from '../../utils/helpers';
import './Tooltip.css';

interface TooltipProps {
  /** Text shown inside the tooltip bubble */
  content: string;
  /** Element the tooltip is attached to */
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * Pure CSS tooltip — shows on hover and keyboard focus.
 * Usage: <Tooltip content="Negative log of activity value"><span>pChEMBL</span></Tooltip>
 */
const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className,
}) => {
  return (
    <span className={cn('tooltip', `tooltip--${position}`, className)} tabIndex={0}>
      {children}
      <span className="tooltip__bubble" role="tooltip">
        {content}
      </span>
    </span>
  );
};

export default Tooltip;
