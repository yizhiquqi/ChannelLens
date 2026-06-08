# Supabase 迁移指南

本指南说明如何将当前 Mock 数据迁移到 Supabase 数据库。

## 第一步：在 Supabase 创建表结构

### 1.1 创建 channels 表

```sql
CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  legal_entity TEXT,
  city TEXT NOT NULL,
  coverage_area TEXT[], -- PostgreSQL array type
  channel_type TEXT NOT NULL,
  categories TEXT[],
  price_range TEXT,
  customer_profile TEXT,
  sales_scenario TEXT,
  cooperation_model TEXT[],
  commission_range TEXT,
  requires_upfront_fee BOOLEAN DEFAULT false,
  requires_stocking BOOLEAN DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT '待认证',
  case_verification_status TEXT DEFAULT '未验证',
  risk_level TEXT DEFAULT 'low',
  risk_tags TEXT[],
  
  -- Scores (stored as JSONB for flexibility)
  scores JSONB NOT NULL,
  
  adaptation_index INTEGER DEFAULT 0,
  cases JSONB, -- Array of CooperationCase objects
  description TEXT,
  established_year INTEGER,
  employee_count TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT channels_risk_level_check CHECK (risk_level IN ('low', 'medium', 'high')),
  CONSTRAINT channels_verification_check CHECK (verification_status IN ('已认证', '待认证', '认证失败'))
);

CREATE INDEX idx_channels_city ON channels(city);
CREATE INDEX idx_channels_type ON channels(channel_type);
CREATE INDEX idx_channels_risk_level ON channels(risk_level);
```

### 1.2 创建 reviews 表

```sql
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  cooperation_category TEXT,
  cooperation_model TEXT,
  amount_range TEXT,
  cooperation_result TEXT NOT NULL,
  fulfillment_score INTEGER CHECK (fulfillment_score BETWEEN 1 AND 5),
  communication_score INTEGER CHECK (communication_score BETWEEN 1 AND 5),
  conversion_score INTEGER CHECK (conversion_score BETWEEN 1 AND 5),
  recommend BOOLEAN DEFAULT false,
  review_text TEXT NOT NULL,
  evidence_status TEXT DEFAULT 'pending',
  review_status TEXT NOT NULL DEFAULT '待审核',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT reviews_result_check CHECK (cooperation_result IN ('成功', '一般', '失败')),
  CONSTRAINT reviews_evidence_check CHECK (evidence_status IN ('provided', 'pending', 'verified')),
  CONSTRAINT reviews_status_check CHECK (review_status IN ('已验证', '待补充', '拒绝', '待审核'))
);

CREATE INDEX idx_reviews_channel_id ON reviews(channel_id);
CREATE INDEX idx_reviews_status ON reviews(review_status);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
```

### 1.3 启用 RLS (行级安全)

```sql
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 允许公开读取（管理员可编辑）
CREATE POLICY channels_read_policy ON channels
  FOR SELECT USING (true);

CREATE POLICY reviews_read_policy ON reviews
  FOR SELECT USING (true);
```

## 第二步：数据迁移

### 2.1 使用 Supabase UI 导入或 SQL 插入

将 Mock 数据转换为 SQL 或使用 Supabase 的数据导入工具导入。

**或者使用 TypeScript 脚本导入：**

```typescript
// scripts/migrate-data.ts
import { createClient } from '@supabase/supabase-js';
import { mockChannels } from '../src/data/channels';
import { mockReviews } from '../src/data/reviews';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

async function migrateChannels() {
  const { error } = await supabase
    .from('channels')
    .insert(mockChannels);
  
  if (error) throw error;
  console.log('✓ Channels migrated');
}

async function migrateReviews() {
  const { error } = await supabase
    .from('reviews')
    .insert(mockReviews);
  
  if (error) throw error;
  console.log('✓ Reviews migrated');
}

async function main() {
  await migrateChannels();
  await migrateReviews();
}

main().catch(console.error);
```

## 第三步：创建数据服务层

### 3.1 创建 Channel 服务

