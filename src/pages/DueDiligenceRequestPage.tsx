import { useState } from 'react';
import { CheckCircle, FileText, Search, Shield } from 'lucide-react';
import { useCSVData } from '../lib/CSVDataContext';

interface DueDiligenceRequestPageProps {
  onNavigate: (page: string) => void;
}

const REPORT_TYPES = [
  {
    id: 'basic',
    label: '基础版',
    price: '免费',
    desc: '基于平台公开资料整理，含合作方档案摘要、公开风险标签、已验证评分汇总',
    features: ['合作方基础档案', '公开风险标签', '已验证评分汇总', '平台数据截图'],
    turnaround: '1 个工作日',
    icon: FileText,
    color: 'border-gray-200 bg-white',
    labelColor: 'bg-gray-100 text-gray-600',
  },
  {
    id: 'standard',
    label: '标准版',
    price: '¥299',
    desc: '在基础版基础上增加工商信息核验、历史合作案例交叉比对，适合中等体量合作',
    features: ['基础版全部内容', '工商信息核验', '历史案例交叉比对', '平台口碑梳理', '合作建议摘要'],
    turnaround: '3 个工作日',
    icon: Search,
    color: 'border-blue-200 bg-blue-50/30',
    labelColor: 'bg-blue-100 text-blue-700',
    recommended: true,
  },
  {
    id: 'deep',
    label: '深度版',
    price: '面议',
    desc: '包含人工访谈、多渠道交叉核实、完整风险评估报告，适合大额预算合作前尽调',
    features: ['标准版全部内容', '多渠道人工访谈', '完整风险评估报告', '合同条款建议', '专属顾问对接'],
    turnaround: '5–7 个工作日',
    icon: Shield,
    color: 'border-gray-200 bg-white',
    labelColor: 'bg-slate-100 text-slate-600',
  },
];

const COOPERATION_MODELS = ['直播带货', '短视频挂车', '图文种草', '私域裂变', '分销代理', '全案代运营', '其他'];
const BUDGET_RANGES = ['5万以下', '5–20万', '20–50万', '50–100万', '100万以上'];
const PRODUCT_CATEGORIES = ['美妆个护', '服饰配饰', '食品饮料', '数码家电', '家居家装', '母婴育儿', '健康保健', '宠物用品', '运动户外', '其他'];

export default function DueDiligenceRequestPage({ onNavigate }: DueDiligenceRequestPageProps) {
  const { partners } = useCSVData();
  const [selectedType, setSelectedType] = useState('standard');
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
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
  });

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, expected_report_type: selectedType, submittedAt: new Date().toISOString() };
    const existing = JSON.parse(localStorage.getItem('dd_requests') ?? '[]');
    localStorage.setItem('dd_requests', JSON.stringify([...existing, payload]));
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">申请已提交</h2>
          <p className="text-sm text-gray-500 mb-3 leading-relaxed">
            我们已收到您的尽调报告申请，将在 1 个工作日内与您联系确认需求。
          </p>
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-8 leading-relaxed">
            当前为 MVP 测试版，申请数据暂存于本地。正式服务将在后台系统上线后开放。
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onNavigate('list')}
              className="w-full px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition-colors text-sm"
            >
              浏览合作方数据库
            </button>
            <button
              onClick={() => { setSubmitted(false); setForm({ brand_name: '', contact: '', target_partner_name: '', target_partner_id: '', product_category: '', product_price_range: '', planned_cooperation_model: '', budget_range: '', main_concerns: '', expected_report_type: 'standard' }); setSelectedType('standard'); }}
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <Shield size={12} />
            人工尽调服务
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">申请尽调报告</h1>
          <p className="text-sm text-gray-500 max-w-xl leading-relaxed">
            在正式合作前，由平台协助核验合作方信息、梳理潜在风险，生成结构化尽调报告供品牌决策参考。
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Report type selector */}
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
                  onClick={() => { setSelectedType(type.id); setForm((prev) => ({ ...prev, expected_report_type: type.id })); }}
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
                    {type.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className={`w-1 h-1 rounded-full shrink-0 ${isSelected ? 'bg-blue-500' : 'bg-gray-400'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 text-xs text-gray-400">预计交付：{type.turnaround}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded flex items-center justify-center">1</span>
              品牌方信息
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">品牌 / 公司名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.brand_name}
                  onChange={(e) => handleChange('brand_name', e.target.value)}
                  placeholder="请输入品牌或公司名称"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">联系方式 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.contact}
                  onChange={(e) => handleChange('contact', e.target.value)}
                  placeholder="手机号 / 微信 / 邮箱"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">产品类目</label>
                <select
                  value={form.product_category}
                  onChange={(e) => handleChange('product_category', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">请选择产品类目</option>
                  {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">产品客单价</label>
                <input
                  type="text"
                  value={form.product_price_range}
                  onChange={(e) => handleChange('product_price_range', e.target.value)}
                  placeholder="如：99–299元"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Target partner info */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded flex items-center justify-center">2</span>
              尽调对象信息
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">合作方名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.target_partner_name}
                  onChange={(e) => handleChange('target_partner_name', e.target.value)}
                  placeholder="主播/达人/MCN/代运营名称"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">平台档案 ID（如已收录）</label>
                <select
                  value={form.target_partner_id}
                  onChange={(e) => handlePartnerSelect(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">选择平台已收录合作方（可选）</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.displayName} ({p.id})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">选择后将自动关联已有档案数据</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">计划合作方式</label>
                <select
                  value={form.planned_cooperation_model}
                  onChange={(e) => handleChange('planned_cooperation_model', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">请选择合作方式</option>
                  {COOPERATION_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">预算范围</label>
                <select
                  value={form.budget_range}
                  onChange={(e) => handleChange('budget_range', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">请选择预算范围</option>
                  {BUDGET_RANGES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Main concerns */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2">
              <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded flex items-center justify-center">3</span>
              主要关注点
            </h2>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">请描述您最希望通过尽调了解的问题</label>
              <textarea
                value={form.main_concerns}
                onChange={(e) => handleChange('main_concerns', e.target.value)}
                rows={4}
                placeholder="例如：关注该主播的真实带货数据是否注水、历史合作品牌的货款结算情况、是否存在与竞品同期合作的冲突..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 mt-1.5">描述越详细，报告针对性越强</p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-xs text-amber-700 leading-relaxed">
            <strong>当前为 MVP 测试版：</strong>申请数据将暂存于本地浏览器，正式尽调服务将在后台系统上线后开放。我们会在 1 个工作日内通过您提供的联系方式与您沟通需求确认。
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.99] text-sm"
          >
            提交尽调申请
          </button>
        </form>
      </div>
    </div>
  );
}
