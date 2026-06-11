import { useState } from 'react';
import { CheckCircle, FileText, Search, Shield } from 'lucide-react';
import { useCSVData } from '../lib/CSVDataContext';
import { insertDueDiligenceRequest } from '../lib/database';

interface DueDiligenceRequestPageProps {
  onNavigate: (page: string) => void;
}

const REPORT_TYPES = [
  {
    id: 'basic',
    label: '基础版',
    price: '¥99',
    desc: '基于平台公开资料整理合作方档案摘要、公开风险标签和已验证反馈摘要，适合初步筛选。',
    features: ['合作方基础档案', '公开风险标签', '已验证反馈摘要', '合作前关注点'],
    turnaround: '1 个工作日',
    icon: FileText,
    color: 'border-gray-200 bg-white',
    labelColor: 'bg-gray-100 text-gray-600',
  },
  {
    id: 'standard',
    label: '标准版',
    price: '¥399',
    desc: '在基础版之上增加主体信息核验、历史案例交叉比对和合作建议，适合正式合作前评估。',
    features: ['基础版全部内容', '主体信息核验', '历史案例交叉比对', '平台口碑梳理', '合作建议摘要'],
    turnaround: '3 个工作日',
    icon: Search,
    color: 'border-blue-200 bg-blue-50/30',
    labelColor: 'bg-blue-100 text-blue-700',
    recommended: true,
  },
  {
    id: 'deep',
    label: '深度版',
    price: '¥999',
    desc: '包含人工访谈、多渠道交叉核实、完整风险评估和合同条款建议，适合高预算合作前尽调。',
    features: ['标准版全部内容', '多渠道人工访谈', '完整风险评估报告', '合同条款建议', '专属顾问对接'],
    turnaround: '5-7 个工作日',
    icon: Shield,
    color: 'border-gray-200 bg-white',
    labelColor: 'bg-slate-100 text-slate-600',
  },
];

const COOPERATION_MODELS = ['直播带货', '短视频挂车', '图文种草', '私域转化', '分销代理', '全案代运营', '其他'];
const BUDGET_RANGES = ['5万以内', '5-20万', '20-50万', '50-100万', '100万以上'];
const PRODUCT_CATEGORIES = ['美妆个护', '服饰配饰', '食品饮料', '数码家电', '家居家装', '母婴育儿', '健康保健', '宠物用品', '运动户外', '其他'];

const emptyForm = {
  brand_name: '',
  contact: '',
  target_partner_name: '',
  target_partner_id: '',
  product_category: '',
  product_price_range: '',
  planned_cooperation_model: '',
  budget_range: '',
  main_concerns: '',
  expected_report_type: 'standard',
};

function submitErrorMessage(error: unknown) {
  const detail = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : String(error ?? '');

  return detail ? `提交尽调申请失败：${detail}` : '提交尽调申请失败，请稍后重试。';
}

