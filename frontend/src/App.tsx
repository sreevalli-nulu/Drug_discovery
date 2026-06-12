import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Navbar from '@/components/common/Navbar';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

// Lazy-load pages for better initial load time
const HomePage = lazy(() => import('@/pages/HomePage'));
const CompoundPage = lazy(() => import('@/pages/CompoundPage'));
const TargetPage = lazy(() => import('@/pages/TargetPage'));
const DiseasePage = lazy(() => import('@/pages/DiseasePage'));
const SearchResultsPage = lazy(() => import('@/pages/SearchResultsPage'));
const WorkspacePage = lazy(() => import('@/pages/WorkspacePage'));
const ComparisonPage = lazy(() => import('@/pages/ComparisonPage'));
const GlossaryPage = lazy(() => import('@/pages/GlossaryPage'));

function App() {
  return (
    <div className="app">
      <Navbar />
      <Suspense fallback={<LoadingSkeleton />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/compounds/:chemblId" element={<CompoundPage />} />
          <Route path="/targets/:targetId" element={<TargetPage />} />
          <Route path="/diseases/:efoId" element={<DiseasePage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/compare" element={<ComparisonPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
