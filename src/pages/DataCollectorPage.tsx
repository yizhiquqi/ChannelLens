import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Plus,
  Save,
  Search,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import { insertRawCollection, isSupabaseConfigured } from '../lib/database';

type ReviewAction = '未复核' | '已复核' | '需核验' | '不导出';

interface RawDataRow {
  raw_id: string;
  source_type: string;
  source_url: string;
  source_title: string;
  source_text: string;
  screenshot_path: string;
  related_mcn_name: string;
  related_company_name: string;
  raw_people_names: string;
  collected_date: string;
  collector_note: string;
  confidence_hint: string;
  processed_status: string;
  suggested_partner_type?: string;
  suggested_platforms?: string;
  suggested_categories?: string;
  risk_clues?: string;
}

interface RawDataInputRow extends Partial<RawDataRow> {
  source_platform?: string;
  collector?: string;
  raw_display_name?: string;
  raw_company_name?: string;
  raw_contact_hint?: string;
  raw_text?: string;
  public_cases_text?: string;
  raw_notes?: string;
  confidence?: string;
  suggested_partner_id?: string;
  suggested_partner_type?: string;
  suggested_platforms?: string;
  suggested_categories?: string;
  risk_clues?: string;
  next_action?: string;
  priority?: string;
  processed_date?: string;
}

interface PartnerGeneratedRow {
  partner_id: string;
  display_name: string;
  entity_type: string;
  partner_type: string;
  legal_entity: string;
  former_name: string;
  company_type: string;
  industry: string;
  registered_capital: string;
  founded_date: string;
  legal_representative: string;
  business_status: string;
  registration_authority: string;
  approval_date: string;
  insured_count: string;
  staff_size: string;
  unified_social_credit_code: string;
  taxpayer_id: string;
  registration_number: string;
  organization_code: string;
  address: string;
  business_scope: string;
  role_title: string;
  city: string;
  coverage_area: string;
  platforms: string;
  ecommerce_scene: string;
  categories: string;
  price_range: string;
  cooperation_models: string;
  typical_fee_range: string;
  customer_profile: string;
  public_cases: string;
  case_verification_status: string;
  verification_status: string;
  review_count: string;
  verified_review_count: string;
  risk_level: string;
  risk_tags: string;
  overall_score: string;
  data_source: string;
  source_url: string;
  source_text_ref: string;
  confidence_level: string;
  human_review_status: ReviewAction;
  visibility: string;
  updated_at: string;
}

interface RelationshipGeneratedRow {
  relationship_id: string;
  from_partner_id: string;
  to_partner_id: string;
  relationship_type: string;
  source_type: string;
  source_url: string;
  source_text_ref: string;
  verification_status: string;
  confidence_level: string;
  notes: string;
  visibility: string;
  updated_at: string;
}

interface MetricGeneratedRow {
  metric_id: string;
  partner_id: string;
  platform: string;
  metric_name: string;
  metric_value: string;
  metric_unit: string;
  source_type: string;
  source_url: string;
  collected_date: string;
  verification_status: string;
  notes: string;
}

interface LogRow {
  log_id: string;
  raw_id: string;
  status: string;
  message: string;
  created_partner_ids: string;
  created_relationship_ids: string;
  missing_fields: string;
  needs_human_review: string;
}

interface GeneratedData {
  partners: PartnerGeneratedRow[];
  relationships: RelationshipGeneratedRow[];
  metrics: MetricGeneratedRow[];
  logs: LogRow[];
  duplicateNames: string[];
}

interface CollectorSource {
  title: string;
  url: string;
  snippet: string;
}

interface McnCollectorDraft {
  name: string;
  company: string;
  formerName: string;
  companyType: string;
  industry: string;
  website: string;
  foundedDate: string;
  registeredCapital: string;
  legalRepresentative: string;
  businessStatus: string;
  registrationAuthority: string;
  approvalDate: string;
  insuredCount: string;
  staffSize: string;
  unifiedSocialCreditCode: string;
  taxpayerId: string;
  registrationNumber: string;
  organizationCode: string;
  address: string;
  businessScope: string;
  douyinAccount: string;
  xiaohongshuAccount: string;
  wechatOfficialAccount: string;
  publicContacts: string[];
  news: CollectorSource[];
  sources: CollectorSource[];
  status: string;
  searchProvider: string;
  searchLinks: Array<{ label: string; url: string }>;
  collectedAt: string;
}

