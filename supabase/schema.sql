-- Accounts and trade checklist schema for PropSuite

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mesa text not null,
  login text not null,
  stage text not null check (stage in ('approval','cushion','withdraw','awaiting_payment','post_withdraw','completed')),
  day integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts(user_id);

alter table public.accounts enable row level security;

-- Owners can manage their own accounts
create policy "Accounts are viewable by owner"
on public.accounts for select
using (auth.uid() = user_id);

create policy "Accounts are insertable by owner"
on public.accounts for insert
with check (auth.uid() = user_id);

create policy "Accounts are updatable by owner"
on public.accounts for update
using (auth.uid() = user_id);

-- No trades table (checklist is visual only)

-- Profiles policies (admin visibility)
alter table if exists public.profiles enable row level security;

create policy if not exists "Profiles are viewable by owner"
on public.profiles for select
using (auth.uid() = id);

create policy if not exists "Profiles are updatable by owner"
on public.profiles for update
using (auth.uid() = id);

create policy if not exists "Admins can view all profiles"
on public.profiles for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin
  )
);

create policy if not exists "Admins can update profiles"
on public.profiles for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin
  )
);
