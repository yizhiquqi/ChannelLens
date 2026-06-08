export type RiskSeverity = 'low' | 'medium' | 'high';

export interface RiskTag {
  id: string;
  name: string;
  severity: RiskSeverity;
  description: string;
  category: 'info' | 'business' | 'financial' | 'legal' | 'operation';
}

export const RISK_TAGS: Record<string, RiskTag> = {
  // Low Risk - 信息和验证相关
  incomplete_info: {
    id: 'incomplete_info',
    name: '信息待补充',
    severity: 'low',
    description: '档案信息不够完整，待进一步核实',
    category: 'info',
  },
  partial_verification: {
    id: 'partial_verification',
    name: '案例未完全核验',
    severity: 'low',
    description: '部分案例信息来源于合作方自述，未完全独立验证',
    category: 'info',
  },
  no_recent_update: {
    id: 'no_recent_update',
    name: '近期无更新',
    severity: 'low',
    description: '档案信息较长时间未更新',
    category: 'info',
  },
  narrow_categories: {
    id: 'narrow_categories',
    name: '适配品类较窄',
    severity: 'low',
    description: '合作方擅长的品类范围较为局限',
    category: 'business',
  },
  long_sales_cycle: {
    id: 'long_sales_cycle',
    name: '成交周期较长',
    severity: 'low',
    description: '合作方的成交周期普遍较长',
    category: 'business',
  },

  // Medium Risk - 业务和财务风险
  self_reported_cases: {
    id: 'self_reported_cases',
    name: '案例主要来自自述',
    severity: 'medium',
    description: '合作案例主要来自合作方自述，缺乏第三方佐证',
    category: 'business',
  },
  high_upfront_fee: {
    id: 'high_upfront_fee',
    name: '前置费用较高',
    severity: 'medium',
    description: '合作前置费用相对较高，存在风险',
    category: 'financial',
  },
  requires_stocking: {
    id: 'requires_stocking',
    name: '需要压货',
    severity: 'medium',
    description: '合作方式要求品牌方压货或大额预付',
    category: 'financial',
  },
  long_settlement_cycle: {
    id: 'long_settlement_cycle',
    name: '回款周期较长',
    severity: 'medium',
    description: '合作方回款周期较长，需要充分的资金准备',
    category: 'financial',
  },
  unstable_conversion: {
    id: 'unstable_conversion',
    name: '转化结果不稳定',
    severity: 'medium',
    description: '不同时期的合作成果波动较大',
    category: 'business',
  },
  unclear_customer_profile: {
    id: 'unclear_customer_profile',
    name: '客户画像不清晰',
    severity: 'medium',
    description: '合作方的目标客户画像定义不够清晰',
    category: 'business',
  },
  low_contract_compliance: {
    id: 'low_contract_compliance',
    name: '合同规范度不足',
    severity: 'medium',
    description: '合作合同的规范性和完整性有待提高',
    category: 'legal',
  },

  // High Risk - 严重信誉和法律风险
  inconsistent_info: {
    id: 'inconsistent_info',
    name: '主体信息不一致',
    severity: 'high',
    description: '提供的主体信息存在明显矛盾或不一致',
    category: 'legal',
  },
  lost_contact_after_cooperation: {
    id: 'lost_contact_after_cooperation',
    name: '合作后失联反馈',
    severity: 'high',
    description: '有合作方在合作完成后失联的反馈记录',
    category: 'operation',
  },
  payment_dispute: {
    id: 'payment_dispute',
    name: '回款争议',
    severity: 'high',
    description: '存在关于回款的争议或诉讼记录',
    category: 'financial',
  },
  exaggerated_resources: {
    id: 'exaggerated_resources',
    name: '夸大资源',
    severity: 'high',
    description: '有虚报粉丝、浏览量或其他资源的嫌疑',
    category: 'legal',
  },
  suspected_false_cases: {
    id: 'suspected_false_cases',
    name: '虚假案例嫌疑',
    severity: 'high',
    description: '合作案例存在虚假或过度夸大的嫌疑',
    category: 'legal',
  },
  parallel_selling_risk: {
    id: 'parallel_selling_risk',
    name: '窜货风险',
    severity: 'high',
    description: '存在产品窜货或渠道混乱的风险',
    category: 'business',
  },
  stocking_dispute: {
    id: 'stocking_dispute',
    name: '压货争议',
    severity: 'high',
    description: '存在压货方面的争议或负面反馈',
    category: 'financial',
  },
  suspected_data_manipulation: {
    id: 'suspected_data_manipulation',
    name: '刷数据嫌疑',
    severity: 'high',
    description: '存在数据刷量或作假的嫌疑',
    category: 'legal',
  },
  concentrated_negative_feedback: {
    id: 'concentrated_negative_feedback',
    name: '集中负面评价',
    severity: 'high',
    description: '存在集中的负面评价或差评',
    category: 'business',
  },
  business_abnormality: {
    id: 'business_abnormality',
    name: '工商或法律异常',
    severity: 'high',
    description: '合作方存在工商异常、经营异常或法律诉讼记录',
    category: 'legal',
  },
};

export function getRiskTagsByCategory(category: RiskTag['category']): RiskTag[] {
  return Object.values(RISK_TAGS).filter((tag) => tag.category === category);
}

export function getRiskTagsBySeverity(severity: RiskSeverity): RiskTag[] {
  return Object.values(RISK_TAGS).filter((tag) => tag.severity === severity);
}

export function getAllRiskTags(): RiskTag[] {
  return Object.values(RISK_TAGS);
}

export function getRiskTag(id: string): RiskTag | undefined {
  return RISK_TAGS[id];
}

export const RISK_TAG_COLORS = {
  high: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
  medium: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  low: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
  },
} as const;

export const RISK_LEVEL_LABELS = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
} as const;

export const RISK_LEVEL_COLORS = {
  high: { bg: 'bg-red-100', text: 'text-red-800', label: RISK_LEVEL_LABELS.high },
  medium: { bg: 'bg-amber-100', text: 'text-amber-800', label: RISK_LEVEL_LABELS.medium },
  low: { bg: 'bg-green-100', text: 'text-green-800', label: RISK_LEVEL_LABELS.low },
} as const;
