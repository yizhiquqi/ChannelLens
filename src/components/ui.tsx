import { useState } from 'react';
import { Search, BarChart3, Menu, X } from 'lucide-react';

interface NavProps {
  currentPage: string;
  onNavigate: (page: string, id?: string) => void;
  userEmail?: string;
  onSignOut?: () => void;
}

export function Nav({ currentPage, onNavigate, userEmail, onSignOut }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { key: 'home', label: '首页' },
    { key: 'list', label: '合作方数据库' },
    { key: 'creator-onboarding', label: '合作商入驻' },
    { key: 'submit', label: '提交合作反馈' },
    { key: 'due-diligence', label: '申请尽调报告' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-gray-900 text-[15px] tracking-tight">渠评</span>
              <span className="text-[10px] text-gray-400 tracking-widest font-medium -mt-0.5">Quping</span>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <button
                key={link.key}
                onClick={() => onNavigate(link.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === link.key
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => onNavigate('list')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Search size={14} />
              搜索
            </button>
            <button
              onClick={() => onNavigate(userEmail ? 'account' : 'login')}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors max-w-[180px] truncate"
            >
              {userEmail ? userEmail : '登录'}
            </button>
            <button
              onClick={() => onNavigate('creator-onboarding')}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              合作商入驻
            </button>
          </div>

          <button className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-50" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {links.map((link) => (
            <button
              key={link.key}
              onClick={() => {
                onNavigate(link.key);
                setMobileOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                currentPage === link.key ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={() => {
              onNavigate(userEmail ? 'account' : 'login');
              setMobileOpen(false);
            }}
            className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
              currentPage === 'login' || currentPage === 'account' ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {userEmail ? `我的账号：${userEmail}` : '登录'}
          </button>
          {userEmail && onSignOut && (
            <button
              onClick={() => {
                onSignOut();
                setMobileOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              退出登录
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

export function Badge({ children, variant = 'gray', size = 'sm' }: { children: React.ReactNode; variant?: string; size?: string }) {
  const variants: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    yellow: 'bg-amber-50 text-amber-700 border-amber-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-100',
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
  };

  const sizes: Record<string, string> = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center border rounded-md font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

export function ScoreBar({ label, score, max = 10 }: { label: string; score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color = score >= 8 ? 'bg-emerald-500' : score >= 6 ? 'bg-blue-500' : score >= 4 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-800 w-8 text-right">{score.toFixed(1)}</span>
    </div>
  );
}

export function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < score ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function AdaptationIndexBadge({ index }: { index: number }) {
  const color =
    index >= 80
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : index >= 60
        ? 'text-blue-600 bg-blue-50 border-blue-200'
        : index >= 40
          ? 'text-amber-600 bg-amber-50 border-amber-200'
          : 'text-red-600 bg-red-50 border-red-200';

  const label = index >= 80 ? '高度适配' : index >= 60 ? '适度适配' : index >= 40 ? '谨慎评估' : '风险较高';

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg ${color}`}>
      <span className="text-lg font-bold leading-none">{index}</span>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] font-medium opacity-70">适配指数</span>
        <span className="text-xs font-semibold">{label}</span>
      </div>
    </div>
  );
}

export function VerificationBadge({ status }: { status: string }) {
  if (status === '已核验') return <Badge variant="green">已核验</Badge>;
  if (status === '部分核验') return <Badge variant="yellow">部分核验</Badge>;
  return <Badge variant="gray">未核验</Badge>;
}

export function RiskTagBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-100 text-xs px-2 py-0.5 rounded-md font-medium">
      <span className="w-1 h-1 rounded-full bg-red-500 inline-block" />
      {tag}
    </span>
  );
}
