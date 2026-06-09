import { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AlertCircle, CheckCircle, ChevronLeft, Download, FileText, Link2, ShieldCheck, Upload, Users } from 'lucide-react';
import { insertCreatorProfile } from '../lib/database';

interface Props {
  onNavigate: (page: string) => void;
  user?: User;
}

type PartnerRole = 'creator' | 'mcn' | 'brand' | 'service';

const ROLE_OPTIONS: Array<{ key: PartnerRole; label: string; desc: string }> = [
  { key: 'creator', label: '达人/主播', desc: '个人账号、主播、内容达人' },
  { key: 'mcn', label: 'MCN/机构', desc: '达人经纪、内容机构、直播机构' },
  { key: 'brand', label: '品牌方', desc: '有产品、预算和合作需求' },
  { key: 'service', label: '合作服务商', desc: '代运营、投流、分销、供应链等' },
];

const PLATFORM_OPTIONS = ['抖音', '小红书', '快手', '淘宝直播', '视频号', 'B站', '其他'];
const PRICE_BANDS = ['0-49 元', '50-99 元', '100-199 元', '200-499 元', '500 元以上'];
const PAYMENT_CYCLES = ['7 天内', '15 天内', '30 天内', '60 天内', '超过 60 天'];
const SETTLEMENT_OPTIONS = ['有合同、对账单、发票/收据', '有合同和对账单', '仅线上确认', '不固定'];
const ISSUE_OPTIONS = ['无', '有争议但已解决', '有未解决争议'];
const FULFILLMENT_OPTIONS = ['按约完成，无延迟', '偶有延迟，已提前沟通', '存在未按约发布/交付'];
const RELATION_OPTIONS = ['签约达人', '独家代理', '商务代理', '内容合作', '店播/代运营', '无MCN/个人自营'];

const initialForm = {
  partnerRole: '' as '' | PartnerRole,
  contactName: '',
  phone: '',
  city: '',
  companyName: '',
  businessLicenseCode: '',
  contractEntity: '',
  mainPlatform: '',
  platformId: '',
  bio: '',

  creatorName: '',
  entityType: '个人',
  mcnName: '',
  mcnCompanyName: '',
  mcnBusinessLicense: '',
  mcnRelationType: '签约达人',
  mcnContact: '',
  followers: '',
  priceBand: '',
  audienceCategories: '',
  genderRatio: '',
  activeFollowers: '',
  avgLikes: '',
  engagementRate: '',
  buyingPower: '',
  gmv90: '',
  refundRate: '',
  conversionRate: '',
  roi: '',

  mcnTalentCount: '',
  mcnTopCreators: '',
  mcnCategories: '',
  mcnServiceModels: '',

  brandName: '',
  brandCategory: '',
  productPriceBand: '',
  monthlyBudget: '',
  cooperationGoals: '',
  targetCreators: '',

  serviceType: '',
  serviceCases: '',
  serviceCoverage: '',
  servicePricing: '',

  pastPartners: '',
  pricing: '',
  preferredProducts: '',
  blockedCategories: '',
  successCases: '',
  paymentCycle: '',
  settlementStandard: '',
  paymentIssues: '',
  fulfillment: '',
  controversy: '',
  truthConsent: false,
};

type OnboardingForm = typeof initialForm;
type FieldKey = keyof OnboardingForm;

const requiredByRole: Record<PartnerRole, FieldKey[]> = {
  creator: [
    'partnerRole', 'contactName', 'phone', 'creatorName', 'mainPlatform', 'platformId', 'bio',
    'mcnName', 'mcnCompanyName', 'mcnRelationType', 'followers', 'priceBand', 'audienceCategories',
    'genderRatio', 'gmv90', 'refundRate', 'conversionRate', 'roi', 'pastPartners', 'pricing',
    'preferredProducts', 'successCases', 'paymentCycle', 'settlementStandard', 'paymentIssues',
    'fulfillment', 'truthConsent',
  ],
  mcn: [
    'partnerRole', 'contactName', 'phone', 'companyName', 'mcnName', 'businessLicenseCode',
    'mcnTalentCount', 'mcnCategories', 'mcnServiceModels', 'mainPlatform', 'pastPartners',
    'successCases', 'paymentCycle', 'settlementStandard', 'paymentIssues', 'truthConsent',
  ],
  brand: [
    'partnerRole', 'contactName', 'phone', 'brandName', 'companyName', 'brandCategory',
    'productPriceBand', 'monthlyBudget', 'cooperationGoals', 'targetCreators', 'truthConsent',
  ],
  service: [
    'partnerRole', 'contactName', 'phone', 'companyName', 'serviceType', 'serviceCoverage',
    'serviceCases', 'servicePricing', 'truthConsent',
  ],
};

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

