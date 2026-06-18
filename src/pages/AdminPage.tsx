import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  FileUp,
  History,
  Loader2,
  Plus,
  Save,
  ShieldAlert,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useCSVData } from '../lib/CSVDataContext';
import {
  createEvidenceFileUrl,
  deleteAdminPartner,
  deleteCooperationReview,
  deleteCreatorProfile,
  deleteDueDiligenceRequest,
  deleteRegistrationRequest,
  fetchAdminPartners,
  fetchAuditLogs,
  fetchCooperationReviews,
  fetchCreatorProfiles,
  fetchDueDiligenceRequests,
  fetchRegistrationRequests,
  insertAuditLog,
  isSupabaseConfigured,
  upsertAdminPartners,
  upsertCooperationReviews,
  upsertCreatorProfiles,
  upsertDueDiligenceRequests,
  upsertRegistrationRequests,
} from '../lib/database';
import type { Partner } from '../types';

type AdminTab = 'overview' | 'partners' | 'creatorProfiles' | 'reviews' | 'dueDiligence' | 'registrationRequests' | 'import' | 'auditLogs';
type Visibility = 'internal' | 'pending_public' | 'public' | 'archived';
type AdminPartner = Partner & {
  adminVisibility?: Visibility;
  adminNotes?: string;
};

type LocalReview = Record<string, unknown> & {
  id: string;
  brandName?: string;
  isAnonymous?: boolean;
  reviewText?: string;
  cooperationDate?: string;
  createdAt?: string;
  partnerNameFree?: string;
  evidenceFiles?: string[];
  evidenceFilePaths?: string[];
  evidenceFileMeta?: Array<{ name?: string; path?: string; size?: number; type?: string }>;
  evidenceNote?: string;
  evidenceReviewNote?: string;
  evidenceReviewedAt?: string;
  reviewStatus?: string;
  evidenceStatus?: string;
  submittedAt?: string;
};

type CreatorProfile = Record<string, unknown> & {
  partnerRole?: string;
  contactName?: string;
  creatorName?: string;
  brandName?: string;
  companyName?: string;
  businessLicenseCode?: string;
  mainPlatform?: string;
  platformId?: string;
  mcnName?: string;
  mcnCompanyName?: string;
  mcnBusinessLicense?: string;
  mcnRelationType?: string;
  mcnContact?: string;
  contractEntity?: string;
  subjectChain?: string;
  completion?: number;
  completionStage?: string;
  followers?: string;
  brandCategory?: string;
  productPriceBand?: string;
  monthlyBudget?: string;
  cooperationGoals?: string;
  targetCreators?: string;
  serviceType?: string;
  serviceCoverage?: string;
  servicePricing?: string;
  serviceCases?: string;
  mcnTalentCount?: string;
  mcnCategories?: string;
  mcnServiceModels?: string;
  preferredProducts?: string;
  gmv90?: string;
  roi?: string;
  paymentCycle?: string;
  paymentIssues?: string;
  fulfillment?: string;
  status?: string;
  reviewReason?: string;
  reviewNote?: string;
  reviewedAt?: string;
  submittedAt?: string;
  identityFileNames?: string[];
  identityFilePaths?: string[];
  identityFileMeta?: Array<{ name?: string; path?: string; size?: number; type?: string }>;
  caseFileNames?: string[];
  caseFilePaths?: string[];
  caseFileMeta?: Array<{ name?: string; path?: string; size?: number; type?: string }>;
};

type DueDiligenceRequest = Record<string, unknown> & {
  id: string;
  brand_name?: string;
  contact?: string;
  target_partner_name?: string;
  target_partner_id?: string;
  product_category?: string;
  planned_cooperation_model?: string;
  budget_range?: string;
  main_concerns?: string;
  expected_report_type?: string;
  reportType?: string;
  reportPrice?: string;
  status?: string;
  submittedAt?: string;
};

type RegistrationRequest = Record<string, unknown> & {
  id: string;
  name?: string;
  email?: string;
  contact?: string;
  applicantType?: string;
  organization?: string;
  intent?: string;
  note?: string;
  status?: string;
  submittedAt?: string;
  reviewedAt?: string;
};

type AuditLog = Record<string, unknown> & {
  id: string;
  actionType: string;
  targetType: string;
  targetId: string;
  targetName: string;
  result: string;
  note?: string;
  createdAt: string;
};

type AuditInput = {
  actionType: string;
  targetType: string;
  targetId: string;
  targetName: string;
  result: string;
  note?: string;
};

type ImportMode = 'upsert' | 'skip' | 'replace';

type PartnerImportPreview = {
  partner: AdminPartner;
  action: 'create' | 'update' | 'skip';
  reason: string;
};

const PARTNER_STORAGE_KEY = 'channellens_admin_partners';
const CREATOR_STORAGE_KEY = 'channellens_creator_profiles';
const REVIEW_STORAGE_KEY = 'channellens_reviews';
const DUE_DILIGENCE_STORAGE_KEY = 'dd_requests';
const REGISTRATION_REQUEST_STORAGE_KEY = 'channellens_registration_requests';
const DELETED_CREATOR_STORAGE_KEY = 'channellens_deleted_creator_profiles';
const DELETED_REVIEW_STORAGE_KEY = 'channellens_deleted_reviews';
const DELETED_DUE_DILIGENCE_STORAGE_KEY = 'channellens_deleted_due_diligence_requests';
const DELETED_DUE_DILIGENCE_FINGERPRINTS_STORAGE_KEY = 'channellens_deleted_due_diligence_fingerprints';
const DELETED_REGISTRATION_REQUEST_STORAGE_KEY = 'channellens_deleted_registration_requests';
const AUDIT_LOG_STORAGE_KEY = 'channellens_admin_audit_logs';

const verificationOptions = ['未核验', '部分核验', '已核验'];
const visibilityOptions: Visibility[] = ['internal', 'pending_public', 'public', 'archived'];
const visibilityLabels: Record<Visibility, string> = {
  internal: '内部',
  pending_public: '待公开',
  public: '公开',
  archived: '下架',
};
const statusOptions = ['pending', 'verified', 'needs_info', 'rejected', 'disputed'];

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  verified: { label: '已验证', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  rejected: { label: '已驳回', color: 'bg-gray-50 text-gray-500 border-gray-100' },
  disputed: { label: '争议中', color: 'bg-red-50 text-red-700 border-red-100' },
  needs_info: { label: '要求补充', color: 'bg-blue-50 text-blue-700 border-blue-100' },
};

const roleLabels: Record<string, string> = {
  creator: '达人/主播',
  mcn: 'MCN/机构',
  brand: '品牌方',
  service: '合作服务商',
};

const dueDiligenceTypeLabels: Record<string, string> = {
  basic: '基础版 ¥99',
  standard: '标准版 ¥399',
  deep: '深度版 ¥999',
};

function normalizeVerificationStatus(value: string) {
  if (value.includes('部分')) return '部分核验';
  if (value.includes('已')) return '已核验';
  return '未核验';
}

function toEditablePartner(partner: Partner): AdminPartner {
  return {
    ...partner,
    verificationStatus: normalizeVerificationStatus(partner.verificationStatus) as Partner['verificationStatus'],
    adminVisibility: 'internal',
    adminNotes: '',
  };
}

function parseStoredArray<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function mergeById<T extends Record<string, unknown>>(primary: T[], fallback: T[]) {
  const seen = new Set<string>();
  const merged: T[] = [];

  [...primary, ...fallback].forEach((item, index) => {
    const id = typeof item.id === 'string' ? item.id : `LOCAL_${index}`;
    if (seen.has(id)) return;
    seen.add(id);
    merged.push(item);
  });

  return merged;
}

