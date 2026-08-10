-- Mapa de Prospectos — schema inicial
-- Tabelas: prospects (dados do CRM) e app_state (desafio semanal por usuário).
-- Segurança: RLS garante que cada usuário só acessa as próprias linhas.

create extension if not exists pgcrypto;

-- ============================ prospects ============================
create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  category text not null,
  subcategory text not null default '',
  intimacy text not null default 'muito_proximo',
  interest int not null default 0,
  status text not null default 'novo',
  phone text,
  email text,
  city text,
  interest_notes text,
  next_step text,
  next_step_date timestamptz,
  favorite boolean not null default false,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospects_user_created_idx
  on public.prospects (user_id, created_at desc);

alter table public.prospects enable row level security;

drop policy if exists "prospects_select" on public.prospects;
create policy "prospects_select" on public.prospects
  for select using (auth.uid() = user_id);

drop policy if exists "prospects_insert" on public.prospects;
create policy "prospects_insert" on public.prospects
  for insert with check (auth.uid() = user_id);

drop policy if exists "prospects_update" on public.prospects;
create policy "prospects_update" on public.prospects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "prospects_delete" on public.prospects;
create policy "prospects_delete" on public.prospects
  for delete using (auth.uid() = user_id);

-- ============================ app_state ============================
create table if not exists public.app_state (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  challenge jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "app_state_all" on public.app_state;
create policy "app_state_all" on public.app_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
