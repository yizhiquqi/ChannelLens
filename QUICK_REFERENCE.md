# 快速参考 - 渠鉴数据结构

## 文件位置和职责

| 文件 | 职责 | 维护频率 |
|------|------|--------|
| `src/data/channels.ts` | 渠道商档案 Mock 数据 | 常规 |
| `src/data/reviews.ts` | 品牌方评价 Mock 数据 | 常规 |
| `src/config/scoring.ts` | 评分维度定义和计算 | 稀频 |
| `src/config/riskTags.ts` | 风险标签库定义 | 稀频 |
| `src/types/index.ts` | TypeScript 类型定义 | 稀频 |

## 核心数据类型

### Channel（渠道商）
```typescript
{
  id: 'c1',
  name: '华北联合商贸有限公司',
  city: '北京',
  channelType: '经销商',        // 渠道类型
  categories: ['个护清洁', ...], // 擅长品类
  priceRange: '20元-200元',      // 客单价
  scores: {                      // 六维评分
    authenticity: 8.5,           // 真实性(0-20)
    fulfillment: 8.0,            // 履约能力(0-20)
    categoryMatch: 9.0,          // 品类匹配(0-20)
    cooperationFeedback: 7.5,    // 合作反馈(0-20)
    complianceControl: 6.5,      // 合规风控(0-10)
    dataCompleteness: 8.0,       // 数据完整度(0-10)
  },
  adaptationIndex: 78,           // 适配指数(0-100)
  riskTags: ['窜货记录'],        // 风险标签
  riskLevel: 'medium',           // 风险等级
  verificationStatus: '已认证',  // 认证状态
}
```

### Review（评价）
```typescript
{
  id: 'r1',
  channelId: 'c1',               // 对应渠道ID
  brandName: '某快消品牌A',      // 品牌名称
  cooperationResult: '成功',     // 合作结果
  fulfillmentScore: 5,           // 履约评分(1-5)
  communicationScore: 4,         // 沟通评分(1-5)
  recommend: true,               // 是否推荐
  reviewStatus: '已验证',        // 审核状态
  createdAt: '2024-01-15',       // 创建时间
}
```

## 常用操作

### 获取特定城市的渠道商
```typescript
import { mockChannels } from '../data';
const beijingChannels = mockChannels.filter(c => c.city === '北京');
```

### 获取渠道商的所有评价
```typescript
import { mockReviews } from '../data';
const reviews = mockReviews.filter(r => r.channelId === 'c1');
```

### 获取已验证评价
```typescript
const verifiedReviews = reviews.filter(r => r.reviewStatus === '已验证');
```

### 获取风险标签信息
```typescript
import { getRiskTag, RISK_TAG_COLORS } from '../config/riskTags';
const riskTag = getRiskTag('account_period');
const colors = RISK_TAG_COLORS[riskTag.severity]; // high/medium/low
```

### 计算渠道适配指数
```typescript
import { calculateAdaptationIndex } from '../config/scoring';
const index = calculateAdaptationIndex(channel.scores);
```

## 页面数据流图

```
首页
└── 静态内容

渠道库列表
├── 读: mockChannels
├── 筛选: 城市/类型/品类
└── 显示: 渠道卡片

渠道详情
├── 读: mockChannels[id]
├── 读: mockReviews.filter(r => r.channelId === id)
├── 读: SCORING_DIMENSIONS 显示评分标签
├── 读: RISK_TAGS 显示风险标签信息
└── 显示: 渠道完整档案 + 评价列表

提交评价
├── 读: mockChannels 用于渠道选择
└── 创建: 新评价对象

后台管理
├── 读: mockChannels 渠道列表
├── 读: mockReviews 评价列表
├── 读: RISK_TAGS 风险标签库
├── 写: 更新渠道信息
├── 写: 审核/标记评价
└── 写: 添加/删除风险标签
```

## 常见错误检查

- ✓ 评价的 `channelId` 是否对应有效渠道
- ✓ 风险标签 ID 是否在 `RISK_TAGS` 中定义
- ✓ 评分分数不超过最大分数（真实性20分、其他维度各20分或10分）
- ✓ 日期格式统一为 YYYY-MM-DD
- ✓ `adaptationIndex` 值范围 0-100

## TypeScript 导入提示

```typescript
// 数据导入
import type { Channel, Review, Scores } from '../types';
import { mockChannels, mockReviews } from '../data';

// 配置导入
import { SCORING_DIMENSIONS, calculateAdaptationIndex } from '../config/scoring';
import { RISK_TAGS, getRiskTag, RISK_TAG_COLORS } from '../config/riskTags';

// 类型守卫
type ChannelType = '经销商' | '代理商' | '分销商' | '直营门店' | '电商运营商' | '跨境渠道商';
type RiskLevel = 'low' | 'medium' | 'high';
type ReviewStatus = '已验证' | '待补充' | '拒绝' | '待审核';
```

## 扩展建议

当功能需要扩展时：

1. **添加新评分维度** → 编辑 `src/config/scoring.ts`
2. **添加新风险标签** → 编辑 `src/config/riskTags.ts`
3. **添加新渠道商** → 编辑 `src/data/channels.ts`
4. **修改页面显示** → 修改 `src/pages/*.tsx`（无需改动数据层）
5. **迁移到数据库** → 创建 `src/services/*.ts` 服务层
