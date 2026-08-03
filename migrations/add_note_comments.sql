-- ============================================================
-- Note Comments
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.note_comments (
    id          bigserial    PRIMARY KEY,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    note_id     bigint       NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
    parent_id   bigint       REFERENCES public.note_comments(id) ON DELETE CASCADE,
    user_id     uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name text         NOT NULL CHECK (trim(author_name) <> ''),
    content     text         NOT NULL CHECK (trim(content) <> '')
);

CREATE INDEX IF NOT EXISTS idx_note_comments_note   ON public.note_comments(note_id);
CREATE INDEX IF NOT EXISTS idx_note_comments_parent ON public.note_comments(parent_id);

ALTER TABLE public.note_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_read_all"     ON public.note_comments;
DROP POLICY IF EXISTS "comments_insert_any"   ON public.note_comments;
DROP POLICY IF EXISTS "comments_delete_admin" ON public.note_comments;

CREATE POLICY "comments_read_all"     ON public.note_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_any"   ON public.note_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "comments_delete_admin" ON public.note_comments FOR DELETE TO authenticated USING (true);

-- Enforce max one level of nesting
CREATE OR REPLACE FUNCTION public.check_comment_depth()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.note_comments
            WHERE id = NEW.parent_id AND parent_id IS NOT NULL
        ) THEN
            RAISE EXCEPTION 'Comments cannot be nested more than one level deep';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_depth ON public.note_comments;
CREATE TRIGGER trg_comment_depth
    BEFORE INSERT ON public.note_comments
    FOR EACH ROW EXECUTE FUNCTION public.check_comment_depth();
