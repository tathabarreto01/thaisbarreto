-- Instagram (@ do perfil) do prospecto.
alter table public.prospects
  add column if not exists instagram text;
