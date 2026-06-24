# 抖音达人首批样本公开导入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 30 位抖音达人以公开、未核验档案写入 ChannelLens 正式 Supabase，并验证网站列表、搜索和详情页。

**Architecture:** 复用现有 `admin_partners` 与 `partner_visibility` 两张表。使用一个可审计、可重复执行的 SQL 文件，通过固定 ID `p_douyin_001` 至 `p_douyin_030` upsert 数据；页面仅增加公开主页链接和“风险待评估”口径，随后由 Vercel 部署。

**Tech Stack:** PostgreSQL / Supabase、React 18、Vite、TypeScript、Vercel

---

## 文件结构

- Create: `supabase_douyin_creator_seed_import.sql` — 30 位达人公开档案及可见性 upsert。
- Reference: `outputs/ChannelLens_抖音达人首批样本_2026-06-24.xlsx` — 本次导入的审核来源。
- Modify: `src/types/index.ts` — 增加公开主页链接字段。
- Modify: `src/pages/ChannelListPage.tsx` — 未核验档案显示“风险待评估”。
- Modify: `src/pages/ChannelDetailPage.tsx` — 展示公开主页链接和中性风险状态。

### Task 1: 创建可重复执行的达人导入 SQL

**Files:**
- Create: `supabase_douyin_creator_seed_import.sql`

- [ ] **Step 1: 写入事务和固定 ID 数据**

SQL 使用以下结构，并为 30 位达人分别写入完整 JSONB payload：

```sql
begin;

insert into public.admin_partners (id, visibility, payload, updated_at)
values
  (
    'p_douyin_001',
    'public',
    jsonb_build_object(
      'id', 'p_douyin_001',
      'name', '护肤学霸蚊子（测评版）',
      'displayName', '护肤学霸蚊子（测评版）',
      'entityType', 'person',
      'roleTitle', '抖音达人',
      'city', '',
      'coverageArea', jsonb_build_array(),
      'partnerType', jsonb_build_array('主播达人'),
      'platforms', jsonb_build_array('抖音'),
      'categories', jsonb_build_array('美妆护肤', '成分护肤', '产品测评'),
      'priceRange', '待补充',
      'cooperationModels', jsonb_build_array('待确认'),
      'customerProfile', '待补充',
      'salesScenario', '短视频内容合作',
      'verificationStatus', '未核验',
      'riskLevel', 'low',
      'riskTags', jsonb_build_array(),
      'scores', jsonb_build_object(
        'authenticity', 0,
        'fulfillment', 0,
        'categoryFit', 0,
        'conversionFeedback', 0,
        'riskControl', 0,
        'dataCompleteness', 0,
        'overall', 0
      ),
      'dataSource', '抖音公开主页及搜索页',
      'description', '复旦/东华双学位，皮肤管理师，长期研究护肤品成分。公开资料待核验。',
      'followerCount', '98.6万',
      'updatedAt', '2026-06-24',
      'adminVisibility', 'public',
      'publicProfileUrl', 'https://www.douyin.com/user/MS4wLjABAAAAbeIim9TwvE2xb5ibjW9VwCUh6AJjgke2oQuuFyvsrle-d3mlX4B3pFsLV2mxfLdA'
    ),
    now()
  )
  -- 完整文件在此处连续写入下方清单中的其余 29 条完整记录
on conflict (id) do update set
  visibility = excluded.visibility,
  payload = excluded.payload,
  updated_at = excluded.updated_at;

insert into public.partner_visibility (id, visibility, updated_at)
select id, 'public', now()
from public.admin_partners
where id between 'p_douyin_001' and 'p_douyin_030'
on conflict (id) do update set
  visibility = excluded.visibility,
  updated_at = excluded.updated_at;

commit;
```

30 个 ID 与昵称严格对应：

