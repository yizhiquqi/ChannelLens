import { useState } from 'react';
import { BarChart3, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/database';

interface Props {
  onNavigate: (page: string) => void;
  onLoggedIn: () => void;
  redirectLabel?: string;
}

export default function LoginPage({ onNavigate, onLoggedIn, redirectLabel = '继续操作' }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');

    if (!isSupabaseConfigured || !supabase) {
      setMessage('登录服务还没有配置完成，请联系平台管理员。');
      return;
    }

    if (!email || !password) {
      setMessage('请输入邮箱和密码。');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setMessage('账号或密码不正确，或该账号尚未通过平台邀请。');
      return;
    }

    onLoggedIn();
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
        <h1 className="text-xl font-bold text-gray-900 mb-2">受邀账号登录</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          请使用平台分配的邮箱账号登录。登录后可以填写入驻资料，并查看审核状态。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1.5">邮箱</span>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setMessage('');
                }}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入邀请邮箱"
                autoComplete="email"
              />
            </div>
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1.5">密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setMessage('');
              }}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入密码"
              autoComplete="current-password"
            />
          </label>

          {message && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{message}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            <ShieldCheck size={16} />
            {loading ? '登录中...' : redirectLabel}
          </button>
        </form>

        <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            暂不开放公开注册。没有账号的合作方，请联系平台获取邀请账号。
          </p>
        </div>
      </div>
    </div>
  );
}
