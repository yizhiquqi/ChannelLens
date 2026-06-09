import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { ChevronLeft, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useCSVData } from '../lib/CSVDataContext';
import { insertCooperationReview, uploadEvidenceFiles, type EvidenceUpload } from '../lib/database';

interface Props {
  onNavigate: (page: string) => void;
  user?: User;
}

const PLATFORMS = ['抖音', '小红书', '视频号', '淘宝直播', '微信私域', '快手', '其他'];
const GOALS = ['品宣种草', '带货', '私域转化', '分销招商', '其他'];
const RESULTS = ['无明显结果', '有曝光', '有线索', '有成交', '有复购', '有争议'];
const PAYMENT_CYCLES = ['7天内', '15天内', '30天内', '60天内', '超过60天', '尚未回款'];
const SETTLEMENT_ISSUES = ['无', '延迟回款', '扣款争议', '赖账/拒付', '流程不规范'];
const DATA_RISK_OPTIONS = ['无明显异常', '疑似刷单', '异常退货', '数据不透明', '投流数据无法核验'];
const COOPERATION_MODELS = ['服务费', '佣金', '项目制', '坑位费', '代运营费', '分销', '代理', '活动分成', '其他'];
const AMOUNT_RANGES = ['1万以下', '1万-5万', '5万-20万', '20万以上'];
const PRICE_RANGES = ['100以下', '100-500', '500-1000', '1000以上'];
const REVIEWER_ROLES = ['创始人', '市场负责人', '渠道负责人', '商务负责人', '电商负责人', '其他'];
const initialForm = {
  brandName: '',
  isAnonymous: true,
  reviewerRole: '',
  partnerId: '',
  partnerNameFree: '',
  brandCategory: '',
  productPriceRange: '',
  cooperationDate: '',
  cooperationPlatform: '',
  cooperationModel: '',
  amountRange: '',
  cooperationGoal: [] as string[],
  cooperationResult: [] as string[],
  realGmv: '',
  actualRoi: '',
  actualRefundRate: '',
  paymentCycleActual: '',
  settlementIssue: '',
  dataRiskSignals: [] as string[],
  fulfillmentIssues: '',
  gmvFeedback: '',
  conversionFeedback: '',
  refundFeedback: '',
  fulfillmentScore: 0,
  communicationScore: 0,
  conversionScore: 0,
  dataTransparencyScore: 0,
  recommend: '' as '' | 'yes' | 'unsure' | 'no',
  repurchaseIntent: '' as '' | 'yes' | 'unsure' | 'no',
  positivePoints: '',
  negativePoints: '',
  riskFeedback: '',
  reviewText: '',
  evidenceStatus: 'pending_review',
  evidenceFiles: [] as string[],
  evidenceFileMeta: [] as EvidenceUpload[],
  evidenceNote: '',
  visibilityPreference: 'public',
};

type FormData = typeof initialForm;

