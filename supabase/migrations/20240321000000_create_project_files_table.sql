-- Create project_files table
create table if not exists project_files (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  filename text not null,
  file_path text not null,
  file_type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table project_files enable row level security;

-- Create policies
create policy "Project files are viewable by project owner and if project is public"
  on project_files for select
  using (
    auth.uid() = user_id or 
    exists (
      select 1 from projects p 
      where p.id = project_id 
      and p.is_public = true
    )
  );

create policy "Users can create files in their own projects"
  on project_files for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from projects p 
      where p.id = project_id 
      and p.user_id = auth.uid()
    )
  );

create policy "Users can update their own project files"
  on project_files for update
  using (auth.uid() = user_id);

create policy "Users can delete their own project files"
  on project_files for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create trigger handle_updated_at
  before update on project_files
  for each row execute procedure public.handle_updated_at(); 