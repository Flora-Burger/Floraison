create table public.cycle_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.cycle_data enable row level security;

create policy "cycle_data_select_own"
  on public.cycle_data for select
  using (auth.uid() = user_id);

create policy "cycle_data_insert_own"
  on public.cycle_data for insert
  with check (auth.uid() = user_id);

create policy "cycle_data_update_own"
  on public.cycle_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.cycle_data TO authenticated;
GRANT SELECT ON public.cycle_data TO anon;
