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

create index if not exists projects_studio_updated_idx on public.projects(studio_id, updated_at desc);
create index if not exists activity_project_created_idx on public.activity_log(project_id, created_at desc);

-- Authenticated studio-membership policies.
alter table public.studios enable row level security;
alter table public.studio_users enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.activity_log enable row level security;

-- Seed one studio row and keep the id stable for the first pilot.
insert into public.studios (name)
select 'Bojana Estudio'
where not exists (select 1 from public.studios);

create policy "members can read own studio" on public.studios for select to authenticated using (exists (select 1 from public.studio_users su where su.studio_id = studios.id and su.id = auth.uid()));
create policy "users can read own membership" on public.studio_users for select to authenticated using (id = auth.uid());
create policy "members can read projects" on public.projects for select to authenticated using (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = projects.studio_id));
create policy "team can create projects" on public.projects for insert to authenticated with check (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = projects.studio_id and su.role in ('owner','admin','team')));
create policy "team can update projects" on public.projects for update to authenticated using (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = projects.studio_id and su.role in ('owner','admin','team'))) with check (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = projects.studio_id and su.role in ('owner','admin','team')));
create policy "admins can delete projects" on public.projects for delete to authenticated using (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = projects.studio_id and su.role in ('owner','admin')));
create policy "members can read clients" on public.clients for select to authenticated using (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = clients.studio_id));
create policy "team can manage clients" on public.clients for all to authenticated using (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = clients.studio_id and su.role in ('owner','admin','team'))) with check (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = clients.studio_id and su.role in ('owner','admin','team')));
create policy "members can read activity" on public.activity_log for select to authenticated using (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = activity_log.studio_id));
create policy "members can write activity" on public.activity_log for insert to authenticated with check (exists (select 1 from public.studio_users su where su.id = auth.uid() and su.studio_id = activity_log.studio_id));

-- The first owner is inserted from the Supabase dashboard after creating the
-- Auth user, because its UUID is generated by Supabase Auth.
