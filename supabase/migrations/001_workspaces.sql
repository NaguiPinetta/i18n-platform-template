-- Create workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create workspace_members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);

-- Enable Row Level Security
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces

-- Users can read workspaces where they are owner or member
CREATE POLICY "Users can read workspaces they own or are members of"
    ON public.workspaces
    FOR SELECT
    USING (
        owner_id = auth.uid() OR
        id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- Users can insert workspaces where owner_id = auth.uid()
CREATE POLICY "Users can create workspaces they own"
    ON public.workspaces
    FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Owners can update their workspaces
CREATE POLICY "Owners can update their workspaces"
    ON public.workspaces
    FOR UPDATE
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Owners can delete their workspaces
CREATE POLICY "Owners can delete their workspaces"
    ON public.workspaces
    FOR DELETE
    USING (owner_id = auth.uid());

-- RLS Policies for workspace_members

-- Users can read members of workspaces they belong to
CREATE POLICY "Users can read members of their workspaces"
    ON public.workspace_members
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces
            WHERE owner_id = auth.uid()
        ) OR
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- Owners can insert members
CREATE POLICY "Owners can add members to their workspaces"
    ON public.workspace_members
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces
            WHERE owner_id = auth.uid()
        )
    );

-- Owners can update members
CREATE POLICY "Owners can update members of their workspaces"
    ON public.workspace_members
    FOR UPDATE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces
            WHERE owner_id = auth.uid()
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces
            WHERE owner_id = auth.uid()
        )
    );

-- Owners can delete members
CREATE POLICY "Owners can remove members from their workspaces"
    ON public.workspace_members
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces
            WHERE owner_id = auth.uid()
        )
    );
