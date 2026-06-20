-- 1. Create Profiles Table (Linked to Supabase Auth Users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  default_label text default 'yuphoria',
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);


-- 2. Create Strips Table (For Saved Photobooth Photo Strips)
create table if not exists public.strips (
  id uuid default gen_random_uuid() not null primary key,
  user_id uuid references auth.users on delete cascade not null,
  data_url text not null, -- base64 representation of printed strip
  label text,
  date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Strips
alter table public.strips enable row level security;

create policy "Users can view their own strips" on public.strips
  for select using (auth.uid() = user_id);

create policy "Users can insert their own strips" on public.strips
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own strips" on public.strips
  for delete using (auth.uid() = user_id);
