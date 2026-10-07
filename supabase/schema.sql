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

-- Temporary pilot policies. Replace these with authenticated studio-membership
-- policies when the real login is connected in step 2.
alter table public.studios enable row level security;
alter table public.studio_users enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.activity_log enable row level security;

drop policy if exists "pilot access projects" on public.projects;
create policy "pilot access projects" on public.projects for all to anon, authenticated using (true) with check (true);

drop policy if exists "pilot access clients" on public.clients;
create policy "pilot access clients" on public.clients for all to anon, authenticated using (true) with check (true);

drop policy if exists "pilot access activity" on public.activity_log;
create policy "pilot access activity" on public.activity_log for all to anon, authenticated using (true) with check (true);

-- Seed one studio row and keep the id stable for the first pilot.
insert into public.studios (name)
select 'Bojana Estudio'
where not exists (select 1 from public.studios);
