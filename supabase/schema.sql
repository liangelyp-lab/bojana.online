-- Bojana Estudio · central memory v1
-- Run this file in Supabase SQL Editor before enabling the remote repository.

create extension if not exists pgcrypto;

create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.studio_users (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  external_id text,
  name text not null,
  email text not null,
  role text not null default 'team' check (role in ('owner', 'admin', 'team', 'client')),
  created_at timestamptz not null default now(),
  unique (studio_id, email)
);

create table if not exists public.clients (
  id text primary key,
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  studio_id uuid not null references public.studios(id) on delete cascade,
  client_id text references public.clients(id) on delete set null,
  name text not null,
  lifecycle_status text not null default 'BORRADOR',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.studio_users(id) on delete cascade,
  role text not null default 'client' check (role in ('owner', 'editor', 'client')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  project_id text references public.projects(id) on delete cascade,
  actor_id uuid references public.studio_users(id) on delete set null,
  event_type text not null,
  summary text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- One row per direct portal link makes a signed URL revocable without changing
-- the signing secret or invalidating every other project link.
create table if not exists public.direct_portal_links (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  nonce text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid references public.studio_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists projects_studio_updated_idx on public.projects(studio_id, updated_at desc);
create index if not exists activity_project_created_idx on public.activity_log(project_id, created_at desc);
create index if not exists project_members_user_idx on public.project_members(user_id, project_id);
create index if not exists activity_actor_created_idx on public.activity_log(actor_id, created_at desc);
create index if not exists direct_portal_links_lookup_idx on public.direct_portal_links(project_id, nonce, expires_at) where revoked_at is null;

-- Authenticated studio-membership policies.
alter table public.studios enable row level security;
alter table public.studio_users enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.activity_log enable row level security;
alter table public.direct_portal_links enable row level security;

-- Keep this bootstrap script safe to re-run while iterating on the pilot.
drop policy if exists "members can read own studio" on public.studios;
drop policy if exists "users can read own membership" on public.studio_users;
drop policy if exists "team can read studio projects" on public.projects;
drop policy if exists "clients can read assigned projects" on public.projects;
drop policy if exists "team can create projects" on public.projects;
drop policy if exists "team can update projects" on public.projects;
drop policy if exists "admins can delete projects" on public.projects;
drop policy if exists "members can read clients" on public.clients;
drop policy if exists "team can manage clients" on public.clients;
drop policy if exists "members can read activity" on public.activity_log;
drop policy if exists "members can write activity" on public.activity_log;
drop policy if exists "users can read project memberships" on public.project_members;
drop policy if exists "team can manage project memberships" on public.project_members;
drop policy if exists "assigned members can read projects" on public.projects;
drop policy if exists "assigned editors can update projects" on public.projects;
drop policy if exists "owners can create projects" on public.projects;
drop policy if exists "owners and admins can delete projects" on public.projects;
drop policy if exists "staff can read assigned clients" on public.clients;
drop policy if exists "owners and admins can manage clients" on public.clients;
drop policy if exists "members can read assigned activity" on public.activity_log;
drop policy if exists "owners and admins can write activity" on public.activity_log;
drop policy if exists "users and managers can read project memberships" on public.project_members;
drop policy if exists "owners and admins can manage project memberships" on public.project_members;
drop policy if exists "users can read own project memberships" on public.project_members;

-- Seed one studio row and keep the id stable for the first pilot.
insert into public.studios (name)
select 'Bojana Estudio'
where not exists (select 1 from public.studios);

create policy "members can read own studio" on public.studios for select to authenticated using (exists (select 1 from public.studio_users su where su.studio_id = studios.id and su.id = auth.uid()));
create policy "users can read own membership" on public.studio_users for select to authenticated using (id = auth.uid());
-- Never use front-end visibility as an authorization boundary. These policies
-- apply even when a signed-in user calls Supabase REST directly with the public
-- anon key embedded in the browser bundle.
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
create policy "owners can create projects" on public.projects for insert to authenticated with check (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = projects.studio_id and su.role = 'owner'));
create policy "owners and admins can delete projects" on public.projects for delete to authenticated using (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = projects.studio_id and su.role in ('owner','admin')));
create policy "staff can read assigned clients" on public.clients for select to authenticated using (
  exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = clients.studio_id and su.role in ('owner','admin'))
  or exists (select 1 from public.projects p join public.project_members pm on pm.project_id = p.id where p.client_id = clients.id and pm.user_id = auth.uid())
);
create policy "owners and admins can manage clients" on public.clients for all to authenticated using (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = clients.studio_id and su.role in ('owner','admin'))) with check (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = clients.studio_id and su.role in ('owner','admin')));
create policy "members can read assigned activity" on public.activity_log for select to authenticated using (
  exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = activity_log.studio_id and su.role in ('owner','admin'))
  or exists (select 1 from public.project_members pm where pm.project_id = activity_log.project_id and pm.user_id = auth.uid())
);
create policy "owners and admins can write activity" on public.activity_log for insert to authenticated with check (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = activity_log.studio_id and su.role in ('owner','admin')));
-- Membership changes go through the server endpoint with its service key.
-- Keeping this table self-readable only avoids a policy recursion with
-- projects and prevents a team member from granting themselves access.
create policy "users can read own project memberships" on public.project_members for select to authenticated using (user_id = auth.uid());

-- The first owner is inserted from the Supabase dashboard after creating the
-- Auth user, because its UUID is generated by Supabase Auth.
