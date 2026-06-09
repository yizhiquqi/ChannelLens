// 合作方实体类型
export type EntityType = 'company' | 'person' | 'team';

export type PartnerType = string;
export type Platform = string;
export type CooperationModel = string;

export type VerificationStatus = '未核验' | '部分核验' | '已核验';
export type RiskLevel = 'low' | 'medium' | 'high';
export type CooperationResult = '无明显结果' | '有曝光' | '有线索' | '有成交' | '有复购' | '有争议' | string;
export type ReviewerRole = '创始人' | '市场负责人' | '渠道负责人' | '商务负责人' | '电商负责人' | '其他' | string;
export type RecommendType = 'yes' | 'unsure' | 'no';
export type EvidenceStatus = '无证据' | '部分证据' | '已验证' | string;
export type ReviewStatus = 'pending' | 'verified' | 'rejected' | 'disputed';

export interface PartnerScores {
  authenticity: number;
  fulfillment: number;
  categoryFit: number;
  conversionFeedback: number;
  riskControl: number;
  dataCompleteness: number;
  overall: number;
}

export interface Partner {
  id: string;
  name: string;
  entityType: EntityType;
  displayName: string;
  legalEntity?: string;
  registeredCapital?: string;
  foundedDate?: string;
  legalRepresentative?: string;
  businessStatus?: string;
  businessInfoSource?: string;
  roleTitle?: string;
  city: string;
  coverageArea: string[];
  partnerType: PartnerType[];
  platforms: Platform[];
  categories: string[];
  priceRange: string;
  cooperationModels: CooperationModel[];
  typicalFeeRange?: string;
  customerProfile: string;
  salesScenario: string;
  verificationStatus: VerificationStatus;
  riskLevel: RiskLevel;
  riskTags: string[];
  scores: PartnerScores;
  publicCases?: string;
  caseVerificationStatus?: string;
  publicCaseSource?: string;
  publicCaseVerificationNote?: string;
  adminRelationships?: PartnerRelationship[];
  dataSource?: string;
  description?: string;
  followerCount?: string;
  engagementRate?: string;
  updatedAt: string;
  adminVisibility?: 'public' | 'internal';
}

export interface CooperationCase {
  brandName: string;
  category: string;
  period: string;
  result: string;
  amount: string;
}

export interface CooperationReview {
  id: string;
  partnerId: string;
  brandName: string;
  isAnonymous: boolean;
  reviewerRole: ReviewerRole;
  brandCategory: string;
  productPriceRange: string;
  cooperationDate: string;
  cooperationPlatform: string;
  cooperationCategory: string;
  cooperationModel: CooperationModel;
  amountRange: string;
  cooperationGoal: string;
  cooperationResult: CooperationResult;
  gmvFeedback: string;
  conversionFeedback: string;
  refundFeedback: string;
  fulfillmentScore: number;
  communicationScore: number;
  conversionScore: number;
  dataTransparencyScore: number;
  recommend: RecommendType;
  repurchaseIntent: string;
  reviewText: string;
  positivePoints: string[];
  negativePoints: string[];
  riskTags: string[];
  riskFeedback: string;
  evidenceStatus: EvidenceStatus;
  reviewStatus: ReviewStatus;
  createdAt: string;
}

export interface PartnerRelationship {
  id: string;
  partnerId: string;
  relatedPartnerId: string;
  relatedPartnerName: string;
  relationshipType: string;
  sourceType: string;
  verificationStatus: string;
  notes: string;
}

// backward-compat aliases
export type Channel = Partner;
export type Review = CooperationReview;
export interface Scores extends PartnerScores {}
