-- Performance (Supabase linter: auth_rls_initplan): envolver auth.uid() em
-- (select auth.uid()) faz o Postgres avaliar uma vez por query em vez de por
-- linha. Mesma semântica das políticas; só otimização.

-- prospects
drop policy if exists "prospects_select" on public.prospects;
create policy "prospects_select" on public.prospects
  for select using ((select auth.uid()) = user_id);

drop policy if exists "prospects_insert" on public.prospects;
create policy "prospects_insert" on public.prospects
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "prospects_update" on public.prospects;
create policy "prospects_update" on public.prospects
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "prospects_delete" on public.prospects;
create policy "prospects_delete" on public.prospects
  for delete using ((select auth.uid()) = user_id);

-- app_state
drop policy if exists "app_state_all" on public.app_state;
create policy "app_state_all" on public.app_state
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
