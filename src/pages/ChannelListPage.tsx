import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X, MapPin, ChevronRight, Shield, CheckCircle, AlertTriangle, Loader2, AlertCircle, Database } from 'lucide-react';
import { useCSVData } from '../lib/CSVDataContext';
import { getPublicDataSourceLabel } from '../lib/displaySources';
import type { Partner } from '../types';

const ENTITY_TYPE_OPTIONS = [
  { id: 'company', label: '公司' },
  { id: 'person', label: '个人' },
  { id: 'team', label: '团队' },
];
const PRICE_RANGES = ['100以下', '100-500', '100-1000', '1万以下', '1万-5万', '5万-20万', '20万以上'];
const RISK_LEVEL_OPTIONS = [
  { id: 'low', label: '低风险' },
  { id: 'medium', label: '中风险' },
  { id: 'high', label: '高风险' },
];
const VERIFICATION_OPTIONS = [
  { id: '未核验', label: '未核验' },
  { id: '部分核验', label: '部分核验' },
  { id: '已核验', label: '已核验' },
];

interface Filters {
  search: string;
  entityType: string;
  partnerType: string;
  platform: string;
  category: string;
  verificationStatus: string;
  riskLevel: string;
  hasVerifiedReview: boolean;
}

const VERIFICATION_STYLES: Record<string, string> = {
  '已核验': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '部分核验': 'bg-amber-50 text-amber-700 border-amber-200',
  '未核验': 'bg-gray-100 text-gray-500 border-gray-200',
};
const RISK_STYLES: Record<string, string> = {
  high: 'bg-red-50 text-red-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-emerald-50 text-emerald-700',
};
const RISK_LABELS: Record<string, string> = { high: '高风险', medium: '中风险', low: '低风险' };

