import { useState } from 'react';
import {
  ChevronLeft, AlertTriangle, CheckCircle, Users, Clock, ThumbsUp, ThumbsDown,
  Shield, Building2, User2, Users2, Loader2, AlertCircle, FileText, GitFork,
  BarChart3, Info, ExternalLink, Edit3,
} from 'lucide-react';
import { useCSVData } from '../lib/CSVDataContext';
import { getBusinessInfoSourceLabel, getPublicDataSourceLabel } from '../lib/displaySources';
import type { Partner, CooperationReview, PartnerRelationship } from '../types';

interface Props {
  channelId: string;
  onNavigate: (page: string, id?: string) => void;
}

const RISK_LEVEL_CONFIG = {
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', label: '高风险', icon: 'text-red-500' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', label: '中风险', icon: 'text-amber-500' },
  low: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', label: '低风险', icon: 'text-emerald-500' },
};
const RISK_ADVICE = {
  high: '存在较高风险线索，建议谨慎合作，优先完成尽调或要求更严格的合同约束。',
  medium: '存在部分待核验信息，建议先小额试单，并要求对方提供案例证明和数据复盘。',
  low: '当前公开风险较低，但仍建议合作前核验案例和合同条款。',
};
const VERIFICATION_STYLES: Record<string, string> = {
  '已核验': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '部分核验': 'bg-amber-50 text-amber-700 border-amber-200',
  '未核验': 'bg-gray-100 text-gray-500 border-gray-200',
};

