import type { CooperationReview, Partner } from '../types';
import { getPublicDataSourceLabel } from './displaySources';

export interface CompanyPageProfile {
  id: string;
  slug: string;
  displayName: string;
  legalEntity?: string;
  institutionType: string;
  foundedDate: string;
  city: string;
  creatorCount: string;
  description: string;
  cooperationSummary: string;
  userScore: number;
  sourceLabel: string;
}

const COMPANY_SLUG_BY_ID: Record<string, string> = {
  P_COMPANY_001: 'wuyou-media',
  P_COMPANY_002: 'changwan',
  P_COMPANY_003: 'yuxin',
  P_COMPANY_004: 'ost-media',
  P_COMPANY_005: 'qianpai-culture',
  P_COMPANY_006: 'gumai-jiahe',
  P_COMPANY_007: 'yujin-culture',
  P_COMPANY_008: 'huaxing-cuican',
  P_COMPANY_009: 'yaowang-tech',
  P_COMPANY_010: 'nanjing-yuanxiao',
  P_COMPANY_011: 'three-sheep',
  P_COMPANY_012: 'xuanou-culture',
  P_COMPANY_013: 'nailaoxingqiu',
  P_COMPANY_014: 'maiya-media',
  P_COMPANY_015: 'lianmeng-media',
  P_COMPANY_016: 'youhaoxi',
  P_COMPANY_017: 'qijishan',
  P_COMPANY_018: 'qianxi-culture',
  P_COMPANY_019: 'suixing-huyu',
  P_COMPANY_020: 'guangzhou-zhiwenhua',
  P_COMPANY_021: 'yingtao-party',
  P_COMPANY_022: 'baobao-entertainment',
  P_COMPANY_023: 'yongheng-wenxi',
  P_COMPANY_024: 'yuanjing-entertainment',
  P_COMPANY_025: 'dayu-network',
  P_COMPANY_026: 'egm',
  P_COMPANY_027: 'nbw',
  P_COMPANY_028: 'fengqun',
  P_COMPANY_029: 'erka-media',
  P_COMPANY_030: 'huanju-media',
  P_COMPANY_031: 'showworld',
  P_COMPANY_032: 'fengqun-culture',
  P_COMPANY_033: 'chaohui-culture',
  P_COMPANY_034: 'xingbang-huyu',
  P_COMPANY_035: 'guohe-universe',
};

const STATIC_COMPANY_PAGES: CompanyPageProfile[] = [
  {
    id: 'STATIC_QIANXUN',
    slug: 'qianxun',
    displayName: '谦寻',
    legalEntity: '杭州谦寻控股有限责任公司',
    institutionType: 'MCN机构',
    foundedDate: '待公开核验',
    city: '杭州',
    creatorCount: '待补充',
    description: '谦寻为直播电商与达人经纪相关机构。本页面先作为独立公司档案占位，后续可补充工商信息、达人矩阵、公开案例与品牌方反馈。',
    cooperationSummary: '暂无已验证合作反馈，建议合作前核验授权链路、报价主体、履约记录与品牌复盘材料。',
    userScore: 0,
    sourceLabel: '待补充',
  },
  {
    id: 'STATIC_XINXUAN',
    slug: 'xinxuan',
    displayName: '辛选',
    legalEntity: '辛选相关公司主体待核验',
    institutionType: '直播电商机构',
    foundedDate: '待公开核验',
    city: '广州',
    creatorCount: '待补充',
    description: '辛选为直播电商相关机构。本页面先作为独立公司档案占位，后续可补充工商信息、主播矩阵、招商模式与合作反馈。',
    cooperationSummary: '暂无已验证合作反馈，建议合作前重点核验合同主体、款项结算、选品流程、售后责任与履约边界。',
    userScore: 0,
    sourceLabel: '待补充',
  },
];

function cleanValue(value?: string) {
  const text = (value ?? '').trim();
  if (!text || text === '未知' || text === '待核验') return '';
  return text;
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.map(cleanValue).find(Boolean) ?? '待补充';
}

export function getCompanySlug(partner: Partner) {
  return COMPANY_SLUG_BY_ID[partner.id] ?? partner.id.toLowerCase().replace(/_/g, '-');
}

export function isCompanyPagePartner(partner: Partner) {
  return partner.entityType === 'company' && partner.partnerType.some((type) => /MCN|代运营|直播|机构/.test(type));
}

function deriveCreatorCount(partner: Partner) {
  const text = [partner.description, partner.publicCases, partner.customerProfile, partner.salesScenario].filter(Boolean).join(' ');
  const match = text.match(/(?:旗下|签约|优质|全国签约)?[^，。；;]{0,8}?(\d{2,6})\s*(?:\+|余|多)?\s*(?:人|名|位)?(?:达人|艺人|主播|创作者)/);
  if (match?.[1]) return `${match[1]}+`;
  return '待补充';
}

function averageVerifiedReviewScore(reviews: CooperationReview[]) {
  const scores = reviews.flatMap((review) => [
    review.fulfillmentScore,
    review.communicationScore,
    review.conversionScore,
    review.dataTransparencyScore,
  ]).filter((score) => score > 0);

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function toCompanyProfile(partner: Partner, reviews: CooperationReview[] = []): CompanyPageProfile {
  const verifiedReviews = reviews.filter((review) => review.partnerId === partner.id && review.reviewStatus === 'verified');
  const reviewScore = averageVerifiedReviewScore(verifiedReviews);
  const publicCases = cleanValue(partner.publicCases);
  const score = reviewScore || partner.scores.overall || 0;

  return {
    id: partner.id,
    slug: getCompanySlug(partner),
    displayName: partner.displayName,
    legalEntity: cleanValue(partner.legalEntity) || undefined,
    institutionType: partner.partnerType.join(' / ') || 'MCN机构',
    foundedDate: firstNonEmpty(partner.foundedDate),
    city: firstNonEmpty(partner.city),
    creatorCount: deriveCreatorCount(partner),
    description: firstNonEmpty(partner.description, publicCases, `${partner.displayName}为渠评收录的合作方机构档案，公开资料仍在持续核验中。`),
    cooperationSummary: verifiedReviews.length > 0
      ? `已收录 ${verifiedReviews.length} 条已验证合作反馈，可用于参考履约、沟通、转化与数据透明度表现。`
      : (publicCases || '暂无已验证合作反馈，建议合作前补充合同、结算、案例和品牌方复盘材料。'),
    userScore: score,
    sourceLabel: firstNonEmpty(getPublicDataSourceLabel(partner.dataSource), '公开资料'),
  };
}

export function getAllCompanyProfiles(partners: Partner[], reviews: CooperationReview[] = []) {
  const fromPartners = partners
    .filter(isCompanyPagePartner)
    .map((partner) => toCompanyProfile(partner, reviews));
  const seen = new Set(fromPartners.map((company) => company.slug));
  return [
    ...fromPartners,
    ...STATIC_COMPANY_PAGES.filter((company) => !seen.has(company.slug)),
  ];
}

export function findCompanyProfile(slug: string, partners: Partner[], reviews: CooperationReview[] = []) {
  return getAllCompanyProfiles(partners, reviews).find((company) => company.slug === slug);
}