const PARTNER_HEADERS: (keyof PartnerGeneratedRow)[] = [
  'partner_id',
  'display_name',
  'entity_type',
  'partner_type',
  'legal_entity',
  'former_name',
  'company_type',
  'industry',
  'registered_capital',
  'founded_date',
  'legal_representative',
  'business_status',
  'registration_authority',
  'approval_date',
  'insured_count',
  'staff_size',
  'unified_social_credit_code',
  'taxpayer_id',
  'registration_number',
  'organization_code',
  'address',
  'business_scope',
  'role_title',
  'city',
  'coverage_area',
  'platforms',
  'ecommerce_scene',
  'categories',
  'price_range',
  'cooperation_models',
  'typical_fee_range',
  'customer_profile',
  'public_cases',
  'case_verification_status',
  'verification_status',
  'review_count',
  'verified_review_count',
  'risk_level',
  'risk_tags',
  'overall_score',
  'data_source',
  'source_url',
  'source_text_ref',
  'confidence_level',
  'human_review_status',
  'visibility',
  'updated_at',
];

const RELATIONSHIP_HEADERS: (keyof RelationshipGeneratedRow)[] = [
  'relationship_id',
  'from_partner_id',
  'to_partner_id',
  'relationship_type',
  'source_type',
  'source_url',
  'source_text_ref',
  'verification_status',
  'confidence_level',
  'notes',
  'visibility',
  'updated_at',
];

const METRIC_HEADERS: (keyof MetricGeneratedRow)[] = [
  'metric_id',
  'partner_id',
  'platform',
  'metric_name',
  'metric_value',
  'metric_unit',
  'source_type',
  'source_url',
  'collected_date',
  'verification_status',
  'notes',
];

const LOG_HEADERS: (keyof LogRow)[] = [
  'log_id',
  'raw_id',
  'status',
  'message',
  'created_partner_ids',
  'created_relationship_ids',
  'missing_fields',
  'needs_human_review',
];

const PLATFORM_KEYWORDS = ['抖音', '小红书', '视频号', '淘宝直播', '快手', '微博', 'B站', '微信'];
const CATEGORY_KEYWORDS = ['美妆', '服装', '食品', '母婴', '宠物', '健康', '家居', '数码', '运动', '个护', '珠宝', '酒水'];
const COMPANY_TYPE_RULES = [
  { keywords: ['直播代运营', '代运营'], type: '直播代运营服务商' },
  { keywords: ['小红书种草', '种草服务'], type: '小红书种草服务商' },
  { keywords: ['招商服务', '招商'], type: '招商服务商' },
  { keywords: ['传媒公司', '传播公司'], type: '传媒公司' },
];

function normalize(value: unknown): string {
  return String(value ?? '').trim();
}

