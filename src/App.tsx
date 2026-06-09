import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Nav } from './components/ui';
import { CSVDataProvider } from './lib/CSVDataContext';
import { isSupabaseConfigured, supabase } from './lib/database';
import HomePage from './pages/HomePage';
import ChannelListPage from './pages/ChannelListPage';
import ChannelDetailPage from './pages/ChannelDetailPage';
import SubmitReviewPage from './pages/SubmitReviewPage';
import DueDiligenceRequestPage from './pages/DueDiligenceRequestPage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage, { hasAdminSession } from './pages/AdminLoginPage';
import DataCollectorPage from './pages/DataCollectorPage';
import CreatorOnboardingPage from './pages/CreatorOnboardingPage';
import LoginPage from './pages/LoginPage';
import AccountPage from './pages/AccountPage';

type Page = 'home' | 'list' | 'detail' | 'submit' | 'due-diligence' | 'admin' | 'data-collector' | 'creator-onboarding' | 'login' | 'account';

function getInitialPage(): Page {
  if (window.location.pathname === '/admin') return 'admin';
  if (window.location.pathname === '/creator-onboarding') return 'creator-onboarding';
  if (window.location.pathname === '/login') return 'login';
  if (window.location.pathname === '/account') return 'account';
  return window.location.pathname === '/data-collector' ? 'data-collector' : 'home';
}

export default function App() {
  const [page, setPage] = useState<Page>(getInitialPage);
  const [detailId, setDetailId] = useState<string>('');
  const [adminAuthed, setAdminAuthed] = useState(() => hasAdminSession());
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  function handleNavigate(target: string, id?: string) {
    if (target === 'detail' && id) {
      setDetailId(id);
    }
    setPage(target as Page);
    if (target === 'data-collector' || target === 'creator-onboarding' || target === 'admin' || target === 'login' || target === 'account') {
      window.history.pushState({}, '', `/${target}`);
    } else if (['/data-collector', '/creator-onboarding', '/admin', '/login', '/account'].includes(window.location.pathname)) {
      window.history.pushState({}, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    handleNavigate('home');
  }

  return (
    <CSVDataProvider>
      <div className="min-h-screen bg-white">
        <Nav currentPage={page} onNavigate={handleNavigate} userEmail={session?.user.email} onSignOut={handleSignOut} />

        {page === 'home' && <HomePage onNavigate={handleNavigate} />}
        {page === 'list' && <ChannelListPage onNavigate={handleNavigate} />}
        {page === 'detail' && <ChannelDetailPage channelId={detailId} onNavigate={handleNavigate} />}
        {page === 'submit' && (
          isSupabaseConfigured && !session ? (
            <LoginPage onNavigate={handleNavigate} onLoggedIn={() => handleNavigate('submit')} redirectLabel="登录后提交合作反馈" />
          ) : (
            <SubmitReviewPage onNavigate={handleNavigate} user={session?.user} />
          )
        )}
        {page === 'due-diligence' && <DueDiligenceRequestPage onNavigate={handleNavigate} />}
        {page === 'admin' && (
          adminAuthed ? (
            <AdminPage />
          ) : (
            <AdminLoginPage onAuthenticated={() => setAdminAuthed(true)} onNavigate={handleNavigate} />
          )
        )}
        {page === 'data-collector' && <DataCollectorPage />}
        {page === 'creator-onboarding' && (
          isSupabaseConfigured && !session ? (
            <LoginPage onNavigate={handleNavigate} onLoggedIn={() => handleNavigate('creator-onboarding')} redirectLabel="登录后继续入驻" />
          ) : (
            <CreatorOnboardingPage onNavigate={handleNavigate} user={session?.user} />
          )
        )}
        {page === 'login' && (
          session ? (
            <AccountPage user={session.user} onNavigate={handleNavigate} onSignOut={handleSignOut} />
          ) : (
            <LoginPage onNavigate={handleNavigate} onLoggedIn={() => handleNavigate('account')} />
          )
        )}
        {page === 'account' && (
          session ? (
            <AccountPage user={session.user} onNavigate={handleNavigate} onSignOut={handleSignOut} />
          ) : (
            <LoginPage onNavigate={handleNavigate} onLoggedIn={() => handleNavigate('account')} />
          )
        )}
      </div>
    </CSVDataProvider>
  );
}