```text
p_douyin_001 护肤学霸蚊子（测评版）
p_douyin_002 护肤硕士季学长
p_douyin_003 美妆护肤测评
p_douyin_004 米多多护肤
p_douyin_005 kk和王博士（测评版）
p_douyin_006 老爸评测美妆护肤
p_douyin_007 成分测评漆仔
p_douyin_008 朵儿朵护肤
p_douyin_009 护肤测评
p_douyin_010 成分测评源哥
p_douyin_011 子轩成分测评
p_douyin_012 洋叔de测评
p_douyin_013 瑞思白白（测评版）
p_douyin_014 小法的护肤笔记
p_douyin_015 大杰护肤品研发师
p_douyin_016 小Ray零食控
p_douyin_017 阿灿零食测评
p_douyin_018 阿荣零食测评
p_douyin_019 荣哥零食测评
p_douyin_020 芝士小奶盖（测评版）
p_douyin_021 甜甜的轻食零食
p_douyin_022 小绵羊零食测评
p_douyin_023 胖兔零食测评
p_douyin_024 零食测评
p_douyin_025 小锦鲤零食测评
p_douyin_026 可乐很真实！（零食测评）
p_douyin_027 洺洺的轻食零食
p_douyin_028 汐汐 零食小铺
p_douyin_029 小橙子轻食零食
p_douyin_030 麻薯测评局
```

- [ ] **Step 2: 静态检查 SQL 的数量和 ID 唯一性**

Run:

```powershell
$sql = Get-Content -Raw supabase_douyin_creator_seed_import.sql
$ids = [regex]::Matches($sql, "'p_douyin_\d{3}'") | ForEach-Object Value | Sort-Object -Unique
$ids.Count
$ids | Select-Object -First 1
$ids | Select-Object -Last 1
```

Expected:

```text
30
'p_douyin_001'
'p_douyin_030'
```

- [ ] **Step 3: 检查禁止字段和基本口径**

Run:

```powershell
rg -n "微信|手机号|邮箱|已核验|overall', [1-9]" supabase_douyin_creator_seed_import.sql
```

Expected: 无匹配结果。

- [ ] **Step 4: 提交 SQL 文件**

```powershell
git add supabase_douyin_creator_seed_import.sql
git commit -m "data: add douyin creator seed import"
```

