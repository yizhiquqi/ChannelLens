create table if not exists public.registration_requests (
  id text primary key,
  status text not null default 'pending',
  applicant_name text,
  applicant_email text,
  applicant_type text,
  intent text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.registration_requests enable row level security;

create index if not exists registration_requests_status_idx
on public.registration_requests (status);

create index if not exists registration_requests_created_at_idx
on public.registration_requests (created_at desc);

drop policy if exists "anyone submit registration requests" on public.registration_requests;
create policy "anyone submit registration requests"
on public.registration_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "admins read registration requests" on public.registration_requests;
create policy "admins read registration requests"
on public.registration_requests
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins update registration requests" on public.registration_requests;
create policy "admins update registration requests"
on public.registration_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins delete registration requests" on public.registration_requests;
create policy "admins delete registration requests"
on public.registration_requests
for delete
to authenticated
using (public.is_admin());
