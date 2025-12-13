-- Create i18n_languages table
-- Stores language definitions per workspace
CREATE TABLE IF NOT EXISTS public.i18n_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    is_rtl BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (workspace_id, code)
);

-- Create index for workspace lookups
CREATE INDEX IF NOT EXISTS idx_i18n_languages_workspace_id ON public.i18n_languages(workspace_id);

-- Enable Row Level Security
ALTER TABLE public.i18n_languages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for i18n_languages

-- Members can read languages for their workspace
CREATE POLICY "Members can read languages in their workspaces"
    ON public.i18n_languages
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

-- Only owners/admins can insert languages
CREATE POLICY "Owners and admins can create languages"
    ON public.i18n_languages
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

-- Only owners/admins can update languages
CREATE POLICY "Owners and admins can update languages"
    ON public.i18n_languages
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

-- Only owners/admins can delete languages
CREATE POLICY "Owners and admins can delete languages"
    ON public.i18n_languages
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
