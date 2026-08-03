-- ============================================================
-- ICTHub — Complete Database Migration
-- Institute of Information & Communication Technology (IICT)
-- Khulna University of Engineering & Technology (KUET)
-- ============================================================
-- Run the entire contents of this file in the Supabase SQL
-- Editor (one shot). It is idempotent — safe to re-run.
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 1. SEMESTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.semesters (
    id         bigserial    PRIMARY KEY,
    created_at timestamptz  NOT NULL DEFAULT now(),
    name       text         NOT NULL,
    start_date date         NOT NULL,
    end_date   date         NOT NULL,
    is_current boolean      NOT NULL DEFAULT false
);

ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "semesters_read_all"    ON public.semesters;
DROP POLICY IF EXISTS "semesters_write_admin" ON public.semesters;
CREATE POLICY "semesters_read_all"    ON public.semesters FOR SELECT USING (true);
CREATE POLICY "semesters_write_admin" ON public.semesters FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure only one semester is current at a time
CREATE OR REPLACE FUNCTION public.ensure_single_current_semester()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NEW.is_current THEN
        UPDATE public.semesters
        SET    is_current = false
        WHERE  id <> NEW.id
          AND  is_current = true;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_single_current_semester ON public.semesters;
CREATE TRIGGER trg_single_current_semester
    BEFORE INSERT OR UPDATE ON public.semesters
    FOR EACH ROW EXECUTE FUNCTION public.ensure_single_current_semester();


