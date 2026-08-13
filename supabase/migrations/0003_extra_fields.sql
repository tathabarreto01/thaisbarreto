-- Campos adicionais do prospecto: profissão, estado civil e observações.
alter table public.prospects
  add column if not exists profession text,
  add column if not exists marital_status text,
  add column if not exists observations text;