function ScoreBadge({ score }: { score: number }) {
  if (!score) return <span className="text-xs text-gray-400">暂无评分</span>;
  const color = score >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : score >= 60 ? 'text-blue-600 bg-blue-50 border-blue-200'
    : score >= 40 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200';
  const label = score >= 80 ? '高度适配' : score >= 60 ? '适度适配' : score >= 40 ? '谨慎评估' : '风险较高';
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg ${color}`}>
      <span className="text-base font-bold leading-none">{score}</span>
      <div className="flex flex-col leading-tight">
        <span className="text-[9px] font-medium opacity-60">适配指数</span>
        <span className="text-[10px] font-semibold">{label}</span>
      </div>
    </div>
  );
}

function PartnerCard({ partner, verifiedReviewCount, onNavigate }: {
  partner: Partner;
  verifiedReviewCount: number;
  onNavigate: (page: string, id?: string) => void;
}) {
  const dataSource = getPublicDataSourceLabel(partner.dataSource);

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onNavigate('detail', partner.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors truncate">
              {partner.displayName}
            </h3>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${VERIFICATION_STYLES[partner.verificationStatus] ?? VERIFICATION_STYLES['未核验']}`}>
              {partner.verificationStatus}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            {partner.city && (
              <span className="flex items-center gap-0.5">
                <MapPin size={11} />
                {partner.city}
              </span>
            )}
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
              {partner.entityType === 'person' ? '个人' : partner.entityType === 'team' ? '团队' : '公司'}
            </span>
            {partner.partnerType.slice(0, 2).map((t) => (
              <span key={t} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">{t}</span>
            ))}
          </div>
        </div>
        <ScoreBadge score={partner.scores.overall} />
      </div>

      {/* Platforms */}
      {partner.platforms.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {partner.platforms.slice(0, 4).map((p) => (
            <span key={p} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{p}</span>
          ))}
        </div>
      )}

      {/* Categories */}
      {partner.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {partner.categories.slice(0, 3).map((c) => (
            <span key={c} className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded">{c}</span>
          ))}
          {partner.categories.length > 3 && (
            <span className="text-[10px] px-1.5 py-0.5 text-gray-400">+{partner.categories.length - 3}</span>
          )}
        </div>
      )}

      {/* Risk tags */}
      {partner.riskTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {partner.riskTags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded flex items-center gap-0.5">
              <span className="w-1 h-1 bg-red-400 rounded-full" />
              {tag}
            </span>
          ))}
          {partner.riskTags.length > 2 && (
            <span className="text-[10px] text-red-500">+{partner.riskTags.length - 2}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${RISK_STYLES[partner.riskLevel] ?? RISK_STYLES.low}`}>
            <Shield size={10} />
            {RISK_LABELS[partner.riskLevel] ?? '低风险'}
          </span>
          {verifiedReviewCount > 0 ? (
            <span className="flex items-center gap-0.5 text-emerald-600">
              <CheckCircle size={10} />
              {verifiedReviewCount} 条已验证反馈
            </span>
          ) : (
            <span className="text-gray-400">暂无已验证反馈</span>
          )}
        </div>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
      </div>

      {/* Data source */}
      {dataSource && (
        <div className="mt-2 text-[10px] text-gray-400">
          数据来源：{dataSource} · {partner.updatedAt}
        </div>
      )}
    </div>
  );
}

export default function PartnerListPage({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { partners, reviews, loading, error } = useCSVData();
  const [filters, setFilters] = useState<Filters>({
    search: '',
    entityType: '',
    partnerType: '',
    platform: '',
    category: '',
    verificationStatus: '',
    riskLevel: '',
    hasVerifiedReview: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  const partnerTypes = useMemo(
    () => Array.from(new Set(partners.flatMap((p) => p.partnerType))).filter(Boolean).sort(),
    [partners]
  );
  const platforms = useMemo(
    () => Array.from(new Set(partners.flatMap((p) => p.platforms))).filter(Boolean).sort(),
    [partners]
  );
  const categories = useMemo(
    () => Array.from(new Set(partners.flatMap((p) => p.categories))).filter(Boolean).sort(),
    [partners]
  );

  const verifiedCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of reviews) {
      if (r.reviewStatus === 'verified') {
        map[r.partnerId] = (map[r.partnerId] ?? 0) + 1;
      }
    }
    return map;
  }, [reviews]);

  const filtered = useMemo(() => {
    const q = filters.search.toLowerCase();
    return partners.filter((p) => {
      if (q) {
        const haystack = [p.displayName, p.legalEntity ?? '', ...p.partnerType, ...p.categories].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.entityType && p.entityType !== filters.entityType) return false;
      if (filters.partnerType && !p.partnerType.includes(filters.partnerType)) return false;
      if (filters.platform && !p.platforms.includes(filters.platform)) return false;
      if (filters.category && !p.categories.includes(filters.category)) return false;
      if (filters.verificationStatus && p.verificationStatus !== filters.verificationStatus) return false;
      if (filters.riskLevel && p.riskLevel !== filters.riskLevel) return false;
      if (filters.hasVerifiedReview && !(verifiedCountMap[p.id] > 0)) return false;
      return true;
    });
  }, [partners, filters, verifiedCountMap]);

  const hasFilters = filters.search !== '' || Object.entries(filters)
    .filter(([k]) => k !== 'search')
    .some(([, v]) => v !== '' && v !== false);

  function clearFilters() {
    setFilters({ search: '', entityType: '', partnerType: '', platform: '', category: '', verificationStatus: '', riskLevel: '', hasVerifiedReview: false });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">正在加载合作方档案...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <AlertCircle size={32} className="text-red-400" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900">合作方数据库</h1>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Database size={11} />
                收录 {partners.length} 个合作方档案 · MVP 测试数据
              </p>
            </div>
            <button
              onClick={() => onNavigate('submit')}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              提交合作反馈
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索合作方名称、公司、类别、品类..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                showFilters || hasFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal size={14} />
              筛选
              {hasFilters && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">主体类型</label>
                  <select value={filters.entityType} onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">全部</option>
                    {ENTITY_TYPE_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">合作方类型</label>
                  <select value={filters.partnerType} onChange={(e) => setFilters({ ...filters, partnerType: e.target.value })}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">全部</option>
                    {partnerTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">平台</label>
                  <select value={filters.platform} onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">全部</option>
                    {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">擅长品类</label>
                  <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">全部</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">核验状态</label>
                  <select value={filters.verificationStatus} onChange={(e) => setFilters({ ...filters, verificationStatus: e.target.value })}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">全部</option>
                    {VERIFICATION_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">风险等级</label>
                  <select value={filters.riskLevel} onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                    className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">全部</option>
                    {RISK_LEVEL_OPTIONS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasVerifiedReview}
                    onChange={(e) => setFilters({ ...filters, hasVerifiedReview: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-600 font-medium">仅显示有已验证反馈的合作方</span>
                </label>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                    <X size={11} />清除筛选
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <AlertTriangle size={36} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-gray-500 font-semibold mb-1">未找到匹配的合作方档案</h3>
            <p className="text-gray-400 text-sm">尝试调整搜索关键词或筛选条件</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">
              共找到 <span className="font-semibold text-gray-700">{filtered.length}</span> 个合作方档案
              {filters.hasVerifiedReview && ' · 仅含已验证反馈'}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  partner={partner}
                  verifiedReviewCount={verifiedCountMap[partner.id] ?? 0}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