function isFilled(value: OnboardingForm[FieldKey]) {
  if (typeof value === 'boolean') return value;
  return String(value).trim().length > 0;
}

function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-400"> *</span>}
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} placeholder={placeholder} required={required} />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  required,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} resize-none`} rows={rows} placeholder={placeholder} required={required} />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} required={required}>
        <option value="">请选择</option>
        {options.map((item) => <option key={item}>{item}</option>)}
      </select>
    </div>
  );
}

export default function CreatorOnboardingPage({ onNavigate, user }: Props) {
  const [form, setForm] = useState<OnboardingForm>(initialForm);
  const [editingProfileId, setEditingProfileId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const raw = window.sessionStorage.getItem('channellens_edit_profile');
    if (!raw) return;

    try {
      const profile = JSON.parse(raw) as Partial<OnboardingForm> & { id?: string };
      setForm({ ...initialForm, ...profile });
      setEditingProfileId(profile.id || '');
      window.sessionStorage.removeItem('channellens_edit_profile');
    } catch {
      window.sessionStorage.removeItem('channellens_edit_profile');
    }
  }, []);

  const activeRequired = form.partnerRole ? requiredByRole[form.partnerRole] : (['partnerRole'] as FieldKey[]);
  const completion = useMemo(() => {
    const filled = activeRequired.filter((key) => isFilled(form[key])).length;
    return Math.round((filled / activeRequired.length) * 100);
  }, [activeRequired, form]);

  const completionStage = completion >= 90 ? '可进入合作推荐' : completion >= 70 ? '可提交初审' : completion >= 40 ? '建议补充关键数据' : '先选择身份并填写主体信息';

  function f(patch: Partial<OnboardingForm>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function validate() {
    return activeRequired.every((key) => isFilled(form[key]));
  }

  function subjectChain() {
    if (form.partnerRole === 'creator') {
      return `${form.mcnCompanyName || '未填公司主体'} -> ${form.mcnName || '未填MCN'} -> ${form.creatorName || '未填达人'}`;
    }
    if (form.partnerRole === 'mcn') {
      return `${form.companyName || '未填公司主体'} -> ${form.mcnName || '未填MCN/机构'}`;
    }
    if (form.partnerRole === 'brand') {
      return `${form.companyName || '未填公司主体'} -> ${form.brandName || '未填品牌'}`;
    }
    return `${form.companyName || '未填公司主体'} -> ${form.serviceType || '未填服务商类型'}`;
  }

  function payload() {
    return {
      ...form,
      id: editingProfileId || undefined,
      contractEntity: form.contractEntity || form.mcnCompanyName || form.companyName,
      subjectChain: subjectChain(),
      completion,
      completionStage,
      userId: user?.id,
      userEmail: user?.email,
      submittedAt: new Date().toISOString(),
      reviewReason: editingProfileId ? '用户已补充资料，待平台重新审核。' : undefined,
      status: 'pending',
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      setMessage('请先补齐当前身份下带星号的关键字段。');
      return;
    }

    try {
      const saved = await insertCreatorProfile(payload());
      const existing = JSON.parse(localStorage.getItem('channellens_creator_profiles') ?? '[]');
      const next = editingProfileId
        ? existing.map((item: { id?: string }) => (item.id === editingProfileId ? saved : item))
        : [...existing, saved];
      localStorage.setItem('channellens_creator_profiles', JSON.stringify(next));
      setSubmitted(true);
    } catch {
      setMessage('提交到云端数据库失败，请稍后重试，或联系平台管理员。');
    }
  }

  function exportJson() {
    if (!validate()) {
      setMessage('请先补齐当前身份下带星号的关键字段，再导出资料。');
      return;
    }

    const blob = new Blob([JSON.stringify(payload(), null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.companyName || form.creatorName || form.brandName || 'partner'}-profile.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">已收到合作商入驻资料</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-5">资料已按身份分流保存，后台可以继续审核主体、数据、案例和风险项。</p>
          <div className="text-left bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
            <div className="text-sm font-bold text-gray-900 mb-3">审核进度</div>
            {[
              ['已提交', true],
              ['待平台审核', true],
              ['通过 / 驳回 / 要求补充', false],
              ['生成合作方档案', false],
            ].map(([label, done]) => (
              <div key={String(label)} className="flex items-center gap-2 py-1.5">
                <span className={`w-2 h-2 rounded-full ${done ? 'bg-blue-600' : 'bg-gray-300'}`} />
                <span className={`text-xs ${done ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>{label}</span>
              </div>
            ))}
            <p className="text-xs text-gray-400 mt-3">正式上线后，这里会展示后台审核结果，并可通过短信/站内信提醒用户。</p>
          </div>
          <button onClick={() => onNavigate(user ? 'account' : 'home')} className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            {user ? '查看我的审核状态' : '返回主网站'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => onNavigate('home')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ChevronLeft size={15} />返回主网站
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-800">合作商入驻</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
          <aside className="lg:sticky lg:top-24 bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Quping</p>
                <h1 className="text-lg font-bold text-gray-900">合作商入驻</h1>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">资料完整度</span>
                <span className="text-sm font-bold text-gray-900">{completion}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${completion}%` }} />
              </div>
              <p className="text-xs text-blue-600 font-semibold mt-3">{completionStage}</p>
              <p className="text-xs text-gray-400 mt-1">不同身份的必填字段不同，完整度会按当前身份自动计算。</p>
            </div>

            <div className="space-y-2 text-sm">
              {['身份选择', '基础主体', '业务资料', '案例与数据', '履约与风控'].map((item) => (
                <a key={item} href={`#${item}`} className="block px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900">
                  {item}
                </a>
              ))}
            </div>

            <div className="mt-5 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-2">
              <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">后台会按账号归属、主体工商、合同主体、案例数据、风险标签生成审核清单。</p>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 sm:px-8 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-blue-300 text-xs font-semibold mb-2">按身份填写</p>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">合作商资料表</h2>
                  <p className="text-slate-400 text-sm mt-2">先选择你是谁，再填写对应资料；平台后续用于审核、建档和匹配。</p>
                </div>
                <button type="button" onClick={exportJson} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-colors">
                  <Download size={16} />
                  导出资料
                </button>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-4 bg-blue-50 border-b border-blue-100 flex flex-wrap gap-3">
              <button type="button" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                <Link2 size={16} />
                绑定平台账号
              </button>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 text-blue-700 text-sm font-semibold rounded-xl cursor-pointer hover:bg-blue-50">
                <Upload size={16} />
                上传身份证/营业执照
                <input type="file" className="hidden" multiple />
              </label>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 text-blue-700 text-sm font-semibold rounded-xl cursor-pointer hover:bg-blue-50">
                <FileText size={16} />
                上传授权/案例截图
                <input type="file" className="hidden" multiple />
              </label>
            </div>

            <div className="p-6 sm:p-8 space-y-10">
              <section id="身份选择">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">01 身份选择</h3>
                <div className="grid sm:grid-cols-4 gap-3">
                  {ROLE_OPTIONS.map((role) => (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => f({ partnerRole: role.key })}
                      className={`text-left rounded-xl border p-4 transition-colors ${
                        form.partnerRole === role.key ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-bold">{role.label}</div>
                      <div className="text-xs mt-1 opacity-70 leading-relaxed">{role.desc}</div>
                    </button>
                  ))}
                </div>
              </section>

              <section id="基础主体">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">02 基础主体</h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  <TextInput label="联系人姓名" required value={form.contactName} onChange={(value) => f({ contactName: value })} placeholder="用于审核沟通" />
                  <TextInput label="联系电话" required value={form.phone} onChange={(value) => f({ phone: value })} placeholder="手机号 / 微信" />
                  <TextInput label="所在城市" value={form.city} onChange={(value) => f({ city: value })} placeholder="例如：杭州" />
                  {form.partnerRole !== 'creator' && (
                    <TextInput label="公司主体名称" required={form.partnerRole !== ''} value={form.companyName} onChange={(value) => f({ companyName: value })} placeholder="营业执照上的公司全称" />
                  )}
                  {form.partnerRole !== 'creator' && (
                    <TextInput label="统一社会信用代码" required={form.partnerRole === 'mcn'} value={form.businessLicenseCode} onChange={(value) => f({ businessLicenseCode: value })} placeholder="用于工商核验" />
                  )}
                  <TextInput label="合同签约主体" value={form.contractEntity} onChange={(value) => f({ contractEntity: value })} placeholder="不填则默认同公司主体" />
                </div>
              </section>

              {form.partnerRole === 'creator' && (
                <>
                  <section id="业务资料">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">03 达人资料</h3>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <TextInput label="博主/主播名称" required value={form.creatorName} onChange={(value) => f({ creatorName: value })} placeholder="例如：小林测评" />
                      <SelectInput label="主平台" required value={form.mainPlatform} onChange={(value) => f({ mainPlatform: value })} options={PLATFORM_OPTIONS} />
                      <TextInput label="平台账号 ID" required value={form.platformId} onChange={(value) => f({ platformId: value })} placeholder="主页 ID / UID / 店播账号" />
                      <SelectInput label="主体类型" value={form.entityType} onChange={(value) => f({ entityType: value })} options={['个人', '个体工商户', '公司/机构', 'MCN 代运营']} />
                      <TextArea label="个人简介" required value={form.bio} onChange={(value) => f({ bio: value })} placeholder="内容方向、主要受众、合作优势" rows={4} />
                    </div>
                  </section>

                  <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <h3 className="text-sm font-bold text-blue-900 mb-1">MCN / 公司主体关联</h3>
                    <p className="text-xs text-blue-700 mb-5">建立「公司主体 → MCN/机构 → 达人」链路。</p>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <TextInput label="MCN / 机构名称" required value={form.mcnName} onChange={(value) => f({ mcnName: value })} />
                      <TextInput label="公司主体名称" required value={form.mcnCompanyName} onChange={(value) => f({ mcnCompanyName: value })} />
                      <TextInput label="统一社会信用代码" value={form.mcnBusinessLicense} onChange={(value) => f({ mcnBusinessLicense: value })} />
                      <SelectInput label="达人-MCN关系" required value={form.mcnRelationType} onChange={(value) => f({ mcnRelationType: value })} options={RELATION_OPTIONS} />
                      <TextInput label="MCN商务联系人" value={form.mcnContact} onChange={(value) => f({ mcnContact: value })} />
                    </div>
                  </section>
                </>
              )}

              {form.partnerRole === 'mcn' && (
                <section id="业务资料">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">03 MCN/机构资料</h3>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <TextInput label="MCN / 机构名称" required value={form.mcnName} onChange={(value) => f({ mcnName: value })} />
                    <SelectInput label="主要平台" required value={form.mainPlatform} onChange={(value) => f({ mainPlatform: value })} options={PLATFORM_OPTIONS} />
                    <TextInput label="签约/合作达人数量" required value={form.mcnTalentCount} onChange={(value) => f({ mcnTalentCount: value })} placeholder="例如：300+" />
                    <TextInput label="优势类目" required value={form.mcnCategories} onChange={(value) => f({ mcnCategories: value })} placeholder="例如：美妆、食品、家清" />
                    <TextInput label="服务模式" required value={form.mcnServiceModels} onChange={(value) => f({ mcnServiceModels: value })} placeholder="如：达人分发、店播、代运营、招商" />
                    <TextArea label="代表达人/账号" value={form.mcnTopCreators} onChange={(value) => f({ mcnTopCreators: value })} placeholder="可填写代表达人、账号ID、案例链接" />
                  </div>
                </section>
              )}

              {form.partnerRole === 'brand' && (
                <section id="业务资料">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">03 品牌方资料</h3>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <TextInput label="品牌名称" required value={form.brandName} onChange={(value) => f({ brandName: value })} />
                    <TextInput label="产品类目" required value={form.brandCategory} onChange={(value) => f({ brandCategory: value })} placeholder="例如：美妆、食品、服装" />
                    <SelectInput label="产品价格带" required value={form.productPriceBand} onChange={(value) => f({ productPriceBand: value })} options={PRICE_BANDS} />
                    <TextInput label="月度合作预算" required value={form.monthlyBudget} onChange={(value) => f({ monthlyBudget: value })} placeholder="例如：10万-30万" />
                    <TextInput label="合作目标" required value={form.cooperationGoals} onChange={(value) => f({ cooperationGoals: value })} placeholder="如：带货、种草、分销招商" />
                    <TextArea label="希望合作的达人类型" required value={form.targetCreators} onChange={(value) => f({ targetCreators: value })} />
                  </div>
                </section>
              )}

              {form.partnerRole === 'service' && (
                <section id="业务资料">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">03 合作服务商资料</h3>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <TextInput label="服务商类型" required value={form.serviceType} onChange={(value) => f({ serviceType: value })} placeholder="如：代运营、投流、供应链、分销" />
                    <TextInput label="服务覆盖范围" required value={form.serviceCoverage} onChange={(value) => f({ serviceCoverage: value })} placeholder="平台/类目/地区" />
                    <TextInput label="收费方式" required value={form.servicePricing} onChange={(value) => f({ servicePricing: value })} placeholder="服务费、佣金、项目制等" />
                    <TextArea label="服务案例" required value={form.serviceCases} onChange={(value) => f({ serviceCases: value })} />
                  </div>
                </section>
              )}

              <section id="案例与数据">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">04 案例与数据</h3>
                <div className="grid sm:grid-cols-2 gap-5">
                  <TextArea label="合作过的品牌/商家" required={form.partnerRole === 'creator' || form.partnerRole === 'mcn'} value={form.pastPartners} onChange={(value) => f({ pastPartners: value })} />
                  <TextInput label="报价/收费方式" required={form.partnerRole === 'creator'} value={form.pricing} onChange={(value) => f({ pricing: value })} placeholder="坑位费、佣金、服务费等" />
                  <TextInput label="期待合作产品" required={form.partnerRole === 'creator'} value={form.preferredProducts} onChange={(value) => f({ preferredProducts: value })} />
                  <TextInput label="不可合作类目" value={form.blockedCategories} onChange={(value) => f({ blockedCategories: value })} />
                  <div className="sm:col-span-2">
                    <TextArea label="成功案例" required={form.partnerRole === 'creator' || form.partnerRole === 'mcn'} value={form.successCases} onChange={(value) => f({ successCases: value })} rows={4} />
                  </div>

                  {form.partnerRole === 'creator' && (
                    <>
                      <TextInput label="粉丝量" required value={form.followers} onChange={(value) => f({ followers: value })} type="number" />
                      <SelectInput label="粉丝主要价格带" required value={form.priceBand} onChange={(value) => f({ priceBand: value })} options={PRICE_BANDS} />
                      <TextInput label="粉丝主要类目偏好" required value={form.audienceCategories} onChange={(value) => f({ audienceCategories: value })} />
                      <TextInput label="粉丝性别比例" required value={form.genderRatio} onChange={(value) => f({ genderRatio: value })} />
                      <TextInput label="近 90 天真实 GMV" required value={form.gmv90} onChange={(value) => f({ gmv90: value })} />
                      <TextInput label="平均退货率" required value={form.refundRate} onChange={(value) => f({ refundRate: value })} />
                      <TextInput label="平均转化率" required value={form.conversionRate} onChange={(value) => f({ conversionRate: value })} />
                      <TextInput label="平均 ROI" required value={form.roi} onChange={(value) => f({ roi: value })} />
                    </>
                  )}
                </div>
              </section>

              {(form.partnerRole === 'creator' || form.partnerRole === 'mcn') && (
                <section id="履约与风控">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-5 pb-2 border-b border-gray-100">05 履约与风控</h3>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <SelectInput label="历史回款账期" required value={form.paymentCycle} onChange={(value) => f({ paymentCycle: value })} options={PAYMENT_CYCLES} />
                    <SelectInput label="结算流程是否规范" required value={form.settlementStandard} onChange={(value) => f({ settlementStandard: value })} options={SETTLEMENT_OPTIONS} />
                    <SelectInput label="是否有扣款/赖账记录" required value={form.paymentIssues} onChange={(value) => f({ paymentIssues: value })} options={ISSUE_OPTIONS} />
                    {form.partnerRole === 'creator' && <SelectInput label="历史履约情况" required value={form.fulfillment} onChange={(value) => f({ fulfillment: value })} options={FULFILLMENT_OPTIONS} />}
                    <div className="sm:col-span-2">
                      <TextArea label="黑历史或争议说明" value={form.controversy} onChange={(value) => f({ controversy: value })} />
                    </div>
                  </div>
                </section>
              )}

              <label className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-100 rounded-xl cursor-pointer">
                <input checked={form.truthConsent} onChange={(e) => f({ truthConsent: e.target.checked })} type="checkbox" className="mt-1 rounded border-gray-300 text-blue-600" required />
                <span className="text-sm text-amber-800">
                  我确认以上信息真实，并同意平台进行账号数据、主体工商、合同履约和风险审核。<span className="text-red-400"> *</span>
                </span>
              </label>

              {message && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{message}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm">
                  提交入驻资料
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
