create table if not exists public.partner_profiles (
  id text primary key,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cooperation_feedback (
  id text primary key,
  review_status text not null default 'pending',
  evidence_status text not null default 'pending_review',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_partners (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partner_profiles enable row level security;
alter table public.cooperation_feedback enable row level security;
alter table public.admin_partners enable row level security;

drop policy if exists "public insert partner profiles" on public.partner_profiles;
create policy "public insert partner profiles"
on public.partner_profiles
for insert
to anon
with check (true);

drop policy if exists "public insert cooperation feedback" on public.cooperation_feedback;
create policy "public insert cooperation feedback"
on public.cooperation_feedback
for insert
to anon
with check (true);

drop policy if exists "authenticated read partner profiles" on public.partner_profiles;
create policy "authenticated read partner profiles"
on public.partner_profiles
for select
to authenticated
using (true);

drop policy if exists "authenticated update partner profiles" on public.partner_profiles;
create policy "authenticated update partner profiles"
on public.partner_profiles
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated insert partner profiles" on public.partner_profiles;
create policy "authenticated insert partner profiles"
on public.partner_profiles
for insert
to authenticated
with check (true);

drop policy if exists "authenticated read cooperation feedback" on public.cooperation_feedback;
create policy "authenticated read cooperation feedback"
on public.cooperation_feedback
for select
to authenticated
using (true);

drop policy if exists "authenticated update cooperation feedback" on public.cooperation_feedback;
create policy "authenticated update cooperation feedback"
on public.cooperation_feedback
for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated insert cooperation feedback" on public.cooperation_feedback;
create policy "authenticated insert cooperation feedback"
on public.cooperation_feedback
for insert
to authenticated
with check (true);

drop policy if exists "authenticated read admin partners" on public.admin_partners;
create policy "authenticated read admin partners"
on public.admin_partners
for select
to authenticated
using (true);

drop policy if exists "authenticated insert admin partners" on public.admin_partners;
create policy "authenticated insert admin partners"
on public.admin_partners
for insert
to authenticated
with check (true);

drop policy if exists "authenticated update admin partners" on public.admin_partners;
create policy "authenticated update admin partners"
on public.admin_partners
for update
to authenticated
using (true)
with check (true);