```typescript
// src/services/channelService.ts
import { supabase } from '../lib/supabaseClient';
import type { Channel } from '../types';

export async function getChannels(): Promise<Channel[]> {
  const { data, error } = await supabase
    .from('channels')
    .select('*');
  
  if (error) throw error;
  return data || [];
}

export async function getChannelById(id: string): Promise<Channel | null> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export async function getChannelsByCity(city: string): Promise<Channel[]> {
  const { data, error } = await supabase
    .from('channels')
    .select('*')
    .contains('coverage_area', [city]);
  
  if (error) throw error;
  return data || [];
}

export async function updateChannel(id: string, updates: Partial<Channel>) {
  const { error } = await supabase
    .from('channels')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
}
```

### 3.2 创建 Review 服务

```typescript
// src/services/reviewService.ts
import { supabase } from '../lib/supabaseClient';
import type { Review } from '../types';

export async function getReviewsByChannelId(channelId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('channel_id', channelId)
    .eq('review_status', '已验证')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function submitReview(review: Omit<Review, 'id'>) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([review])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getReviewsForAdmin(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function updateReviewStatus(id: string, status: string) {
  const { error } = await supabase
    .from('reviews')
    .update({ review_status: status, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
}
```

### 3.3 创建 Supabase 客户端

```typescript
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

## 第四步：更新页面代码

### 4.1 更新 ChannelListPage

```typescript
// 替换前
import { mockChannels } from '../data/channels';

// 替换后
import { useEffect, useState } from 'react';
import { getChannels } from '../services/channelService';

export default function ChannelListPage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChannels().then(data => {
      setChannels(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>加载中...</div>;
  
  return (
    // 剩余代码保持不变
  );
}
```

### 4.2 更新 ChannelDetailPage

```typescript
// 替换前
const channel = mockChannels.find((c) => c.id === channelId);
const channelReviews = mockReviews.filter((r) => r.channelId === channelId);

// 替换后
const [channel, setChannel] = useState<Channel | null>(null);
const [reviews, setReviews] = useState<Review[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  Promise.all([
    getChannelById(channelId),
    getReviewsByChannelId(channelId)
  ]).then(([ch, revs]) => {
    setChannel(ch);
    setReviews(revs);
    setLoading(false);
  });
}, [channelId]);

if (loading) return <div>加载中...</div>;
if (!channel) return <div>渠道商不存在</div>;
```

## 第五步：环境变量配置

确保 `.env` 文件中有 Supabase 配置：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 完成检查清单

- [ ] 在 Supabase 创建 channels 和 reviews 表
- [ ] 启用 RLS 政策
- [ ] 导入 Mock 数据到表中
- [ ] 创建 channelService.ts 和 reviewService.ts
- [ ] 创建 supabaseClient.ts
- [ ] 更新 ChannelListPage 使用服务
- [ ] 更新 ChannelDetailPage 使用服务
- [ ] 更新 SubmitReviewPage 的提交逻辑
- [ ] 更新 AdminPage 的 CRUD 操作
- [ ] 测试所有功能正常运行
- [ ] 删除或保留 src/data/mockData.ts 备份

## 性能优化建议

1. **添加缓存**
```typescript
const queryClient = new QueryClient();

// 在组件中使用
const { data: channels } = useQuery(['channels'], getChannels, {
  staleTime: 5 * 60 * 1000, // 5分钟
});
```

2. **分页加载**
```typescript
export async function getChannelsPaginated(page: number, limit: number = 10) {
  const { data, error, count } = await supabase
    .from('channels')
    .select('*', { count: 'exact' })
    .range(page * limit, (page + 1) * limit - 1);
  
  return { data, total: count };
}
```

3. **实时订阅**
```typescript
supabase
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'reviews' },
    (payload) => {
      // 实时更新 UI
    }
  )
  .subscribe();
```

## 故障排除

| 问题 | 解决方案 |
|------|--------|
| 401 Unauthorized | 检查 VITE_SUPABASE_ANON_KEY 是否正确 |
| RLS 阻止读取 | 检查 RLS 策略是否允许 SELECT 操作 |
| 数据类型不匹配 | 检查数组字段是否转换为 TEXT[] |
| 性能慢 | 添加必要的数据库索引 |

参考：[Supabase 官方文档](https://supabase.com/docs)
