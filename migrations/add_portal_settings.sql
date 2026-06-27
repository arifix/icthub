-- ============================================================
-- ICTHub: Add portal_settings table
-- Run in Supabase SQL Editor AFTER complete_schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.portal_settings (
    id         bigserial   PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    key        text        NOT NULL UNIQUE,
    value      text        NOT NULL
);

ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_all_portal_settings" ON public.portal_settings;
CREATE POLICY "public_all_portal_settings"
    ON public.portal_settings FOR ALL USING (true) WITH CHECK (true);

-- Set a default portal password (change this immediately via Admin > Settings)
INSERT INTO public.portal_settings (key, value)
VALUES ('portal_password', 'iict@kuet')
ON CONFLICT (key) DO NOTHING;