function Tag({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium ${className}`}>
      {children}
    </span>
  );
}

function ScoreRow({ label, score, max = 100 }: { label: string; score: number; max?: number }) {
  if (!score) return null;
  const pct = (score / max) * 100;
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-800 w-8 text-right">{score}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: CooperationReview }) {
  const [expanded, setExpanded] = useState(false);
  const resultColor =
    review.cooperationResult === '有成交' || review.cooperationResult === '有复购' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : review.cooperationResult === '有争议' ? 'text-red-700 bg-red-50 border-red-200'
    : review.cooperationResult === '有线索' || review.cooperationResult === '有曝光' ? 'text-blue-700 bg-blue-50 border-blue-200'
    : 'text-gray-600 bg-gray-50 border-gray-200';

  const displayName = review.isAnonymous
    ? (review.brandCategory ? `匿名${review.brandCategory}品牌` : '匿名品牌方')
    : review.brandName;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-bold text-gray-800">{displayName}</span>
            <Tag className={resultColor}>{review.cooperationResult || '—'}</Tag>
            {review.recommend === 'yes' ? (
              <span className="flex items-center gap-0.5 text-xs text-emerald-600 font-medium">
                <ThumbsUp size={11} />复投意愿高
              </span>
            ) : review.recommend === 'no' ? (
              <span className="flex items-center gap-0.5 text-xs text-red-500 font-medium">
                <ThumbsDown size={11} />不推荐
              </span>
            ) : (
              <span className="text-xs text-amber-600 font-medium">待定</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Clock size={10} />{review.cooperationDate}</span>
            {review.reviewerRole && <span>{review.reviewerRole}</span>}
            {review.cooperationPlatform && <span>{review.cooperationPlatform}</span>}
            {review.cooperationModel && <span>{review.cooperationModel}</span>}
            {review.amountRange && <span>{review.amountRange}</span>}
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
          <CheckCircle size={10} />已验证
        </span>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {[
          { label: '履约', score: review.fulfillmentScore },
          { label: '沟通', score: review.communicationScore },
          { label: '转化', score: review.conversionScore },
          { label: '数据透明', score: review.dataTransparencyScore },
        ].map(({ label, score }) => score > 0 ? (
          <div key={label} className="text-center bg-gray-50 rounded-lg py-2 px-1">
            <div className={`text-sm font-bold ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-blue-600' : 'text-amber-600'}`}>{score}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
          </div>
        ) : null)}
      </div>

      {/* Feedback details */}
      {(review.gmvFeedback || review.conversionFeedback || review.refundFeedback) && (
        <div className="grid sm:grid-cols-3 gap-2 mb-3">
          {review.gmvFeedback && (
            <div className="bg-gray-50 rounded px-2.5 py-1.5">
              <div className="text-[10px] text-gray-400 mb-0.5">GMV 反馈</div>
              <div className="text-xs text-gray-700 font-medium">{review.gmvFeedback}</div>
            </div>
          )}
          {review.conversionFeedback && (
            <div className="bg-gray-50 rounded px-2.5 py-1.5">
              <div className="text-[10px] text-gray-400 mb-0.5">转化反馈</div>
              <div className="text-xs text-gray-700 font-medium">{review.conversionFeedback}</div>
            </div>
          )}
          {review.refundFeedback && (
            <div className="bg-gray-50 rounded px-2.5 py-1.5">
              <div className="text-[10px] text-gray-400 mb-0.5">退货反馈</div>
              <div className="text-xs text-gray-700 font-medium">{review.refundFeedback}</div>
            </div>
          )}
        </div>
      )}

      {/* Points */}
      {(review.positivePoints.length > 0 || review.negativePoints.length > 0) && (
        <div className="flex gap-4 mb-3">
          {review.positivePoints.length > 0 && (
            <div className="flex-1">
              <p className="text-[10px] font-medium text-gray-500 mb-1">合作优点</p>
              <div className="flex flex-wrap gap-1">
                {review.positivePoints.map((p, i) => (
                  <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{p}</span>
                ))}
              </div>
            </div>
          )}
          {review.negativePoints.length > 0 && (
            <div className="flex-1">
              <p className="text-[10px] font-medium text-gray-500 mb-1">待改进</p>
              <div className="flex flex-wrap gap-1">
                {review.negativePoints.map((p, i) => (
                  <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review text */}
      {review.reviewText && (
        <div>
          <p className={`text-sm text-gray-600 leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
            {review.reviewText}
          </p>
          {review.reviewText.length > 120 && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline mt-1">
              {expanded ? '收起' : '展开全文'}
            </button>
          )}
        </div>
      )}

      {/* Risk feedback */}
      {review.riskFeedback && (
        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
          <span className="font-medium">风险提示：</span>{review.riskFeedback}
        </div>
      )}

      <div className="mt-3 text-[10px] text-gray-400 text-right">{review.createdAt}</div>
    </div>
  );
}

// ─── Module A: Identity ───────────────────────────────────────────────────────
function IdentityModule({ partner }: { partner: Partner }) {
  const entityIcon = partner.entityType === 'company' ? Building2 : partner.entityType === 'team' ? Users2 : User2;
  const Icon = entityIcon;
  const entityLabel = partner.entityType === 'company' ? '公司' : partner.entityType === 'team' ? '团队' : '个人';
  const businessInfoSource = getBusinessInfoSourceLabel(partner);
  const dataSource = getPublicDataSourceLabel(partner.dataSource);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <FileText size={14} />A. 基础身份信息
      </h2>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Icon size={22} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-gray-900 mb-1">{partner.displayName}</h1>
          <div className="flex flex-wrap gap-1.5">
            <Tag className={VERIFICATION_STYLES[partner.verificationStatus] ?? VERIFICATION_STYLES['未核验']}>
              {partner.verificationStatus}
            </Tag>
            <Tag className="bg-gray-100 text-gray-600 border-gray-200">{entityLabel}</Tag>
            {partner.partnerType.map((t) => (
              <Tag key={t} className="bg-blue-50 text-blue-600 border-blue-200">{t}</Tag>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        {partner.companyType && (
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">企业类型</dt>
            <dd className="font-medium text-gray-800">{partner.companyType}</dd>
          </div>
        )}
        {partner.registeredCapital && (
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">注册资本</dt>
            <dd className="font-medium text-gray-800">{partner.registeredCapital}</dd>
          </div>
        )}
        {partner.foundedDate && (
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">成立日期</dt>
            <dd className="font-medium text-gray-800">{partner.foundedDate}</dd>
          </div>
        )}
        {partner.approvalDate && (
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">核准日期</dt>
            <dd className="font-medium text-gray-800">{partner.approvalDate}</dd>
          </div>
        )}
        {partner.address && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-gray-400 mb-0.5">住址</dt>
            <dd className="font-medium text-gray-800">{partner.address}</dd>
          </div>
        )}
        {partner.businessScope && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-gray-400 mb-0.5">经营范围</dt>
            <dd className="font-medium text-gray-800 leading-relaxed">{partner.businessScope}</dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-gray-400 mb-0.5">档案更新时间</dt>
          <dd className="text-gray-500">{partner.updatedAt || '—'}</dd>
        </div>
      </div>

      {partner.entityType === 'person' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2 text-xs text-blue-700">
          <CheckCircle size={13} className="shrink-0 mt-0.5" />
          <p>仅展示公开业务身份和合作能力信息，不展示个人联系方式、证件、地址等隐私字段。</p>
        </div>
      )}
    </div>
  );
}

// ─── Module B: Cooperation Profile ───────────────────────────────────────────
function CoopProfileModule({ partner }: { partner: Partner }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <BarChart3 size={14} />B. 电商合作能力画像
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {partner.platforms.length > 0 && (
          <div>
            <dt className="text-xs text-gray-400 mb-1.5 font-medium">主要平台</dt>
            <dd className="flex flex-wrap gap-1">
              {partner.platforms.map((p) => (
                <Tag key={p} className="bg-slate-100 text-slate-700 border-slate-200">{p}</Tag>
              ))}
            </dd>
          </div>
        )}
        {partner.categories.length > 0 && (
          <div>
            <dt className="text-xs text-gray-400 mb-1.5 font-medium">擅长品类</dt>
            <dd className="flex flex-wrap gap-1">
              {partner.categories.map((c) => (
                <Tag key={c} className="bg-gray-50 text-gray-600 border-gray-200">{c}</Tag>
              ))}
            </dd>
          </div>
        )}
        {partner.cooperationModels.length > 0 && (
          <div>
            <dt className="text-xs text-gray-400 mb-1.5 font-medium">合作方式</dt>
            <dd className="flex flex-wrap gap-1">
              {partner.cooperationModels.map((m) => (
                <Tag key={m} className="bg-blue-50 text-blue-600 border-blue-200">{m}</Tag>
              ))}
            </dd>
          </div>
        )}
        {(partner.priceRange || partner.typicalFeeRange) && (
          <div>
            <dt className="text-xs text-gray-400 mb-1.5 font-medium">典型合作费用</dt>
            <dd className="text-sm font-medium text-gray-800">{partner.typicalFeeRange || partner.priceRange}</dd>
          </div>
        )}
        {partner.salesScenario && (
          <div>
            <dt className="text-xs text-gray-400 mb-1.5 font-medium">主要电商场景</dt>
            <dd className="text-sm text-gray-700">{partner.salesScenario}</dd>
          </div>
        )}
        {partner.customerProfile && (
          <div>
            <dt className="text-xs text-gray-400 mb-1.5 font-medium">客户画像</dt>
            <dd className="text-sm text-gray-700">{partner.customerProfile}</dd>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Module C: Public Cases ───────────────────────────────────────────────────
function PublicCasesModule({ partner }: { partner: Partner }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
        <ExternalLink size={14} />C. 公开资料与公开案例
      </h2>
      <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2 text-xs text-amber-700 mb-4">
        <Info size={13} className="shrink-0 mt-0.5" />
        <p>以下内容来自公开资料或合作方自述，尚不等同于平台已验证合作评价。</p>
      </div>
      {partner.publicCases ? (
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{partner.publicCases}</div>
      ) : (
        <p className="text-sm text-gray-400">暂无公开案例记录。</p>
      )}
      {partner.caseVerificationStatus && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-400">案例核验状态：</span>
          <Tag className={VERIFICATION_STYLES[partner.caseVerificationStatus] ?? VERIFICATION_STYLES['未核验']}>
            {partner.caseVerificationStatus}
          </Tag>
        </div>
      )}
      {(partner.publicCaseSource || partner.publicCaseVerificationNote) && (
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          {partner.publicCaseSource && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              <div className="text-[10px] text-gray-400 mb-0.5">Public source</div>
              <div className="text-xs text-gray-700 break-all">{partner.publicCaseSource}</div>
            </div>
          )}
          {partner.publicCaseVerificationNote && (
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              <div className="text-[10px] text-gray-400 mb-0.5">Verification note</div>
              <div className="text-xs text-gray-700">{partner.publicCaseVerificationNote}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Module D: Relationships ─────────────────────────────────────────────────
function RelationshipsModule({ relationships }: { relationships: PartnerRelationship[] }) {
  const visibleRelationships = relationships.filter((rel) => {
    const name = rel.relatedPartnerName.trim();
    const isPlaceholderAdminRelation =
      name.length <= 1 &&
      rel.relationshipType === 'Related party' &&
      rel.sourceType === 'Admin edit';

    return !isPlaceholderAdminRelation;
  });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <GitFork size={14} />D. 公司 / 达人 / 团队关系
      </h2>
      {visibleRelationships.length === 0 ? (
        <p className="text-sm text-gray-400">
          暂无公开关联关系，后续将补充 MCN、达人、团队和商务归属信息。
        </p>
      ) : (
        <div className="space-y-3">
          {visibleRelationships.map((rel) => {
            const verificationStatus = rel.verificationStatus === '???' ? '未核验' : rel.verificationStatus;

            return (
              <div key={rel.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800 text-sm">{rel.relatedPartnerName}</span>
                  <Tag className={VERIFICATION_STYLES[verificationStatus] ?? VERIFICATION_STYLES['未核验']}>
                    {verificationStatus}
                  </Tag>
                </div>
                <div className="flex gap-3 text-xs text-gray-500">
                  <span>关系类型：{rel.relationshipType}</span>
                  <span>来源：{rel.sourceType}</span>
                </div>
                {rel.notes && <p className="text-xs text-gray-500 mt-1">{rel.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Module E: Adaptation Index ──────────────────────────────────────────────
function AdaptationIndexModule({ partner }: { partner: Partner }) {
  const s = partner.scores;
  const hasDetailedScores = s.authenticity || s.fulfillment || s.categoryFit || s.conversionFeedback || s.riskControl || s.dataCompleteness;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <BarChart3 size={14} />E. 合作适配指数
      </h2>
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 mb-5">
        该指数基于公开资料完整度、核验状态和已验证合作评价综合生成；当前样本有限，仅供合作前参考。
      </div>
      {hasDetailedScores ? (
        <div className="space-y-3">
          <ScoreRow label="信息真实性" score={s.authenticity} />
          <ScoreRow label="履约能力" score={s.fulfillment} />
          <ScoreRow label="品类适配度" score={s.categoryFit} />
          <ScoreRow label="转化与反馈" score={s.conversionFeedback} />
          <ScoreRow label="数据透明度" score={s.dataCompleteness} />
          <ScoreRow label="合规与风控" score={s.riskControl} />
        </div>
      ) : s.overall ? (
        <div className="text-center py-4">
          <div className="text-5xl font-extrabold text-blue-600 mb-1">{s.overall}</div>
          <div className="text-sm text-gray-500">合作适配指数（综合）</div>
        </div>
      ) : (
        <p className="text-sm text-gray-400">暂无评分，待更多合作反馈补充。</p>
      )}
    </div>
  );
}

// ─── Module F: Verified Reviews ───────────────────────────────────────────────
function VerifiedReviewsModule({ reviews, onNavigate }: { reviews: CooperationReview[]; onNavigate: (page: string) => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <CheckCircle size={14} />F. 品牌方已验证合作反馈
        </h2>
        <button onClick={() => onNavigate('submit')} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          + 提交反馈
        </button>
      </div>
      {reviews.length === 0 ? (
        <div className="text-center py-10">
          <Users size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">暂无已验证品牌合作反馈。</p>
          <p className="text-xs text-gray-400 mt-1">你可以提交真实合作经历，帮助其他品牌降低合作风险。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}
    </div>
  );
}

// ─── Module G: Risk ────────────────────────────────────────────────────────────
function RiskModule({ partner }: { partner: Partner }) {
  const cfg = RISK_LEVEL_CONFIG[partner.riskLevel] ?? RISK_LEVEL_CONFIG.low;
  return (
    <div className={`border rounded-2xl p-6 ${cfg.bg} ${cfg.border}`}>
      <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Shield size={14} />G. 风险标签与合作建议
      </h2>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className={cfg.icon} />
        <span className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</span>
      </div>
      <p className="text-sm text-gray-700 mb-4">{RISK_ADVICE[partner.riskLevel]}</p>
      {partner.riskTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {partner.riskTags.map((tag) => (
            <span key={tag} className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${cfg.border} ${cfg.text} bg-white`}>
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">暂无公开风险标签。</p>
      )}
    </div>
  );
}

// ─── Module H: Due Diligence CTA ─────────────────────────────────────────────
function DueDiligenceCTA({ partner, onNavigate }: { partner: Partner; onNavigate: (page: string, id?: string) => void }) {
  return (
    <div className="bg-slate-900 rounded-2xl p-6 text-white">
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
        <FileText size={14} />H. 申请尽调报告
      </h2>
      <h3 className="text-lg font-bold mb-2">准备合作前，申请该合作方尽调报告</h3>
      <p className="text-sm text-slate-400 mb-5">
        我们将基于公开资料、关系图谱、品牌反馈和人工核验，整理合作前风险简报。
      </p>
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        {[
          { name: '基础版 ¥99', desc: '公开资料、主体信息、公开案例、初步风险线索' },
          { name: '标准版 ¥399', desc: '增加关系图谱、匿名反馈、风险标签和合作建议' },
          { name: '深度版 ¥999', desc: '增加人工核验、访谈反馈、合同条款建议和试单方案' },
        ].map((item) => (
          <div key={item.name} className="bg-white/10 rounded-xl p-3">
            <div className="text-xs font-bold text-white mb-1">{item.name}</div>
            <div className="text-xs text-slate-400 leading-relaxed">{item.desc}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => onNavigate('due-diligence', partner.id)}
        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors text-sm"
      >
        申请尽调报告
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PartnerDetailPage({ channelId, onNavigate }: Props) {
  const { partners, reviews, relationships, loading, error } = useCSVData();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <p className="text-sm text-gray-500">正在加载档案数据...</p>
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

  const partner = partners.find((p) => p.id === channelId);

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">合作方档案不存在</h2>
          <p className="text-sm text-gray-400 mb-4">该档案可能尚未录入或 ID 有误</p>
          <button onClick={() => onNavigate('list')} className="text-blue-600 hover:underline text-sm font-medium">
            返回合作方数据库
          </button>
        </div>
      </div>
    );
  }

  const verifiedReviews = reviews.filter(
    (r) => r.partnerId === channelId && r.reviewStatus === 'verified' && r.evidenceStatus === 'verified' && r.reviewVisibility === 'public'
  );
  const partnerRelationships = partner.adminRelationships?.length
    ? partner.adminRelationships
    : relationships.filter((r) => r.partnerId === channelId);
  const riskCfg = RISK_LEVEL_CONFIG[partner.riskLevel] ?? RISK_LEVEL_CONFIG.low;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <button
            onClick={() => onNavigate('list')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft size={15} />
            合作方数据库
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-700 font-medium truncate max-w-xs">{partner.displayName}</span>
        </div>
      </div>

      {/* Hero header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-gray-900">{partner.displayName}</h1>
                <span className={`text-xs font-medium px-2 py-1 rounded border ${VERIFICATION_STYLES[partner.verificationStatus] ?? VERIFICATION_STYLES['未核验']}`}>
                  {partner.verificationStatus}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${riskCfg.bg} ${riskCfg.text}`}>
                  {riskCfg.label}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {partner.partnerType.join(' · ')}
                {partner.city ? ` · ${partner.city}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center">
                {partner.scores.overall > 0 ? (
                  <div>
                    <div className="text-3xl font-extrabold text-blue-600">{partner.scores.overall}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">合作适配指数</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">暂无评分</div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onNavigate('admin', channelId)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Edit3 size={13} />
                  管理员编辑
                </button>
                <button
                  onClick={() => onNavigate('due-diligence', partner.id)}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  申请尽调报告
                </button>
                <button
                  onClick={() => onNavigate('submit')}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  提交合作反馈
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <IdentityModule partner={partner} />
            <CoopProfileModule partner={partner} />
            <PublicCasesModule partner={partner} />
            <RelationshipsModule relationships={partnerRelationships} />
            <AdaptationIndexModule partner={partner} />
            <VerifiedReviewsModule reviews={verifiedReviews} onNavigate={onNavigate} />
            <RiskModule partner={partner} />
            <DueDiligenceCTA partner={partner} onNavigate={onNavigate} />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Key metrics */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-32">
              <h3 className="text-sm font-bold text-gray-800 mb-4">核心指标</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">合作适配指数</span>
                  <span className="text-sm font-bold text-blue-600">
                    {partner.scores.overall > 0 ? partner.scores.overall : '暂无'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">已验证反馈</span>
                  <span className="text-sm font-bold text-gray-800">{verifiedReviews.length} 条</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">核验状态</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded border ${VERIFICATION_STYLES[partner.verificationStatus] ?? VERIFICATION_STYLES['未核验']}`}>
                    {partner.verificationStatus}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">风险等级</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${riskCfg.bg} ${riskCfg.text}`}>
                    {riskCfg.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">关联关系</span>
                  <span className="text-sm font-bold text-gray-800">{partnerRelationships.length} 条</span>
                </div>
              </div>
            </div>

            {/* Recommend summary */}
            {verifiedReviews.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4">复投意愿分布</h3>
                {(() => {
                  const yes = verifiedReviews.filter((r) => r.recommend === 'yes').length;
                  const unsure = verifiedReviews.filter((r) => r.recommend === 'unsure').length;
                  const no = verifiedReviews.filter((r) => r.recommend === 'no').length;
                  const total = verifiedReviews.length;
                  return (
                    <div className="space-y-2">
                      {[
                        { label: '愿意复投', count: yes, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
                        { label: '待定', count: unsure, color: 'bg-amber-500', textColor: 'text-amber-600' },
                        { label: '不推荐', count: no, color: 'bg-red-500', textColor: 'text-red-600' },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between mb-1 text-xs">
                            <span className={`font-medium ${item.textColor}`}>{item.label}</span>
                            <span className="text-gray-600 font-bold">{item.count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color}`} style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Avg scores */}
            {verifiedReviews.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-800 mb-4">平均反馈评分</h3>
                {(() => {
                  const avg = (key: keyof CooperationReview) => {
                    const vals = verifiedReviews.map((r) => r[key] as number).filter((v) => v > 0);
                    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
                  };
                  return (
                    <div className="space-y-2.5">
                      <ScoreRow label="履约" score={avg('fulfillmentScore')} />
                      <ScoreRow label="沟通" score={avg('communicationScore')} />
                      <ScoreRow label="转化" score={avg('conversionScore')} />
                      <ScoreRow label="数据透明" score={avg('dataTransparencyScore')} />
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
