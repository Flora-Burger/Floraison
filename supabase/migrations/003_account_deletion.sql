-- Suppression des données cycle par l'utilisatrice
drop policy if exists "cycle_data_delete_own" on public.cycle_data;
create policy "cycle_data_delete_own"
  on public.cycle_data for delete
  using (auth.uid() = user_id);

grant delete on public.cycle_data to authenticated;

-- Suppression complète du compte (auth + données en cascade)
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Non authentifié';
  end if;

  delete from public.cycle_data where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
