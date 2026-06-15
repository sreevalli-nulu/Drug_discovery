import { useState } from 'react';
import { Bookmark, Download, FlaskConical, Dna, Activity } from 'lucide-react';
import { TabPanel, EmptyState } from '../components/common';
import WorkspaceCard from '../components/workspace/WorkspaceCard';
import { useWorkspace } from '../hooks/useWorkspace';
import { workspaceService } from '../services';
import type { TabItem } from '../components/common';
import './WorkspacePage.css';

const WorkspacePage = () => {
  const [activeTab, setActiveTab] = useState('compounds');
  const { data: workspace, isLoading } = useWorkspace();

  const compounds = workspace?.compounds ?? [];
  const targets = workspace?.targets ?? [];
  const diseases = workspace?.diseases ?? [];
  const totalCount = workspace?.total_count ?? 0;

  const tabs: TabItem[] = [
    {
      id: 'compounds',
      label: 'Compounds',
      icon: <FlaskConical size={15} />,
      count: isLoading ? undefined : compounds.length,
    },
    {
      id: 'targets',
      label: 'Targets',
      icon: <Dna size={15} />,
      count: isLoading ? undefined : targets.length,
    },
    {
      id: 'diseases',
      label: 'Diseases',
      icon: <Activity size={15} />,
      count: isLoading ? undefined : diseases.length,
    },
  ];

  const handleExport = () => {
    workspaceService.exportCsv();
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="workspace-page__skeletons">
          {[1, 2, 3].map((i) => (
            <div key={i} className="workspace-page__skeleton" />
          ))}
        </div>
      );
    }

    if (totalCount === 0) {
      return (
        <EmptyState
          icon={Bookmark}
          title="Your workspace is empty"
          message="Save compounds, targets, and diseases from their profile pages to track them here. Use the bookmark button on any profile page to add it."
        />
      );
    }

    const items =
      activeTab === 'compounds' ? compounds :
      activeTab === 'targets' ? targets :
      diseases;

    if (items.length === 0) {
      const labels: Record<string, string> = {
        compounds: 'compounds',
        targets: 'targets',
        diseases: 'diseases',
      };
      return (
        <EmptyState
          icon={Bookmark}
          title={`No ${labels[activeTab]} saved`}
          message={`Visit a ${labels[activeTab].slice(0, -1)} profile page and click "Save" to add it here.`}
        />
      );
    }

    return (
      <div className="workspace-page__grid">
        {items.map((entity) => (
          <WorkspaceCard key={entity.id} entity={entity} />
        ))}
      </div>
    );
  };

  return (
    <div className="workspace-page">
      <div className="workspace-page__header">
        <div className="workspace-page__header-left">
          <h1 className="workspace-page__title">
            <Bookmark size={22} />
            My Workspace
          </h1>
          {totalCount > 0 && (
            <span className="workspace-page__count">
              {totalCount} saved {totalCount === 1 ? 'entity' : 'entities'}
            </span>
          )}
        </div>
        {totalCount > 0 && (
          <button
            type="button"
            className="workspace-page__export-btn"
            onClick={handleExport}
            title="Download workspace as CSV"
          >
            <Download size={15} />
            Export CSV
          </button>
        )}
      </div>

      <TabPanel
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {renderTabContent()}
      </TabPanel>
    </div>
  );
};

export default WorkspacePage;
