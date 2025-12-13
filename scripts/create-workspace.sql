-- Create a workspace for a user via SQL Editor
-- 
-- ⚠️ PREFERRED METHOD: Use the UI! After logging in, go to /dashboard and use
--    the "Create Workspace" dialog. This script is only for manual setup.
--
-- Usage in SQL Editor:
-- 1. Replace 'your-email@example.com' with your actual email address
-- 2. Optionally change the workspace name from 'My Workspace'
-- 3. Run this script in Supabase SQL Editor
--
-- Note: This script may require temporarily bypassing RLS or using service role
-- permissions. The UI method is recommended as it properly handles RLS.

DO $$
DECLARE
    -- ⚠️ CHANGE THESE VALUES:
    user_email TEXT := 'your-email@example.com';  -- Replace with your email
    workspace_name TEXT := 'My Workspace';         -- Change if desired
    
    -- Internal variables (don't change)
    target_user_id UUID;
    new_workspace_id UUID;
BEGIN
    -- Validate inputs
    IF user_email = 'your-email@example.com' THEN
        RAISE EXCEPTION 'Please set user_email to your actual email address';
    END IF;
    
    -- Get user ID from email
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email
    LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found. Make sure the user exists in auth.users', user_email;
    END IF;
    
    -- Create the workspace
    -- Note: This may fail due to RLS if not run with proper permissions
    INSERT INTO public.workspaces (name, owner_id)
    VALUES (workspace_name, target_user_id)
    RETURNING id INTO new_workspace_id;
    
    -- Add user as owner in workspace_members
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (new_workspace_id, target_user_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO UPDATE
    SET role = 'owner';
    
    RAISE NOTICE '✅ Workspace created successfully!';
    RAISE NOTICE 'Workspace ID: %', new_workspace_id;
    RAISE NOTICE 'Workspace Name: %', workspace_name;
    RAISE NOTICE 'Owner: % (ID: %)', user_email, target_user_id;
    RAISE NOTICE '';
    RAISE NOTICE 'You can now refresh your dashboard to see the workspace.';
END $$;
