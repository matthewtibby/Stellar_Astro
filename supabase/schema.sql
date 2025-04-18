-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type processing_status as enum ('pending', 'processing', 'completed', 'failed');
create type file_type as enum ('light', 'dark', 'flat', 'bias', 'master', 'final');

-- Create profiles table (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create projects table
create table projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create fits_files table
create table fits_files (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  file_type file_type not null,
  file_path text not null,
  file_size bigint not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create processing_steps table
create table processing_steps (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  step_name text not null,
  status processing_status default 'pending' not null,
  input_files uuid[] not null,
  output_files uuid[],
  parameters jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create community_posts table
create table community_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  content text,
  image_url text,
  likes_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create comments table
create table comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  post_id uuid references community_posts(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create likes table
create table likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  post_id uuid references community_posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

-- Create RLS (Row Level Security) policies
alter table profiles enable row level security;
alter table projects enable row level security;
alter table fits_files enable row level security;
alter table processing_steps enable row level security;
alter table community_posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Projects policies
create policy "Projects are viewable by owner and if public"
  on projects for select
  using (auth.uid() = user_id or is_public = true);

create policy "Users can create their own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on projects for delete
  using (auth.uid() = user_id);

-- FITS files policies
create policy "FITS files are viewable by project owner"
  on fits_files for select
  using (
    exists (
      select 1 from projects
      where projects.id = fits_files.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can upload FITS files to their projects"
  on fits_files for insert
  with check (
    exists (
      select 1 from projects
      where projects.id = fits_files.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Processing steps policies
create policy "Processing steps are viewable by project owner"
  on processing_steps for select
  using (
    exists (
      select 1 from projects
      where projects.id = processing_steps.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Community posts policies
create policy "Community posts are viewable by everyone"
  on community_posts for select
  using (true);

create policy "Users can create community posts"
  on community_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on community_posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on community_posts for delete
  using (auth.uid() = user_id);

-- Comments policies
create policy "Comments are viewable by everyone"
  on comments for select
  using (true);

create policy "Users can create comments"
  on comments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own comments"
  on comments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on comments for delete
  using (auth.uid() = user_id);

-- Likes policies
create policy "Likes are viewable by everyone"
  on likes for select
  using (true);

create policy "Users can create likes"
  on likes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own likes"
  on likes for delete
  using (auth.uid() = user_id);

-- Create functions and triggers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers to relevant tables
create trigger handle_updated_at
  before update on profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on projects
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on processing_steps
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on community_posts
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on comments
  for each row execute procedure public.handle_updated_at(); 