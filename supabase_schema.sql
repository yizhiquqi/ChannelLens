create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_profiles (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partner_profiles add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.partner_profiles add column if not exists user_email text;

create table if not exists public.cooperation_feedback (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  review_status text not null default 'pending',
  evidence_status text not null default 'pending_review',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cooperation_feedback add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.cooperation_feedback add column if not exists user_email text;

create table if not exists public.due_diligence_requests (
  id text primary key,
  status text not null default 'pending',
  report_type text not null default 'standard',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_partners (
  id text primary key,
  visibility text not null default 'internal' check (visibility in ('public', 'internal')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_partners add column if not exists visibility text not null default 'internal';

create table if not exists public.partner_visibility (
  id text primary key,
  visibility text not null default 'internal' check (visibility in ('public', 'internal')),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'partner',
  display_name text,
  phone text,
  company_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
       or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.admin_users enable row level security;
alter table public.partner_profiles enable row level security;
alter table public.cooperation_feedback enable row level security;
alter table public.due_diligence_requests enable row level security;
alter table public.admin_partners enable row level security;
alter table public.partner_visibility enable row level security;
alter table public.user_profiles enable row level security;

drop policy if exists "admins read admin users" on public.admin_users;
create policy "admins read admin users"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid() or lower(email) = lower(auth.jwt() ->> 'email') or public.is_admin());

drop policy if exists "users read own profiles" on public.user_profiles;
create policy "users read own profiles"
on public.user_profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "users insert own profiles" on public.user_profiles;
create policy "users insert own profiles"
on public.user_profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "users update own profiles" on public.user_profiles;
create policy "users update own profiles"
on public.user_profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "authenticated insert partner profiles" on public.partner_profiles;
create policy "authenticated insert partner profiles"
on public.partner_profiles
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "authenticated read partner profiles" on public.partner_profiles;
create policy "authenticated read partner profiles"
on public.partner_profiles
for select
to authenticated
using (user_id = auth.uid() or lower(user_email) = lower(auth.jwt() ->> 'email') or public.is_admin());

drop policy if exists "authenticated update partner profiles" on public.partner_profiles;
create policy "authenticated update partner profiles"
on public.partner_profiles
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "public insert partner profiles" on public.partner_profiles;

drop policy if exists "authenticated insert cooperation feedback" on public.cooperation_feedback;
create policy "authenticated insert cooperation feedback"
on public.cooperation_feedback
for insert
to authenticated
with check (true);

drop policy if exists "authenticated read cooperation feedback" on public.cooperation_feedback;
create policy "authenticated read cooperation feedback"
on public.cooperation_feedback
for select
to authenticated
using (
  public.is_admin()
  or (payload ->> 'userId') = auth.uid()::text
  or lower(payload ->> 'userEmail') = lower(auth.jwt() ->> 'email')
);

drop policy if exists "public read verified cooperation feedback" on public.cooperation_feedback;
create policy "public read verified cooperation feedback"
on public.cooperation_feedback
for select
to anon, authenticated
using (
  review_status = 'verified'
  and evidence_status = 'verified'
  and payload ->> 'reviewVisibility' = 'public'
);

drop policy if exists "authenticated update cooperation feedback" on public.cooperation_feedback;
create policy "authenticated update cooperation feedback"
on public.cooperation_feedback
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public insert cooperation feedback" on public.cooperation_feedback;

drop policy if exists "public insert due diligence requests" on public.due_diligence_requests;
create policy "public insert due diligence requests"
on public.due_diligence_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "admins read due diligence requests" on public.due_diligence_requests;
create policy "admins read due diligence requests"
on public.due_diligence_requests
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins update due diligence requests" on public.due_diligence_requests;
create policy "admins update due diligence requests"
on public.due_diligence_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public read public admin partners" on public.admin_partners;
create policy "public read public admin partners"
on public.admin_partners
for select
to anon, authenticated
using (visibility = 'public' or public.is_admin());

drop policy if exists "admins insert admin partners" on public.admin_partners;
create policy "admins insert admin partners"
on public.admin_partners
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins update admin partners" on public.admin_partners;
create policy "admins update admin partners"
on public.admin_partners
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "authenticated read admin partners" on public.admin_partners;
drop policy if exists "authenticated insert admin partners" on public.admin_partners;
drop policy if exists "authenticated update admin partners" on public.admin_partners;

drop policy if exists "public read partner visibility" on public.partner_visibility;
create policy "public read partner visibility"
on public.partner_visibility
for select
to anon, authenticated
using (true);

drop policy if exists "admins insert partner visibility" on public.partner_visibility;
create policy "admins insert partner visibility"
on public.partner_visibility
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins update partner visibility" on public.partner_visibility;
create policy "admins update partner visibility"
on public.partner_visibility
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit)
values ('evidence-files', 'evidence-files', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = 52428800;

drop policy if exists "users upload own evidence files" on storage.objects;
create policy "users upload own evidence files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'evidence-files'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "users read own evidence files" on storage.objects;
create policy "users read own evidence files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'evidence-files'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "admins update evidence files" on storage.objects;
create policy "admins update evidence files"
on storage.objects
for update
to authenticated
using (bucket_id = 'evidence-files' and public.is_admin())
with check (bucket_id = 'evidence-files' and public.is_admin());

insert into public.admin_users (email)
values ('quqi991207@gmail.com')
on conflict (email) do nothing;
