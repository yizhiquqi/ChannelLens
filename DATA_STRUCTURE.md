# 渠鉴 ChannelLens 数据结构文档

## 目录结构

```
src/
├── data/                    # 数据层 - Mock 数据
│   ├── channels.ts         # 渠道商档案数据
│   ├── reviews.ts          # 品牌方评价数据
│   └── index.ts            # 数据导出集合
├── config/                  # 配置层 - 系统配置
│   ├── scoring.ts          # 评分模型配置
│   ├── riskTags.ts         # 风险标签库配置
│   └── index.ts            # 配置导出集合
├── types/                   # 类型定义
│   └── index.ts            # TypeScript 接口定义
└── pages/                   # 页面层 - 从 data/ 和 config/ 读取数据
```

## 数据结构详解

### 1. 渠道商档案 (src/data/channels.ts)

**Channel 接口字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 渠道商唯一标识 |
| name | string | 渠道商展示名称 |
| legalEntity | string | 法人代表/法定代表人 |
| city | string | 所在城市 |
| coverageArea | string[] | 覆盖区域列表 |
| channelType | ChannelType | 渠道类型（经销商/代理商/分销商/直营门店/电商运营商/跨境渠道商） |
| categories | string[] | 擅长品类 |
| priceRange | string | 适合客单价范围 |
| customerProfile | string | 目标客户描述 |
| salesScenario | string | 销售场景描述 |
| cooperationModel | string[] | 支持的合作模式 |
| commissionRange | string | 佣金范围 |
| requiresUpfrontFee | boolean | 是否需要预付款 |
| requiresStocking | boolean | 是否需要压货 |
| verificationStatus | VerificationStatus | 认证状态（已认证/待认证/认证失败） |
| caseVerificationStatus | CaseVerificationStatus | 案例验证状态（已验证/部分验证/未验证） |
| riskLevel | RiskLevel | 风险等级（low/medium/high） |
| riskTags | string[] | 风险标签ID数组 |
| scores | Scores | 多维度评分对象 |
| adaptationIndex | number | 渠道适配指数（0-100） |
| cases | CooperationCase[] | 合作案例列表 |
| description | string | 渠道商描述 |
| establishedYear | number | 成立年份 |
| employeeCount | string | 员工规模 |
| updatedAt | string | 最后更新时间 |

**Scores 对象结构：**
```typescript
{
  authenticity: number;        // 真实性（0-20）
  fulfillment: number;         // 履约能力（0-20）
  categoryMatch: number;       // 品类匹配（0-20）
  cooperationFeedback: number; // 合作反馈（0-20）
  complianceControl: number;   // 合规风控（0-10）
  dataCompleteness: number;    // 数据完整度（0-10）
}
```

### 2. 品牌方评价 (src/data/reviews.ts)

**Review 接口字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 评价唯一标识 |
| channelId | string | 关联的渠道商ID |
| brandName | string | 品牌方名称（匿名时处理） |
| isAnonymous | boolean | 是否匿名 |
| cooperationCategory | string | 合作品类 |
| cooperationModel | string | 合作模式 |
| amountRange | string | 合作金额区间 |
| cooperationResult | '成功' \| '一般' \| '失败' | 合作结果 |
| fulfillmentScore | number | 履约评分（1-5星） |
| communicationScore | number | 沟通评分（1-5星） |
| conversionScore | number | 转化评分（1-5星） |
| recommend | boolean | 是否推荐 |
| reviewText | string | 评价文本内容 |
| evidenceStatus | 'provided' \| 'pending' \| 'verified' | 证据状态 |
| reviewStatus | ReviewStatus | 评价审核状态 |
| createdAt | string | 创建时间 |

### 3. 评分模型 (src/config/scoring.ts)

**评分维度：**
- 真实性 (20分)：基于认证状态、案例验证情况
- 履约能力 (20分)：基于合作评价、账期管理
- 品类匹配 (20分)：品类覆盖的匹配程度
- 合作反馈 (20分)：基于品牌方匿名评价
- 合规风控 (10分)：基于风险标签、诉讼记录
- 数据完整度 (10分)：档案信息完整程度

**总分计算：** 100分 = 所有维度分数之和

**关键函数：**
- `calculateAdaptationIndex(scores)` - 计算渠道适配指数
- `getScoreDimensions()` - 获取所有评分维度
- `getScoreColor(score)` - 获取评分对应颜色
- `getScoreLabel(score)` - 获取评分对应标签

### 4. 风险标签库 (src/config/riskTags.ts)

**风险标签分类：**

