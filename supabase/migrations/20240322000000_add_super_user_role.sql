-- Create user_roles enum type
CREATE TYPE user_role AS ENUM ('user', 'super_user', 'admin');

-- Add role column to auth.users if it doesn't exist
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user';

-- Create a function to check if user is super user
CREATE OR REPLACE FUNCTION is_super_user(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id AND role = 'super_user'
  );
END;
$$ LANGUAGE plpgsql;

-- Grant super user role to the specified user
UPDATE auth.users 
SET role = 'super_user'
WHERE id = 'aed89f04-6d12-4590-821c-b6f036471e68';

-- Create RLS policies that allow super users full access
CREATE POLICY "Super users have full access to projects"
ON projects
FOR ALL
USING (is_super_user(auth.uid()));

CREATE POLICY "Super users have full access to project_files"
ON project_files
FOR ALL
USING (is_super_user(auth.uid()));

-- Create a table to track premium features
CREATE TABLE IF NOT EXISTS premium_features (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  status text DEFAULT 'beta' CHECK (status IN ('beta', 'stable', 'deprecated')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create a table to track user feature access
CREATE TABLE IF NOT EXISTS user_feature_access (
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  feature_id uuid REFERENCES premium_features ON DELETE CASCADE,
  access_level text DEFAULT 'beta' CHECK (access_level IN ('beta', 'stable')),
  granted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, feature_id)
);

-- Enable RLS on new tables
ALTER TABLE premium_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_access ENABLE ROW LEVEL SECURITY;

-- Create policies for premium features
CREATE POLICY "Super users have full access to premium features"
ON premium_features
FOR ALL
USING (is_super_user(auth.uid()));

CREATE POLICY "Super users have full access to user feature access"
ON user_feature_access
FOR ALL
USING (is_super_user(auth.uid()));

-- Add updated_at trigger to new tables
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON premium_features
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON user_feature_access
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at(); 