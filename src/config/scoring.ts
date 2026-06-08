export const SCORING_DIMENSIONS = {
  authenticity: {
    label: '真实性',
    maxScore: 20,
    weight: 0.2,
    description: '基于档案认证状态、案例验证情况、信息完整度等因素评估',
  },
  fulfillment: {
    label: '履约能力',
    maxScore: 20,
    weight: 0.2,
    description: '基于合作评价中的履约评分、是否有失联记录、合作稳定性',
  },
  categoryFit: {
    label: '品类匹配度',
    maxScore: 20,
    weight: 0.2,
    description: '合作方的擅长品类与品牌商品类的匹配程度',
  },
  conversionFeedback: {
    label: '合作反馈',
    maxScore: 20,
    weight: 0.2,
    description: '基于品牌方的合作评价，包括转化评分和综合建议',
  },
  riskControl: {
    label: '合规风控',
    maxScore: 10,
    weight: 0.1,
    description: '风险标签、诉讼记录、工商异常等合规风险评估',
  },
  dataCompleteness: {
    label: '数据完整度',
    maxScore: 10,
    weight: 0.1,
    description: '档案信息完整程度、合作案例数量、评价数据充分度',
  },
} as const;

export const TOTAL_SCORE = 100;
export const ADAPTATION_INDEX_NAME = '合作适配指数';

export function calculateAdaptationIndex(scores: Record<string, number>): number {
  let totalScore = 0;
  for (const [key, value] of Object.entries(scores)) {
    const dimension = SCORING_DIMENSIONS[key as keyof typeof SCORING_DIMENSIONS];
    if (dimension) {
      totalScore += (value / dimension.maxScore) * dimension.maxScore;
    }
  }
  return Math.round(totalScore);
}

export function getScoreDimensions() {
  return Object.entries(SCORING_DIMENSIONS).map(([key, value]) => ({
    key,
    ...value,
  }));
}

export function getScoreColor(score: number, maxScore: number = 10) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return 'emerald';
  if (percentage >= 60) return 'blue';
  if (percentage >= 40) return 'amber';
  return 'red';
}

export function getScoreLabel(score: number, maxScore: number = 10) {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 80) return '优秀';
  if (percentage >= 60) return '良好';
  if (percentage >= 40) return '一般';
  return '需改进';
}

export function getAdaptationIndexColor(score: number) {
  if (score >= 80) return 'emerald';
  if (score >= 60) return 'blue';
  if (score >= 40) return 'amber';
  return 'red';
}

export function getAdaptationIndexLabel(score: number) {
  if (score >= 80) return '高度适配';
  if (score >= 60) return '适度适配';
  if (score >= 40) return '谨慎评估';
  return '风险较高';
}