function splitList(value: string): string[] {
  return normalize(value)
    .split(/[;；、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractKeywords(text: string, keywords: string[]): string {
  const matched = keywords.filter((keyword) => text.includes(keyword));
  return matched.length > 0 ? matched.join(';') : '未知';
}

function getCompanyPartnerType(text: string): string {
  const matched = COMPANY_TYPE_RULES.find((rule) => rule.keywords.some((keyword) => text.includes(keyword)));
  return matched?.type ?? 'MCN机构';
}

function chooseValue(...values: unknown[]): string {
  for (const value of values) {
    const normalized = normalize(value);
    if (normalized) return normalized;
  }
  return '';
}

function extractLabeledValue(text: string, labels: string[]): string {
  for (const label of labels) {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = text.match(new RegExp(`${escapedLabel}[：:]\\s*([^\\n]+)`));
    const value = normalize(match?.[1]).replace(/^待补充$/, '');
    if (value) return value;
  }
  return '';
}

function normalizeRawRow(row: RawDataInputRow, index: number): RawDataRow {
  const rawText = chooseValue(row.source_text, row.raw_text, row.public_cases_text);
  const notes = chooseValue(row.collector_note, row.raw_notes, row.risk_clues, row.next_action);
  return {
    raw_id: chooseValue(row.raw_id, `RAW_${String(index + 1).padStart(3, '0')}`),
    source_type: chooseValue(row.source_type, row.source_platform),
    source_url: chooseValue(row.source_url),
    source_title: chooseValue(row.source_title, row.raw_display_name),
    source_text: rawText,
    screenshot_path: chooseValue(row.screenshot_path),
    related_mcn_name: chooseValue(row.related_mcn_name, row.raw_display_name),
    related_company_name: chooseValue(row.related_company_name, row.raw_company_name),
    raw_people_names: chooseValue(row.raw_people_names),
    collected_date: chooseValue(row.collected_date),
    collector_note: notes,
    confidence_hint: chooseValue(row.confidence_hint, row.confidence),
    processed_status: chooseValue(row.processed_status),
    suggested_partner_type: chooseValue(row.suggested_partner_type),
    suggested_platforms: chooseValue(row.suggested_platforms),
    suggested_categories: chooseValue(row.suggested_categories),
    risk_clues: chooseValue(row.risk_clues),
  };
}

function collectorDraftToRawRow(draft: McnCollectorDraft): RawDataRow {
  const primarySource = draft.website || draft.sources?.[0]?.url || '';
  const sourceText = [
    `公司主体：${draft.company || '待补充'}`,
    `曾用名：${draft.formerName || '待补充'}`,
    `企业类型：${draft.companyType || '待补充'}`,
    `所属行业：${draft.industry || '待补充'}`,
    `官网：${draft.website || '待补充'}`,
    `成立时间：${draft.foundedDate || '待补充'}`,
    `注册资本：${draft.registeredCapital || '待补充'}`,
    `法定代表人：${draft.legalRepresentative || '待补充'}`,
    `经营状态：${draft.businessStatus || '待补充'}`,
    `登记机关：${draft.registrationAuthority || '待补充'}`,
    `核准日期：${draft.approvalDate || '待补充'}`,
    `参保人数：${draft.insuredCount || '待补充'}`,
    `人员规模：${draft.staffSize || '待补充'}`,
    `统一社会信用代码：${draft.unifiedSocialCreditCode || '待补充'}`,
    `纳税人识别号：${draft.taxpayerId || '待补充'}`,
    `注册号：${draft.registrationNumber || '待补充'}`,
    `组织机构代码：${draft.organizationCode || '待补充'}`,
    `地址：${draft.address || '待补充'}`,
    `经营范围：${draft.businessScope || '待补充'}`,
    `抖音账号：${draft.douyinAccount || '待补充'}`,
    `小红书账号：${draft.xiaohongshuAccount || '待补充'}`,
    `微信公众号：${draft.wechatOfficialAccount || '待补充'}`,
    `公开联系方式：${draft.publicContacts?.join('；') || '待补充'}`,
    `相关新闻：${draft.news?.map((item) => item.title).join('；') || '待补充'}`,
  ].join('\n');

  return {
    raw_id: `AUTO_${Date.now()}`,
    source_type: draft.searchProvider && draft.searchProvider !== 'none' ? `搜索API:${draft.searchProvider}` : '人工搜索入口',
    source_url: primarySource,
    source_title: `${draft.name} 公开资料采集草稿`,
    source_text: sourceText,
    screenshot_path: '',
    related_mcn_name: draft.name,
    related_company_name: draft.company,
    raw_people_names: '',
    collected_date: new Date().toISOString().slice(0, 10),
    collector_note: `collector status=${draft.status}; sources=${draft.sources?.length ?? 0}`,
    confidence_hint: draft.sources?.length > 0 ? 'medium' : 'low',
    processed_status: '待人工复核',
    suggested_partner_type: 'MCN机构',
    suggested_platforms: [draft.douyinAccount ? '抖音' : '', draft.xiaohongshuAccount ? '小红书' : '', draft.wechatOfficialAccount ? '微信' : ''].filter(Boolean).join(';') || '未知',
    suggested_categories: '未知',
    risk_clues: '信息待补充;公开来源需复核',
  };
}

function getVerificationStatus(sourceType: string, text: string): string {
  const officialSource = ['官网', '官方网站', '官方公众号', '公司公众号', '达人主页'].some((keyword) => sourceType.includes(keyword));
  const explicitRelation = ['旗下达人', '代表达人', '签约达人', '合作达人'].some((keyword) => text.includes(keyword));
  return officialSource && explicitRelation ? '部分核验' : '未核验';
}

function getConfidenceLevel(row: RawDataRow): string {
  const hint = normalize(row.confidence_hint);
  if (hint) return hint;
  if (row.related_mcn_name || row.related_company_name || row.raw_people_names) return 'medium';
  return 'low';
}

function getRelationshipType(text: string): string {
  if (text.includes('签约达人')) return '公开资料显示签约达人';
  if (text.includes('代表达人') || text.toLowerCase().includes('top3')) return '代表达人';
  return '公开关联达人';
}

function getMissingFields(row: PartnerGeneratedRow): string[] {
  return PARTNER_HEADERS.filter((field) => {
    if (['role_title', 'source_url', 'overall_score'].includes(field)) return false;
    const value = row[field];
    return value === '' || value === '未知';
  });
}

function makePartner(overrides: Partial<PartnerGeneratedRow>): PartnerGeneratedRow {
  return {
    partner_id: '',
    display_name: '',
    entity_type: '',
    partner_type: '',
    legal_entity: '',
    former_name: '',
    company_type: '',
    industry: '',
    registered_capital: '',
    founded_date: '',
    legal_representative: '',
    business_status: '',
    registration_authority: '',
    approval_date: '',
    insured_count: '',
    staff_size: '',
    unified_social_credit_code: '',
    taxpayer_id: '',
    registration_number: '',
    organization_code: '',
    address: '',
    business_scope: '',
    role_title: '',
    city: '',
    coverage_area: '',
    platforms: '',
    ecommerce_scene: '',
    categories: '',
    price_range: '',
    cooperation_models: '',
    typical_fee_range: '',
    customer_profile: '',
    public_cases: '',
    case_verification_status: '未核验',
    verification_status: '未核验',
    review_count: '0',
    verified_review_count: '0',
    risk_level: 'low',
    risk_tags: '信息待补充;案例未完全核验',
    overall_score: '',
    data_source: '',
    source_url: '',
    source_text_ref: '',
    confidence_level: 'low',
    human_review_status: '未复核',
    visibility: 'public',
    updated_at: new Date().toISOString().slice(0, 10),
    ...overrides,
  };
}

function findPeopleInText(text: string): string[] {
  const marker = /(旗下达人|代表达人|签约达人|top3|TOP3)[:：为是包括包含]?([^。；;\n]+)/g;
  const names = new Set<string>();
  let match = marker.exec(text);
  while (match) {
    splitList(match[2])
      .filter((name) => name.length <= 24 && !/[。！？]/.test(name))
      .forEach((name) => names.add(name.replace(/等$/, '')));
    match = marker.exec(text);
  }
  return Array.from(names);
}

function extractMetrics(text: string, partnerId: string, row: RawDataRow, startIndex: number): MetricGeneratedRow[] {
  const patterns = [
    { regex: /粉丝(?:数|量)?[约为达超：:\s]*([0-9.]+)\s*(亿|万|w|W)?/g, name: '粉丝数' },
    { regex: /GMV[约为达：:\s]*([0-9.]+)\s*(万|元|万元)?/gi, name: 'GMV' },
    { regex: /播放(?:量)?[约为达：:\s]*([0-9.]+)\s*(万|w|W)?/g, name: '播放量' },
  ];
  const metrics: MetricGeneratedRow[] = [];
  for (const pattern of patterns) {
    let match = pattern.regex.exec(text);
    while (match) {
      metrics.push({
        metric_id: `M_${String(startIndex + metrics.length).padStart(3, '0')}`,
        partner_id: partnerId,
        platform: extractKeywords(text, PLATFORM_KEYWORDS),
        metric_name: pattern.name,
        metric_value: match[1],
        metric_unit: match[2] ?? '',
        source_type: row.source_type,
        source_url: row.source_url,
        collected_date: row.collected_date,
        verification_status: '未核验',
        notes: `根据 raw_id ${row.raw_id} 的公开资料整理，指标尚未人工核验。`,
      });
      match = pattern.regex.exec(text);
    }
  }
  return metrics;
}

function generateData(rawRows: RawDataRow[]): GeneratedData {
  const partners: PartnerGeneratedRow[] = [];
  const relationships: RelationshipGeneratedRow[] = [];
  const metrics: MetricGeneratedRow[] = [];
  const logs: LogRow[] = [];
  const duplicateNames: string[] = [];
  const partnerByName = new Map<string, PartnerGeneratedRow>();
  const legalEntitiesByName = new Map<string, Set<string>>();
  let companyCounter = 1;
  let personCounter = 1;
  let relationshipCounter = 1;

  rawRows.forEach((row, rowIndex) => {
    const rawId = normalize(row.raw_id) || `RAW_${String(rowIndex + 1).padStart(3, '0')}`;
    const text = normalize(row.source_text);
    const sourceType = normalize(row.source_type);
    const sourceUrl = normalize(row.source_url);
    const createdPartnerIds: string[] = [];
    const createdRelationshipIds: string[] = [];
    const logMessages: string[] = [];
    const confidenceLevel = getConfidenceLevel(row);
    const verificationStatus = getVerificationStatus(sourceType, text);
    const platforms = chooseValue(row.suggested_platforms, extractKeywords(text, PLATFORM_KEYWORDS)) || '未知';
    const categories = chooseValue(row.suggested_categories, extractKeywords(text, CATEGORY_KEYWORDS)) || '未知';
    const riskTags = chooseValue(row.risk_clues, '信息待补充;案例未完全核验');
    const companyName = normalize(row.related_mcn_name);
    const legalEntity = normalize(row.related_company_name);
    const businessFields = {
      former_name: extractLabeledValue(text, ['曾用名']),
      company_type: extractLabeledValue(text, ['企业类型', '公司类型']),
      industry: extractLabeledValue(text, ['所属行业', '行业']),
      registered_capital: extractLabeledValue(text, ['注册资本']),
      founded_date: extractLabeledValue(text, ['成立时间', '成立日期']),
      legal_representative: extractLabeledValue(text, ['法定代表人', '法人']),
      business_status: extractLabeledValue(text, ['经营状态']),
      registration_authority: extractLabeledValue(text, ['登记机关']),
      approval_date: extractLabeledValue(text, ['核准日期']),
      insured_count: extractLabeledValue(text, ['参保人数']),
      staff_size: extractLabeledValue(text, ['人员规模']),
      unified_social_credit_code: extractLabeledValue(text, ['统一社会信用代码']),
      taxpayer_id: extractLabeledValue(text, ['纳税人识别号']),
      registration_number: extractLabeledValue(text, ['注册号']),
      organization_code: extractLabeledValue(text, ['组织机构代码']),
      address: extractLabeledValue(text, ['地址', '注册地址']),
      business_scope: extractLabeledValue(text, ['经营范围']),
    };
    let companyPartner: PartnerGeneratedRow | undefined;

    if (companyName || legalEntity) {
      const displayName = companyName || legalEntity;
      const existing = partnerByName.get(displayName);
      if (existing) {
        companyPartner = existing;
        duplicateNames.push(displayName);
        logMessages.push(`display_name 已存在，沿用 ${existing.partner_id}`);
        const legalSet = legalEntitiesByName.get(displayName);
        if (legalEntity && legalSet && !legalSet.has(legalEntity)) {
          legalSet.add(legalEntity);
          logMessages.push('主体可能存在多个候选，需人工复核');
        }
      } else {
        companyPartner = makePartner({
          partner_id: `P_COMPANY_${String(companyCounter).padStart(3, '0')}`,
          display_name: displayName,
          entity_type: 'company',
          partner_type: chooseValue(row.suggested_partner_type, getCompanyPartnerType(text)),
          legal_entity: legalEntity || '未知',
          ...businessFields,
          platforms,
          categories,
          public_cases: text || '',
          case_verification_status: '未核验',
          verification_status: verificationStatus,
          risk_tags: riskTags,
          data_source: sourceType,
          source_url: sourceUrl,
          source_text_ref: rawId,
          confidence_level: confidenceLevel,
        });
        companyCounter += 1;
        partners.push(companyPartner);
        partnerByName.set(displayName, companyPartner);
        legalEntitiesByName.set(displayName, new Set(legalEntity ? [legalEntity] : []));
        createdPartnerIds.push(companyPartner.partner_id);
        metrics.push(...extractMetrics(text, companyPartner.partner_id, row, metrics.length + 1));
      }
    }

    const peopleNames = Array.from(new Set([...splitList(row.raw_people_names), ...findPeopleInText(text)]));
    const peoplePartners: PartnerGeneratedRow[] = [];
    peopleNames.forEach((personName) => {
      const existing = partnerByName.get(personName);
      if (existing) {
        peoplePartners.push(existing);
        duplicateNames.push(personName);
        logMessages.push(`达人 ${personName} 已存在，沿用 ${existing.partner_id}`);
        return;
      }
      const personPartner = makePartner({
        partner_id: `P_PERSON_${String(personCounter).padStart(3, '0')}`,
        display_name: personName,
        entity_type: 'person',
        partner_type: '主播达人',
        legal_entity: '',
        role_title: text.includes('主播') ? '主播/达人' : '达人',
        platforms,
        categories: '未知',
        case_verification_status: '未核验',
        verification_status: '未核验',
        risk_tags: '信息待补充',
        data_source: sourceType,
        source_url: sourceUrl,
        source_text_ref: rawId,
        confidence_level: confidenceLevel,
      });
      personCounter += 1;
      partners.push(personPartner);
      partnerByName.set(personName, personPartner);
      peoplePartners.push(personPartner);
      createdPartnerIds.push(personPartner.partner_id);
      metrics.push(...extractMetrics(text, personPartner.partner_id, row, metrics.length + 1));
    });

    if (companyPartner && peoplePartners.length > 0) {
      peoplePartners.forEach((personPartner) => {
        const relationshipId = `R_${String(relationshipCounter).padStart(3, '0')}`;
        relationshipCounter += 1;
        relationships.push({
          relationship_id: relationshipId,
          from_partner_id: companyPartner.partner_id,
          to_partner_id: personPartner.partner_id,
          relationship_type: getRelationshipType(text),
          source_type: sourceType,
          source_url: sourceUrl,
          source_text_ref: rawId,
          verification_status: verificationStatus,
          confidence_level: confidenceLevel,
          notes: `根据 raw_id ${rawId} 中的公开资料整理，关系尚未人工核验。`,
          visibility: 'public',
          updated_at: new Date().toISOString().slice(0, 10),
        });
        createdRelationshipIds.push(relationshipId);
      });
    }

    const missing = partners
      .filter((partner) => createdPartnerIds.includes(partner.partner_id))
      .flatMap(getMissingFields);
    const uniqueMissing = Array.from(new Set(missing));
    logs.push({
      log_id: `LOG_${String(rowIndex + 1).padStart(3, '0')}`,
      raw_id: rawId,
      status: createdPartnerIds.length > 0 || createdRelationshipIds.length > 0 ? 'processed' : 'needs_human_review',
      message: logMessages.length > 0 ? logMessages.join('；') : '已根据公开资料整理，所有生成结果均需人工复核。',
      created_partner_ids: createdPartnerIds.join(';'),
      created_relationship_ids: createdRelationshipIds.join(';'),
      missing_fields: uniqueMissing.join(';'),
      needs_human_review: 'true',
    });
  });

  return {
    partners,
    relationships,
    metrics,
    logs,
    duplicateNames: Array.from(new Set(duplicateNames)),
  };
}

function parseCsv(text: string): Promise<RawDataRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawDataInputRow>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data.map(normalizeRawRow)),
      error: (error: Error) => reject(error),
    });
  });
}

