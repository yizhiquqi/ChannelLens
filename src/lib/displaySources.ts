import type { Partner } from '../types';

export function getBusinessInfoSourceLabel(partner: Partner) {
  if (partner.entityType === 'company') return '企信通';
  return partner.businessInfoSource ?? '';
}

export function getPublicDataSourceLabel(source?: string) {
  const value = (source ?? '').trim();
  if (!value) return '';

  const labels = new Set<string>();
  if (/合作商入驻|入驻申请/.test(value)) labels.add('合作商入驻资料');
  if (/用户确认/.test(value)) labels.add('用户确认');
  if (/品牌方/.test(value)) labels.add('品牌方反馈');
  if (/官网/.test(value)) labels.add('公开官网');
  if (/公开资料|公开来源/.test(value)) labels.add('公开资料');

  const cleaned = value
    .split(/[;；,，、]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !/raw_data\.csv|raw_id|RAW\d+/i.test(item))
    .filter((item) => !/本地|示例行/.test(item));

  cleaned.forEach((item) => {
    if (/官网/.test(item)) labels.add('公开官网');
    else if (/品牌方/.test(item)) labels.add('品牌方反馈');
    else if (/用户确认/.test(item)) labels.add('用户确认');
    else if (/合作商入驻|入驻申请/.test(item)) labels.add('合作商入驻资料');
    else if (/公开资料|公开来源/.test(item)) labels.add('公开资料');
    else labels.add(item);
  });

  if (labels.size === 0) return '公开资料';
  return Array.from(labels).join('；');
}
