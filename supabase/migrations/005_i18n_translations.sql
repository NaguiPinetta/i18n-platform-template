-- Create i18n_translations table
-- Stores actual translation values per key and language
CREATE TABLE IF NOT EXISTS public.i18n_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    key_id UUID NOT NULL REFERENCES public.i18n_keys(id) ON DELETE CASCADE,
    language_id UUID NOT NULL REFERENCES public.i18n_languages(id) ON DELETE CASCADE,
    value TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (key_id, language_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_i18n_translations_workspace_id ON public.i18n_translations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_i18n_translations_key_id ON public.i18n_translations(key_id);
CREATE INDEX IF NOT EXISTS idx_i18n_translations_language_id ON public.i18n_translations(language_id);

-- Enable Row Level Security
ALTER TABLE public.i18n_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for i18n_translations

-- Members can read translations for their workspace
CREATE POLICY "Members can read translations in their workspaces"
    ON public.i18n_translations
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

-- Members can insert translations for their workspace
CREATE POLICY "Members can create translations"
    ON public.i18n_translations
    FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces
            WHERE owner_id = auth.uid()
        ) OR
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- Members can update translations for their workspace
CREATE POLICY "Members can update translations"
    ON public.i18n_translations
    FOR UPDATE
    USING (
        workspace_id IN (
            SELECT id FROM public.workspaces
            WHERE owner_id = auth.uid()
        ) OR
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        workspace_id IN (
            SELECT id FROM public.workspaces
            WHERE owner_id = auth.uid()
        ) OR
        workspace_id IN (
            SELECT workspace_id FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- Members can delete translations for their workspace
CREATE POLICY "Members can delete translations"
    ON public.i18n_translations
    FOR DELETE
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_i18n_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on translation updates
DROP TRIGGER IF EXISTS trigger_update_i18n_translations_updated_at ON public.i18n_translations;
CREATE TRIGGER trigger_update_i18n_translations_updated_at
    BEFORE UPDATE ON public.i18n_translations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_i18n_translations_updated_at();