function downloadCsv<T extends object>(filename: string, rows: T[], fields: (keyof T)[]) {
  const columns = fields.map(String);
  const csv = rows.length > 0
    ? Papa.unparse(rows, { columns })
    : Papa.unparse({ fields: columns, data: [] });
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function EmptyState() {
  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center bg-white">
      <FileSpreadsheet size={30} className="mx-auto text-gray-300 mb-3" />
      <p className="text-sm font-medium text-gray-700">上传或读取 raw_data.csv 后开始整理</p>
      <p className="text-xs text-gray-400 mt-1">工具只解析你手动收集的本地资料，不访问外部平台。</p>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    已复核: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    需核验: 'bg-amber-50 text-amber-700 border-amber-100',
    不导出: 'bg-gray-100 text-gray-500 border-gray-200',
    未复核: 'bg-blue-50 text-blue-700 border-blue-100',
  };
  return <span className={`inline-flex border rounded px-2 py-0.5 text-[11px] font-medium ${styles[value] ?? styles['未复核']}`}>{value}</span>;
}

function HighlightCell({ value }: { value: string }) {
  const missing = value === '' || value === '未知';
  return (
    <td className={`px-3 py-2 text-xs whitespace-nowrap ${missing ? 'bg-amber-50 text-amber-700' : 'text-gray-600'}`}>
      {value || '空'}
    </td>
  );
}

