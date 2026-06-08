import { useState } from 'react';
import { Nav } from './components/ui';
import { CSVDataProvider } from './lib/CSVDataContext';
import HomePage from './pages/HomePage';
import ChannelListPage from './pages/ChannelListPage';
import ChannelDetailPage from './pages/ChannelDetailPage';
import SubmitReviewPage from './pages/SubmitReviewPage';
import DueDiligenceRequestPage from './pages/DueDiligenceRequestPage';
import AdminPage from './pages/AdminPage';
import DataCollectorPage from './pages/DataCollectorPage';
import CreatorOnboardingPage from './pages/CreatorOnboardingPage';

type Page = 'home' | 'list' | 'detail' | 'submit' | 'due-diligence' | 'admin' | 'data-collector' | 'creator-onboarding';

function getInitialPage(): Page {
  if (window.location.pathname === '/admin') return 'admin';
  if (window.location.pathname === '/creator-onboarding') return 'creator-onboarding';
  return window.location.pathname === '/data-collector' ? 'data-collector' : 'home';
}

export default function App() {
  const [page, setPage] = useState<Page>(getInitialPage);
  const [detailId, setDetailId] = useState<string>('');

  function handleNavigate(target: string, id?: string) {
    if (target === 'detail' && id) {
      setDetailId(id);
    }
    setPage(target as Page);
    if (target === 'data-collector' || target === 'creator-onboarding' || target === 'admin') {
      window.history.pushState({}, '', `/${target}`);
    } else if (['/data-collector', '/creator-onboarding', '/admin'].includes(window.location.pathname)) {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <CSVDataProvider>
      <div className="min-h-screen bg-white">
        <Nav currentPage={page} onNavigate={handleNavigate} />

        {page === 'home' && <HomePage onNavigate={handleNavigate} />}
        {page === 'list' && <ChannelListPage onNavigate={handleNavigate} />}
        {page === 'detail' && <ChannelDetailPage channelId={detailId} onNavigate={handleNavigate} />}
        {page === 'submit' && <SubmitReviewPage onNavigate={handleNavigate} />}
        {page === 'due-diligence' && <DueDiligenceRequestPage onNavigate={handleNavigate} />}
        {page === 'admin' && <AdminPage />}
        {page === 'data-collector' && <DataCollectorPage />}
        {page === 'creator-onboarding' && <CreatorOnboardingPage onNavigate={handleNavigate} />}
      </div>
    </CSVDataProvider>
  );
}
