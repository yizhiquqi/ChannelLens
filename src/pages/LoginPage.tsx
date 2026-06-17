import { useState, type FormEvent, type ReactNode } from 'react';
import { BarChart3, CheckCircle2, LockKeyhole, Mail, Send, ShieldCheck, UserPlus } from 'lucide-react';
import { insertRegistrationRequest, isSupabaseConfigured, supabase } from '../lib/database';

interface Props {
  onNavigate: (page: string) => void;
  onLoggedIn: () => void;
  redirectLabel?: string;
}

type RequestForm = {
  name: string;
  email: string;
  contact: string;
  applicantType: string;
  organization: string;
  intent: string;
  note: string;
};

const initialRequestForm: RequestForm = {
  name: '',
  email: '',
  contact: '',
  applicantType: '达人',
  organization: '',
  intent: '合作商入驻',
  note: '',
};

const applicantTypes = ['达人', 'MCN', '品牌方', '合作商', '其他'];
const intentOptions = ['合作商入驻', '提交合作反馈', '申请尽调报告', '其他'];
const REQUEST_STORAGE_KEY = 'channellens_registration_requests';

export default function LoginPage({ onNavigate, onLoggedIn, redirectLabel = '继续操作' }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState<RequestForm>(initialRequestForm);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
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

  async function submitRegistrationRequest(event: FormEvent) {
    event.preventDefault();
    setRequestMessage('');
    setRequestError('');

    if (!requestForm.name.trim() || !requestForm.email.trim() || !requestForm.contact.trim()) {
      setRequestError('请填写姓名、邮箱和联系方式，方便我们审批后联系你。');
      return;
    }

    setRequestLoading(true);
    const payload = {
      ...requestForm,
      name: requestForm.name.trim(),
      email: requestForm.email.trim(),
      contact: requestForm.contact.trim(),
      organization: requestForm.organization.trim(),
      note: requestForm.note.trim(),
      status: 'pending',
      source: 'login_registration_request',
      submittedAt: new Date().toISOString(),
    };

    try {
      const saved = await insertRegistrationRequest(payload);
      if (saved.storage === 'local') {
        const existing = JSON.parse(window.localStorage.getItem(REQUEST_STORAGE_KEY) || '[]');
        window.localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify([saved, ...existing]));
      }
      setRequestForm(initialRequestForm);
      setRequestMessage('已收到注册申请，我们会尽快审批，并通过邮箱或联系方式通知你。');
      setShowRequestForm(false);
    } catch {
      setRequestError('提交失败，请稍后重试，或直接联系平台管理员。');
    } finally {
      setRequestLoading(false);
    }
  }

  function updateRequestForm<K extends keyof RequestForm>(key: K, value: RequestForm[K]) {
    setRequestForm((prev) => ({ ...prev, [key]: value }));
    setRequestError('');
    setRequestMessage('');
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <BarChart3 size={19} className="text-white" />
          </div>
          <div className="text-left">
            <div className="font-bold text-gray-900 leading-tight">渠评</div>
            <div className="text-[10px] text-gray-400 tracking-widest font-medium">Quping</div>
          </div>
        </button>

        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
          <LockKeyhole size={22} className="text-blue-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">受邀账号登录</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          请使用平台分配的邮箱账号登录。登录后可以填写入驻资料、提交合作反馈，并查看审核状态。
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
            暂不开放自由注册。没有账号的合作方，可以先提交注册申请，平台审批后会分配登录账号。
          </p>
          <button
            type="button"
            onClick={() => {
              setShowRequestForm((prev) => !prev);
              setRequestError('');
              setRequestMessage('');
            }}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            <UserPlus size={15} />
            {showRequestForm ? '收起申请表' : '申请注册账号'}
          </button>
        </div>

        {requestMessage && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <span>{requestMessage}</span>
          </div>
        )}

        {showRequestForm && (
          <form onSubmit={submitRegistrationRequest} className="mt-5 space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">注册申请</h2>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                填写后我们会尽快审批。通过后会用你留下的邮箱或联系方式通知账号信息。
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Field label="申请人姓名" required>
                <input
                  value={requestForm.name}
                  onChange={(event) => updateRequestForm('name', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入姓名"
                />
              </Field>

              <Field label="邮箱" required>
                <input
                  type="email"
                  value={requestForm.email}
                  onChange={(event) => updateRequestForm('email', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="用于接收审批结果"
                />
              </Field>

              <Field label="手机 / 微信" required>
                <input
                  value={requestForm.contact}
                  onChange={(event) => updateRequestForm('contact', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="方便管理员联系"
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="身份类型">
                  <select
                    value={requestForm.applicantType}
                    onChange={(event) => updateRequestForm('applicantType', event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {applicantTypes.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>

                <Field label="申请用途">
                  <select
                    value={requestForm.intent}
                    onChange={(event) => updateRequestForm('intent', event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {intentOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="公司 / 机构 / 账号名称">
                <input
                  value={requestForm.organization}
                  onChange={(event) => updateRequestForm('organization', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：品牌方公司、MCN 或达人账号"
                />
              </Field>

              <Field label="补充说明">
                <textarea
                  value={requestForm.note}
                  onChange={(event) => updateRequestForm('note', event.target.value)}
                  className="min-h-24 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="可以简单说明你想入驻、反馈或申请尽调的原因"
                />
              </Field>
            </div>

            {requestError && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{requestError}</div>}

            <button
              type="submit"
              disabled={requestLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
            >
              <Send size={15} />
              {requestLoading ? '提交中...' : '提交注册申请'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-500">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