-- ============================================================
-- 2. SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subjects (
    id          bigserial    PRIMARY KEY,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    title       text         NOT NULL,
    description text         NOT NULL DEFAULT '',
    code        text         NOT NULL,
    is_active   boolean      NOT NULL DEFAULT true,
    semester_id bigint       REFERENCES public.semesters(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_subjects_semester  ON public.subjects(semester_id);
CREATE INDEX IF NOT EXISTS idx_subjects_is_active ON public.subjects(is_active);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subjects_read_all"    ON public.subjects;
DROP POLICY IF EXISTS "subjects_write_admin" ON public.subjects;
CREATE POLICY "subjects_read_all"    ON public.subjects FOR SELECT USING (true);
CREATE POLICY "subjects_write_admin" ON public.subjects FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 3. NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notes (
    id          bigserial    PRIMARY KEY,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    subject_id  bigint       NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title       text         NOT NULL,
    content     text         NOT NULL DEFAULT '',
    summary     text,
    is_active   boolean      NOT NULL DEFAULT true,
    semester_id bigint       REFERENCES public.semesters(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_subject   ON public.notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_semester  ON public.notes(semester_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_active ON public.notes(is_active);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_read_all"    ON public.notes;
DROP POLICY IF EXISTS "notes_write_admin" ON public.notes;
CREATE POLICY "notes_read_all"    ON public.notes FOR SELECT USING (true);
CREATE POLICY "notes_write_admin" ON public.notes FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 4. EVENTS  (Academic Calendar)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
    id          bigserial    PRIMARY KEY,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    date        date         NOT NULL,
    title       text         NOT NULL,
    description text         NOT NULL DEFAULT '',
    subject_id  bigint       REFERENCES public.subjects(id) ON DELETE SET NULL,
    is_active   boolean      NOT NULL DEFAULT true,
    semester_id bigint       REFERENCES public.semesters(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_events_date      ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_semester  ON public.events(semester_id);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_read_all"    ON public.events;
DROP POLICY IF EXISTS "events_write_admin" ON public.events;
CREATE POLICY "events_read_all"    ON public.events FOR SELECT USING (true);
CREATE POLICY "events_write_admin" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 5. FILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.files (
    id          bigserial    PRIMARY KEY,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    subject_id  bigint       REFERENCES public.subjects(id) ON DELETE SET NULL,
    name        text         NOT NULL,
    file_path   text         NOT NULL,
    file_type   text         NOT NULL DEFAULT '',
    size        bigint       NOT NULL DEFAULT 0,
    is_active   boolean      NOT NULL DEFAULT true,
    semester_id bigint       REFERENCES public.semesters(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_files_subject  ON public.files(subject_id);
CREATE INDEX IF NOT EXISTS idx_files_semester ON public.files(semester_id);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "files_read_all"    ON public.files;
DROP POLICY IF EXISTS "files_write_admin" ON public.files;
CREATE POLICY "files_read_all"    ON public.files FOR SELECT USING (true);
CREATE POLICY "files_write_admin" ON public.files FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- ============================================================
-- 6. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id          bigserial    PRIMARY KEY,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    type        text         NOT NULL CHECK (type IN ('note','file','event')),
    title       text         NOT NULL,
    message     text         NOT NULL DEFAULT '',
    related_id  bigint       NOT NULL DEFAULT 0,
    semester_id bigint       NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    subject_id  bigint       REFERENCES public.subjects(id) ON DELETE SET NULL,
    created_by  text         NOT NULL DEFAULT 'admin',
    is_read     boolean      NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_notifications_semester ON public.notifications(semester_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type     ON public.notifications(type);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_read_all"     ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_read"  ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_admin" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_admin" ON public.notifications;

CREATE POLICY "notifications_read_all"     ON public.notifications FOR SELECT USING (true);
CREATE POLICY "notifications_update_read"  ON public.notifications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "notifications_insert_admin" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_delete_admin" ON public.notifications FOR DELETE TO authenticated USING (true);


-- ============================================================
-- 7. PORTAL_SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.portal_settings (
    id         bigserial    PRIMARY KEY,
    created_at timestamptz  NOT NULL DEFAULT now(),
    key        text         NOT NULL UNIQUE,
    value      text         NOT NULL
);

ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portal_settings_read_all"    ON public.portal_settings;
DROP POLICY IF EXISTS "portal_settings_write_admin" ON public.portal_settings;
CREATE POLICY "portal_settings_read_all"    ON public.portal_settings FOR SELECT USING (true);
CREATE POLICY "portal_settings_write_admin" ON public.portal_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Default portal password — change immediately via Admin > Settings
INSERT INTO public.portal_settings (key, value)
VALUES ('portal_password', 'iict@kuet')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- 8. STORAGE BUCKET  (for file uploads)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('icthub-files', 'icthub-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "icthub_files_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "icthub_files_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "icthub_files_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "icthub_files_admin_delete" ON storage.objects;

CREATE POLICY "icthub_files_public_read"
    ON storage.objects FOR SELECT USING (bucket_id = 'icthub-files');

CREATE POLICY "icthub_files_admin_upload"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'icthub-files');

CREATE POLICY "icthub_files_admin_update"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'icthub-files');

CREATE POLICY "icthub_files_admin_delete"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'icthub-files');


-- ============================================================
-- 9. AUTO-NOTIFICATION TRIGGERS
-- ============================================================

-- Notes
CREATE OR REPLACE FUNCTION public.notify_on_note_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NEW.is_active AND NEW.semester_id IS NOT NULL THEN
        INSERT INTO public.notifications
            (type, title, message, related_id, semester_id, subject_id, created_by)
        SELECT 'note', NEW.title, 'New note added: ' || NEW.title,
               NEW.id, NEW.semester_id, NEW.subject_id, 'admin'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.notifications
            WHERE type = 'note' AND related_id = NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_note ON public.notes;
CREATE TRIGGER trg_notify_note
    AFTER INSERT ON public.notes
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_note_insert();

-- Files
CREATE OR REPLACE FUNCTION public.notify_on_file_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NEW.is_active AND NEW.semester_id IS NOT NULL THEN
        INSERT INTO public.notifications
            (type, title, message, related_id, semester_id, subject_id, created_by)
        SELECT 'file', NEW.name, 'New file uploaded: ' || NEW.name,
               NEW.id, NEW.semester_id, NEW.subject_id, 'admin'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.notifications
            WHERE type = 'file' AND related_id = NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_file ON public.files;
CREATE TRIGGER trg_notify_file
    AFTER INSERT ON public.files
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_file_insert();

-- Events
CREATE OR REPLACE FUNCTION public.notify_on_event_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NEW.is_active AND NEW.semester_id IS NOT NULL THEN
        INSERT INTO public.notifications
            (type, title, message, related_id, semester_id, subject_id, created_by)
        SELECT 'event', NEW.title,
               'New event: ' || NEW.title || ' on ' || to_char(NEW.date, 'DD Mon YYYY'),
               NEW.id, NEW.semester_id, NEW.subject_id, 'admin'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.notifications
            WHERE type = 'event' AND related_id = NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_event ON public.events;
CREATE TRIGGER trg_notify_event
    AFTER INSERT ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_event_insert();


-- ============================================================
-- DONE
-- ============================================================
-- Tables: semesters, subjects, notes, events, files,
--         notifications, portal_settings
-- Storage: icthub-files (public read, admin write)
-- Triggers: auto-notifications on insert, single current semester
--
-- Next steps:
--   1. Authentication > Users: create your admin account.
--   2. Log into ICTHub at /admin/login.
--   3. Admin > Settings: change the portal password.
--   4. Create a semester, then add subjects, notes, events, files.
-- ============================================================
