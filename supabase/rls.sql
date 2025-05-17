-- Enable RLS
alter table projects enable row level security;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Public projects are viewable by anyone" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create new policies
CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Public projects are viewable by anyone"
ON projects FOR SELECT
TO authenticated
USING (is_public = true);

CREATE POLICY "Users can create their own projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;

-- Create policies for profiles table
alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Create policies for subscriptions table
alter table subscriptions enable row level security;

create policy "Users can view their own subscriptions"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Create policies for payment_methods table
alter table payment_methods enable row level security;

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