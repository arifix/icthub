-- ============================================================
-- ICTHub Info Content Migration
-- Adds information categories and notes for the public Info page
-- ============================================================

CREATE TABLE IF NOT EXISTS public.info_categories (
    id          bigserial    PRIMARY KEY,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    name        text         NOT NULL,
    description text         NOT NULL DEFAULT '',
    sort_order  integer      NOT NULL DEFAULT 0,
    is_active   boolean      NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_info_categories_sort_order ON public.info_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_info_categories_is_active ON public.info_categories(is_active);

ALTER TABLE public.info_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "info_categories_read_all" ON public.info_categories;
DROP POLICY IF EXISTS "info_categories_write_admin" ON public.info_categories;
CREATE POLICY "info_categories_read_all" ON public.info_categories FOR SELECT USING (true);
CREATE POLICY "info_categories_write_admin" ON public.info_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.info_notes (
    id          bigserial    PRIMARY KEY,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    category_id bigint       NOT NULL REFERENCES public.info_categories(id) ON DELETE CASCADE,
    title       text         NOT NULL,
    content     text         NOT NULL DEFAULT '',
    sort_order  integer      NOT NULL DEFAULT 0,
    is_active   boolean      NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_info_notes_category   ON public.info_notes(category_id);
CREATE INDEX IF NOT EXISTS idx_info_notes_sort_order ON public.info_notes(sort_order);
CREATE INDEX IF NOT EXISTS idx_info_notes_is_active  ON public.info_notes(is_active);

ALTER TABLE public.info_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "info_notes_read_all" ON public.info_notes;
DROP POLICY IF EXISTS "info_notes_write_admin" ON public.info_notes;
CREATE POLICY "info_notes_read_all" ON public.info_notes FOR SELECT USING (true);
CREATE POLICY "info_notes_write_admin" ON public.info_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);