create extension if not exists pgcrypto;

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  destination text not null check (char_length(destination) between 1 and 120),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists budgets_user_updated_idx
  on public.budgets (user_id, updated_at desc);

alter table public.budgets enable row level security;

create policy "Users can read their budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Users can create their budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their budgets"
  on public.budgets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);

