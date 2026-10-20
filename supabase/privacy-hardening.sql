-- Privacy hardening migration · run once in the Supabase SQL Editor.
-- This changes the live Row Level Security policies; deploying the frontend
-- alone does not apply database policies.

begin;

drop policy if exists "team can read studio projects" on public.projects;
drop policy if exists "clients can read assigned projects" on public.projects;
drop policy if exists "team can create projects" on public.projects;
drop policy if exists "team can update projects" on public.projects;
drop policy if exists "admins can delete projects" on public.projects;
drop policy if exists "assigned members can read projects" on public.projects;
drop policy if exists "assigned editors can update projects" on public.projects;
drop policy if exists "owners can create projects" on public.projects;
drop policy if exists "owners and admins can delete projects" on public.projects;

drop policy if exists "members can read clients" on public.clients;
drop policy if exists "team can manage clients" on public.clients;
drop policy if exists "staff can read assigned clients" on public.clients;
drop policy if exists "owners and admins can manage clients" on public.clients;

drop policy if exists "members can read activity" on public.activity_log;
drop policy if exists "members can write activity" on public.activity_log;
drop policy if exists "members can read assigned activity" on public.activity_log;
drop policy if exists "owners and admins can write activity" on public.activity_log;

drop policy if exists "users can read project memberships" on public.project_members;
drop policy if exists "team can manage project memberships" on public.project_members;
drop policy if exists "users and managers can read project memberships" on public.project_members;
drop policy if exists "owners and admins can manage project memberships" on public.project_members;
drop policy if exists "users can read own project memberships" on public.project_members;

create policy "assigned members can read projects" on public.projects for select to authenticated using (
  exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = projects.studio_id and su.role = 'owner')
  or exists (select 1 from public.project_members pm where pm.project_id = projects.id and pm.user_id = auth.uid())
);

create policy "assigned editors can update projects" on public.projects for update to authenticated using (
  exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = projects.studio_id and su.role = 'owner')
  or exists (select 1 from public.project_members pm join public.studio_users su on su.id = pm.user_id where pm.project_id = projects.id and pm.user_id = auth.uid() and pm.role in ('owner','editor') and su.role in ('admin','team'))
) with check (
  exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = projects.studio_id and su.role = 'owner')
  or exists (select 1 from public.project_members pm join public.studio_users su on su.id = pm.user_id where pm.project_id = projects.id and pm.user_id = auth.uid() and pm.role in ('owner','editor') and su.role in ('admin','team'))
);

create policy "owners can create projects" on public.projects for insert to authenticated with check (
  exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = projects.studio_id and su.role = 'owner')
);

create policy "owners and admins can delete projects" on public.projects for delete to authenticated using (
  exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = projects.studio_id and su.role in ('owner','admin'))
);

create policy "staff can read assigned clients" on public.clients for select to authenticated using (
  exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = clients.studio_id and su.role in ('owner','admin'))
  or exists (select 1 from public.projects p join public.project_members pm on pm.project_id = p.id where p.client_id = clients.id and pm.user_id = auth.uid())
);

create policy "owners and admins can manage clients" on public.clients for all to authenticated using (
  exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = clients.studio_id and su.role in ('owner','admin'))
) with check (
  exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = clients.studio_id and su.role in ('owner','admin'))
);

create policy "members can read assigned activity" on public.activity_log for select to authenticated using (
  exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = activity_log.studio_id and su.role in ('owner','admin'))
  or exists (select 1 from public.project_members pm where pm.project_id = activity_log.project_id and pm.user_id = auth.uid())
);

create policy "owners and admins can write activity" on public.activity_log for insert to authenticated with check (
  exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = activity_log.studio_id and su.role in ('owner','admin'))
);

-- Membership writes use the server endpoint and its service role. A user can
-- only read their own memberships, so they cannot self-assign or enumerate
-- the rest of the project's users through the public database API.
create policy "users can read own project memberships" on public.project_members for select to authenticated using (user_id = auth.uid());

commit;
