# 合作方详情页优化说明

## 概览

合作方详情页已全面优化，支持三种实体类型（company/person/team）的自适应显示。同一个 `PartnerDetailPage` 组件根据 `partner.entityType` 自动展示不同的内容字段。

---

## 页面架构

### 组件结构

```
PartnerDetailPage
├── 导航栏
├── 主内容区域 (lg:col-span-2)
│   ├── 类型特异性 Section (根据 entityType 选择)
│   │   ├── CompanySection     (entity Type = company)
│   │   ├── PersonSection      (entity Type = person)
│   │   └── TeamSection        (entity Type = team)
│   └── SharedSections (所有类型通用)
│       ├── 风险信息
│       ├── 合作适配指数
│       └── 品牌方评价
└── 右侧面板 (lg:col-span-1，sticky)
    ├── 核心指标
    ├── 评价倾向
    └── 操作按钮
```

---

## 三种类型的展示逻辑

### 1️⃣ 公司型 (entityType = 'company')

**CompanySection 展示内容：**

```
📋 公司基础信息
├── 展示名称 + "公司类型合作方" 标签
├── 法定代表人
├── 成立时间（年份）
├── 所在城市
├── 覆盖区域（多城市）
└── 工商信息（注册号）

💼 业务能力
├── 合作方类别（Badge 展示）
├── 擅长品类（Badge 展示）
├── 合作模式（Badge 展示）
└── 员工规模

🎯 合作背景
├── 客户画像
└── 销售场景

📊 历史案例
└── 列表展示（品牌名、时间、成果、金额）
```

**字段来源：**
- `displayName` / `legalEntity` → 标题
- `establishedYear` → 成立时间
- `city` → 所在城市
- `coverageArea` → 覆盖区域
- `registrationNumber` → 工商信息
- `partnerType` → 类别
- `categories` → 品类
- `cooperationModels` → 合作模式
- `employeeCount` → 员工规模
- `customerProfile` → 客户画像
- `salesScenario` → 销售场景
- `cases` → 历史案例

---

### 2️⃣ 个人型 (entityType = 'person')

**PersonSection 展示内容：**

```
👤 个人基础信息
├── 展示名称 + "个人合作方" + "隐私保护中" 标签
├── 职业身份（身份/职业）
├── 主要平台（抖音/小红书等）
├── 所在城市
├── 粉丝数
└── 互动率

🔒 隐私保护提示
└── "为保护个人隐私，仅展示公开的业务身份和合作能力信息"

💪 合作能力
├── 合作类别（Badge）
├── 擅长品类（Badge）
├── 合作方式（Badge）
└── 适合客单价

🎨 运营画像
├── 主要客户
└── 成交场景
```

**字段来源：**
- `displayName` → 展示名
- `roleTitle` → 职业身份
- `platforms` → 主要平台
- `city` → 所在城市
- `followerCount` → 粉丝数
- `engagementRate` → 互动率
- `partnerType` → 合作类别
- `categories` → 擅长品类
- `cooperationModels` → 合作方式
- `priceRange` → 适合客单价
- `customerProfile` → 主要客户
- `salesScenario` → 成交场景

**隐私保护：**
- ❌ 不显示私人手机号
- ❌ 不显示私人微信
- ❌ 不显示身份证
- ❌ 不显示家庭地址
- ❌ 不显示私人邮箱
- ✅ 只显示公开的业务身份和合作能力

---

### 3️⃣ 团队型 (entityType = 'team')

**TeamSection 展示内容：**

```
👥 团队基础信息
├── 展示名称 + "团队类型合作方" 标签
├── 团队类别（合作方类别）
├── 团队规模（员工数）
├── 主要平台
├── 覆盖区域
└── 所在城市

💼 业务能力
├── 擅长品类（Badge）
├── 合作方式（Badge）
├── 客户画像
└── 成交场景

📊 合作案例
└── 列表展示（品牌名、时间、成果、金额）
```

**字段来源：**
- `displayName` → 团队名称
- `partnerType` → 团队类别
- `employeeCount` → 团队规模
- `platforms` → 主要平台
- `coverageArea` → 覆盖区域
- `city` → 所在城市
- `categories` → 擅长品类
- `cooperationModels` → 合作方式
- `customerProfile` → 客户画像
- `salesScenario` → 成交场景
- `cases` → 合作案例

