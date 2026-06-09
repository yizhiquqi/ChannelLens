import { useState } from 'react';
import { BarChart3, LockKeyhole, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/database';

interface Props {
  onAuthenticated: () => void;
  onNavigate: (page: string) => void;
}

const ADMIN_SESSION_KEY = 'channellens_admin_session';

export function hasAdminSession() {
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'ok';
}

export function clearAdminSession() {
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export default function AdminLoginPage({ onAuthenticated, onNavigate }: Props) {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (isSupabaseConfigured && supabase) {
      if (!email || !password) {
        setError('请输入管理员邮箱和密码。');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError('管理员账号或密码不正确。');
        return;
      }

      window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'ok');
      onAuthenticated();
      return;
    }

    if (!adminPassword) {
      setError('线上环境还没有配置管理员密码或 Supabase 登录，请先在 Vercel 环境变量里添加配置。');
      return;
    }

    if (password !== adminPassword) {
      setError('密码不正确。');
      return;
    }

    window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'ok');
    onAuthenticated();
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <BarChart3 size={19} className="text-white" />
          </div>
          <div className="text-left">
            <div className="font-bold text-gray-900 leading-tight">渠鉴</div>
            <div className="text-[10px] text-gray-400 tracking-widest font-medium">ChannelLens</div>
          </div>
        </button>

        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
          <LockKeyhole size={22} className="text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">管理员登录</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          后台审核、入驻申请、证据材料和内部备注仅管理员可见。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSupabaseConfigured && (
            <label className="block">
              <span className="block text-xs font-semibold text-gray-500 mb-1.5">管理员邮箱</span>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入 Supabase 管理员邮箱"
                autoComplete="email"
              />
            </label>
          )}

          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1.5">管理员密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入后台访问密码"
              autoComplete="current-password"
            />
          </label>

          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}

          <button type="submit" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            <ShieldCheck size={16} />
            进入后台
          </button>
        </form>
      </div>
    </div>
  );
}
