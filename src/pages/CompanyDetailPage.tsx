import { useEffect, useMemo } from 'react';
import {
  ArrowLeft, Building2, CalendarDays, CheckCircle2, FileText, Link2, Loader2,
  MapPin, MessageSquareText, Star, Users, AlertCircle,
} from 'lucide-react';
import { useCSVData } from '../lib/CSVDataContext';
import { findCompanyProfile, getAllCompanyProfiles } from '../lib/companyPages';

interface Props {
  slug: string;
  onNavigate: (page: string, id?: string) => void;
}

function setMetaDescription(content: string) {
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'description');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-900 leading-relaxed">{value || '待补充'}</div>
    </div>
  );
}

function ScorePanel({ score }: { score: number }) {
  if (!score) {
    return (
      <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
          <Star size={16} />
          用户评分待补充
        </div>
        <p className="text-xs text-gray-500 mt-2">暂无足够已验证合作反馈，暂不展示评分。</p>
      </div>
    );
  }

  const label = score >= 80 ? '合作反馈较好' : score >= 60 ? '可进一步沟通' : score >= 40 ? '建议谨慎核验' : '信息仍需补充';

  return (
    <div className="border border-blue-100 rounded-lg p-5 bg-blue-50">
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold text-blue-700">{score}</span>
        <span className="text-sm text-blue-600 pb-1">/ 100</span>
      </div>
      <div className="text-sm font-semibold text-blue-900 mt-2">{label}</div>
      <p className="text-xs text-blue-700 mt-2">评分综合公开资料完整度、合作反馈和平台核验状态，仅作合作前参考。</p>
    </div>
  );
}

export default function CompanyDetailPage({ slug, onNavigate }: Props) {
  const { partners, reviews, loading, error } = useCSVData();
  const company = useMemo(() => findCompanyProfile(slug, partners, reviews), [slug, partners, reviews]);
  const allCompanies = useMemo(() => getAllCompanyProfiles(partners, reviews), [partners, reviews]);
  const relatedCompanies = allCompanies.filter((item) => item.slug !== slug).slice(0, 12);
  const verifiedReviews = reviews.filter((review) => review.partnerId === company?.id && review.reviewStatus === 'verified');

  useEffect(() => {
    if (!company) {
      document.title = '公司档案 | 渠评';
      setMetaDescription('渠评公司档案页，收录MCN机构、直播电商机构与合作方公开资料。');
      return;
    }

    document.title = `${company.displayName}怎么样？合作评价与公司信息 | 渠评`;
    setMetaDescription(
      `${company.displayName}怎么样？渠评整理${company.displayName}的公司介绍、机构类型、成立时间、所在地、达人数量、合作评价和用户评分，帮助品牌合作前做基础判断。`
    );
  }, [company]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Loader2 size={20} className="animate-spin text-blue-500" />
          正在加载公司档案
        </div>
      </main>
    );
  }

  if (error || !company) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <button onClick={() => onNavigate('list')} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6">
            <ArrowLeft size={16} />
            返回合作方数据库
          </button>
          <div className="bg-white border border-gray-200 rounded-xl p-8">
            <div className="flex items-center gap-3 text-gray-900 font-semibold">
              <AlertCircle size={20} className="text-amber-500" />
              暂未找到这个公司页面
            </div>
            <p className="text-sm text-gray-500 mt-3">该公司 slug 还没有匹配到公开档案，可以先回到合作方数据库搜索。</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button onClick={() => onNavigate('list')} className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white mb-8">
            <ArrowLeft size={16} />
            返回合作方数据库
          </button>
          <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-end">
            <div>
              <div className="inline-flex items-center gap-2 text-xs text-blue-200 bg-blue-500/15 border border-blue-400/20 px-3 py-1 rounded-full mb-4">
                <Building2 size={13} />
                MCN / 公司档案
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{company.displayName}怎么样？</h1>
              <p className="text-slate-300 mt-4 max-w-3xl leading-7">
                渠评整理 {company.displayName} 的公开公司信息、合作评价、用户评分与合作前核验要点，方便品牌和合作方在沟通前先做基础判断。
              </p>
              <div className="flex flex-wrap gap-2 mt-5 text-xs">
                <span className="px-2.5 py-1 rounded bg-white/10 text-slate-200">{company.institutionType}</span>
                <span className="px-2.5 py-1 rounded bg-white/10 text-slate-200">{company.city}</span>
                <span className="px-2.5 py-1 rounded bg-white/10 text-slate-200">来源：{company.sourceLabel}</span>
              </div>
            </div>
            <ScorePanel score={company.userScore} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">公司介绍</h2>
              </div>
              <p className="text-sm text-gray-700 leading-7">{company.description}</p>
              {company.legalEntity && (
                <p className="text-xs text-gray-500 mt-4">公司主体：{company.legalEntity}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <InfoCard icon={<Building2 size={14} />} label="机构类型" value={company.institutionType} />
              <InfoCard icon={<CalendarDays size={14} />} label="成立时间" value={company.foundedDate} />
              <InfoCard icon={<MapPin size={14} />} label="所在地" value={company.city} />
              <InfoCard icon={<Users size={14} />} label="达人数量" value={company.creatorCount} />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquareText size={18} className="text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">合作评价</h2>
              </div>
              <p className="text-sm text-gray-700 leading-7">{company.cooperationSummary}</p>

              {verifiedReviews.length > 0 && (
                <div className="mt-5 grid gap-3">
                  {verifiedReviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-gray-900">{review.isAnonymous ? '匿名合作反馈' : review.brandName}</div>
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5">
                          <CheckCircle2 size={12} />
                          已验证
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 leading-6">{review.reviewText || review.riskFeedback || '暂无详细评价文本。'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">内部链接</h2>
              <div className="space-y-2">
                <a href="/partners" className="flex items-center justify-between text-sm text-gray-700 hover:text-blue-600">
                  合作方数据库 <Link2 size={14} />
                </a>
                <a href="/reviews" className="flex items-center justify-between text-sm text-gray-700 hover:text-blue-600">
                  提交合作反馈 <Link2 size={14} />
                </a>
                <a href="/creator-onboarding" className="flex items-center justify-between text-sm text-gray-700 hover:text-blue-600">
                  合作商入驻 <Link2 size={14} />
                </a>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">更多 MCN 公司</h2>
              <div className="flex flex-wrap gap-2">
                {relatedCompanies.map((item) => (
                  <a key={item.slug} href={`/company/${item.slug}`} className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                    {item.displayName}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