export default function DataCollectorPage() {
  const [rawRows, setRawRows] = useState<RawDataRow[]>([]);
  const [generated, setGenerated] = useState<GeneratedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'raw' | 'partners' | 'relationships' | 'metrics' | 'logs'>('raw');
  const [query, setQuery] = useState('');
  const [collectorName, setCollectorName] = useState('');
  const [collectorJson, setCollectorJson] = useState('');
  const [collectorDraft, setCollectorDraft] = useState<McnCollectorDraft | null>(null);

  const visiblePartners = useMemo(() => generated?.partners.filter((row) => row.human_review_status !== '不导出') ?? [], [generated]);
  const visibleRelationships = useMemo(() => generated?.relationships.filter((row) => row.visibility !== 'hidden') ?? [], [generated]);

  const filteredRawRows = useMemo(() => {
    if (!query) return rawRows;
    return rawRows.filter((row) => Object.values(row).some((value) => value.includes(query)));
  }, [query, rawRows]);

  async function loadDefaultCsv() {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/data/raw_data.csv');
      if (!response.ok) throw new Error('未找到 public/data/raw_data.csv');
      const text = await response.text();
      const rows = await parseCsv(text);
      setRawRows(rows);
      setGenerated(null);
      setMessage(`已读取 ${rows.length} 条 raw_data.csv 原始资料。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '读取失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(file: File | null) {
    if (!file) return;
    setLoading(true);
    setMessage('');
    try {
      const text = await file.text();
      const rows = await parseCsv(text);
      setRawRows(rows);
      setGenerated(null);
      setMessage(`已上传并解析 ${rows.length} 条原始资料。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '解析失败');
    } finally {
      setLoading(false);
    }
  }

  function handleGenerate() {
    const data = generateData(rawRows);
    setGenerated(data);
    setActiveTab('partners');
    setMessage(`已生成 ${data.partners.length} 个 partner、${data.relationships.length} 条关系、${data.metrics.length} 条公开指标。`);
  }

  function updatePartnerStatus(partnerId: string, status: ReviewAction) {
    setGenerated((current) => {
      if (!current) return current;
      return {
        ...current,
        partners: current.partners.map((row) => (
          row.partner_id === partnerId
            ? { ...row, human_review_status: status, visibility: status === '不导出' ? 'hidden' : 'public' }
            : row
        )),
      };
    });
  }

  async function handleCollectMcn() {
    const name = normalize(collectorName);
    if (!name) {
      setMessage('请输入 MCN 名称。');
      return;
    }

    setCollecting(true);
    setMessage('');
    try {
      const response = await fetch(`/api/collect-mcn?name=${encodeURIComponent(name)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '采集失败');
      setCollectorDraft(payload);
      setCollectorJson(JSON.stringify(payload, null, 2));
      setMessage(payload.searchProvider === 'none'
        ? '已生成采集草稿。当前未配置搜索 API key，请根据右侧搜索入口补充资料后保存。'
        : `已生成 ${name} 的公开资料采集草稿。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '采集失败');
    } finally {
      setCollecting(false);
    }
  }

  function parseCollectorJson() {
    const parsed = JSON.parse(collectorJson) as McnCollectorDraft;
    if (!parsed.name) throw new Error('JSON 里缺少 name 字段');
    return parsed;
  }

  function addCollectorDraftToRawRows() {
    try {
      const parsed = parseCollectorJson();
      const row = collectorDraftToRawRow(parsed);
      setRawRows((current) => [row, ...current]);
      setCollectorDraft(parsed);
      setActiveTab('raw');
      setMessage(`已把 ${parsed.name} 加入当前 raw 队列，可继续生成结构化数据。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'JSON 解析失败');
    }
  }

  async function saveCollectorDraft() {
    try {
      const parsed = parseCollectorJson();
      const saved = await insertRawCollection({
        ...parsed,
        query: parsed.name,
        status: parsed.status || 'draft',
      } as unknown as Record<string, unknown>);
      setCollectorDraft(parsed);
      setMessage(isSupabaseConfigured
        ? `已保存 ${parsed.name} 到 Supabase raw_collections。`
        : `已生成本地草稿 ${saved.id}。当前未配置 Supabase，线上不会持久保存。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">数据整理器</h1>
              <p className="text-sm text-gray-500 mt-1">将本地 raw_data.csv 整理为可追溯、待人工复核的结构化 CSV。</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <Upload size={15} />
                上传 raw_data.csv
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => handleUpload(event.target.files?.[0] ?? null)} />
              </label>
              <button onClick={loadDefaultCsv} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
                读取本地文件
              </button>
              <button
                onClick={handleGenerate}
                disabled={rawRows.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={15} />
                生成结构化数据
              </button>
            </div>
          </div>
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-xs text-amber-800">
            <ShieldAlert size={15} className="shrink-0 mt-0.5" />
            <p>本工具不登录、不访问、不抓取任何外部平台；资料中没有的信息不会补写，公开关系和公开指标默认不标记为已核验。</p>
          </div>
          {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">MCN 公开资料 Collector</h2>
              <p className="text-xs text-gray-500 mt-1">输入 MCN 名称，生成公司主体、官网、账号、联系方式、新闻等 JSON 草稿；人工核验后可保存或加入 raw 队列。</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 lg:w-[520px]">
              <input
                value={collectorName}
                onChange={(event) => setCollectorName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleCollectMcn();
                }}
                placeholder="例如：无忧传媒、谦寻、辛选、遥望科技"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCollectMcn}
                disabled={collecting}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {collecting ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                生成草稿
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-4">
            <div>
              <textarea
                value={collectorJson}
                onChange={(event) => setCollectorJson(event.target.value)}
                placeholder={`{\n  "name": "",\n  "company": "",\n  "formerName": "",\n  "companyType": "",\n  "industry": "",\n  "website": "",\n  "foundedDate": "",\n  "registeredCapital": "",\n  "legalRepresentative": "",\n  "businessStatus": "",\n  "registrationAuthority": "",\n  "approvalDate": "",\n  "insuredCount": "",\n  "staffSize": "",\n  "unifiedSocialCreditCode": "",\n  "taxpayerId": "",\n  "registrationNumber": "",\n  "organizationCode": "",\n  "address": "",\n  "businessScope": "",\n  "douyinAccount": "",\n  "xiaohongshuAccount": "",\n  "wechatOfficialAccount": "",\n  "publicContacts": [],\n  "news": []\n}`}
                className="w-full min-h-[260px] font-mono text-xs border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={addCollectorDraftToRawRows}
                  disabled={!collectorJson}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  <Plus size={14} />
                  加入 raw 队列
                </button>
                <button
                  onClick={saveCollectorDraft}
                  disabled={!collectorJson}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-40"
                >
                  <Save size={14} />
                  保存到 raw_collections
                </button>
              </div>
            </div>

            <aside className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 mb-3">搜索入口 / 来源</h3>
              {collectorDraft?.searchLinks?.length ? (
                <div className="space-y-2 mb-4">
                  {collectorDraft.searchLinks.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="flex items-start justify-between gap-2 text-xs text-blue-700 hover:text-blue-800 bg-white border border-blue-100 rounded-md px-2.5 py-2">
                      <span>{link.label}</span>
                      <ExternalLink size={12} className="shrink-0 mt-0.5" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-4">生成草稿后这里会出现搜索入口。</p>
              )}

              <h3 className="text-sm font-bold text-gray-900 mb-2">已识别来源</h3>
              {collectorDraft?.sources?.length ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {collectorDraft.sources.slice(0, 8).map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="block bg-white border border-gray-200 rounded-md p-2 hover:border-blue-200">
                      <div className="text-xs font-semibold text-gray-800 line-clamp-1">{source.title}</div>
                      <div className="text-[11px] text-gray-400 line-clamp-2 mt-1">{source.snippet}</div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">当前没有自动识别来源；配置搜索 API key 后会自动补充。</p>
              )}
            </aside>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: '原始资料', value: rawRows.length },
            { label: '生成 partners', value: generated?.partners.length ?? 0 },
            { label: '生成 relationships', value: generated?.relationships.length ?? 0 },
            { label: '待人工复核', value: generated?.partners.filter((row) => row.human_review_status !== '已复核').length ?? 0 },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{item.value}</div>
              <div className="text-xs text-gray-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        {generated && generated.duplicateNames.length > 0 && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex gap-2 text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>发现可能重复的 partner：{generated.duplicateNames.join('、')}。已按 display_name 去重，详情见处理日志。</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            {[
              { key: 'raw', label: `原始资料 ${rawRows.length}` },
              { key: 'partners', label: `partners ${generated?.partners.length ?? 0}` },
              { key: 'relationships', label: `relationships ${generated?.relationships.length ?? 0}` },
              { key: 'metrics', label: `metrics ${generated?.metrics.length ?? 0}` },
              { key: 'logs', label: `logs ${generated?.logs.length ?? 0}` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索当前原始资料"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>

        {rawRows.length === 0 ? <EmptyState /> : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {activeTab === 'raw' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['raw_id', 'source_type', 'source_title', 'related_mcn_name', 'related_company_name', 'raw_people_names', 'processed_status'].map((head) => <th key={head} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{head}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRawRows.map((row) => (
                      <tr key={row.raw_id || row.source_title}>
                        <td className="px-3 py-2 text-xs font-mono text-gray-500">{row.raw_id}</td>
                        <HighlightCell value={row.source_type} />
                        <td className="px-3 py-2 text-xs text-gray-700 min-w-48">{row.source_title}</td>
                        <HighlightCell value={row.related_mcn_name} />
                        <HighlightCell value={row.related_company_name} />
                        <HighlightCell value={row.raw_people_names} />
                        <td className="px-3 py-2 text-xs text-gray-500">{row.processed_status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'partners' && generated && (
              <>
                <div className="p-3 border-b border-gray-100 flex flex-wrap gap-2">
                  <button onClick={() => downloadCsv('partners_generated.csv', visiblePartners, PARTNER_HEADERS)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700">
                    <Download size={13} /> partners_generated.csv
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>{['partner_id', 'display_name', 'entity_type', 'partner_type', 'platforms', 'categories', 'verification_status', 'confidence_level', 'human_review_status', '操作'].map((head) => <th key={head} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{head}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {generated.partners.map((row) => (
                        <tr key={row.partner_id} className={row.visibility === 'hidden' ? 'bg-gray-50 opacity-60' : ''}>
                          <td className="px-3 py-2 text-xs font-mono text-gray-500">{row.partner_id}</td>
                          <td className="px-3 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap">{row.display_name}</td>
                          <td className="px-3 py-2 text-xs text-gray-600">{row.entity_type}</td>
                          <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{row.partner_type}</td>
                          <HighlightCell value={row.platforms} />
                          <HighlightCell value={row.categories} />
                          <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{row.verification_status}</td>
                          <td className="px-3 py-2 text-xs text-gray-600">{row.confidence_level}</td>
                          <td className="px-3 py-2"><StatusBadge value={row.human_review_status} /></td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1 whitespace-nowrap">
                              {(['已复核', '需核验', '不导出'] as ReviewAction[]).map((status) => (
                                <button key={status} onClick={() => updatePartnerStatus(row.partner_id, status)} className="px-2 py-1 text-[11px] border border-gray-200 rounded hover:bg-gray-50">{status}</button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'relationships' && generated && (
              <>
                <div className="p-3 border-b border-gray-100">
                  <button onClick={() => downloadCsv('partner_relationships_generated.csv', visibleRelationships, RELATIONSHIP_HEADERS)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700">
                    <Download size={13} /> partner_relationships_generated.csv
                  </button>
                </div>
                <PreviewTable rows={generated.relationships} headers={RELATIONSHIP_HEADERS} />
              </>
            )}

            {activeTab === 'metrics' && generated && (
              <>
                <div className="p-3 border-b border-gray-100">
                  <button onClick={() => downloadCsv('public_metrics_generated.csv', generated.metrics, METRIC_HEADERS)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700">
                    <Download size={13} /> public_metrics_generated.csv
                  </button>
                </div>
                <PreviewTable rows={generated.metrics} headers={METRIC_HEADERS} />
              </>
            )}

            {activeTab === 'logs' && generated && (
              <>
                <div className="p-3 border-b border-gray-100">
                  <button onClick={() => downloadCsv('data_processing_log.csv', generated.logs, LOG_HEADERS)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700">
                    <Download size={13} /> data_processing_log.csv
                  </button>
                </div>
                <PreviewTable rows={generated.logs} headers={LOG_HEADERS} />
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function PreviewTable<T extends object>(props: { rows: T[]; headers: (keyof T)[] }) {
  if (props.rows.length === 0) {
    return <div className="p-10 text-center text-sm text-gray-400">暂无可生成数据，下载时会保留标准表头。</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>{props.headers.map((head) => <th key={String(head)} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{String(head)}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {props.rows.map((row, index) => (
            <tr key={index}>
              {props.headers.map((head) => <td key={String(head)} className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{String(row[head] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
