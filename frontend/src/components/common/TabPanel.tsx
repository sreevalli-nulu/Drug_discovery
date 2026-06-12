import React from 'react';
import { cn } from '../../utils/helpers';
import './TabPanel.css';

export interface TabItem {
  id: string;
  label: string;
  /** Optional count chip, e.g. Compounds (12). Pass 0 to show 0; omit to hide. */
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabPanelProps {
  tabs: TabItem[];
  /** id of the currently active tab — the PAGE owns this state */
  activeTab: string;
  onTabChange: (id: string) => void;
  /** Content for the active tab */
  children: React.ReactNode;
  className?: string;
}

const TabPanel: React.FC<TabPanelProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
}) => {
  return (
    <div className={cn('tabpanel', className)}>
      <div className="tabpanel__tabs" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              className={cn('tabpanel__tab', isActive && 'tabpanel__tab--active')}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.icon && <span className="tabpanel__icon">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className="tabpanel__count">{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="tabpanel__content" role="tabpanel">
        {children}
      </div>
    </div>
  );
};

export default TabPanel;
