-- Adiciona "Fatores de Motivação" (múltipla escolha) à tabela prospects.
alter table public.prospects
  add column if not exists motivations jsonb not null default '[]'::jsonb;
