-- Idempotent : safe to re-run if the table was already created manually.
create table if not exists public.cycle_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.cycle_data enable row level security;

drop policy if exists "cycle_data_select_own" on public.cycle_data;
create policy "cycle_data_select_own"
  on public.cycle_data for select
  using (auth.uid() = user_id);

drop policy if exists "cycle_data_insert_own" on public.cycle_data;
create policy "cycle_data_insert_own"
  on public.cycle_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "cycle_data_update_own" on public.cycle_data;
create policy "cycle_data_update_own"
  on public.cycle_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.cycle_data to authenticated;
grant select on public.cycle_data to anon;
