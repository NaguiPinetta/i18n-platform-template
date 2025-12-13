-- Fix RLS recursion between workspaces <-> workspace_members
-- Error symptom: "infinite recursion detected in policy for relation \"workspaces\"" (SQLSTATE 42P17)
--
-- Root cause: policies referenced each other:
-- - workspaces SELECT policy queried workspace_members
-- - workspace_members SELECT policy queried workspaces (and workspace_members again)
--
-- Approach: introduce a SECURITY DEFINER helper that checks membership without RLS,
-- and rewrite policies to avoid mutual recursion.

-- Helper: check if current auth user is a member of a workspace.
-- SECURITY DEFINER means it runs with the function owner's privileges and avoids RLS recursion.
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = _workspace_id
      AND wm.user_id = auth.uid()
  );
$$;

-- Drop old policies (from 001_workspaces.sql)
DROP POLICY IF EXISTS "Users can read workspaces they own or are members of" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces they own" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can update their workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can delete their workspaces" ON public.workspaces;

DROP POLICY IF EXISTS "Users can read members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners can add members to their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners can update members of their workspaces" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners can remove members from their workspaces" ON public.workspace_members;

-- Recreate safe policies

-- workspaces: SELECT for owners or members (membership via helper)
CREATE POLICY "Users can read workspaces they own or are members of"
  ON public.workspaces
  FOR SELECT
  USING (
    owner_id = auth.uid()
    OR public.is_workspace_member(id)
  );

-- workspaces: INSERT only if you set yourself as owner
CREATE POLICY "Users can create workspaces they own"
  ON public.workspaces
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- workspaces: UPDATE/DELETE only owners (keep minimal)
CREATE POLICY "Owners can update their workspaces"
  ON public.workspaces
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete their workspaces"
  ON public.workspaces
  FOR DELETE
  USING (owner_id = auth.uid());

-- workspace_members: members can read the member list of their workspace
-- owners can always read
CREATE POLICY "Users can read members of their workspaces"
  ON public.workspace_members
  FOR SELECT
  USING (
    public.is_workspace_member(workspace_id)
    OR EXISTS (
      SELECT 1
      FROM public.workspaces w
      WHERE w.id = workspace_id
        AND w.owner_id = auth.uid()
    )
  );

-- workspace_members: only owners can manage members
CREATE POLICY "Owners can add members to their workspaces"
  ON public.workspace_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workspaces w
      WHERE w.id = workspace_id
        AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update members of their workspaces"
  ON public.workspace_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.workspaces w
      WHERE w.id = workspace_id
        AND w.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.workspaces w
      WHERE w.id = workspace_id
        AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can remove members from their workspaces"
  ON public.workspace_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.workspaces w
      WHERE w.id = workspace_id
        AND w.owner_id = auth.uid()
    )
  );

