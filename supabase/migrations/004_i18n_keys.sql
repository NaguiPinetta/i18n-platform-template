-- Create i18n_keys table
-- Stores translation keys (metadata) per workspace
CREATE TABLE IF NOT EXISTS public.i18n_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    module TEXT NOT NULL,
    type TEXT NOT NULL,
    screen TEXT,
    context TEXT,
    screenshot_ref TEXT,
    max_chars INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (workspace_id, key)
);

-- Create indexes for workspace and module lookups
CREATE INDEX IF NOT EXISTS idx_i18n_keys_workspace_id ON public.i18n_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_i18n_keys_module ON public.i18n_keys(workspace_id, module);

-- Enable Row Level Security
ALTER TABLE public.i18n_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for i18n_keys

-- Members can read keys for their workspace
CREATE POLICY "Members can read keys in their workspaces"
    ON public.i18n_keys
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

-- Only owners/admins can insert keys
CREATE POLICY "Owners and admins can create keys"
    ON public.i18n_keys
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT w.id FROM public.workspaces w
            WHERE w.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.workspace_members wm
                WHERE wm.workspace_id = w.id
                AND wm.user_id = auth.uid()
                AND wm.role IN ('owner', 'admin')
            )
        )
    );

-- Only owners/admins can update keys
CREATE POLICY "Owners and admins can update keys"
    ON public.i18n_keys
    FOR UPDATE
    USING (
        workspace_id IN (
            SELECT w.id FROM public.workspaces w
            WHERE w.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.workspace_members wm
                WHERE wm.workspace_id = w.id
                AND wm.user_id = auth.uid()
                AND wm.role IN ('owner', 'admin')
            )
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT w.id FROM public.workspaces w
            WHERE w.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.workspace_members wm
                WHERE wm.workspace_id = w.id
                AND wm.user_id = auth.uid()
                AND wm.role IN ('owner', 'admin')
            )
        )
    );

-- Only owners/admins can delete keys
CREATE POLICY "Owners and admins can delete keys"
    ON public.i18n_keys
    FOR DELETE
    USING (
        workspace_id IN (
            SELECT w.id FROM public.workspaces w
            WHERE w.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.workspace_members wm
                WHERE wm.workspace_id = w.id
                AND wm.user_id = auth.uid()
                AND wm.role IN ('owner', 'admin')
            )
        )
    );