#### 高风险 (High)
- 账期风险：资金压力问题
- 窜货记录：产品窜货情况
- 低价倾销：破坏价格体系
- 履约延迟：多次履约不及时
- 合同纠纷：存在法律纠纷
- 虚报销量：数据造假
- 品牌损害：损害品牌形象

#### 中风险 (Medium)
- 信息不透明：信息隐瞒
- 库存问题：积压滞销
- 沟通困难：效率低下
- 违规操作：行业违规

#### 低风险 (Low)
- 团队不稳定：人员流动
- 经验不足：行业经验缺乏

**关键函数：**
- `getRiskTagsByCategory(category)` - 按分类获取风险标签
- `getRiskTagsBySeverity(severity)` - 按严重程度获取风险标签
- `getRiskTag(id)` - 获取单个风险标签详情

## 使用示例

### 在页面中导入数据

```typescript
// 方式1：直接导入
import { mockChannels } from '../data/channels';
import { mockReviews } from '../data/reviews';

// 方式2：通过集合导入
import { mockChannels, mockReviews } from '../data';

// 页面中使用
const filteredChannels = mockChannels.filter(c => c.city === '北京');
const channelReviews = mockReviews.filter(r => r.channelId === channelId);
```

### 使用评分配置

```typescript
import { SCORING_DIMENSIONS, calculateAdaptationIndex } from '../config/scoring';

const channel = mockChannels[0];
const adaptationIndex = calculateAdaptationIndex(channel.scores);

// 遍历所有评分维度
SCORING_DIMENSIONS.forEach(dim => {
  console.log(dim.label, dim.weight);
});
```

### 使用风险标签

```typescript
import { RISK_TAGS, getRiskTag, RISK_TAG_COLORS } from '../config/riskTags';

const riskTagId = 'account_period';
const riskTag = getRiskTag(riskTagId);
const colors = RISK_TAG_COLORS[riskTag.severity];
```

## 页面数据流

```
HomePage
├── 使用：无特定数据依赖
├── 来源：静态内容

ChannelListPage
├── 使用：mockChannels
├── 来源：src/data/channels.ts
├── 过滤：城市、类型、品类、客单价
└── 显示：渠道卡片（名称、位置、类型、适配指数）

ChannelDetailPage
├── 使用：mockChannels + mockReviews
├── 来源：src/data/channels.ts、src/data/reviews.ts
├── 显示：
│   ├── 基础信息：来自 Channel 对象
│   ├── 评分：来自 channel.scores
│   ├── 风险标签：来自 channel.riskTags + RISK_TAGS 配置
│   └── 评价列表：来自 mockReviews.filter(r => r.channelId === id)
└── 配置：使用 SCORING_DIMENSIONS 展示评分维度标签

SubmitReviewPage
├── 使用：mockChannels
├── 来源：src/data/channels.ts
└── 用途：渠道商选择下拉列表

AdminPage
├── 使用：mockChannels + mockReviews + RISK_TAGS
├── 来源：src/data/ 和 src/config/
├── 功能：
│   ├── 渠道商管理：CRUD 渠道商档案
│   ├── 评价审核：审核、标记、更新评价状态
│   └── 风险标签管理：添加、删除风险标签
└── 配置：使用 RISK_TAGS 进行标签管理
```

## 迁移到 Supabase

当需要从 Mock 数据迁移到真实数据库时，按以下步骤：

1. 创建 Supabase 表结构
   - `channels` 表 - 对应 Channel 接口
   - `reviews` 表 - 对应 Review 接口

2. 创建数据层服务
   ```typescript
   // src/services/channelService.ts
   export const getChannels = async () => {
     const { data } = await supabase.from('channels').select('*');
     return data;
   };
   ```

3. 替换导入
   ```typescript
   // 替换前
   import { mockChannels } from '../data/channels';
   
   // 替换后
   import { getChannels } from '../services/channelService';
   const channels = await getChannels();
   ```

## 维护指南

### 添加新的渠道商
编辑 `src/data/channels.ts`，遵循现有结构添加新对象。

### 添加新的评价
编辑 `src/data/reviews.ts`，确保 `channelId` 对应有效的渠道商。

### 添加新的风险标签
编辑 `src/config/riskTags.ts`，在 `RISK_TAGS` 对象中添加新标签定义。

### 调整评分权重
编辑 `src/config/scoring.ts`，修改 `SCORING_DIMENSIONS` 中各维度的 `weight` 属性。

## 数据一致性检查

确保数据维护时的一致性：
- 评价中的 `channelId` 必须对应 `channels` 中的有效 ID
- 风险标签 ID 必须与 `RISK_TAGS` 中的定义一致
- 评分分数不应超过各维度的最大分数
- 时间戳使用 ISO 8601 格式 (YYYY-MM-DD)
