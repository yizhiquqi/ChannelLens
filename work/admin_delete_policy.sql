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