### Task 2: 调整未核验档案的公开展示口径

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/pages/ChannelListPage.tsx`
- Modify: `src/pages/ChannelDetailPage.tsx`

- [ ] **Step 1: 增加公开主页字段**

在 `Partner` 接口的 `dataSource` 后加入：

```ts
publicProfileUrl?: string;
```

- [ ] **Step 2: 列表页对未核验档案显示中性风险状态**

在 `PartnerCard` 中计算：

```ts
const hasRiskAssessment = partner.verificationStatus !== '未核验' || partner.riskTags.length > 0;
```

将卡片底部风险徽章改为：

```tsx
{hasRiskAssessment ? (
  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${RISK_STYLES[partner.riskLevel] ?? RISK_STYLES.low}`}>
    <Shield size={10} />
    {RISK_LABELS[partner.riskLevel] ?? '低风险'}
  </span>
) : (
  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
    <Shield size={10} />
    风险待评估
  </span>
)}
```

- [ ] **Step 3: 详情页使用同一风险口径**

在 `riskCfg` 之后增加：

```ts
const hasRiskAssessment = partner.verificationStatus !== '未核验' || partner.riskTags.length > 0;
const publicRiskCfg = hasRiskAssessment
  ? riskCfg
  : { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-500', label: '风险待评估', icon: 'text-gray-400' };
```

详情页抬头和侧栏的风险徽章都使用 `publicRiskCfg`，其余内部风险模块保持现有逻辑。

- [ ] **Step 4: 在基础身份模块显示公开主页链接**

在档案更新时间字段之后加入：

```tsx
{partner.publicProfileUrl && (
  <div>
    <dt className="text-xs text-gray-400 mb-0.5">公开主页</dt>
    <dd>
      <a
        href={partner.publicProfileUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
      >
        查看抖音主页 <ExternalLink size={12} />
      </a>
    </dd>
  </div>
)}
```

- [ ] **Step 5: 运行静态检查和构建**

```powershell
npm run typecheck
npm run lint
npm run build
```

Expected: 三条命令均退出码 0。

- [ ] **Step 6: 提交页面口径修改**

```powershell
git add src/types/index.ts src/pages/ChannelListPage.tsx src/pages/ChannelDetailPage.tsx
git commit -m "fix: clarify unverified creator profiles"
```

### Task 3: 在 Supabase 正式项目执行导入

**Files:**
- Read: `supabase_douyin_creator_seed_import.sql`

- [ ] **Step 1: 写入前检查固定 ID 是否已存在**

在 Supabase SQL Editor 执行：

```sql
select id, visibility, payload ->> 'displayName' as display_name
from public.admin_partners
where id between 'p_douyin_001' and 'p_douyin_030'
order by id;
```

Expected: 首次执行返回 0 行；如果已有行，只能是同一批达人，否则停止导入。

- [ ] **Step 2: 执行完整导入 SQL**

在当前管理员登录状态下运行 `supabase_douyin_creator_seed_import.sql`。

Expected: 事务成功完成，无 RLS 或约束错误。

- [ ] **Step 3: 验证数据库数量、可见性和字段口径**

```sql
select
  count(*) as total,
  count(*) filter (where visibility = 'public') as public_count,
  count(*) filter (where payload ->> 'verificationStatus' = '未核验') as unverified_count,
  count(*) filter (where (payload #>> '{scores,overall}')::numeric = 0) as zero_score_count
from public.admin_partners
where id between 'p_douyin_001' and 'p_douyin_030';
```

Expected:

```text
total=30, public_count=30, unverified_count=30, zero_score_count=30
```

- [ ] **Step 4: 抽查三条记录**

```sql
select id, payload ->> 'displayName', payload ->> 'followerCount', payload ->> 'dataSource'
from public.admin_partners
where id in ('p_douyin_003', 'p_douyin_017', 'p_douyin_030')
order by id;
```

Expected: 分别返回“美妆护肤测评”“阿灿零食测评”“麻薯测评局”，粉丝数和数据来源非空。

### Task 4: 验证正式网站公开展示

**Files:**
- Verify only: `src/pages/ChannelListPage.tsx`
- Verify only: `src/pages/ChannelDetailPage.tsx`

- [ ] **Step 1: 打开正式网站合作方列表**

Expected: 列表可见新导入达人，数据来源显示为抖音公开资料。

- [ ] **Step 2: 搜索两个品类样本**

依次搜索：

```text
美妆护肤测评
阿灿零食测评
```

Expected: 每次均能返回对应达人。

- [ ] **Step 3: 抽查三个详情页**

打开 `p_douyin_003`、`p_douyin_017`、`p_douyin_030`。

Expected:

- 昵称、品类、粉丝数、简介和公开来源正确。
- 核验状态为“未核验”。
- 评分显示“暂无评分”，不显示 0 分。
- 不存在合作评价、成功案例、联系方式或推测性风险。

- [ ] **Step 4: 记录验证结果**

若数据库验证通过且网站展示正确，任务完成。因为网站运行时读取 Supabase，本次不需要 Vercel 重新部署；仅将 SQL 审计文件推送到 GitHub。

### Task 5: 推送改动并验证 Vercel 部署

**Files:**
- Commit already created: `supabase_douyin_creator_seed_import.sql`

- [ ] **Step 1: 检查提交范围**

```powershell
git status --short
git log -2 --oneline
```

Expected: 无意外代码文件，`outputs/` 保持未跟踪且不提交。

- [ ] **Step 2: 推送 main**

```powershell
git push origin main
```

Expected: 推送成功并触发 Vercel 部署。部署完成后重复 Task 4 的线上抽查，结果一致。
