import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX, FlaskConical, Dna, Activity } from 'lucide-react';
import { SearchBar, TabPanel, EmptyState } from '../components/common';
import CompoundResultCard from '../components/search/CompoundResults';
import TargetResultCard from '../components/search/TargetResults';
import DiseaseResultCard from '../components/search/DiseaseResults';
import { useUnifiedSearch } from '../hooks/useSearch';
import type { TabItem } from '../components/common';
import './SearchResultsPage.css';

type TabId = 'compounds' | 'targets' | 'diseases';

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const tabParam = (searchParams.get('tab') as TabId) ?? 'compounds';
  const [activeTab, setActiveTab] = useState<TabId>(tabParam);

  console.log('Current query:', query, 'Tab:', tabParam);

  const handleTabChange = (id: string) => {
    const tab = id as TabId;
    setActiveTab(tab);
    setSearchParams({ q: query, tab });
  };

  const handleSearch = (q: string) => {
    setSearchParams({ q, tab: activeTab });
  };

  useEffect(() => {
    setActiveTab(tabParam);
  }, [tabParam]);

  const { data, isLoading, isError } = useUnifiedSearch(query);

  const compounds = data?.compounds ?? [];
  const targets = data?.targets ?? [];
  const diseases = data?.diseases ?? [];

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

  // Auto-switch to first tab with results when data arrives
  useEffect(() => {
    if (!data) return;
    if (activeTab === 'compounds' && compounds.length === 0) {
      if (targets.length > 0) setActiveTab('targets');
      else if (diseases.length > 0) setActiveTab('diseases');
    }
  }, [data]);

  const renderTabContent = () => {
    if (!query) {
      return (
        <EmptyState
          icon={SearchX}
          title="Enter a search term"
          message="Try a drug name like imatinib, a gene like EGFR, or a disease like lung cancer."
        />
      );
    }

    if (isError) {
      return (
        <EmptyState
          icon={SearchX}
          title="Search failed"
          message="Could not connect to the API. Make sure the backend is running at localhost:8000."
        />
      );
    }

    if (isLoading) {
      return (
        <div className="results__skeletons">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="results__skeleton-row" />
          ))}
        </div>
      );
    }

    if (activeTab === 'compounds') {
      if (compounds.length === 0) {
        return (
          <EmptyState
            icon={FlaskConical}
            title="No compounds found"
            message={`No compounds matched "${query}". Try a different name or ChEMBL ID.`}
          />
        );
      }
      return (
        <>
          {compounds.map((c) => (
            <CompoundResultCard key={c.chembl_id} compound={c} />
          ))}
        </>
      );
    }

    if (activeTab === 'targets') {
      if (targets.length === 0) {
        return (
          <EmptyState
            icon={Dna}
            title="No targets found"
            message={`No gene targets matched "${query}". Try a gene symbol like EGFR or BRAF.`}
          />
        );
      }
      return (
        <>
          {targets.map((t) => (
            <TargetResultCard key={t.target_chembl_id} target={t} />
          ))}
        </>
      );
    }

    if (activeTab === 'diseases') {
      if (diseases.length === 0) {
        return (
          <EmptyState
            icon={Activity}
            title="No diseases found"
            message={`No diseases matched "${query}". Try a condition like "lung cancer".`}
          />
        );
      }
      return (
        <>
          {diseases.map((d) => (
            <DiseaseResultCard key={d.efo_id} disease={d} />
          ))}
        </>
      );
    }

    return null;
  };

  return (
    <div className="results-page">
      <div className="results-page__search">
        <SearchBar onSearch={handleSearch} initialValue={query} size="md" />
      </div>

      {query && (
        <p className="results-page__summary">
          {isLoading
            ? 'Searching…'
            : `${data?.counts?.total ?? 0} results for "${query}"`}
        </p>
      )}

      <TabPanel tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange}>
        <div className="results__list">{renderTabContent()}</div>
      </TabPanel>
    </div>
  );
};

export default SearchResultsPage;