export default function DueDiligenceRequestPage({ onNavigate }: DueDiligenceRequestPageProps) {
  const { partners } = useCSVData();
  const [selectedType, setSelectedType] = useState('standard');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(emptyForm);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'expected_report_type') setSelectedType(value);
  }

  function handlePartnerSelect(partnerId: string) {
    const partner = partners.find((p) => p.id === partnerId);
    setForm((prev) => ({
      ...prev,
      target_partner_id: partnerId,
      target_partner_name: partner?.displayName ?? prev.target_partner_name,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        expected_report_type: selectedType,
        reportPrice: REPORT_TYPES.find((type) => type.id === selectedType)?.price,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
      const saved = await insertDueDiligenceRequest(payload);
      const existing = JSON.parse(localStorage.getItem('dd_requests') ?? '[]');
      localStorage.setItem('dd_requests', JSON.stringify([...existing, saved]));
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setMessage(submitErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">申请已提交</h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            我们已收到您的尽调报告申请，后台会记录需求并在 1 个工作日内与您联系确认报告范围和付款方式。
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onNavigate('list')}
              className="w-full px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-colors text-sm"
            >
              浏览合作方数据库
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setForm(emptyForm);
                setSelectedType('standard');
              }}
              className="w-full px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
            >
              再提交一份
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <Shield size={12} />
            人工尽调服务
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">申请尽调报告</h1>
          <p className="text-sm text-gray-500 max-w-xl leading-relaxed">
            在正式合作前，由平台协助核验合作方信息、梳理潜在风险，生成结构化尽调报告供品牌、达人、MCN 或服务商决策参考。
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">选择报告类型</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {REPORT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setSelectedType(type.id);
                    setForm((prev) => ({ ...prev, expected_report_type: type.id }));
                  }}
                  className={`relative text-left border-2 rounded-2xl p-5 transition-all ${isSelected ? 'border-blue-500 bg-blue-50/50' : `${type.color} hover:border-gray-300`}`}
                >
                  {type.recommended && (
                    <span className="absolute -top-2.5 left-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">推荐</span>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Icon size={16} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${type.labelColor}`}>{type.price}</span>
                  </div>
                  <div className={`text-sm font-bold mb-1.5 ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>{type.label}</div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{type.desc}</p>
                  <ul className="space-y-1">
                    {type.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className={`w-1 h-1 rounded-full shrink-0 ${isSelected ? 'bg-blue-500' : 'bg-gray-400'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 text-xs text-gray-400">预计交付：{type.turnaround}</div>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-5">申请方信息</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-medium text-gray-700 mb-1.5">品牌 / 公司 / 个人名称 <span className="text-red-500">*</span></span>
                <input required value={form.brand_name} onChange={(e) => handleChange('brand_name', e.target.value)} placeholder="请输入申请方名称" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-700 mb-1.5">联系方式 <span className="text-red-500">*</span></span>
                <input required value={form.contact} onChange={(e) => handleChange('contact', e.target.value)} placeholder="手机号 / 微信 / 邮箱" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-700 mb-1.5">产品/业务类目</span>
                <select value={form.product_category} onChange={(e) => handleChange('product_category', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">请选择类目</option>
                  {PRODUCT_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-700 mb-1.5">客单价/合作价格带</span>
                <input value={form.product_price_range} onChange={(e) => handleChange('product_price_range', e.target.value)} placeholder="如：99-399元" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-5">尽调对象信息</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-medium text-gray-700 mb-1.5">合作方名称 <span className="text-red-500">*</span></span>
                <input required value={form.target_partner_name} onChange={(e) => handleChange('target_partner_name', e.target.value)} placeholder="主播/达人/MCN/代运营/品牌名称" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-700 mb-1.5">平台已收录档案</span>
                <select value={form.target_partner_id} onChange={(e) => handlePartnerSelect(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">选择已收录合作方（可选）</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>{partner.displayName} ({partner.id})</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-700 mb-1.5">计划合作方式</span>
                <select value={form.planned_cooperation_model} onChange={(e) => handleChange('planned_cooperation_model', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">请选择合作方式</option>
                  {COOPERATION_MODELS.map((model) => <option key={model} value={model}>{model}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-gray-700 mb-1.5">预算范围</span>
                <select value={form.budget_range} onChange={(e) => handleChange('budget_range', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">请选择预算范围</option>
                  {BUDGET_RANGES.map((budget) => <option key={budget} value={budget}>{budget}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-5">主要关注点</h2>
            <textarea
              value={form.main_concerns}
              onChange={(e) => handleChange('main_concerns', e.target.value)}
              rows={4}
              placeholder="例如：想核验真实带货数据、历史回款记录、履约争议、粉丝画像是否匹配、是否存在刷单或退货异常。"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {message && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              {message}
            </div>
          )}

          <button type="submit" disabled={submitting} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all disabled:opacity-60 text-sm">
            {submitting ? '正在提交...' : '提交尽调申请'}
          </button>
        </form>
      </div>
    </div>
  );
}
