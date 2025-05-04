-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Create maintenance schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS maintenance;

-- Function to verify and apply RLS policies
CREATE OR REPLACE FUNCTION maintenance.verify_rls_policies()
RETURNS void AS $$
DECLARE
    missing_policies boolean := false;
    policy_count int;
BEGIN
    -- Check if RLS is enabled on projects table
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE tablename = 'projects' 
        AND rowsecurity = true
    ) THEN
        RAISE WARNING 'RLS not enabled on projects table. Enabling...';
        ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
        missing_policies := true;
    END IF;

    -- Count existing policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'projects';

    IF policy_count < 5 THEN
        RAISE WARNING 'Missing RLS policies on projects table. Applying...';
        missing_policies := true;
    END IF;

    -- If policies are missing, apply them
    IF missing_policies THEN
        -- Drop existing policies to avoid conflicts
        DROP POLICY IF EXISTS "Projects are viewable by owner and if public" ON projects;
        DROP POLICY IF EXISTS "Public projects are viewable by anyone" ON projects;
        DROP POLICY IF EXISTS "Super users have full access to projects" ON projects;
        DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
        DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
        DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
        DROP POLICY IF EXISTS "Users can view their own projects" ON projects;

        -- Create clean policies
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

        -- Grant permissions
        GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a table to log permission errors
CREATE TABLE IF NOT EXISTS maintenance.permission_errors (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    error_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id uuid REFERENCES auth.users(id),
    error_message TEXT,
    table_name TEXT,
    operation TEXT,
    resolved BOOLEAN DEFAULT false
);

-- Function to log permission errors
CREATE OR REPLACE FUNCTION maintenance.log_permission_error(
    p_user_id uuid,
    p_error_message TEXT,
    p_table_name TEXT,
    p_operation TEXT
)
RETURNS void AS $$
BEGIN
    INSERT INTO maintenance.permission_errors (user_id, error_message, table_name, operation)
    VALUES (p_user_id, p_error_message, p_table_name, p_operation);
END;
$$ LANGUAGE plpgsql;

-- Function to check for unresolved permission errors
CREATE OR REPLACE FUNCTION maintenance.check_permission_errors()
RETURNS TABLE (
    error_count bigint,
    latest_error timestamp with time zone,
    affected_tables text[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::bigint,
        MAX(error_time),
        ARRAY_AGG(DISTINCT table_name)
    FROM maintenance.permission_errors
    WHERE resolved = false;
END;
$$ LANGUAGE plpgsql;

-- Create a function to automatically fix common permission issues
CREATE OR REPLACE FUNCTION maintenance.auto_fix_permissions()
RETURNS void AS $$
BEGIN
    -- Verify and fix RLS policies
    PERFORM maintenance.verify_rls_policies();
    
    -- Grant basic permissions to authenticated role
    GRANT USAGE ON SCHEMA public TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
    
    -- Mark fixed errors as resolved
    UPDATE maintenance.permission_errors 
    SET resolved = true 
    WHERE resolved = false 
    AND table_name = 'projects';
END;
$$ LANGUAGE plpgsql;

-- Schedule regular permission checks (runs every day at midnight)
SELECT cron.schedule(
    'daily-permission-check',
    '0 0 * * *',
    $$
    BEGIN
        PERFORM maintenance.verify_rls_policies();
        PERFORM maintenance.auto_fix_permissions();
    END;
    $$
); 