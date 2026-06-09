import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { CheckCircle, Clock, FileText, LogOut, UserRound } from 'lucide-react';
import { fetchCreatorProfiles, isSupabaseConfigured } from '../lib/database';

interface Props {
  user: User;
  onNavigate: (page: string) => void;
  onSignOut: () => void;
}

type Profile = Record<string, unknown> & {
  id?: string;
  userId?: string;
  userEmail?: string;
  partnerRole?: string;
  creatorName?: string;
  mcnName?: string;
  brandName?: string;
  companyName?: string;
  status?: string;
  completion?: number;
  completionStage?: string;
  reviewReason?: string;
  submittedAt?: string;
};

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  verified: { label: '已通过', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  needs_info: { label: '要求补充', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  rejected: { label: '已驳回', className: 'bg-gray-50 text-gray-500 border-gray-100' },
  disputed: { label: '争议核验', className: 'bg-red-50 text-red-700 border-red-100' },
};

function profileName(profile: Profile) {
  return profile.creatorName || profile.mcnName || profile.brandName || profile.companyName || '未命名入驻资料';
}

export default function AccountPage({ user, onNavigate, onSignOut }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadProfiles() {
      if (!isSupabaseConfigured) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      try {
        const allProfiles = await fetchCreatorProfiles<Profile>();
        if (cancelled) return;
        setProfiles(
          allProfiles.filter((profile) => profile.userId === user.id || profile.userEmail === user.email)
        );
      } catch {
        if (!cancelled) setMessage('暂时无法读取你的入驻资料，请稍后刷新。');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfiles();
    return () => {
      cancelled = true;
    };
  }, [user.email, user.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
              <UserRound size={22} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">我的账号</h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <LogOut size={15} />
            退出登录
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-1">入驻资料</h2>
              <p className="text-sm text-gray-500">你提交的资料会在这里显示审核进度和补充说明。</p>
            </div>
            <button
              onClick={() => onNavigate('creator-onboarding')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
            >
              填写/再次提交
            </button>
          </div>
        </div>

        {message && <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{message}</div>}

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-500">正在读取资料...</div>
        ) : profiles.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <FileText size={28} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700 mb-1">还没有入驻资料</p>
            <p className="text-xs text-gray-400 mb-5">提交后，审核状态会同步到这里。</p>
            <button
              onClick={() => onNavigate('creator-onboarding')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
            >
              去填写入驻资料
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {profiles.map((profile) => {
              const status = String(profile.status || 'pending');
              const meta = statusLabels[status] || statusLabels.pending;
              return (
                <div key={profile.id || String(profile.submittedAt)} className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <div className="text-sm font-bold text-gray-900">{String(profileName(profile))}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {String(profile.partnerRole || '合作商')} / 完整度 {Number(profile.completion || 0)}%
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border w-fit ${meta.className}`}>
                      {status === 'verified' ? <CheckCircle size={13} /> : <Clock size={13} />}
                      {meta.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    {profile.reviewReason ? String(profile.reviewReason) : String(profile.completionStage || '平台会尽快审核你的资料。')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
