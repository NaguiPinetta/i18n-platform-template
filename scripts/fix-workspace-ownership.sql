-- Fix workspace ownership and membership
-- Use this if you created a workspace but it's not showing up
--
-- INSTRUCTIONS:
-- 1. First, find your user ID by running:
--    SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
--
-- 2. Find the workspace ID by running:
--    SELECT id, name, owner_id FROM public.workspaces;
--
-- 3. Replace the placeholders below with your actual IDs
-- 4. Run this script

DO $$
DECLARE
    -- ⚠️ CHANGE THESE VALUES:
    user_email TEXT := 'your-email@example.com';  -- Your email
    workspace_id_to_fix UUID := '00000000-0000-0000-0000-000000000000';  -- Workspace ID from step 2
    
    target_user_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = user_email
    LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    IF workspace_id_to_fix = '00000000-0000-0000-0000-000000000000' THEN
        RAISE EXCEPTION 'Please set workspace_id_to_fix to the actual workspace ID';
    END IF;
    
    -- Update workspace owner
    UPDATE public.workspaces
    SET owner_id = target_user_id
    WHERE id = workspace_id_to_fix;
    
    -- Add/update workspace membership
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (workspace_id_to_fix, target_user_id, 'owner')
    ON CONFLICT (workspace_id, user_id) 
    DO UPDATE SET role = 'owner';
    
    RAISE NOTICE '✅ Workspace ownership fixed!';
    RAISE NOTICE 'Workspace ID: %', workspace_id_to_fix;
    RAISE NOTICE 'New Owner ID: %', target_user_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Refresh your dashboard to see the workspace.';
END $$;