function stableHash(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function dueDiligenceFingerprint(request: DueDiligenceRequest) {
  return [
    request.submittedAt,
    request.brand_name,
    request.contact,
    request.target_partner_name,
    request.expected_report_type ?? request.reportType,
  ].map((value) => String(value ?? '').trim()).join('|');
}

function normalizeDueDiligenceRequests(requests: DueDiligenceRequest[]) {
  const seen = new Set<string>();
  return requests.reduce<DueDiligenceRequest[]>((acc, request, index) => {
    const fingerprint = dueDiligenceFingerprint(request);
    const id = typeof request.id === 'string' && request.id.trim()
      ? request.id
      : `DD_LEGACY_${stableHash(fingerprint || `row-${index}`)}`;
    const dedupeKey = fingerprint || id;
    if (seen.has(dedupeKey)) return acc;
    seen.add(dedupeKey);
    acc.push({ ...request, id });
    return acc;
  }, []);
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
  labels,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  labels?: Record<string, string>;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function splitTags(value: string) {
  return value
    .split(/[，,;；\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function asVisibility(value: unknown): Visibility {
  const text = String(value ?? '').trim();
  if (text === 'public' || text === '公开') return 'public';
  if (text === 'pending_public' || text === '待公开') return 'pending_public';
  if (text === 'archived' || text === '下架') return 'archived';
  return 'internal';
}

function visibilityBadgeClass(visibility: Visibility) {
  if (visibility === 'public') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  if (visibility === 'pending_public') return 'text-blue-700 bg-blue-50 border-blue-100';
  if (visibility === 'archived') return 'text-gray-500 bg-gray-50 border-gray-200';
  return 'text-gray-500 bg-gray-50 border-gray-100';
}

function rowValue(row: Record<string, unknown>, keys: string[]) {
  const normalized = new Map(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value]));

  for (const key of keys) {
    const value = row[key] ?? normalized.get(key.trim().toLowerCase());
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function importPartnerFromRow(row: Record<string, unknown>, index: number): AdminPartner {
  const legalEntity = rowValue(row, ['legalEntity', 'company', 'companyName', '公司主体', '公司名称', '主体名称']);
  const displayName = rowValue(row, ['displayName', 'name', '品牌名', '简称', '展示名称']) || legalEntity || `Imported partner ${index + 1}`;
  const creditCode = rowValue(row, ['unifiedSocialCreditCode', 'creditCode', '统一社会信用代码']);
  const idSeed = creditCode || legalEntity || displayName || `IMPORT_${index + 1}`;
  const id = rowValue(row, ['id', 'partner_id', 'ID']) || `COMPANY_${idSeed.replace(/[^\w]+/g, '_').toUpperCase()}`;
  const partnerType = splitTags(rowValue(row, ['partnerType', '类型', '机构类型']) || 'MCN/机构');
  const riskTags = splitTags(rowValue(row, ['riskTags', '风险标签']));
  const scoreText = rowValue(row, ['overall', 'score', '综合评分', '合作适配指数']);
  const overall = Number(scoreText) || 90;
  const now = new Date().toISOString().slice(0, 10);

  return {
    id,
    name: displayName,
    entityType: 'company',
    displayName,
    legalEntity,
    companyType: rowValue(row, ['companyType', '企业类型']),
    registeredCapital: rowValue(row, ['registeredCapital', '注册资本']),
    foundedDate: rowValue(row, ['foundedDate', '成立日期']),
    approvalDate: rowValue(row, ['approvalDate', '核准日期']),
    address: rowValue(row, ['address', '住址', '地址']),
    businessScope: rowValue(row, ['businessScope', '经营范围']),
    businessStatus: rowValue(row, ['businessStatus', '经营状态']) || '在营',
    businessInfoSource: rowValue(row, ['businessInfoSource', '工商信息来源']) || '企信通',
    roleTitle: rowValue(row, ['roleTitle', '角色']) || 'MCN/机构',
    city: rowValue(row, ['city', '所在地', '城市']),
    coverageArea: splitTags(rowValue(row, ['coverageArea', '覆盖区域']) || '全国'),
    partnerType,
    platforms: splitTags(rowValue(row, ['platforms', '平台'])),
    categories: splitTags(rowValue(row, ['categories', '类目', '所属行业'])),
    priceRange: rowValue(row, ['priceRange', '价格带']),
    cooperationModels: splitTags(rowValue(row, ['cooperationModels', '合作模式']) || '直播带货'),
    typicalFeeRange: rowValue(row, ['typicalFeeRange', '收费']),
    customerProfile: rowValue(row, ['customerProfile', '粉丝画像']),
    salesScenario: rowValue(row, ['salesScenario', '销售场景']),
    verificationStatus: '已核验' as Partner['verificationStatus'],
    riskLevel: (rowValue(row, ['riskLevel', '风险等级']) || 'low') as Partner['riskLevel'],
    riskTags,
    scores: {
      authenticity: Number(rowValue(row, ['authenticity'])) || overall,
      fulfillment: Number(rowValue(row, ['fulfillment'])) || overall,
      categoryFit: Number(rowValue(row, ['categoryFit'])) || overall,
      conversionFeedback: Number(rowValue(row, ['conversionFeedback'])) || overall,
      riskControl: Number(rowValue(row, ['riskControl'])) || overall,
      dataCompleteness: Number(rowValue(row, ['dataCompleteness'])) || overall,
      overall,
    },
    publicCases: rowValue(row, ['publicCases', '公开案例']),
    caseVerificationStatus: rowValue(row, ['caseVerificationStatus', '案例核验状态']) || '已核验',
    publicCaseSource: rowValue(row, ['publicCaseSource', '案例来源']),
    publicCaseVerificationNote: rowValue(row, ['publicCaseVerificationNote', '案例核验备注']),
    dataSource: rowValue(row, ['dataSource', '数据来源']) || '企信通',
    description: rowValue(row, ['description', '简介']),
    followerCount: rowValue(row, ['followerCount', '达人数量']),
    engagementRate: rowValue(row, ['engagementRate']),
    updatedAt: rowValue(row, ['updatedAt', '档案更新时间']) || now,
    adminVisibility: asVisibility(rowValue(row, ['adminVisibility', 'visibility', '可见性'])),
    adminNotes: rowValue(row, ['adminNotes', '后台备注']),
  };
}

function partnerMatchKey(partner: AdminPartner) {
  const partnerRecord = partner as Record<string, unknown>;
  return String(
    partnerRecord.unifiedSocialCreditCode ||
    partnerRecord.businessLicenseCode ||
    partner.legalEntity ||
    partner.displayName ||
    partner.id
  ).trim().toLowerCase();
}

function buildPartnerImportPreview(rows: Array<Record<string, unknown>>, partners: AdminPartner[], mode: ImportMode): PartnerImportPreview[] {
  const existingById = new Map(partners.map((partner) => [partner.id, partner]));
  const existingByKey = new Map<string, AdminPartner>(
    partners
      .map((partner): [string, AdminPartner] => [partnerMatchKey(partner), partner])
      .filter(([key]) => Boolean(key))
  );

  return rows.map((row, index) => {
    const partner = importPartnerFromRow(row, index);
    const matched = existingById.get(partner.id) || existingByKey.get(partnerMatchKey(partner));
    if (matched && mode === 'skip') {
      return { partner: { ...partner, id: matched.id }, action: 'skip', reason: '已存在，按当前模式跳过' };
    }
    if (matched) {
      return { partner: { ...matched, ...partner, id: matched.id }, action: 'update', reason: '匹配到现有档案，将覆盖更新' };
    }
    return { partner, action: 'create', reason: '新合作方档案' };
  });
}


function serializeRelationships(partner: AdminPartner) {
  return (partner.adminRelationships ?? [])
    .map((rel) => [
      rel.relatedPartnerName,
      rel.relationshipType,
      rel.sourceType,
      rel.verificationStatus,
      rel.notes,
    ].join(' | '))
    .join('\n');
}

function parseRelationships(value: string, partnerId: string): Partner['adminRelationships'] {
  return value
    .split(/\n/)
    .map((line, index) => {
      const [name = '', type = '', source = '', status = '', notes = ''] = line.split('|').map((item) => item.trim());
      if (!name && !type && !source && !status && !notes) return null;
      return {
        id: partnerId + '_REL_' + (index + 1),
        partnerId,
        relatedPartnerId: '',
        relatedPartnerName: name || 'Unnamed relation',
        relationshipType: type || 'Related party',
        sourceType: source || 'Admin edit',
        verificationStatus: status || '未核验',
        notes,
      };
    })
    .filter(Boolean) as Partner['adminRelationships'];
}

function creatorSubjectChain(profile: CreatorProfile) {
  if (profile.subjectChain) return String(profile.subjectChain);
  if (profile.partnerRole === 'brand') return `${profile.companyName || '未填公司主体'} -> ${profile.brandName || '未填品牌'}`;
  if (profile.partnerRole === 'service') return `${profile.companyName || '未填公司主体'} -> ${profile.serviceType || '未填服务类型'}`;
  if (profile.partnerRole === 'mcn') return `${profile.companyName || '未填公司主体'} -> ${profile.mcnName || '未填MCN/机构'}`;
  return `${profile.mcnCompanyName || '未填公司主体'} -> ${profile.mcnName || '未填MCN'} -> ${profile.creatorName || '未填达人'}`;
}

function reviewChecklist(profile: CreatorProfile) {
  const role = profile.partnerRole || 'creator';
  const checklist = [
    { label: '主体信息完整', done: Boolean(profile.companyName || profile.mcnCompanyName) },
    { label: '联系人可沟通', done: Boolean(profile.contactName && profile.phone) },
    { label: '合同主体明确', done: Boolean(profile.contractEntity || profile.companyName || profile.mcnCompanyName) },
  ];

  if (role === 'creator') {
    checklist.push(
      { label: '账号归属待核验', done: Boolean(profile.mainPlatform && profile.platformId) },
      { label: 'MCN关系已填写', done: Boolean(profile.mcnName && profile.mcnCompanyName) },
      { label: '带货数据已填写', done: Boolean(profile.gmv90 && profile.roi) },
      { label: '履约/回款已填写', done: Boolean(profile.paymentCycle && profile.fulfillment) },
    );
  } else if (role === 'mcn') {
    checklist.push(
      { label: '工商主体待核验', done: Boolean(profile.businessLicenseCode) },
      { label: '达人规模已填写', done: Boolean(profile.mcnTalentCount) },
      { label: '案例资料已填写', done: Boolean(profile.successCases) },
    );
  } else if (role === 'brand') {
    checklist.push(
      { label: '产品类目已填写', done: Boolean(profile.brandCategory) },
      { label: '预算和目标已填写', done: Boolean(profile.monthlyBudget && profile.cooperationGoals) },
      { label: '目标达人画像已填写', done: Boolean(profile.targetCreators) },
    );
  } else {
    checklist.push(
      { label: '服务类型已填写', done: Boolean(profile.serviceType) },
      { label: '服务案例已填写', done: Boolean(profile.serviceCases) },
      { label: '收费方式已填写', done: Boolean(profile.servicePricing) },
    );
  }

  return checklist;
}

function profileToPartner(profile: CreatorProfile, index: number): AdminPartner {
  const now = new Date().toISOString().slice(0, 10);
  const role = profile.partnerRole || 'creator';
  const displayName =
    role === 'brand'
      ? String(profile.brandName || profile.companyName || '未命名品牌')
      : role === 'service'
        ? String(profile.companyName || profile.serviceType || '未命名服务商')
        : role === 'mcn'
          ? String(profile.mcnName || profile.companyName || '未命名MCN')
          : String(profile.creatorName || '未命名达人');
  const companyName = String(profile.contractEntity || profile.companyName || profile.mcnCompanyName || '');
  const idSeed = `${profile.platformId || displayName || index}`.replace(/\W+/g, '_').toUpperCase();
  const roleType = role === 'brand' ? '品牌方' : role === 'service' ? '合作服务商' : role === 'mcn' ? 'MCN机构' : '主播达人';
  const categories =
    role === 'brand'
      ? String(profile.brandCategory || '').split(/[，,、]/).map((item) => item.trim()).filter(Boolean)
      : role === 'service'
        ? String(profile.serviceCoverage || '').split(/[，,、]/).map((item) => item.trim()).filter(Boolean)
        : role === 'mcn'
          ? String(profile.mcnCategories || '').split(/[，,、]/).map((item) => item.trim()).filter(Boolean)
          : String(profile.preferredProducts || '').split(/[，,、]/).map((item) => item.trim()).filter(Boolean);

  return {
    id: `P_${role.toUpperCase()}_${idSeed || index + 1}`,
    name: displayName,
    entityType: role === 'creator' ? 'person' : 'company',
    displayName,
    legalEntity: companyName,
    businessStatus: '待核验',
    businessInfoSource: profile.businessLicenseCode || profile.mcnBusinessLicense ? '合作商入驻资料：统一社会信用代码' : '合作商入驻资料',
    roleTitle: String(profile.mcnRelationType || roleLabels[role] || '合作商'),
    city: String(profile.city || ''),
    coverageArea: [],
    partnerType: [roleType],
    platforms: profile.mainPlatform ? [String(profile.mainPlatform)] : [],
    categories,
    priceRange: String(profile.priceBand || profile.productPriceBand || ''),
    cooperationModels: [role === 'brand' ? '品牌合作需求' : role === 'service' ? String(profile.serviceType || '服务合作') : role === 'mcn' ? '机构合作' : '达人合作'],
    typicalFeeRange: String(profile.pricing || profile.servicePricing || profile.monthlyBudget || ''),
    customerProfile: String(profile.audienceCategories || profile.targetCreators || profile.cooperationGoals || ''),
    salesScenario: String(profile.bio || profile.serviceCases || profile.successCases || ''),
    verificationStatus: '已核验' as Partner['verificationStatus'],
    riskLevel: String(profile.paymentIssues || '').includes('未解决') ? 'high' : 'medium',
    riskTags: [
      ...(companyName ? [] : ['公司主体待补充']),
      ...(role === 'creator' && !profile.mcnName ? ['MCN信息待补充'] : []),
      ...(role === 'mcn' && !profile.businessLicenseCode ? ['工商信息待核验'] : []),
      ...(profile.paymentIssues && String(profile.paymentIssues) !== '无' ? [String(profile.paymentIssues)] : []),
      ...(profile.controversy ? ['争议说明待复核'] : []),
    ],
    scores: {
      authenticity: 70,
      fulfillment: String(profile.fulfillment || '').includes('按约') ? 80 : 60,
      categoryFit: 70,
      conversionFeedback: profile.roi ? 70 : 50,
      riskControl: String(profile.paymentIssues || '') === '无' ? 80 : 50,
      dataCompleteness: 75,
      overall: 70,
    },
    publicCases: String(profile.successCases || profile.serviceCases || ''),
    caseVerificationStatus: '待核验',
    dataSource: '合作商入驻申请',
    description: `${creatorSubjectChain(profile)}。${profile.bio || profile.serviceCases || profile.targetCreators || ''}`,
    followerCount: String(profile.followers || ''),
    engagementRate: String(profile.engagementRate || ''),
    updatedAt: now,
    adminVisibility: 'internal',
    adminNotes: `由${roleLabels[role] || '合作商'}入驻申请自动生成。联系人：${profile.contactName || profile.mcnContact || '未填'}。统一社会信用代码：${profile.businessLicenseCode || profile.mcnBusinessLicense || '未填'}。`,
  };
}

export default function AdminPage() {
  const { partners, reviews, loading, error } = useCSVData();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [editablePartners, setEditablePartners] = useState<AdminPartner[]>([]);
  const [creatorProfiles, setCreatorProfiles] = useState<CreatorProfile[]>([]);
  const [localReviews, setLocalReviews] = useState<LocalReview[]>([]);
  const [dueDiligenceRequests, setDueDiligenceRequests] = useState<DueDiligenceRequest[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => parseStoredArray<AuditLog>(AUDIT_LOG_STORAGE_KEY));
  const [importMode, setImportMode] = useState<ImportMode>('upsert');
  const [importPreview, setImportPreview] = useState<PartnerImportPreview[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [editingPartner, setEditingPartner] = useState<AdminPartner | null>(null);
  const [editingCreatorIndex, setEditingCreatorIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [deletingPartnerId, setDeletingPartnerId] = useState<string | null>(null);
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null);
  const [deletedCreatorIds, setDeletedCreatorIds] = useState<string[]>(() => parseStoredArray<string>(DELETED_CREATOR_STORAGE_KEY));
  const [deletedReviewIds, setDeletedReviewIds] = useState<string[]>(() => parseStoredArray<string>(DELETED_REVIEW_STORAGE_KEY));
  const [deletedDueDiligenceIds, setDeletedDueDiligenceIds] = useState<string[]>(() => parseStoredArray<string>(DELETED_DUE_DILIGENCE_STORAGE_KEY));
  const [deletedDueDiligenceFingerprints, setDeletedDueDiligenceFingerprints] = useState<string[]>(() => parseStoredArray<string>(DELETED_DUE_DILIGENCE_FINGERPRINTS_STORAGE_KEY));
  const [deletedRegistrationRequestIds, setDeletedRegistrationRequestIds] = useState<string[]>(() => parseStoredArray<string>(DELETED_REGISTRATION_REQUEST_STORAGE_KEY));

  useEffect(() => {
    if (partners.length === 0) return;

    let cancelled = false;

    async function loadEditablePartners() {
      const basePartners = partners.map(toEditablePartner);
      const stored = parseStoredArray<AdminPartner>(PARTNER_STORAGE_KEY);

      if (!isSupabaseConfigured) {
        setEditablePartners(stored.length > 0 ? stored : basePartners);
        return;
      }

      try {
        const remotePartners = await fetchAdminPartners<Record<string, unknown>>();
        if (cancelled) return;
        const merged = mergeById(
          remotePartners,
          mergeById(stored as unknown as Record<string, unknown>[], basePartners as unknown as Record<string, unknown>[])
        ) as unknown as AdminPartner[];
        setEditablePartners(merged.length > 0 ? merged : basePartners);
      } catch {
        if (cancelled) return;
        setEditablePartners(stored.length > 0 ? stored : basePartners);
        setNotice('合作方编辑数据读取失败，当前显示本机缓存或默认档案。');
      }
    }

    loadEditablePartners();
    return () => {
      cancelled = true;
    };
  }, [partners]);

  useEffect(() => {
    if (editablePartners.length === 0) return;
    const partnerId = new URLSearchParams(window.location.search).get('partner');
    if (!partnerId) return;
    const target = editablePartners.find((partner) => partner.id === partnerId);
    if (!target) return;
    setActiveTab('partners');
    setEditingPartner(target);
  }, [editablePartners]);

  useEffect(() => {
    let cancelled = false;

    async function loadSubmissions() {
      const localProfiles = parseStoredArray<CreatorProfile>(CREATOR_STORAGE_KEY);
      const localFeedback = parseStoredArray<LocalReview>(REVIEW_STORAGE_KEY);
      const localDueDiligenceRequests = parseStoredArray<DueDiligenceRequest>(DUE_DILIGENCE_STORAGE_KEY);
      const localRegistrationRequests = parseStoredArray<RegistrationRequest>(REGISTRATION_REQUEST_STORAGE_KEY);

      if (!isSupabaseConfigured) {
        setCreatorProfiles(localProfiles.filter((profile) => !deletedCreatorIds.includes(String(profile.id))));
        setLocalReviews(localFeedback.filter((review) => !deletedReviewIds.includes(String(review.id))));
        const nextDueDiligence = normalizeDueDiligenceRequests(localDueDiligenceRequests)
          .filter((request) => (
            !deletedDueDiligenceIds.includes(String(request.id)) &&
            !deletedDueDiligenceFingerprints.includes(dueDiligenceFingerprint(request))
          ));
        setDueDiligenceRequests(nextDueDiligence);
        window.localStorage.setItem(DUE_DILIGENCE_STORAGE_KEY, JSON.stringify(nextDueDiligence));
        setRegistrationRequests(localRegistrationRequests.filter((request) => !deletedRegistrationRequestIds.includes(String(request.id))));
        return;
      }

      setRemoteLoading(true);
      try {
        const [remoteProfiles, remoteFeedback, remoteDueDiligenceRequests, remoteRegistrationRequests] = await Promise.all([
          fetchCreatorProfiles<CreatorProfile>(),
          fetchCooperationReviews<LocalReview>(),
          fetchDueDiligenceRequests<DueDiligenceRequest>(),
          fetchRegistrationRequests<RegistrationRequest>(),
        ]);

        if (cancelled) return;
        setCreatorProfiles(
          (mergeById(remoteProfiles as Record<string, unknown>[], localProfiles as Record<string, unknown>[]) as CreatorProfile[])
            .filter((profile) => !deletedCreatorIds.includes(String(profile.id)))
        );
        setLocalReviews(mergeById(remoteFeedback, localFeedback).filter((review) => !deletedReviewIds.includes(String(review.id))));
        const nextDueDiligence = normalizeDueDiligenceRequests(mergeById(remoteDueDiligenceRequests, localDueDiligenceRequests))
          .filter((request) => (
            !deletedDueDiligenceIds.includes(String(request.id)) &&
            !deletedDueDiligenceFingerprints.includes(dueDiligenceFingerprint(request))
          ));
        setDueDiligenceRequests(nextDueDiligence);
        window.localStorage.setItem(DUE_DILIGENCE_STORAGE_KEY, JSON.stringify(nextDueDiligence));
        setRegistrationRequests(
          mergeById(remoteRegistrationRequests, localRegistrationRequests)
            .filter((request) => !deletedRegistrationRequestIds.includes(String(request.id)))
        );
      } catch {
        if (cancelled) return;
        setRegistrationRequests(localRegistrationRequests.filter((request) => !deletedRegistrationRequestIds.includes(String(request.id))));
        setCreatorProfiles(localProfiles.filter((profile) => !deletedCreatorIds.includes(String(profile.id))));
        setLocalReviews(localFeedback.filter((review) => !deletedReviewIds.includes(String(review.id))));
        const nextDueDiligence = normalizeDueDiligenceRequests(localDueDiligenceRequests)
          .filter((request) => (
            !deletedDueDiligenceIds.includes(String(request.id)) &&
            !deletedDueDiligenceFingerprints.includes(dueDiligenceFingerprint(request))
          ));
        setDueDiligenceRequests(nextDueDiligence);
        window.localStorage.setItem(DUE_DILIGENCE_STORAGE_KEY, JSON.stringify(nextDueDiligence));
        setNotice('云端数据读取失败，当前显示本机缓存数据。');
      } finally {
        if (!cancelled) setRemoteLoading(false);
      }
    }

    loadSubmissions();
    return () => {
      cancelled = true;
    };
  }, [deletedCreatorIds, deletedDueDiligenceFingerprints, deletedDueDiligenceIds, deletedRegistrationRequestIds, deletedReviewIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadAuditLogs() {
      if (!isSupabaseConfigured) return;
      const remoteLogs = await fetchAuditLogs<AuditLog>();
      if (cancelled) return;
      const localLogs = parseStoredArray<AuditLog>(AUDIT_LOG_STORAGE_KEY);
      const mergedLogs = mergeById(remoteLogs, localLogs)
        .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
        .slice(0, 300);
      setAuditLogs(mergedLogs);
      window.localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(mergedLogs));
    }

    loadAuditLogs();
    return () => {
      cancelled = true;
    };
  }, []);

  const allReviews: LocalReview[] = useMemo(
    () => mergeById(
      localReviews,
      reviews.map((review) => ({
        ...review,
        reviewStatus: review.reviewStatus,
        evidenceStatus: review.evidenceStatus,
      })) as unknown as LocalReview[]
    ).filter((review) => !deletedReviewIds.includes(String(review.id))),
    [deletedReviewIds, localReviews, reviews]
  );

  const stats = useMemo(() => {
    const pendingCreators = creatorProfiles.filter((profile) => (profile.status ?? 'pending') === 'pending').length;
    const pendingDueDiligence = dueDiligenceRequests.filter((request) => (request.status ?? 'pending') === 'pending').length;
    const pendingRegistrations = registrationRequests.filter((request) => (request.status ?? 'pending') === 'pending').length;
    return [
      { label: '合作方档案', value: editablePartners.length, sub: '可编辑核验状态、标签和可见性', color: 'text-blue-600' },
      { label: '合作商入驻申请', value: creatorProfiles.length, sub: `${pendingCreators} 条待审核`, color: 'text-emerald-600' },
      { label: '合作反馈', value: allReviews.length, sub: '可审核证据与反馈状态', color: 'text-amber-600' },
      { label: '尽调申请', value: dueDiligenceRequests.length, sub: `${pendingDueDiligence} 条待跟进`, color: 'text-purple-600' },
      { label: '注册申请', value: registrationRequests.length, sub: `${pendingRegistrations} 条待审批`, color: 'text-sky-600' },
    ];
  }, [allReviews.length, creatorProfiles, dueDiligenceRequests, editablePartners.length, registrationRequests]);

  function recordAudit(entry: AuditInput) {
    const nextEntry: AuditLog = {
      ...entry,
      id: `AUDIT_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const nextLogs = [nextEntry, ...auditLogs].slice(0, 300);
    setAuditLogs(nextLogs);
    window.localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(nextLogs));
    if (isSupabaseConfigured) {
      insertAuditLog(nextEntry as unknown as Record<string, unknown>).catch(() => {
        setNotice('审核日志已保存在本地，云端日志同步失败，请确认已补跑审核日志 SQL。');
      });
    }
  }

  function handlePartnerImportFile(file: File | null) {
    if (!file) return;
    setImportFileName(file.name);

    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data.filter((row) => Object.values(row).some((value) => String(value ?? '').trim()));
        const preview = buildPartnerImportPreview(rows, editablePartners, importMode);
        setImportPreview(preview);
        setNotice(`已解析 ${preview.length} 条合作方数据，请确认后导入。`);
      },
      error: () => {
        setNotice('文件解析失败，请确认是 UTF-8 CSV，或先用 Excel 另存为 CSV 后再上传。');
      },
    });
  }

  function refreshImportPreview(nextMode: ImportMode) {
    setImportMode(nextMode);
    setImportPreview((current) => buildPartnerImportPreview(current.map((item) => item.partner as unknown as Record<string, unknown>), editablePartners, nextMode));
  }

  function applyPartnerImport() {
    const changedRows = importPreview.filter((item) => item.action !== 'skip');
    if (changedRows.length === 0) {
      setNotice('没有需要导入的合作方数据。');
      return;
    }

    const nextMap = new Map(editablePartners.map((partner) => [partner.id, partner]));
    changedRows.forEach((item) => {
      if (importMode === 'replace') {
        nextMap.set(item.partner.id, item.partner);
        return;
      }
      nextMap.set(item.partner.id, { ...nextMap.get(item.partner.id), ...item.partner });
    });

    const nextPartners = Array.from(nextMap.values());
    savePartners(nextPartners);
    recordAudit({
      actionType: 'partner_import',
      targetType: 'admin_partners',
      targetId: importFileName,
      targetName: importFileName || 'CSV import',
      result: `${changedRows.length} rows imported`,
      note: `mode=${importMode}; create=${importPreview.filter((item) => item.action === 'create').length}; update=${importPreview.filter((item) => item.action === 'update').length}; skip=${importPreview.filter((item) => item.action === 'skip').length}`,
    });
    setImportPreview([]);
  }

  function savePartners(nextPartners: AdminPartner[]) {
    setEditablePartners(nextPartners);
    window.localStorage.setItem(PARTNER_STORAGE_KEY, JSON.stringify(nextPartners));
    if (isSupabaseConfigured) {
      upsertAdminPartners(nextPartners as unknown as Record<string, unknown>[]).catch(() => {
        setNotice('本地已保存，但合作方档案同步云端失败，请稍后重试。');
      });
    }
    setNotice(isSupabaseConfigured ? '已保存合作方档案，并同步到云端数据库。' : '已保存合作方编辑内容，数据保存在本机浏览器。');
  }

  function saveCreatorProfiles(nextProfiles: CreatorProfile[]) {
    setCreatorProfiles(nextProfiles);
    window.localStorage.setItem(CREATOR_STORAGE_KEY, JSON.stringify(nextProfiles));
    if (isSupabaseConfigured) {
      upsertCreatorProfiles(nextProfiles as Record<string, unknown>[]).catch(() => {
        setNotice('本地已保存，但同步云端数据库失败，请稍后重试。');
      });
    }
    setNotice(isSupabaseConfigured ? '已保存合作商入驻审核状态，并同步到云端数据库。' : '已保存合作商入驻审核状态。');
  }

  function saveLocalReviews(nextReviews: LocalReview[]) {
    setLocalReviews(nextReviews);
    window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(nextReviews));
    if (isSupabaseConfigured) {
      upsertCooperationReviews(nextReviews).catch(() => {
        setNotice('本地已保存，但同步云端数据库失败，请稍后重试。');
      });
    }
    setNotice(isSupabaseConfigured ? '已保存合作反馈审核结果，并同步到云端数据库。' : '已保存合作反馈审核结果。');
  }


  function saveDueDiligenceRequests(nextRequests: DueDiligenceRequest[]) {
    const normalizedRequests = normalizeDueDiligenceRequests(nextRequests);
    setDueDiligenceRequests(normalizedRequests);
    window.localStorage.setItem(DUE_DILIGENCE_STORAGE_KEY, JSON.stringify(normalizedRequests));
    if (isSupabaseConfigured) {
      upsertDueDiligenceRequests(normalizedRequests as Record<string, unknown>[]).catch(() => {
        setNotice('????????????????????????');
      });
    }
    setNotice(isSupabaseConfigured ? '????????????????????' : '??????????');
  }

  function setDueDiligenceStatus(requestId: string, status: string) {
    const request = dueDiligenceRequests.find((item) => item.id === requestId);
    saveDueDiligenceRequests(
      dueDiligenceRequests.map((request) =>
        request.id === requestId
          ? { ...request, status, reviewedAt: new Date().toISOString() }
          : request
      )
    );
    recordAudit({
      actionType: 'due_diligence_status',
      targetType: 'due_diligence_requests',
      targetId: requestId,
      targetName: request?.target_partner_name || request?.brand_name || requestId,
      result: status,
      note: '后台更新尽调申请状态',
    });
  }

  function saveRegistrationRequests(nextRequests: RegistrationRequest[]) {
    setRegistrationRequests(nextRequests);
    window.localStorage.setItem(REGISTRATION_REQUEST_STORAGE_KEY, JSON.stringify(nextRequests));
    if (isSupabaseConfigured) {
      upsertRegistrationRequests(nextRequests as Record<string, unknown>[]).catch(() => {
        setNotice('本地已保存，但注册申请同步云端数据库失败，请稍后重试。');
      });
    }
    setNotice(isSupabaseConfigured ? '已保存注册申请审批状态，并同步到云端数据库。' : '已保存注册申请审批状态。');
  }

  function setRegistrationRequestStatus(requestId: string, status: string) {
    const request = registrationRequests.find((item) => item.id === requestId);
    saveRegistrationRequests(
      registrationRequests.map((request) =>
        request.id === requestId
          ? { ...request, status, reviewedAt: new Date().toISOString() }
          : request
      )
    );
    recordAudit({
      actionType: 'registration_status',
      targetType: 'registration_requests',
      targetId: requestId,
      targetName: request?.name || request?.email || requestId,
      result: status,
      note: '后台更新注册申请状态',
    });
  }

  function setReviewEvidenceStatus(reviewId: string, evidenceStatus: string, reviewStatus: string, defaultNote: string) {
    const note = window.prompt('Evidence review note / user-facing message:', defaultNote);
    if (note === null) return;

    const currentReview = allReviews.find((review) => review.id === reviewId);
    if (!currentReview) return;

    const reviewedAt = new Date().toISOString();
    const updatedReview = {
      ...currentReview,
      evidenceStatus,
      reviewStatus,
      reviewVisibility: currentReview.reviewVisibility ?? 'internal',
      evidenceReviewNote: note,
      evidenceReviewedAt: reviewedAt,
    };

    saveLocalReviews(
      mergeById(
        [updatedReview],
        localReviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                evidenceStatus,
                reviewStatus,
                reviewVisibility: review.reviewVisibility ?? 'internal',
                evidenceReviewNote: note,
                evidenceReviewedAt: reviewedAt,
              }
            : review
        )
      )
    );
    recordAudit({
      actionType: 'review_status',
      targetType: 'cooperation_feedback',
      targetId: reviewId,
      targetName: currentReview.brandName || reviewId,
      result: `${reviewStatus}/${evidenceStatus}`,
      note,
    });
  }

  function setReviewVisibility(reviewId: string, reviewVisibility: Visibility) {
    const currentReview = allReviews.find((review) => review.id === reviewId);
    if (!currentReview) return;

    saveLocalReviews(
      mergeById(
        [{ ...currentReview, reviewVisibility }],
        localReviews.map((review) => (review.id === reviewId ? { ...review, reviewVisibility } : review))
      )
    );
    recordAudit({
      actionType: 'review_visibility',
      targetType: 'cooperation_feedback',
      targetId: reviewId,
      targetName: currentReview.brandName || reviewId,
      result: reviewVisibility,
      note: `合作反馈可见性改为${visibilityLabels[reviewVisibility]}`,
    });
  }

  function setPartnerVisibility(partner: AdminPartner, visibility: Visibility) {
    savePartners(
      editablePartners.map((item) =>
        item.id === partner.id ? { ...item, adminVisibility: visibility } : item
      )
    );
    recordAudit({
      actionType: 'partner_visibility',
      targetType: 'admin_partners',
      targetId: partner.id,
      targetName: partner.displayName,
      result: visibility,
      note: `合作方可见性改为${visibilityLabels[visibility]}`,
    });
  }

  async function openEvidenceFile(review: LocalReview, index: number) {
    const path = review.evidenceFilePaths?.[index] || review.evidenceFileMeta?.[index]?.path;
    if (!path) {
      window.alert('这条证据只有文件名，没有可打开的存储路径。请让提交方重新上传一次。');
      return;
    }

    try {
      const url = await createEvidenceFileUrl(path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.alert('证据文件暂时打不开，可能是存储权限或登录状态问题。');
    }
  }

  async function openCreatorFile(profile: CreatorProfile, kind: 'identity' | 'case', index: number) {
    const paths = kind === 'identity' ? profile.identityFilePaths : profile.caseFilePaths;
    const meta = kind === 'identity' ? profile.identityFileMeta : profile.caseFileMeta;
    const path = paths?.[index] || meta?.[index]?.path;

    if (!path) {
      window.alert('这份材料只有文件名，没有可打开的存储路径。请让提交方重新上传一次。');
      return;
    }

    try {
      const url = await createEvidenceFileUrl(path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.alert('材料暂时打不开，可能是存储权限或登录状态问题。');
    }
  }

  function saveEditingPartner() {
    if (!editingPartner) return;
    savePartners(editablePartners.map((partner) => (partner.id === editingPartner.id ? editingPartner : partner)));
    recordAudit({
      actionType: 'partner_edit',
      targetType: 'admin_partners',
      targetId: editingPartner.id,
      targetName: editingPartner.displayName,
      result: 'saved',
      note: '后台编辑合作方档案',
    });
    setEditingPartner(null);
  }

  async function deletePartner(partner: AdminPartner) {
    const confirmed = window.confirm(`确认删除「${partner.displayName}」吗？删除后将从后台档案和公开页面移除。`);
    if (!confirmed) return;

    const nextPartners = editablePartners.filter((item) => item.id !== partner.id);
    setDeletingPartnerId(partner.id);

    try {
      if (isSupabaseConfigured) {
        await deleteAdminPartner(partner.id);
      }

      setEditablePartners(nextPartners);
      window.localStorage.setItem(PARTNER_STORAGE_KEY, JSON.stringify(nextPartners));
      if (editingPartner?.id === partner.id) setEditingPartner(null);
      recordAudit({
        actionType: 'partner_delete',
        targetType: 'admin_partners',
        targetId: partner.id,
        targetName: partner.displayName,
        result: 'deleted',
        note: '后台删除合作方档案',
      });
      setNotice(isSupabaseConfigured ? '已删除合作方档案，并同步到云端数据库。' : '已从本地后台档案删除。');
    } catch {
      setNotice('删除失败：云端数据库可能还没开启管理员删除权限，请先补跑删除权限 SQL。');
    } finally {
      setDeletingPartnerId(null);
    }
  }

  async function deleteCreatorSubmission(index: number) {
    const profile = creatorProfiles[index];
    if (!profile) return;

    const name = profile.creatorName || profile.mcnName || profile.brandName || profile.companyName || '这条入驻申请';
    const confirmed = window.confirm(`确认删除「${name}」吗？删除后后台不再显示这条入驻申请。`);
    if (!confirmed) return;

    const id = String(profile.id);
    setDeletingSubmissionId(id);
    try {
      if (isSupabaseConfigured && id) {
        await deleteCreatorProfile(id);
      }

      const nextDeletedIds = Array.from(new Set([...deletedCreatorIds, id]));
      const nextProfiles = creatorProfiles.filter((_, itemIndex) => itemIndex !== index);
      setDeletedCreatorIds(nextDeletedIds);
      setCreatorProfiles(nextProfiles);
      window.localStorage.setItem(DELETED_CREATOR_STORAGE_KEY, JSON.stringify(nextDeletedIds));
      window.localStorage.setItem(CREATOR_STORAGE_KEY, JSON.stringify(nextProfiles));
      if (editingCreatorIndex === index) setEditingCreatorIndex(null);
      recordAudit({
        actionType: 'creator_submission_delete',
        targetType: 'partner_profiles',
        targetId: id,
        targetName: String(name),
        result: 'deleted',
        note: '后台删除入驻申请',
      });
      setNotice('已删除入驻申请。');
    } catch {
      setNotice('删除失败：云端数据库可能还没开启入驻申请删除权限，请先补跑删除权限 SQL。');
    } finally {
      setDeletingSubmissionId(null);
    }
  }

  async function deleteReviewSubmission(review: LocalReview) {
    const name = review.isAnonymous ? '匿名合作反馈' : (review.brandName || '这条合作反馈');
    const confirmed = window.confirm(`确认删除「${name}」吗？删除后后台不再显示这条合作反馈。`);
    if (!confirmed) return;

    const id = String(review.id);
    setDeletingSubmissionId(id);
    try {
      if (isSupabaseConfigured && id) {
        await deleteCooperationReview(id);
      }

      const nextDeletedIds = Array.from(new Set([...deletedReviewIds, id]));
      const nextReviews = localReviews.filter((item) => item.id !== id);
      setDeletedReviewIds(nextDeletedIds);
      setLocalReviews(nextReviews);
      window.localStorage.setItem(DELETED_REVIEW_STORAGE_KEY, JSON.stringify(nextDeletedIds));
      window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(nextReviews));
      recordAudit({
        actionType: 'review_delete',
        targetType: 'cooperation_feedback',
        targetId: id,
        targetName: String(name),
        result: 'deleted',
        note: '后台删除合作反馈',
      });
      setNotice('已删除合作反馈。');
    } catch {
      setNotice('删除失败：云端数据库可能还没开启合作反馈删除权限，请先补跑删除权限 SQL。');
    } finally {
      setDeletingSubmissionId(null);
    }
  }

  async function deleteDueDiligenceSubmission(request: DueDiligenceRequest) {
    {
      const name = request.target_partner_name || request.brand_name || '这条尽调申请';
      const confirmed = window.confirm(`确认删除「${name}」吗？删除后后台不再显示这条尽调申请。`);
      if (!confirmed) return;

      const id = String(request.id);
      const requestFingerprint = dueDiligenceFingerprint(request);
      setDeletingSubmissionId(id);

      let cloudDeleted = true;
      try {
        if (isSupabaseConfigured && id) {
          await deleteDueDiligenceRequest(id);
        }
      } catch {
        cloudDeleted = false;
      }

      const nextDeletedIds = Array.from(new Set([...deletedDueDiligenceIds, id]));
      const nextDeletedFingerprints = Array.from(new Set([...deletedDueDiligenceFingerprints, requestFingerprint]));
      const nextRequests = normalizeDueDiligenceRequests(dueDiligenceRequests).filter((item) => (
        item.id !== id && dueDiligenceFingerprint(item) !== requestFingerprint
      ));
      setDeletedDueDiligenceIds(nextDeletedIds);
      setDeletedDueDiligenceFingerprints(nextDeletedFingerprints);
      setDueDiligenceRequests(nextRequests);
      window.localStorage.setItem(DELETED_DUE_DILIGENCE_STORAGE_KEY, JSON.stringify(nextDeletedIds));
      window.localStorage.setItem(DELETED_DUE_DILIGENCE_FINGERPRINTS_STORAGE_KEY, JSON.stringify(nextDeletedFingerprints));
      window.localStorage.setItem(DUE_DILIGENCE_STORAGE_KEY, JSON.stringify(nextRequests));
      recordAudit({
        actionType: 'due_diligence_delete',
        targetType: 'due_diligence_requests',
        targetId: id,
        targetName: String(name),
        result: 'deleted',
        note: '后台删除尽调申请',
      });
      setNotice(cloudDeleted ? '已删除尽调申请。' : '已从后台移除这条尽调申请；如果刷新后仍出现，请再检查 Supabase 删除权限。');
      setDeletingSubmissionId(null);
      return;
    }
  }

  async function deleteRegistrationSubmission(request: RegistrationRequest) {
    const name = request.name || request.email || '这条注册申请';
    const confirmed = window.confirm(`确认删除「${name}」吗？删除后后台不再显示这条注册申请。`);
    if (!confirmed) return;

    const id = String(request.id);
    setDeletingSubmissionId(id);
    try {
      if (isSupabaseConfigured && id) {
        await deleteRegistrationRequest(id);
      }

      const nextDeletedIds = Array.from(new Set([...deletedRegistrationRequestIds, id]));
      const nextRequests = registrationRequests.filter((item) => item.id !== id);
      setDeletedRegistrationRequestIds(nextDeletedIds);
      setRegistrationRequests(nextRequests);
      window.localStorage.setItem(DELETED_REGISTRATION_REQUEST_STORAGE_KEY, JSON.stringify(nextDeletedIds));
      window.localStorage.setItem(REGISTRATION_REQUEST_STORAGE_KEY, JSON.stringify(nextRequests));
      recordAudit({
        actionType: 'registration_delete',
        targetType: 'registration_requests',
        targetId: id,
        targetName: String(name),
        result: 'deleted',
        note: '后台删除注册申请',
      });
      setNotice('已删除注册申请。');
    } catch {
      setNotice('删除失败：云端数据库可能还没开启注册申请删除权限，请确认已补跑注册申请 SQL。');
    } finally {
      setDeletingSubmissionId(null);
    }
  }

  function updateCreator(index: number, patch: Partial<CreatorProfile>) {
    saveCreatorProfiles(
      creatorProfiles.map((profile, i) => {
        if (i !== index) return profile;
        const next = { ...profile, ...patch };
        return { ...next, subjectChain: creatorSubjectChain(next) };
      })
    );
  }

  function setCreatorReview(index: number, status: string, defaultReason: string) {
    const reason = window.prompt('填写审核备注/原因，用户侧后续可展示这段内容：', defaultReason);
    if (reason === null) return;
    const profile = creatorProfiles[index];

    updateCreator(index, {
      status,
      reviewReason: reason,
      reviewedAt: new Date().toISOString(),
    });
    recordAudit({
      actionType: 'creator_review',
      targetType: 'partner_profiles',
      targetId: String(profile?.id ?? index),
      targetName: String(profile?.creatorName || profile?.mcnName || profile?.brandName || profile?.companyName || index),
      result: status,
      note: reason,
    });
    setNotice(`已更新审核状态：${statusLabels[status]?.label ?? status}`);
  }

  function approveCreatorAsPartner(index: number) {
    const profile = creatorProfiles[index];
    if (!profile) return;

    const partner = profileToPartner(profile, index);
    if (editablePartners.some((item) => item.id === partner.id)) {
      setNotice('这条入驻申请已经生成过合作方档案。');
      updateCreator(index, { status: 'verified' });
      recordAudit({
        actionType: 'creator_approve_existing',
        targetType: 'partner_profiles',
        targetId: String(profile.id ?? index),
        targetName: partner.displayName,
        result: 'verified',
        note: '入驻申请已通过，合作方档案已存在',
      });
      return;
    }

    savePartners([partner, ...editablePartners]);
    saveCreatorProfiles(
      creatorProfiles.map((item, i) =>
        i === index
          ? {
              ...item,
              status: 'verified',
              reviewReason: '审核通过，已生成合作方档案。',
              reviewedAt: new Date().toISOString(),
              generatedPartnerId: partner.id,
              subjectChain: creatorSubjectChain(item),
            }
          : item
      )
    );
    recordAudit({
      actionType: 'creator_approve',
      targetType: 'partner_profiles',
      targetId: String(profile.id ?? index),
      targetName: partner.displayName,
      result: 'verified',
      note: `已生成合作方档案：${partner.id}`,
    });
    setNotice(`已审核通过，并生成合作方档案：${partner.displayName}`);
  }

  const editingCreator = editingCreatorIndex === null ? null : creatorProfiles[editingCreatorIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">加载数据中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-sm text-center">
          <AlertTriangle size={24} className="text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">后台审核管理</h1>
              <p className="text-sm text-gray-500">直接编辑合作方档案、入驻资料、风险标签、核验状态和可见性。</p>
            </div>
            <div className={`flex items-center gap-2 border text-xs font-medium px-3 py-1.5 rounded-lg ${
              isSupabaseConfigured ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <ShieldAlert size={13} />
              {isSupabaseConfigured ? '已连接云端数据库' : '未配置云端数据库'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((item) => (
            <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className={`text-2xl font-bold mb-0.5 ${item.color}`}>{item.value}</div>
              <div className="text-sm font-semibold text-gray-800">{item.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>

        {(remoteLoading || notice) && (
          <div className="mb-6 flex items-start gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3">
            {remoteLoading ? <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin" /> : <CheckCircle size={16} className="shrink-0 mt-0.5" />}
            <p className="text-sm">{remoteLoading ? '正在读取云端提交数据...' : notice}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
          {([
            { key: 'overview', label: '概览' },
            { key: 'partners', label: `合作方档案 (${editablePartners.length})` },
            { key: 'creatorProfiles', label: `入驻申请 (${creatorProfiles.length})` },
            { key: 'reviews', label: `合作反馈 (${allReviews.length})` },
            { key: 'dueDiligence', label: `尽调申请 (${dueDiligenceRequests.length})` },
            { key: 'registrationRequests', label: `注册申请 (${registrationRequests.length})` },
            { key: 'import', label: '批量导入' },
            { key: 'auditLogs', label: `审核日志 (${auditLogs.length})` },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-800 mb-4">待处理入驻申请</h2>
              <div className="space-y-3">
                {creatorProfiles.length === 0 ? (
                  <p className="text-sm text-gray-400 py-8 text-center">暂无入驻申请。合作商提交资料后会出现在这里。</p>
                ) : (
                  creatorProfiles.slice(0, 5).map((profile, index) => (
                    <div key={`${profile.creatorName}-${index}`} className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {profile.creatorName || profile.mcnName || profile.brandName || profile.companyName || '未命名合作商'}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {roleLabels[profile.partnerRole || 'creator'] || '合作商'} / {profile.completionStage || '待补充资料'}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('creatorProfiles');
                            setEditingCreatorIndex(index);
                          }}
                          className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                        >
                          审核
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-800 mb-4">风险标签预警</h2>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {editablePartners.filter((partner) => partner.riskTags.length > 0).map((partner) => (
                  <div key={partner.id} className="flex items-center justify-between gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{partner.displayName}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {partner.riskTags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setEditingPartner(partner)} className="text-xs bg-white text-red-600 border border-red-100 px-3 py-1.5 rounded-lg">
                      编辑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['ID', '名称', '类型', '核验状态', '综合评分', '风险标签', '可见性', '操作'].map((head) => (
                      <th key={head} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {editablePartners.map((partner) => {
                    const visibility = asVisibility(partner.adminVisibility);
                    const typeText = Array.isArray(partner.partnerType) ? partner.partnerType.join('、') : partner.partnerType;
                    return (
                      <tr key={partner.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{partner.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 text-xs">{partner.displayName}</div>
                          {partner.legalEntity && <div className="text-[10px] text-gray-400">{partner.legalEntity}</div>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px]">{typeText}</td>
                        <td className="px-4 py-3">
                          <select
                            value={partner.verificationStatus}
                            onChange={(event) =>
                              savePartners(
                                editablePartners.map((item) =>
                                  item.id === partner.id ? { ...item, verificationStatus: event.target.value as Partner['verificationStatus'] } : item
                                )
                              )
                            }
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {verificationOptions.map((option) => (
                              <option key={option}>{option}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                          {partner.scores?.overall ? partner.scores.overall : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 min-w-[220px]">
                            {partner.riskTags.length === 0 ? (
                              <span className="text-xs text-gray-300">-</span>
                            ) : (
                              partner.riskTags.slice(0, 3).map((tagText) => (
                                <span key={tagText} className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded">
                                  {tagText}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setPartnerVisibility(partner, visibility === 'public' ? 'internal' : 'public')}
                            className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border ${
                              visibilityBadgeClass(visibility)
                            }`}
                          >
                            {visibility === 'public' ? <Eye size={12} /> : <EyeOff size={12} />}
                            {visibilityLabels[visibility]}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingPartner(partner)}
                              className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1.5 rounded-lg hover:bg-blue-100"
                            >
                              <Edit3 size={12} />
                              编辑
                            </button>
                            <button
                              onClick={() => setEditingPartner({ ...partner, riskTags: [...partner.riskTags, '新风险待补充'] })}
                              className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-100"
                            >
                              <Tag size={12} />
                              风险标签
                            </button>
                            <button
                              onClick={() => deletePartner(partner)}
                              disabled={deletingPartnerId === partner.id}
                              className="inline-flex items-center gap-1 text-xs bg-white text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingPartnerId === partner.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'creatorProfiles' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {creatorProfiles.length === 0 ? (
              <div className="p-10 text-center">
                <Plus size={22} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">暂无合作商入驻申请。去“合作商入驻”页面提交一条测试资料后，这里就能审核。</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['名称/身份', '主体链路', '关键资料', '完整度', '审核清单', '状态', '操作'].map((head) => (
                        <th key={head} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {creatorProfiles.map((profile, index) => {
                      const status = String(profile.status ?? 'pending');
                      const statusMeta = statusLabels[status] ?? statusLabels.pending;
                      const checklist = reviewChecklist(profile);
                      const doneCount = checklist.filter((item) => item.done).length;
                      const identityFileNames = profile.identityFileNames ?? [];
                      const caseFileNames = profile.caseFileNames ?? [];
                      return (
                        <tr key={`${profile.creatorName}-${index}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 text-xs">{profile.creatorName || profile.mcnName || profile.brandName || profile.companyName || '未命名合作商'}</div>
                            <div className="text-[10px] text-blue-600 mt-0.5">{roleLabels[profile.partnerRole || 'creator'] || '合作商'}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {profile.subjectChain || creatorSubjectChain(profile)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {profile.partnerRole === 'creator'
                              ? `${profile.mainPlatform || '-'} / ${profile.followers || '-'} 粉丝`
                              : profile.partnerRole === 'brand'
                                ? `${profile.productPriceBand || '-'} / ${profile.cooperationGoals || '-'}`
                                : profile.partnerRole === 'service'
                                  ? `${profile.serviceCoverage || '-'}`
                                  : `${profile.mainPlatform || '-'} / ${profile.mcnServiceModels || '-'}`}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {profile.partnerRole === 'creator'
                              ? `GMV ${profile.gmv90 || '-'} / ROI ${profile.roi || '-'}`
                              : profile.partnerRole === 'brand'
                                ? `${profile.brandCategory || '-'} / 预算 ${profile.monthlyBudget || '-'}`
                                : profile.partnerRole === 'service'
                                  ? `${profile.serviceType || '-'} / ${profile.servicePricing || '-'}`
                                  : `${profile.mcnTalentCount || '-'} 达人 / ${profile.mcnCategories || '-'}`}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs font-semibold text-gray-700">{Number(profile.completion || 0)}%</div>
                            <div className="text-[10px] text-gray-400">{profile.completionStage || '待补充资料'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1 min-w-[170px]">
                              <div className="text-[10px] text-gray-500">{doneCount}/{checklist.length} 项完成</div>
                              {checklist.slice(0, 3).map((item) => (
                                <div key={item.label} className={`text-[10px] ${item.done ? 'text-emerald-600' : 'text-gray-400'}`}>
                                  {item.done ? '✓' : '○'} {item.label}
                                </div>
                              ))}
                              {(identityFileNames.length > 0 || caseFileNames.length > 0) && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {identityFileNames.map((file, fileIndex) => {
                                    const hasPath = Boolean(profile.identityFilePaths?.[fileIndex] || profile.identityFileMeta?.[fileIndex]?.path);

                                    return (
                                      <button
                                        key={`identity-${file}-${fileIndex}`}
                                        type="button"
                                        onClick={() => openCreatorFile(profile, 'identity', fileIndex)}
                                        disabled={!hasPath}
                                        className={`text-[10px] border px-1.5 py-0.5 rounded ${
                                          hasPath
                                            ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                                            : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                                        }`}
                                      >
                                        主体:{file}
                                      </button>
                                    );
                                  })}
                                  {caseFileNames.map((file, fileIndex) => {
                                    const hasPath = Boolean(profile.caseFilePaths?.[fileIndex] || profile.caseFileMeta?.[fileIndex]?.path);

                                    return (
                                      <button
                                        key={`case-${file}-${fileIndex}`}
                                        type="button"
                                        onClick={() => openCreatorFile(profile, 'case', fileIndex)}
                                        disabled={!hasPath}
                                        className={`text-[10px] border px-1.5 py-0.5 rounded ${
                                          hasPath
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                                            : 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                                        }`}
                                      >
                                        案例:{file}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={status}
                              onChange={(event) => updateCreator(index, { status: event.target.value })}
                              className={`text-xs border rounded-lg px-2 py-1 bg-white ${statusMeta.color}`}
                            >
                              {statusOptions.map((option) => (
                                <option key={option} value={option}>
                                  {statusLabels[option].label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                onClick={() => setEditingCreatorIndex(index)}
                                className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1.5 rounded-lg hover:bg-blue-100"
                              >
                                <Edit3 size={12} />
                                编辑
                              </button>
                              <button
                                onClick={() => approveCreatorAsPartner(index)}
                                className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100"
                              >
                                <CheckCircle size={12} />
                                通过并生成档案
                              </button>
                              <button
                                onClick={() => setCreatorReview(index, 'needs_info', '请补充营业执照/账号授权/案例截图等材料。')}
                                className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1.5 rounded-lg hover:bg-blue-100"
                              >
                                要求补充
                              </button>
                              <button
                                onClick={() => setCreatorReview(index, 'disputed', '资料存在争议，需进一步人工核验。')}
                                className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1.5 rounded-lg hover:bg-amber-100"
                              >
                                标记争议
                              </button>
                              <button
                                onClick={() => setCreatorReview(index, 'rejected', '资料不符合入驻要求或关键主体无法核验。')}
                                className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-100"
                              >
                                驳回
                              </button>
                              <button
                                onClick={() => deleteCreatorSubmission(index)}
                                disabled={deletingSubmissionId === String(profile.id)}
                                className="inline-flex items-center gap-1 text-xs bg-white text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {deletingSubmissionId === String(profile.id) ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                删除
                              </button>
                            </div>
                            {(profile.reviewReason || profile.reviewedAt) && (
                              <div className="mt-2 max-w-[260px] text-[10px] text-gray-400 leading-relaxed">
                                {profile.reviewReason || '暂无审核备注'}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'registrationRequests' && (
          <div className="space-y-3">
            {registrationRequests.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-400">暂无注册申请。</div>
            ) : (
              registrationRequests.map((request) => {
                const status = request.status ?? 'pending';
                const statusMeta = {
                  pending: { label: '待审批', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                  approved: { label: '已通过', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                  contacted: { label: '已联系', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                  rejected: { label: '已拒绝', color: 'bg-gray-50 text-gray-500 border-gray-100' },
                }[status] ?? { label: status, color: 'bg-gray-50 text-gray-500 border-gray-100' };

                return (
                  <div key={request.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900">{request.name || '未填写姓名'}</h3>
                          <span className={`text-xs border px-2 py-0.5 rounded-md ${statusMeta.color}`}>{statusMeta.label}</span>
                          {request.applicantType && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md">{request.applicantType}</span>}
                          {request.intent && <span className="text-xs bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-md">{request.intent}</span>}
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                          <div><span className="text-gray-400">邮箱：</span>{request.email || '未填写'}</div>
                          <div><span className="text-gray-400">手机/微信：</span>{request.contact || '未填写'}</div>
                          <div><span className="text-gray-400">公司/机构/账号：</span>{request.organization || '未填写'}</div>
                          <div><span className="text-gray-400">提交时间：</span>{request.submittedAt ? new Date(String(request.submittedAt)).toLocaleString() : '未知'}</div>
                        </div>
                        {request.note && (
                          <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 text-sm text-gray-600 leading-relaxed">
                            {request.note}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <button onClick={() => setRegistrationRequestStatus(request.id, 'approved')} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100">
                          通过
                        </button>
                        <button onClick={() => setRegistrationRequestStatus(request.id, 'contacted')} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1.5 rounded-lg hover:bg-blue-100">
                          已联系
                        </button>
                        <button onClick={() => setRegistrationRequestStatus(request.id, 'rejected')} className="text-xs bg-gray-50 text-gray-600 border border-gray-100 px-2.5 py-1.5 rounded-lg hover:bg-gray-100">
                          拒绝
                        </button>
                        <button
                          onClick={() => deleteRegistrationSubmission(request)}
                          disabled={deletingSubmissionId === request.id}
                          className="inline-flex items-center gap-1 text-xs bg-white text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingSubmissionId === request.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'dueDiligence' && (
          <div className="space-y-3">
            {dueDiligenceRequests.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-400">暂无尽调申请</div>
            ) : (
              dueDiligenceRequests.map((request) => {
                const status = String(request.status ?? 'pending');
                const statusMeta = statusLabels[status] ?? statusLabels.pending;
                const reportType = String(request.expected_report_type ?? request.reportType ?? 'standard');
                const reportLabel = dueDiligenceTypeLabels[reportType] ?? String(request.reportPrice ?? reportType);

                return (
                  <div key={request.id} className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-xs font-mono text-gray-400">{request.id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${statusMeta.color}`}>{statusMeta.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded border bg-purple-50 text-purple-700 border-purple-100">{reportLabel}</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900">{request.brand_name || '未填写申请方'}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          联系方式：{request.contact || '-'} · 提交时间：{request.submittedAt || '-'}
                        </div>
                        <div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs text-gray-600">
                          <div className="bg-gray-50 rounded-lg px-3 py-2">尽调对象：{request.target_partner_name || '-'}</div>
                          <div className="bg-gray-50 rounded-lg px-3 py-2">计划合作：{request.planned_cooperation_model || '-'}</div>
                          <div className="bg-gray-50 rounded-lg px-3 py-2">类目：{request.product_category || '-'}</div>
                          <div className="bg-gray-50 rounded-lg px-3 py-2">预算：{request.budget_range || '-'}</div>
                        </div>
                        {request.main_concerns && (
                          <p className="text-xs text-gray-600 leading-relaxed mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                            关注点：{request.main_concerns}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap lg:flex-col gap-1.5 shrink-0">
                        <button onClick={() => setDueDiligenceStatus(request.id, 'needs_info')} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1.5 rounded-lg hover:bg-blue-100">
                          跟进中
                        </button>
                        <button onClick={() => setDueDiligenceStatus(request.id, 'verified')} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100">
                          已完成
                        </button>
                        <button onClick={() => setDueDiligenceStatus(request.id, 'rejected')} className="text-xs bg-red-50 text-red-600 border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-100">
                          关闭/驳回
                        </button>
                        <button
                          onClick={() => deleteDueDiligenceSubmission(request)}
                          disabled={deletingSubmissionId === request.id}
                          className="inline-flex items-center justify-center gap-1 text-xs bg-white text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingSubmissionId === request.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {allReviews.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-sm text-gray-400">暂无合作反馈数据</div>
            ) : (
              allReviews.map((review) => {
                const reviewStatus = String(review.reviewStatus ?? 'pending');
                const statusMeta = statusLabels[reviewStatus] ?? statusLabels.pending;
                const evidenceStatus = String(review.evidenceStatus ?? 'pending_review');
                const reviewVisibility = asVisibility(review.reviewVisibility);
                const evidenceLabel =
                  evidenceStatus === 'verified'
                    ? '证据已验证'
                    : evidenceStatus === 'rejected'
                      ? '证据已驳回'
                      : evidenceStatus === 'needs_info'
                        ? '证据需补充'
                        : '证据待审核';
                return (
                  <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-gray-400">{review.id}</span>
                        <span className="text-sm font-semibold text-gray-900">{review.isAnonymous ? '匿名品牌方' : review.brandName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${statusMeta.color}`}>{statusMeta.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                          evidenceStatus === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          evidenceStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                          evidenceStatus === 'needs_info' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>{evidenceLabel}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${visibilityBadgeClass(reviewVisibility)}`}>
                          {visibilityLabels[reviewVisibility]}
                        </span>
                        {reviewStatus === 'verified' ? <CheckCircle size={13} className="text-emerald-500" /> : <Clock size={13} className="text-amber-500" />}
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 ml-4">{review.cooperationDate || review.createdAt || review.submittedAt}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">{review.reviewText || '暂无文字内容'}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {([
                        ['履约', Number(review.fulfillmentScore || 0)],
                        ['沟通', Number(review.communicationScore || 0)],
                        ['转化', Number(review.conversionScore || 0)],
                        ['透明', Number(review.dataTransparencyScore || 0)],
                      ] as Array<[string, number]>).map(([label, value]) => (
                        <div key={label} className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                          <div className="text-sm font-bold text-gray-800">{Number(value) > 0 ? value : '-'}</div>
                          <div className="text-[10px] text-gray-400">{label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
                      <div className="text-xs font-semibold text-gray-700 mb-2">证据材料</div>
                      {review.evidenceFiles && review.evidenceFiles.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {review.evidenceFiles.map((file, fileIndex) => {
                            const hasPath = Boolean(review.evidenceFilePaths?.[fileIndex] || review.evidenceFileMeta?.[fileIndex]?.path);

                            return (
                              <button
                                key={`${file}-${fileIndex}`}
                                type="button"
                                onClick={() => openEvidenceFile(review, fileIndex)}
                                disabled={!hasPath}
                                className={`text-[10px] border px-2 py-1 rounded-md ${
                                  hasPath
                                    ? 'bg-white text-blue-700 border-blue-100 hover:bg-blue-50'
                                    : 'bg-white text-gray-400 border-gray-200 cursor-not-allowed'
                                }`}
                                title={hasPath ? '打开证据文件' : '缺少文件路径，无法在线打开'}
                              >
                                {file}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">无上传文件记录</div>
                      )}
                      {review.evidenceNote && <p className="text-xs text-gray-500 mt-2">说明：{review.evidenceNote}</p>}
                      {review.evidenceReviewNote && <p className="text-xs text-blue-600 mt-2">审核备注：{review.evidenceReviewNote}</p>}
                    </div>
                    {(
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <button
                          onClick={() => setReviewVisibility(review.id, reviewVisibility === 'public' ? 'internal' : 'public')}
                          className={`text-xs border px-2.5 py-1.5 rounded-lg ${
                            reviewVisibility === 'public'
                              ? 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                              : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                          }`}
                        >
                          {reviewVisibility === 'public' ? '设为内部' : '设为公开'}
                        </button>
                        <button
                          onClick={() => setReviewEvidenceStatus(review.id, 'verified', 'verified', '证据材料已核验，合作反馈通过审核。')}
                          className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100"
                        >
                          证据通过
                        </button>
                        <button
                          onClick={() => setReviewEvidenceStatus(review.id, 'needs_info', 'needs_info', '请补充合同、转账记录、对账单或聊天截图。')}
                          className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1.5 rounded-lg hover:bg-blue-100"
                        >
                          要求补充证据
                        </button>
                        <button
                          onClick={() => setReviewEvidenceStatus(review.id, 'disputed', 'disputed', '证据与反馈内容存在争议，需进一步核验。')}
                          className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1.5 rounded-lg hover:bg-amber-100"
                        >
                          标记争议
                        </button>
                        <button
                          onClick={() => setReviewEvidenceStatus(review.id, 'rejected', 'rejected', '证据不足或无法证明真实合作，反馈已驳回。')}
                          className="text-xs bg-red-50 text-red-600 border border-red-100 px-2.5 py-1.5 rounded-lg hover:bg-red-100"
                        >
                          驳回反馈
                        </button>
                        <button
                          onClick={() => deleteReviewSubmission(review)}
                          disabled={deletingSubmissionId === review.id}
                          className="inline-flex items-center gap-1 text-xs bg-white text-red-600 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingSubmissionId === review.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'import' && (
          <div className="grid lg:grid-cols-[360px,1fr] gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 h-fit">
              <div className="flex items-center gap-2 mb-4">
                <FileUp size={18} className="text-blue-600" />
                <h2 className="text-sm font-bold text-gray-900">合作方批量导入</h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                先支持 CSV。Excel 可以另存为 CSV 后上传；系统会按 ID、统一社会信用代码、公司主体或展示名匹配现有档案。
              </p>
              <label className="block">
                <span className="block text-xs font-semibold text-gray-500 mb-1.5">导入模式</span>
                <select
                  value={importMode}
                  onChange={(event) => refreshImportPreview(event.target.value as ImportMode)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="upsert">新增并更新已有档案</option>
                  <option value="skip">只新增，已有档案跳过</option>
                  <option value="replace">覆盖匹配档案</option>
                </select>
              </label>
              <label className="mt-4 flex flex-col items-center justify-center gap-2 border border-dashed border-blue-200 bg-blue-50/60 rounded-xl px-4 py-8 cursor-pointer hover:bg-blue-50">
                <FileUp size={24} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">上传 CSV 文件</span>
                <span className="text-xs text-blue-500">{importFileName || '支持 UTF-8 CSV'}</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => handlePartnerImportFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="button"
                onClick={applyPartnerImport}
                disabled={importPreview.filter((item) => item.action !== 'skip').length === 0}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                确认导入 {importPreview.filter((item) => item.action !== 'skip').length} 条
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">导入预览</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    新增 {importPreview.filter((item) => item.action === 'create').length}，更新 {importPreview.filter((item) => item.action === 'update').length}，跳过 {importPreview.filter((item) => item.action === 'skip').length}
                  </p>
                </div>
              </div>
              {importPreview.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-400">上传 CSV 后会在这里预览导入结果。</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['动作', '名称', '公司主体', '企业类型', '注册资本', '可见性', '说明'].map((head) => (
                          <th key={head} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{head}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importPreview.slice(0, 100).map((item) => {
                        const visibility = asVisibility(item.partner.adminVisibility);
                        return (
                          <tr key={`${item.partner.id}-${item.action}`} className={item.action === 'skip' ? 'bg-gray-50 opacity-70' : ''}>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                item.action === 'create'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : item.action === 'update'
                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                    : 'bg-gray-50 text-gray-500 border-gray-100'
                              }`}>
                                {item.action === 'create' ? '新增' : item.action === 'update' ? '更新' : '跳过'}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">{item.partner.displayName}</td>
                            <td className="px-4 py-3 text-gray-600">{item.partner.legalEntity || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{item.partner.companyType || '-'}</td>
                            <td className="px-4 py-3 text-gray-600">{item.partner.registeredCapital || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded border ${visibilityBadgeClass(visibility)}`}>
                                {visibilityLabels[visibility]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">{item.reason}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'auditLogs' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <History size={18} className="text-blue-600" />
              <div>
                <h2 className="text-sm font-bold text-gray-900">审核日志</h2>
                <p className="text-xs text-gray-400 mt-0.5">记录后台审核、公开、删除、导入等关键操作。</p>
              </div>
            </div>
            {auditLogs.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">暂无审核日志。后续操作会自动记录。</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['时间', '动作', '对象', '结果', '备注'].map((head) => (
                        <th key={head} className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{head}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</td>
                        <td className="px-4 py-3 text-xs font-mono text-blue-700">{log.actionType}</td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium text-gray-900">{log.targetName || '-'}</div>
                          <div className="text-[10px] text-gray-400">{log.targetType} / {log.targetId}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">{log.result}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-md">{log.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            当前编辑结果保存到浏览器本地缓存，适合先做产品原型和审核流程演示。正式上线时可以把这些保存动作接到数据库、审核日志和权限系统。
          </p>
        </div>
      </div>

      {editingPartner && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 flex justify-end">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">编辑合作方</h2>
                <p className="text-xs text-gray-400">{editingPartner.id}</p>
              </div>
              <button onClick={() => setEditingPartner(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <TextInput label="展示名称" value={editingPartner.displayName} onChange={(value) => setEditingPartner({ ...editingPartner, displayName: value })} />
              <TextInput label="主体/公司名称" value={editingPartner.legalEntity ?? ''} onChange={(value) => setEditingPartner({ ...editingPartner, legalEntity: value })} />
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-4">
                <div>
                  <div className="text-xs font-bold text-gray-900">A. 工商核心信息</div>
                  <div className="text-xs text-gray-400 mt-1">前台仅展示这些核心工商字段，其余变量会保留在数据库但不公开展示。</div>
                </div>
                <TextInput
                  label="企业类型"
                  value={editingPartner.companyType ?? ''}
                  onChange={(value) => setEditingPartner({ ...editingPartner, companyType: value })}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextInput
                    label="注册资本"
                    value={editingPartner.registeredCapital ?? ''}
                    onChange={(value) => setEditingPartner({ ...editingPartner, registeredCapital: value })}
                  />
                  <TextInput
                    label="成立日期"
                    value={editingPartner.foundedDate ?? ''}
                    onChange={(value) => setEditingPartner({ ...editingPartner, foundedDate: value })}
                  />
                  <TextInput
                    label="核准日期"
                    value={editingPartner.approvalDate ?? ''}
                    onChange={(value) => setEditingPartner({ ...editingPartner, approvalDate: value })}
                  />
                  <TextInput
                    label="工商信息来源"
                    value={editingPartner.businessInfoSource ?? ''}
                    onChange={(value) => setEditingPartner({ ...editingPartner, businessInfoSource: value })}
                  />
                </div>
                <TextArea
                  label="住址"
                  value={editingPartner.address ?? ''}
                  onChange={(value) => setEditingPartner({ ...editingPartner, address: value })}
                />
                <TextArea
                  label="经营范围"
                  value={editingPartner.businessScope ?? ''}
                  onChange={(value) => setEditingPartner({ ...editingPartner, businessScope: value })}
                />
              </div>
              <TextInput
                label="类型"
                value={Array.isArray(editingPartner.partnerType) ? editingPartner.partnerType.join('、') : String(editingPartner.partnerType)}
                onChange={(value) => setEditingPartner({ ...editingPartner, partnerType: splitTags(value) })}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <SelectInput
                  label="核验状态"
                  value={editingPartner.verificationStatus}
                  options={verificationOptions}
                  onChange={(value) => setEditingPartner({ ...editingPartner, verificationStatus: value as Partner['verificationStatus'] })}
                />
                <SelectInput
                  label="可见性"
                  value={editingPartner.adminVisibility ?? 'internal'}
                  options={visibilityOptions}
                  labels={visibilityLabels}
                  onChange={(value) => setEditingPartner({ ...editingPartner, adminVisibility: value as Visibility })}
                />
              </div>
              <TextInput
                label="综合评分"
                value={String(editingPartner.scores?.overall ?? '')}
                onChange={(value) =>
                  setEditingPartner({
                    ...editingPartner,
                    scores: { ...editingPartner.scores, overall: Number(value) || 0 },
                  })
                }
              />
              <div className="rounded-xl border border-gray-100 bg-white p-4 space-y-4">
                <div>
                  <div className="text-xs font-bold text-gray-900">E. Cooperation fit index</div>
                  <div className="text-xs text-gray-400 mt-1">Edit overall and detailed score dimensions shown in section E.</div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {([
                    ['authenticity', '信息真实性'],
                    ['fulfillment', '履约稳定性'],
                    ['categoryFit', '类目匹配度'],
                    ['conversionFeedback', '转化反馈'],
                    ['dataCompleteness', '数据完整度'],
                    ['riskControl', '风险控制'],
                  ] as Array<[keyof Partner['scores'], string]>).map(([key, label]) => (
                    <TextInput
                      key={key}
                      label={label}
                      value={String(editingPartner.scores?.[key] ?? '')}
                      onChange={(value) =>
                        setEditingPartner({
                          ...editingPartner,
                          scores: { ...editingPartner.scores, [key]: Number(value) || 0 },
                        })
                      }
                    />
                  ))}
                </div>
              </div>
              <TextArea
                label="风险标签"
                value={editingPartner.riskTags.join('，')}
                placeholder="多个标签用逗号分隔，例如：信息待补充，签约关系需持续核验"
                onChange={(value) => setEditingPartner({ ...editingPartner, riskTags: splitTags(value) })}
              />
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-4">
                <div>
                  <div className="text-xs font-bold text-gray-900">C. Public cases</div>
                  <div className="text-xs text-gray-400 mt-1">Edit public cases, sources, and verification notes.</div>
                </div>
                <TextArea
                  label="Public cases / source material"
                  value={editingPartner.publicCases ?? ''}
                  onChange={(value) => setEditingPartner({ ...editingPartner, publicCases: value })}
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <SelectInput
                    label="Case verification status"
                    value={editingPartner.caseVerificationStatus ?? '未核验'}
                    options={verificationOptions}
                    onChange={(value) => setEditingPartner({ ...editingPartner, caseVerificationStatus: value })}
                  />
                  <TextInput
                    label="Public source"
                    value={editingPartner.publicCaseSource ?? ''}
                    onChange={(value) => setEditingPartner({ ...editingPartner, publicCaseSource: value })}
                    placeholder="Website, platform profile, news link, screenshot source..."
                  />
                </div>
                <TextArea
                  label="Case verification note"
                  value={editingPartner.publicCaseVerificationNote ?? ''}
                  onChange={(value) => setEditingPartner({ ...editingPartner, publicCaseVerificationNote: value })}
                />
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-4">
                <div>
                  <div className="text-xs font-bold text-blue-900">D. Company / creator / team relationships</div>
                  <div className="text-xs text-blue-700 mt-1">One per line: name | relationship | source | verification | note</div>
                </div>
                <TextArea
                  label="Relationship records"
                  value={serializeRelationships(editingPartner)}
                  placeholder="Example MCN | signed agency | public profile | partially verified | needs ongoing verification"
                  onChange={(value) => setEditingPartner({ ...editingPartner, adminRelationships: parseRelationships(value, editingPartner.id) })}
                />
              </div>
              <TextArea label="审核备注" value={editingPartner.adminNotes ?? ''} onChange={(value) => setEditingPartner({ ...editingPartner, adminNotes: value })} />

              <button
                onClick={saveEditingPartner}
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm"
              >
                <Save size={16} />
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCreator && editingCreatorIndex !== null && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 flex justify-end">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">编辑入驻申请</h2>
                <p className="text-xs text-gray-400">{editingCreator.creatorName || '未命名博主'}</p>
              </div>
              <button onClick={() => setEditingCreatorIndex(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <TextInput label="博主/主播名称" value={String(editingCreator.creatorName ?? '')} onChange={(value) => updateCreator(editingCreatorIndex, { creatorName: value })} />
              <TextInput label="主平台" value={String(editingCreator.mainPlatform ?? '')} onChange={(value) => updateCreator(editingCreatorIndex, { mainPlatform: value })} />
              <TextInput label="平台账号 ID" value={String(editingCreator.platformId ?? '')} onChange={(value) => updateCreator(editingCreatorIndex, { platformId: value })} />
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-4">
                <div>
                  <div className="text-xs font-bold text-blue-900">主体关联链路</div>
                  <div className="text-xs text-blue-700 mt-1">{creatorSubjectChain(editingCreator)}</div>
                </div>
                <TextInput label="MCN / 机构名称" value={String(editingCreator.mcnName ?? '')} onChange={(value) => updateCreator(editingCreatorIndex, { mcnName: value })} />
                <TextInput label="公司主体名称" value={String(editingCreator.mcnCompanyName ?? '')} onChange={(value) => updateCreator(editingCreatorIndex, { mcnCompanyName: value })} />
                <TextInput label="统一社会信用代码" value={String(editingCreator.mcnBusinessLicense ?? '')} onChange={(value) => updateCreator(editingCreatorIndex, { mcnBusinessLicense: value })} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextInput label="达人-MCN关系" value={String(editingCreator.mcnRelationType ?? '')} onChange={(value) => updateCreator(editingCreatorIndex, { mcnRelationType: value })} />
                  <TextInput label="合同签约主体" value={String(editingCreator.contractEntity ?? '')} onChange={(value) => updateCreator(editingCreatorIndex, { contractEntity: value })} />
                </div>
                <TextInput label="MCN商务联系人" value={String(editingCreator.mcnContact ?? '')} onChange={(value) => updateCreator(editingCreatorIndex, { mcnContact: value })} />
              </div>
              <TextInput label="粉丝量" value={String(editingCreator.followers ?? '')} onChange={(value) => updateCreator(editingCreatorIndex, { followers: value })} />
              <TextInput label="期待合作产品" value={String(editingCreator.preferredProducts ?? '')} onChange={(value) => updateCreator(editingCreatorIndex, { preferredProducts: value })} />
              <div className="grid sm:grid-cols-2 gap-4">
                <TextInput label="近 90 天 GMV" value={String(editingCreator.gmv90 ?? '')} onChange={(value) => updateCreator(editingCreatorIndex, { gmv90: value })} />
                <TextInput label="ROI" value={String(editingCreator.roi ?? '')} onChange={(value) => updateCreator(editingCreatorIndex, { roi: value })} />
              </div>
              <SelectInput
                label="审核状态"
                value={String(editingCreator.status ?? 'pending')}
                options={statusOptions}
                labels={Object.fromEntries(statusOptions.map((status) => [status, statusLabels[status].label]))}
                onChange={(value) => updateCreator(editingCreatorIndex, { status: value })}
              />
              <TextArea
                label="争议/黑历史说明"
                value={String(editingCreator.controversy ?? '')}
                onChange={(value) => updateCreator(editingCreatorIndex, { controversy: value })}
              />
              <TextArea
                label="审核备注/用户提示"
                value={String(editingCreator.reviewReason ?? '')}
                placeholder="例如：请补充营业执照、平台账号授权截图或过往案例证明。"
                onChange={(value) => updateCreator(editingCreatorIndex, { reviewReason: value })}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCreatorReview(editingCreatorIndex, 'needs_info', '请补充营业执照、平台账号授权截图或过往案例证明。')}
                  className="py-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-sm font-semibold"
                >
                  要求补充
                </button>
                <button
                  type="button"
                  onClick={() => setCreatorReview(editingCreatorIndex, 'rejected', '资料不符合入驻要求或关键主体无法核验。')}
                  className="py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-semibold"
                >
                  驳回
                </button>
              </div>

              <button
                onClick={() => {
                  saveCreatorProfiles(creatorProfiles);
                  setEditingCreatorIndex(null);
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm"
              >
                <Save size={16} />
                完成编辑
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
