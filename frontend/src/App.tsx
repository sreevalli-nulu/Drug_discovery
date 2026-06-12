import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Navbar from '@/components/common/Navbar';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import ScrollToTop from '@/components/common/ScrollToTop';

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
      <ScrollToTop />
      <Navbar />
      <div className="page-layout">
        <main className="main-content">
          <Suspense fallback={<LoadingSkeleton />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/compound/:chemblId" element={<CompoundPage />} />
              <Route path="/target/:targetId" element={<TargetPage />} />
              <Route path="/disease/:efoId" element={<DiseasePage />} />
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/compare" element={<ComparisonPage />} />
              <Route path="/glossary" element={<GlossaryPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;