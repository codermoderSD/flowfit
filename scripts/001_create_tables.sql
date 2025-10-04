-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Create user_settings table
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  work_start text not null default '09:00',
  work_end text not null default '17:00',
  interval integer not null default 30,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

alter table public.user_settings enable row level security;

create policy "user_settings_select_own"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "user_settings_insert_own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "user_settings_update_own"
  on public.user_settings for update
  using (auth.uid() = user_id);

-- Create activities table
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default now()
);

alter table public.activities enable row level security;

create policy "activities_select_own"
  on public.activities for select
  using (auth.uid() = user_id);

create policy "activities_insert_own"
  on public.activities for insert
  with check (auth.uid() = user_id);

create policy "activities_update_own"
  on public.activities for update
  using (auth.uid() = user_id);

create policy "activities_delete_own"
  on public.activities for delete
  using (auth.uid() = user_id);

-- Create activity_logs table
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  activity_name text not null,
  calories integer not null default 0,
  body_area text,
  completed_at timestamp with time zone default now()
);

alter table public.activity_logs enable row level security;

create policy "activity_logs_select_own"
  on public.activity_logs for select
  using (auth.uid() = user_id);

create policy "activity_logs_insert_own"
  on public.activity_logs for insert
  with check (auth.uid() = user_id);

create policy "activity_logs_delete_own"
  on public.activity_logs for delete
  using (auth.uid() = user_id);

-- Create time_blocks table
create table if not exists public.time_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  start_time text not null,
  end_time text not null,
  is_recurring boolean default false,
  recurring_days text[], -- array of day names: ['Monday', 'Tuesday', etc.]
  created_at timestamp with time zone default now()
);

alter table public.time_blocks enable row level security;

create policy "time_blocks_select_own"
  on public.time_blocks for select
  using (auth.uid() = user_id);

create policy "time_blocks_insert_own"
  on public.time_blocks for insert
  with check (auth.uid() = user_id);

create policy "time_blocks_update_own"
  on public.time_blocks for update
  using (auth.uid() = user_id);

create policy "time_blocks_delete_own"
  on public.time_blocks for delete
  using (auth.uid() = user_id);
