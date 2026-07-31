-- Préférences compagnon (rareté + dernier message) — sync multi-appareils
create table if not exists public.user_companion (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rarity jsonb not null default '{"byCycle":{},"seenVariants":[]}'::jsonb,
  daily_message jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_companion enable row level security;

drop policy if exists "user_companion_select_own" on public.user_companion;
create policy "user_companion_select_own"
  on public.user_companion for select
  using (auth.uid() = user_id);

drop policy if exists "user_companion_insert_own" on public.user_companion;
create policy "user_companion_insert_own"
  on public.user_companion for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_companion_update_own" on public.user_companion;
create policy "user_companion_update_own"
  on public.user_companion for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.user_companion to authenticated;
