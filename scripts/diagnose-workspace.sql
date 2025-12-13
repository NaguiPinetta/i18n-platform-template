-- Diagnostic script to check workspace visibility
-- Run these queries ONE AT A TIME in Supabase SQL Editor
-- Replace 'your-email@example.com' with your actual email

-- ============================================
-- STEP 1: Find your user ID
-- ============================================
-- Run this first to get your user ID:
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'your-email@example.com';  -- ⚠️ CHANGE THIS

-- ============================================
-- STEP 2: Check workspaces you own
-- ============================================
-- Replace 'YOUR_USER_ID_HERE' with the ID from step 1:
SELECT id, name, owner_id, created_at 
FROM public.workspaces 
WHERE owner_id = 'YOUR_USER_ID_HERE';  -- ⚠️ CHANGE THIS

-- ============================================
-- STEP 3: Check your workspace memberships
-- ============================================
-- Replace 'YOUR_USER_ID_HERE' with the ID from step 1:
SELECT 
    wm.workspace_id, 
    w.name as workspace_name, 
    w.owner_id,
    wm.role,
    wm.created_at
FROM public.workspace_members wm
JOIN public.workspaces w ON w.id = wm.workspace_id
WHERE wm.user_id = 'YOUR_USER_ID_HERE';  -- ⚠️ CHANGE THIS

-- ============================================
-- STEP 4: See ALL workspaces (for debugging)
-- ============================================
-- This shows all workspaces and their owners:
SELECT 
    w.id,
    w.name,
    w.owner_id,
    (SELECT email FROM auth.users WHERE id = w.owner_id) as owner_email,
    w.created_at
FROM public.workspaces w
ORDER BY w.created_at DESC;

-- ============================================
-- STEP 5: See ALL workspace memberships
-- ============================================
-- This shows all memberships:
SELECT 
    wm.workspace_id,
    w.name as workspace_name,
    wm.user_id,
    (SELECT email FROM auth.users WHERE id = wm.user_id) as user_email,
    wm.role,
    wm.created_at
FROM public.workspace_members wm
JOIN public.workspaces w ON w.id = wm.workspace_id
ORDER BY wm.created_at DESC;

-- 1. Check your user ID
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 2. Check workspaces you own
-- SELECT * FROM public.workspaces WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- 3. Check your workspace memberships
-- SELECT wm.*, w.name as workspace_name
-- FROM public.workspace_members wm
-- JOIN public.workspaces w ON w.id = wm.workspace_id
-- WHERE wm.user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- 4. If workspace exists but you're not the owner, check owner_id
-- SELECT id, name, owner_id, 
--        (SELECT email FROM auth.users WHERE id = owner_id) as owner_email
-- FROM public.workspaces;