function ScoreSelector({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-1">
        {[20, 40, 60, 80, 100].map((v) => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`flex-1 py-2 rounded text-xs font-semibold border transition-colors ${
              value >= v ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-blue-300'
            }`}>
            {v}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5 px-0.5">
        <span>较差</span><span>一般</span><span>良好</span><span>优秀</span><span>卓越</span>
      </div>
    </div>
  );
}

export default function SubmitReviewPage({ onNavigate, user }: Props) {
  const { partners } = useCSVData();
  const [form, setForm] = useState<FormData>(initialForm);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function f(patch: Partial<FormData>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function toggleResult(result: string) {
    setForm((prev) => {
      const selected = prev.cooperationResult.includes(result);
      return {
        ...prev,
        cooperationResult: selected
          ? prev.cooperationResult.filter((item) => item !== result)
          : [...prev.cooperationResult, result],
      };
    });
  }

  function toggleGoal(goal: string) {
    setForm((prev) => {
      const selected = prev.cooperationGoal.includes(goal);
      return {
        ...prev,
        cooperationGoal: selected
          ? prev.cooperationGoal.filter((item) => item !== goal)
          : [...prev.cooperationGoal, goal],
      };
    });
  }

  function toggleDataRisk(signal: string) {
    setForm((prev) => {
      const selected = prev.dataRiskSignals.includes(signal);
      return {
        ...prev,
        dataRiskSignals: selected
          ? prev.dataRiskSignals.filter((item) => item !== signal)
          : [...prev.dataRiskSignals, signal],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.reviewerRole || !form.reviewText || (!form.partnerId && !form.partnerNameFree)) {
      setMessage('请先补齐品牌角色、合作方和合作反馈总结。');
      return;
    }
    if (selectedFiles.length === 0 && form.evidenceFiles.length === 0) {
      setMessage('请至少上传一项证据材料，例如合同、转账记录、对账单或聊天截图。');
      return;
    }

    try {
      setSubmitting(true);
      const uploadedFiles = selectedFiles.length > 0 ? await uploadEvidenceFiles(selectedFiles, user?.id) : form.evidenceFileMeta;
      const payload = {
        ...form,
        id: `REVIEW_${Date.now()}`,
        evidenceFiles: uploadedFiles.map((file) => file.name),
        evidenceFilePaths: uploadedFiles.map((file) => file.path),
        evidenceFileMeta: uploadedFiles,
        userId: user?.id,
        userEmail: user?.email,
        evidenceStatus: 'pending_review',
        reviewStatus: 'pending',
        submittedAt: new Date().toISOString(),
        status: 'pending',
      };
      const saved = await insertCooperationReview(payload);
      const existing = JSON.parse(localStorage.getItem('channellens_reviews') ?? '[]');
      existing.push(saved);
      localStorage.setItem('channellens_reviews', JSON.stringify(existing));
      setSubmitted(true);
    } catch {
      setMessage('提交到云端数据库失败，请稍后重试，或联系平台管理员。');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">已收到合作反馈</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            当前为 MVP 测试版，正式提交功能将在后台系统上线后开放。
          </p>
          <p className="text-gray-400 text-xs mb-6">
            你也可以将该表单内容复制给平台管理员录入。本次提交已临时保存至本地（测试数据）。
          </p>
          <button onClick={() => onNavigate('list')}
            className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            返回合作方数据库
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => onNavigate('list')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ChevronLeft size={15} />返回
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-800">提交合作反馈</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-900 px-8 py-6">
            <h1 className="text-xl font-bold text-white mb-1">提交合作反馈</h1>
            <p className="text-slate-400 text-sm">仅接受真实合作经历。所有内容将进行匿名、脱敏和人工审核。</p>
          </div>

          <div className="border-b border-gray-100 px-6 py-3 bg-amber-50 flex items-start gap-2">
            <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              合同、付款记录、聊天截图等证据仅用于后台核验，不会公开展示。当前为 MVP 测试版，提交内容将暂存本地。
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-10">
            {/* 01 品牌方信息 */}
            <section>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">01 品牌方信息</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">品牌名称 <span className="text-red-400">*</span></label>
                  <input type="text" placeholder="您的品牌名称" value={form.brandName} onChange={(e) => f({ brandName: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">您的职能角色 <span className="text-red-400">*</span></label>
                  <select value={form.reviewerRole} onChange={(e) => f({ reviewerRole: e.target.value })} className={inputClass} required>
                    <option value="">请选择</option>
                    {REVIEWER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isAnonymous} onChange={(e) => f({ isAnonymous: e.target.checked })} className="rounded border-gray-300 text-blue-600" />
                    <span className="text-sm text-gray-700">品牌名称匿名展示（推荐）</span>
                  </label>
                  <p className="text-xs text-gray-400 mt-1 ml-6">勾选后前台展示时将显示匿名品牌方而非真实名称。</p>
                </div>
              </div>
            </section>

            {/* 02 合作方信息 */}
            <section>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">02 合作方信息</h2>
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">选择已有合作方</label>
                    <select value={form.partnerId} onChange={(e) => f({ partnerId: e.target.value, partnerNameFree: '' })} className={inputClass}>
                      <option value="">从数据库选择...</option>
                      {partners.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">或手动填写名称 <span className="text-red-400">*</span></label>
                    <input type="text" placeholder="合作方名称（若未在库中）" value={form.partnerNameFree}
                      onChange={(e) => f({ partnerNameFree: e.target.value })} className={inputClass} disabled={!!form.partnerId} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">合作平台</label>
                    <select value={form.cooperationPlatform} onChange={(e) => f({ cooperationPlatform: e.target.value })} className={inputClass}>
                      <option value="">请选择</option>
                      {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">合作时间</label>
                    <input type="text" placeholder="如：2026Q1 / 2025-12" value={form.cooperationDate} onChange={(e) => f({ cooperationDate: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">合作方式</label>
                    <select value={form.cooperationModel} onChange={(e) => f({ cooperationModel: e.target.value })} className={inputClass}>
                      <option value="">请选择</option>
                      {COOPERATION_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">投入金额范围</label>
                    <select value={form.amountRange} onChange={(e) => f({ amountRange: e.target.value })} className={inputClass}>
                      <option value="">请选择</option>
                      {AMOUNT_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">品牌品类</label>
                    <input type="text" placeholder="如：美妆、服装、食品" value={form.brandCategory} onChange={(e) => f({ brandCategory: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">产品价格带</label>
                    <select value={form.productPriceRange} onChange={(e) => f({ productPriceRange: e.target.value })} className={inputClass}>
                      <option value="">请选择</option>
                      {PRICE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">合作目标</label>
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map((g) => (
                      <button key={g} type="button" onClick={() => toggleGoal(g)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${form.cooperationGoal.includes(g) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">合作结果</label>
                  <div className="flex flex-wrap gap-2">
                    {RESULTS.map((r) => (
                      <button key={r} type="button" onClick={() => toggleResult(r)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${form.cooperationResult.includes(r) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 03 效果反馈 */}
            <section>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">03 效果反馈</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">真实GMV</label>
                  <input type="text" placeholder="如：28万 / 未披露" value={form.realGmv} onChange={(e) => f({ realGmv: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">实际ROI</label>
                  <input type="text" placeholder="如：1:2.8 / 未达预期" value={form.actualRoi} onChange={(e) => f({ actualRoi: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">实际退货率</label>
                  <input type="text" placeholder="如：18% / 偏高" value={form.actualRefundRate} onChange={(e) => f({ actualRefundRate: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">GMV 达成</label>
                  <input type="text" placeholder="低于预期/符合预期" value={form.gmvFeedback} onChange={(e) => f({ gmvFeedback: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">转化反馈</label>
                  <input type="text" placeholder="成交周期长/有效线索多" value={form.conversionFeedback} onChange={(e) => f({ conversionFeedback: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">退货反馈</label>
                  <input type="text" placeholder="退货率正常/退货率偏高" value={form.refundFeedback} onChange={(e) => f({ refundFeedback: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">实际回款账期</label>
                  <select value={form.paymentCycleActual} onChange={(e) => f({ paymentCycleActual: e.target.value })} className={inputClass}>
                    <option value="">请选择</option>
                    {PAYMENT_CYCLES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">结算/扣款情况</label>
                  <select value={form.settlementIssue} onChange={(e) => f({ settlementIssue: e.target.value })} className={inputClass}>
                    <option value="">请选择</option>
                    {SETTLEMENT_ISSUES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">数据真实性/异常信号</label>
                <div className="flex flex-wrap gap-2">
                  {DATA_RISK_OPTIONS.map((item) => (
                    <button key={item} type="button" onClick={() => toggleDataRisk(item)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${form.dataRiskSignals.includes(item) ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">履约/交付问题补充</label>
                <textarea rows={3} placeholder="如：未按约发布时间、复盘材料缺失、样品/脚本确认延迟等" value={form.fulfillmentIssues}
                  onChange={(e) => f({ fulfillmentIssues: e.target.value })} className={`${inputClass} resize-none`} />
              </div>
            </section>

            {/* 04 合作评分 */}
            <section>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">04 合作评分</h2>
              <div className="space-y-6">
                <ScoreSelector label="履约能力" value={form.fulfillmentScore} onChange={(v) => f({ fulfillmentScore: v })} />
                <ScoreSelector label="沟通协作" value={form.communicationScore} onChange={(v) => f({ communicationScore: v })} />
                <ScoreSelector label="转化效果" value={form.conversionScore} onChange={(v) => f({ conversionScore: v })} />
                <ScoreSelector label="数据透明度" value={form.dataTransparencyScore} onChange={(v) => f({ dataTransparencyScore: v })} />
              </div>
            </section>

            {/* 05 合作体验 */}
            <section>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">05 合作体验</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">是否推荐该合作方</label>
                  <div className="flex gap-3">
                    {[{ v: 'yes', l: '推荐' }, { v: 'unsure', l: '待定' }, { v: 'no', l: '不推荐' }].map((opt) => (
                      <button key={opt.v} type="button" onClick={() => f({ recommend: opt.v as any })}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                          form.recommend === opt.v
                            ? opt.v === 'yes' ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : opt.v === 'no' ? 'bg-red-50 border-red-300 text-red-700'
                              : 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">复投意愿</label>
                  <div className="flex gap-3">
                    {[{ v: 'yes', l: '会继续合作' }, { v: 'unsure', l: '看情况' }, { v: 'no', l: '不会复投' }].map((opt) => (
                      <button key={opt.v} type="button" onClick={() => f({ repurchaseIntent: opt.v as any })}
                        className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-colors ${form.repurchaseIntent === opt.v ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">合作反馈总结 <span className="text-red-400">*</span></label>
                  <textarea rows={5} maxLength={800} placeholder="描述真实合作体验，合作亮点与不足..." value={form.reviewText}
                    onChange={(e) => f({ reviewText: e.target.value })} className={`${inputClass} resize-none`} required />
                  <div className="text-xs text-gray-400 mt-1 text-right">{form.reviewText.length}/800</div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">合作优点（分号分隔）</label>
                    <input type="text" placeholder="沟通积极;执行速度快" value={form.positivePoints} onChange={(e) => f({ positivePoints: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">待改进点（分号分隔）</label>
                    <input type="text" placeholder="转化低于预期;复盘不足" value={form.negativePoints} onChange={(e) => f({ negativePoints: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">风险反馈（可选）</label>
                  <input type="text" placeholder="如：回款延迟、履约不到位、数据无法核验、疑似刷单等" value={form.riskFeedback} onChange={(e) => f({ riskFeedback: e.target.value })} className={inputClass} />
                </div>
              </div>
            </section>

            {/* 06 证据与可见性 */}
            <section>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">06 证据状态与可见性</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">上传证据材料 <span className="text-red-400">*</span></label>
                  <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-blue-200 bg-blue-50 rounded-xl px-4 py-6 cursor-pointer hover:bg-blue-100 transition-colors">
                    <span className="text-sm font-semibold text-blue-700">上传合同、转账记录、对账单或聊天截图</span>
                    <span className="text-xs text-blue-500">文件会上传到平台证据存储，后台审核后决定是否采信。</span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        setSelectedFiles(files);
                        f({ evidenceFiles: files.map((file) => file.name) });
                      }}
                    />
                  </label>
                  {form.evidenceFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {form.evidenceFiles.map((file) => (
                        <span key={file} className="text-xs bg-white border border-blue-100 text-blue-700 px-2 py-1 rounded-md">{file}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">证据状态由后台审核决定，提交方不能自行标记为已验证。</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">证据说明</label>
                  <input value={form.evidenceNote} onChange={(e) => f({ evidenceNote: e.target.value })} className={inputClass} placeholder="例如：合同+首付款截图+对账单" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">可见性偏好</label>
                  <select value={form.visibilityPreference} onChange={(e) => f({ visibilityPreference: e.target.value })} className={inputClass}>
                    <option value="public">公开展示（匿名脱敏）</option>
                    <option value="internal">仅平台内部可见</option>
                  </select>
                </div>
              </div>
            </section>

            <div className="pt-4 border-t border-gray-100">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg mb-5 flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  提交即代表您同意提供真实、准确的合作反馈，并同意平台对内容进行后台审核和匿名脱敏处理。
                </p>
              </div>
              {message && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg mb-5 flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">{message}</p>
                </div>
              )}
              <button type="submit" disabled={submitting} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors text-sm">
                {submitting ? '正在上传并提交...' : '提交合作反馈'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
