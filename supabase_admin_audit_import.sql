alter table public.admin_partners
drop constraint if exists admin_partners_visibility_check;

alter table public.admin_partners
add constraint admin_partners_visibility_check
check (visibility in ('internal', 'pending_public', 'public', 'archived'));

alter table public.partner_visibility
drop constraint if exists partner_visibility_visibility_check;

alter table public.partner_visibility
add constraint partner_visibility_visibility_check
check (visibility in ('internal', 'pending_public', 'public', 'archived'));

create table if not exists public.admin_audit_logs (
  id text primary key,
  action_type text not null default '',
  target_type text not null default '',
  target_id text not null default '',
  target_name text not null default '',
  result text not null default '',
  note text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

drop policy if exists "admins read audit logs" on public.admin_audit_logs;
create policy "admins read audit logs"
on public.admin_audit_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists "admins insert audit logs" on public.admin_audit_logs;
create policy "admins insert audit logs"
on public.admin_audit_logs
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admins update audit logs" on public.admin_audit_logs;
create policy "admins update audit logs"
on public.admin_audit_logs
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