---

## 共享 Sections (所有类型通用)

### SharedSections 组件展示：

```
⚠️ 风险信息（仅在 riskLevel !== 'low' 时显示）
├── 风险等级标签
└── 风险标签列表（带颜色标记）

📊 合作适配指数详解
├── 真实性（20分）
├── 履约能力（20分）
├── 品类匹配度（20分）
├── 合作反馈（20分）
├── 合规风控（10分）
└── 数据完整度（10分）

💬 品牌方评价
├── 已验证评价列表
└── 提交评价按钮
```

---

## 右侧面板 (所有类型相同)

```
📌 核心指标（sticky）
├── 已验证评价数
├── 总体评分
├── 核验状态
└── 风险等级

📈 评价倾向（如有评价）
├── 推荐 (推荐比例)
├── 未定论 (未定论比例)
└── 不推荐 (不推荐比例)

🎯 申请尽调报告按钮
```

---

## 代码实现细节

### 类型检查与渲染

```typescript
export default function PartnerDetailPage({ channelId, onNavigate }) {
  const partner = mockPartners.find(p => p.id === channelId);
  
  // ...
  
  return (
    <div>
      {/* 根据 entityType 渲染不同的 Section */}
      {partner.entityType === 'company' && <CompanySection partner={partner} />}
      {partner.entityType === 'person' && <PersonSection partner={partner} />}
      {partner.entityType === 'team' && <TeamSection partner={partner} />}
      
      {/* 所有类型都显示的共享 Sections */}
      <SharedSections partner={partner} verifiedReviews={verifiedReviews} onNavigate={onNavigate} />
    </div>
  );
}
```

### 隐私保护实现

PersonSection 中包含显式的隐私提示：

```typescript
<div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2 text-xs text-blue-700">
  <CheckCircle size={14} className="shrink-0 mt-0.5" />
  <p>为保护个人隐私，仅展示公开的业务身份和合作能力信息，不展示个人敏感信息。</p>
</div>
```

---

## 视觉设计

### 类型识别图标

- 🏢 **Company** - Building2 图标，蓝色
- 👤 **Person** - User2 图标，紫色
- 👥 **Team** - Users2 图标，绿色

### 颜色方案

| 类型 | 图标颜色 | 标签 |
|------|---------|------|
| Company | `text-blue-600` | "公司类型合作方" |
| Person | `text-purple-600` | "个人合作方（隐私保护中）" |
| Team | `text-green-600` | "团队类型合作方" |

### 响应式布局

- **桌面 (lg+)**: 主内容 2/3 + 右侧面板 1/3 (sticky)
- **平板/手机**: 主内容占满宽度，右侧面板跟随滚动

---

## 数据字段映射

### Company 特有字段

```typescript
{
  establishedYear: number;      // 成立年份
  employeeCount: string;        // 员工规模
  legalRepresentative: string;  // 法定代表人
  registrationNumber: string;   // 工商注册号
}
```

### Person 特有字段

```typescript
{
  roleTitle: string;     // 职业身份
  followerCount: string; // 粉丝数
  engagementRate: string; // 互动率
}
```

### Team 特有字段

```typescript
{
  employeeCount: string; // 团队规模（核心成员数）
}
```

### 所有类型都有字段

```typescript
{
  id, name, displayName, entityType
  city, coverageArea, platforms, categories
  partnerType[], cooperationModels[]
  verificationStatus, riskLevel, riskTags[]
  scores, customerProfile, salesScenario
  cases[], description, updatedAt
}
```

---

## 使用流程

### 查看公司型合作方

1. 从列表点击某个 company 类型的合作方
2. 进入详情页
3. 自动渲染 **CompanySection**，显示法人、成立年份、覆盖区域等
4. 显示历史案例列表
5. 下方显示共享 Sections（风险、评分、评价）

### 查看个人型合作方

1. 从列表点击某个 person 类型的合作方
2. 进入详情页
3. 自动渲染 **PersonSection**，显示职业身份、平台、粉丝等
4. 展示隐私保护提示
5. **不显示任何私人信息**
6. 下方显示共享 Sections

### 查看团队型合作方

