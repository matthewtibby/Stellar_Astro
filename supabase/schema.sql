-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Drop existing types if they exist
drop type if exists user_role cascade;
drop type if exists processing_status cascade;
drop type if exists file_type cascade;
drop type if exists subscription_status cascade;
drop type if exists subscription_plan cascade;

-- Create custom types
create type user_role as enum ('user', 'super_user', 'admin');
create type processing_status as enum ('pending', 'processing', 'completed', 'failed');
create type file_type as enum ('light', 'dark', 'flat', 'bias', 'master', 'final');
create type subscription_status as enum ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired');
create type subscription_plan as enum ('free', 'pro-monthly', 'pro-annual');

-- Drop existing triggers if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists handle_updated_at on profiles;
drop trigger if exists handle_updated_at on subscriptions;
drop trigger if exists handle_updated_at on payment_methods;
drop trigger if exists handle_updated_at on projects;
drop trigger if exists handle_updated_at on processing_steps;
drop trigger if exists handle_updated_at on community_posts;
drop trigger if exists handle_updated_at on comments;

-- Create functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.is_super_user(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from auth.users 
    where id = user_id and role = 'super_user'
  );
end;
$$ language plpgsql;

-- Add role column to auth.users if it doesn't exist
alter table auth.users 
add column if not exists role user_role default 'user';

-- Drop existing super_user role if it exists
drop role if exists super_user;

-- Create super_user role
create role super_user;

-- Grant necessary permissions to super_user
grant super_user to postgres;
grant super_user to authenticated;
grant super_user to service_role;

-- Drop existing tables if they exist
drop table if exists likes cascade;
drop table if exists comments cascade;
drop table if exists community_posts cascade;
drop table if exists processing_steps cascade;
drop table if exists fits_files cascade;
drop table if exists projects cascade;
drop table if exists payment_methods cascade;
drop table if exists subscriptions cascade;
drop table if exists profiles cascade;

-- Create profiles table (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create subscriptions table
create table subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan subscription_plan default 'free' not null,
  status subscription_status default 'active' not null,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean default false,
  canceled_at timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create payment_methods table
create table payment_methods (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  stripe_payment_method_id text not null,
  type text not null,
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  is_default boolean default false,
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

-- Grant necessary permissions to authenticated users
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant all on all functions in schema public to authenticated;

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table payment_methods enable row level security;
alter table projects enable row level security;
alter table fits_files enable row level security;
alter table processing_steps enable row level security;
alter table community_posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;

-- Create RLS policies for profiles
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Create RLS policies for subscriptions
create policy "Users can view their own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Create RLS policies for payment_methods
create policy "Users can view their own payment methods"
  on payment_methods for select
  using (auth.uid() = user_id);

create policy "Users can create their own payment methods"
  on payment_methods for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own payment methods"
  on payment_methods for update
  using (auth.uid() = user_id);

create policy "Users can delete their own payment methods"
  on payment_methods for delete
  using (auth.uid() = user_id);

-- Create RLS policies for projects
create policy "Users can view their own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Public projects are viewable by anyone"
  on projects for select
  using (is_public = true);

create policy "Users can create their own projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on projects for delete
  using (auth.uid() = user_id);

-- Grant explicit permissions to authenticated role
grant select on projects to authenticated;
grant insert on projects to authenticated;
grant update on projects to authenticated;
grant delete on projects to authenticated;

-- Create RLS policies for fits_files
create policy "Users can view their project's files"
  on fits_files for select
  using (
    exists (
      select 1 from projects
      where projects.id = fits_files.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create files for their projects"
  on fits_files for insert
  with check (
    exists (
      select 1 from projects
      where projects.id = fits_files.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update their project's files"
  on fits_files for update
  using (
    exists (
      select 1 from projects
      where projects.id = fits_files.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete their project's files"
  on fits_files for delete
  using (
    exists (
      select 1 from projects
      where projects.id = fits_files.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Create RLS policies for processing_steps
create policy "Users can view their project's steps"
  on processing_steps for select
  using (
    exists (
      select 1 from projects
      where projects.id = processing_steps.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create steps for their projects"
  on processing_steps for insert
  with check (
    exists (
      select 1 from projects
      where projects.id = processing_steps.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update their project's steps"
  on processing_steps for update
  using (
    exists (
      select 1 from projects
      where projects.id = processing_steps.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete their project's steps"
  on processing_steps for delete
  using (
    exists (
      select 1 from projects
      where projects.id = processing_steps.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Create RLS policies for community_posts
create policy "Anyone can view public posts"
  on community_posts for select
  using (true);

create policy "Users can create their own posts"
  on community_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on community_posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on community_posts for delete
  using (auth.uid() = user_id);

-- Create RLS policies for comments
create policy "Anyone can view comments"
  on comments for select
  using (true);

create policy "Users can create their own comments"
  on comments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own comments"
  on comments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on comments for delete
  using (auth.uid() = user_id);

-- Create RLS policies for likes
create policy "Anyone can view likes"
  on likes for select
  using (true);

create policy "Users can create their own likes"
  on likes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own likes"
  on likes for delete
  using (auth.uid() = user_id);

-- Create triggers
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger handle_updated_at
  before update on profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on subscriptions
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on payment_methods
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