import Papa from 'papaparse';
import type {
  Partner, CooperationReview, PartnerRelationship,
  PartnerScores, EntityType, VerificationStatus, RiskLevel,
  CooperationResult, ReviewerRole, RecommendType, EvidenceStatus, ReviewStatus,
} from '../types';
import { getPublicDataSourceLabel } from './displaySources';

function splitField(value: string): string[] {
  if (!value || value.trim() === '' || value.trim().startsWith('#')) return [];
  return value.split(';').map((s) => s.trim()).filter(Boolean);
}

function toBool(value: string): boolean {
  return value?.toLowerCase() === 'true';
}

function toNum(value: string): number {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

interface PartnerRow {
  partner_id: string;
  display_name: string;
  entity_type: string;
  partner_type: string;
  legal_entity: string;
  former_name?: string;
  company_type?: string;
  industry?: string;
  registered_capital: string;
  founded_date: string;
  legal_representative: string;
  business_status: string;
  registration_authority?: string;
  approval_date?: string;
  insured_count?: string;
  staff_size?: string;
  unified_social_credit_code?: string;
  taxpayer_id?: string;
  registration_number?: string;
  organization_code?: string;
  address?: string;
  business_scope?: string;
  business_info_source: string;
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
  risk_tag_1: string;
  risk_tag_2: string;
  risk_tag_3: string;
  risk_tags: string;
  authenticity_score: string;
  fulfillment_score: string;
  category_fit_score: string;
  conversion_feedback_score: string;
  data_transparency_score: string;
  risk_control_score: string;
  data_completeness_score: string;
  overall_score: string;
  data_source: string;
  visibility: string;
  updated_at: string;
  notes: string;
  Introduction: string;
}

interface ReviewRow {
  review_id: string;
  partner_id: string;
  brand_name: string;
  is_anonymous: string;
  reviewer_role: string;
  brand_category: string;
  product_price_range: string;
  cooperation_date: string;
  cooperation_platform: string;
  cooperation_model: string;
  amount_range: string;
  cooperation_goal: string;
  cooperation_result: string;
  gmv_feedback: string;
  conversion_feedback: string;
  refund_feedback: string;
  fulfillment_score: string;
  communication_score: string;
  conversion_score: string;
  data_transparency_score: string;
  recommend: string;
  repurchase_intent: string;
  positive_points: string;
  negative_points: string;
  risk_tag_1: string;
  risk_tag_2: string;
  risk_tag_3: string;
  risk_feedback: string;
  review_text: string;
  evidence_status: string;
  review_status: string;
  visibility: string;
  created_at: string;
  notes: string;
}

interface RelationshipRow {
  id: string;
  partner_id: string;
  related_partner_id: string;
  related_partner_name: string;
  relationship_type: string;
  source_type: string;
  verification_status: string;
  notes: string;
  visibility: string;
}

function collectRiskTags(r1: string, r2: string, r3: string, legacy: string): string[] {
  const tags = [r1, r2, r3]
    .map((t) => (t || '').trim())
    .filter((t) => t !== '' && !t.startsWith('#'));
  const fromField = splitField(legacy);
  return Array.from(new Set([...tags, ...fromField]));
}

function parsePartnerRow(row: PartnerRow): Partner {
  const scores: PartnerScores = {
    authenticity: toNum(row.authenticity_score),
    fulfillment: toNum(row.fulfillment_score),
    categoryFit: toNum(row.category_fit_score),
    conversionFeedback: toNum(row.conversion_feedback_score),
    riskControl: toNum(row.risk_control_score),
    dataCompleteness: toNum(row.data_completeness_score),
    overall: toNum(row.overall_score),
  };

  return {
    id: row.partner_id,
    name: row.display_name,
    entityType: row.entity_type as EntityType,
    displayName: row.display_name,
    legalEntity: row.legal_entity || undefined,
    formerName: row.former_name || undefined,
    companyType: row.company_type || undefined,
    industry: row.industry || undefined,
    registeredCapital: row.registered_capital || undefined,
    foundedDate: row.founded_date || undefined,
    legalRepresentative: row.legal_representative || undefined,
    businessStatus: row.business_status || undefined,
    registrationAuthority: row.registration_authority || undefined,
    approvalDate: row.approval_date || undefined,
    insuredCount: row.insured_count || undefined,
    staffSize: row.staff_size || undefined,
    unifiedSocialCreditCode: row.unified_social_credit_code || undefined,
    taxpayerId: row.taxpayer_id || undefined,
    registrationNumber: row.registration_number || undefined,
    organizationCode: row.organization_code || undefined,
    address: row.address || undefined,
    businessScope: row.business_scope || undefined,
    businessInfoSource: row.entity_type === 'company' ? '企信通' : (row.business_info_source || undefined),
    city: row.city,
    coverageArea: splitField(row.coverage_area),
    partnerType: splitField(row.partner_type),
    platforms: splitField(row.platforms),
    categories: splitField(row.categories),
    priceRange: row.price_range || row.typical_fee_range,
    typicalFeeRange: row.typical_fee_range || undefined,
    cooperationModels: splitField(row.cooperation_models),
    customerProfile: row.customer_profile,
    salesScenario: row.ecommerce_scene,
    verificationStatus: row.verification_status as VerificationStatus,
    riskLevel: (row.risk_level || 'low') as RiskLevel,
    riskTags: collectRiskTags(row.risk_tag_1, row.risk_tag_2, row.risk_tag_3, row.risk_tags),
    scores,
    publicCases: row.public_cases || undefined,
    caseVerificationStatus: row.case_verification_status || undefined,
    dataSource: getPublicDataSourceLabel(row.data_source) || undefined,
    description: row.Introduction || row.public_cases || undefined,
    updatedAt: row.updated_at,
  };
}

function parseReviewRow(row: ReviewRow): CooperationReview {
  return {
    id: row.review_id,
    partnerId: row.partner_id,
    brandName: row.brand_name,
    isAnonymous: toBool(row.is_anonymous),
    reviewerRole: row.reviewer_role as ReviewerRole,
    brandCategory: row.brand_category,
    productPriceRange: row.product_price_range,
    cooperationDate: row.cooperation_date,
    cooperationPlatform: row.cooperation_platform,
    cooperationCategory: row.brand_category,
    cooperationModel: row.cooperation_model,
    amountRange: row.amount_range,
    cooperationGoal: row.cooperation_goal,
    cooperationResult: row.cooperation_result as CooperationResult,
    gmvFeedback: row.gmv_feedback,
    conversionFeedback: row.conversion_feedback,
    refundFeedback: row.refund_feedback,
    fulfillmentScore: toNum(row.fulfillment_score),
    communicationScore: toNum(row.communication_score),
    conversionScore: toNum(row.conversion_score),
    dataTransparencyScore: toNum(row.data_transparency_score),
    recommend: row.recommend as RecommendType,
    repurchaseIntent: row.repurchase_intent,
    reviewText: row.review_text,
    positivePoints: splitField(row.positive_points),
    negativePoints: splitField(row.negative_points),
    riskTags: collectRiskTags(row.risk_tag_1, row.risk_tag_2, row.risk_tag_3, ''),
    riskFeedback: row.risk_feedback,
    evidenceStatus: row.evidence_status as EvidenceStatus,
    reviewStatus: row.review_status as ReviewStatus,
    createdAt: row.created_at,
  };
}

function parseRelationshipRow(row: RelationshipRow): PartnerRelationship {
  return {
    id: row.id,
    partnerId: row.partner_id,
    relatedPartnerId: row.related_partner_id,
    relatedPartnerName: row.related_partner_name,
    relationshipType: row.relationship_type,
    sourceType: row.source_type,
    verificationStatus: row.verification_status,
    notes: row.notes,
  };
}

async function fetchCSV<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();

  return new Promise((resolve, reject) => {
    Papa.parse<T>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          console.warn('[CSV] Parse warnings:', result.errors);
        }
        resolve(result.data);
      },
      error: (err) => reject(err),
    });
  });
}

export async function loadPartners(): Promise<Partner[]> {
  const rows = await fetchCSV<PartnerRow>('/data/partners.csv');
  return rows
    .filter((r) => r.partner_id && r.partner_id.trim() !== '' && r.visibility === 'public')
    .map(parsePartnerRow);
}

export async function loadReviews(): Promise<CooperationReview[]> {
  const rows = await fetchCSV<ReviewRow>('/data/cooperation_reviews.csv');
  return rows
    .filter((r) => r.review_id && r.review_id.trim() !== '' && r.visibility === 'public')
    .map(parseReviewRow);
}

export async function loadRelationships(): Promise<PartnerRelationship[]> {
  try {
    const rows = await fetchCSV<RelationshipRow>('/data/partner_relationships.csv');
    return rows
      .filter((r) => r.id && r.id.trim() !== '' && r.visibility === 'public')
      .map(parseRelationshipRow);
  } catch {
    // File may not exist yet — return empty array gracefully
    return [];
  }
}