1. 从列表点击某个 team 类型的合作方
2. 进入详情页
3. 自动渲染 **TeamSection**，显示团队规模、平台、案例等
4. 下方显示共享 Sections

---

## 数据展示对比

| 字段 | Company | Person | Team |
|------|---------|--------|------|
| 法定代表人 | ✅ | ❌ | ❌ |
| 职业身份 | ❌ | ✅ | ❌ |
| 成立年份 | ✅ | ❌ | ❌ |
| 粉丝数 | ❌ | ✅ | ❌ |
| 互动率 | ❌ | ✅ | ❌ |
| 工商注册号 | ✅ | ❌ | ❌ |
| 团队规模 | ✅ | ❌ | ✅ |
| 覆盖区域 | ✅ | ✅ | ✅ |
| 所在城市 | ✅ | ✅ | ✅ |
| 合作案例 | ✅ | ❌ | ✅ |
| 合作方类别 | ✅ | ✅ | ✅ |
| 擅长品类 | ✅ | ✅ | ✅ |
| 合作方式 | ✅ | ✅ | ✅ |
| 客户画像 | ✅ | ✅ | ✅ |
| 成交场景 | ✅ | ✅ | ✅ |
| 风险标签 | ✅ | ✅ | ✅ |
| 合作适配指数 | ✅ | ✅ | ✅ |
| 品牌方评价 | ✅ | ✅ | ✅ |

---

## 隐私保护检查清单

✅ **个人型页面隐私保护：**
- ❌ 不显示真名（仅显示 displayName）
- ❌ 不显示手机号
- ❌ 不显示微信 ID
- ❌ 不显示 QQ 号
- ❌ 不显示身份证号
- ❌ 不显示家庭地址
- ❌ 不显示私人邮箱
- ✅ 显式提示"隐私保护中"
- ✅ 只显示公开的平台账号
- ✅ 只显示公开的粉丝数和互动率

---

## 技术实现要点

### 1. 单一 PartnerDetailPage 组件

优点：
- 共享导航、核心指标、评价等通用逻辑
- 减少代码重复
- 便于维护

实现方式：
```typescript
// 同一个组件，根据 entityType 选择不同 Section 组件
{partner.entityType === 'company' && <CompanySection partner={partner} />}
{partner.entityType === 'person' && <PersonSection partner={partner} />}
{partner.entityType === 'team' && <TeamSection partner={partner} />}
```

### 2. 提取 SharedSections 组件

优点：
- DRY 原则，避免重复代码
- 三种类型共享的内容独立管理

包含内容：
- 风险标签展示
- 合作适配指数
- 品牌方评价

### 3. 类型特异性 Sections

每个类型独立的 Section 组件：
- `CompanySection` - 公司相关信息
- `PersonSection` - 个人相关信息 + 隐私保护
- `TeamSection` - 团队相关信息

---

## 测试场景

### 场景1: 查看某个 MCN 机构（Company）

✅ 应显示：法人、成立时间、覆盖区域、工商号、员工规模、历史案例
❌ 应不显示：粉丝数、互动率、职业身份

### 场景2: 查看某个小红书达人（Person）

✅ 应显示：职业身份、主要平台、粉丝数、互动率
❌ 应不显示：工商号、成立时间、员工规模、历史案例、真名
✅ 应显示隐私保护提示

### 场景3: 查看某个直播团队（Team）

✅ 应显示：团队规模、主要平台、覆盖区域、合作案例
❌ 应不显示：粉丝数、工商号、法定代表人

---

## 后续扩展建议

1. **增加编辑功能** - 后台可编辑三种类型的字段
2. **历史版本** - 记录合作方信息更新历史
3. **数据验证** - 在后台对不同类型的必填字段进行验证
4. **导出功能** - 支持导出合作方档案为 PDF
5. **对比功能** - 支持对比多个合作方（同类型）

---

## 构建状态

✅ **编译成功** - 所有类型检查通过
✅ **无错误** - PartnerDetailPage 已完全重构
✅ **响应式** - 支持桌面、平板、手机
✅ **隐私保护** - 个人型页面隐私信息已隐藏

---

## 总结

PartnerDetailPage 已优化为真正意义上的 **三种类型自适应展示**，同一个组件根据 `entityType` 灵活显示不同的内容，同时在个人型页面实现完善的隐私保护。
