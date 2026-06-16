drop policy if exists "admins delete admin partners" on public.admin_partners;
create policy "admins delete admin partners"
on public.admin_partners
for delete
to authenticated
using (public.is_admin());

drop policy if exists "admins delete partner visibility" on public.partner_visibility;
create policy "admins delete partner visibility"
on public.partner_visibility
for delete
to authenticated
using (public.is_admin());

drop policy if exists "admins delete partner profiles" on public.partner_profiles;
create policy "admins delete partner profiles"
on public.partner_profiles
for delete
to authenticated
using (public.is_admin());

drop policy if exists "admins delete cooperation feedback" on public.cooperation_feedback;
create policy "admins delete cooperation feedback"
on public.cooperation_feedback
for delete
to authenticated
using (public.is_admin());

drop policy if exists "admins delete due diligence requests" on public.due_diligence_requests;
create policy "admins delete due diligence requests"
on public.due_diligence_requests
for delete
to authenticated
using (public.is_admin());
