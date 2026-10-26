-- ============================================================
-- ICTHub — Security hardening (2026-10-26)
-- ============================================================
-- Run AFTER complete_schema.sql and the add_*.sql migrations.
-- Idempotent: safe to re-run.
--
-- What this fixes
--   1. "authenticated" no longer means "admin". Admins are listed in
--      public.admin_users and checked with public.is_admin().
--   2. The portal password is no longer stored in plaintext in a
--      publicly readable table. It is bcrypt-hashed and only verified
--      server-side through public.redeem_portal_access().
--   3. Portal content is actually gated: students sign in with a
--      Supabase anonymous session that is granted access only after
--      the password check. Every content table, the storage bucket and
--      realtime notifications check public.has_portal_access().
--   4. Changing the portal password revokes every student session.
--   5. Students can no longer flip notifications.is_read for everyone,
--      spoof comment author names, or write arbitrary analytics rows.
--   6. Draft (is_active = false) content is hidden from students at
--      the database level, not just in the UI.
--   7. The storage bucket is private; files are served via signed URLs.
--   8. SECURITY DEFINER functions pin search_path.
--
-- REQUIRED dashboard settings (Supabase → Authentication → Sign In / Providers)
--   • Enable "Allow anonymous sign-ins".
--   • Keep "Allow new users to sign up" ENABLED. It is a global switch:
--     turning it off also blocks anonymous sign-ins, so no student could
--     log in. It is safe to leave on — a new account is not an admin
--     (admin_users) and sees nothing without the portal password.
--   • Optional: enable CAPTCHA protection for extra brute-force defence.
--
-- AFTER RUNNING
--   • Review admins:   select u.email from public.admin_users a
--                      join auth.users u on u.id = a.user_id;
--     Every pre-existing non-anonymous user is seeded as an admin to
--     preserve current behaviour — delete any you do not recognise.
--   • Add an admin:    insert into public.admin_users (user_id)
--                      select id from auth.users where email = 'you@example.com';
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


-- ============================================================
-- 0. NORMALISE EXISTING SCHEMA
-- ============================================================
-- Drop every existing policy on the app tables first (including ones
-- created by hand in the dashboard, e.g. "public_all_portal_settings").
-- This must happen before any column type change below, because
-- Postgres refuses to alter a column that a policy references.
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT policyname, tablename FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('semesters','subjects','notes','events','files',
                            'notifications','info_categories','info_notes',
                            'portal_settings','note_comments','page_visits',
                            'admin_users','portal_members','portal_login_attempts')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END;
$$;

-- Some live databases have user_id columns typed as text instead of uuid,
-- which breaks every comparison with auth.uid() ("operator does not exist:
-- text = uuid"). Convert them. Values that aren't valid UUIDs become NULL;
-- for these columns that only removes comment ownership/analytics linkage.
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT table_name, column_name FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name = 'user_id'
          AND data_type <> 'uuid'
          AND table_name IN ('note_comments','page_visits','admin_users',
                             'portal_members','portal_login_attempts')
    LOOP
        RAISE NOTICE 'Converting %.% to uuid', r.table_name, r.column_name;
        EXECUTE format(
            'ALTER TABLE public.%1$I ALTER COLUMN %2$I TYPE uuid USING (
                 CASE WHEN %2$I::text ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$''
                      THEN %2$I::text::uuid END)',
            r.table_name, r.column_name);
    END LOOP;
END;
$$;


-- ============================================================
-- 1. ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id    uuid         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Preserve current behaviour: every existing real (non-anonymous) user was an admin.
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE COALESCE(is_anonymous, false) = false
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
    SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid());
$$;

DROP POLICY IF EXISTS "admin_users_read_self" ON public.admin_users;
CREATE POLICY "admin_users_read_self" ON public.admin_users
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));
-- No write policies: admins are managed from the SQL editor only.


-- ============================================================
-- 2. PORTAL PASSWORD + MEMBERSHIP
-- ============================================================
CREATE TABLE IF NOT EXISTS public.portal_config (
    id               boolean      PRIMARY KEY DEFAULT true CHECK (id),
    password_hash    text         NOT NULL,
    password_version integer      NOT NULL DEFAULT 1,
    session_days     integer      NOT NULL DEFAULT 120 CHECK (session_days BETWEEN 1 AND 365),
    updated_at       timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.portal_config ENABLE ROW LEVEL SECURITY;
-- No policies: only SECURITY DEFINER functions touch this table.

-- Migrate the existing plaintext password (if any), then remove it.
DO $$
DECLARE
    v_plain text;
BEGIN
    IF to_regclass('public.portal_settings') IS NOT NULL THEN
        SELECT value INTO v_plain FROM public.portal_settings WHERE key = 'portal_password';
    END IF;

    INSERT INTO public.portal_config (id, password_hash)
    VALUES (true, extensions.crypt(COALESCE(v_plain, 'iict@kuet'), extensions.gen_salt('bf', 10)))
    ON CONFLICT (id) DO NOTHING;

    IF to_regclass('public.portal_settings') IS NOT NULL THEN
        DELETE FROM public.portal_settings WHERE key = 'portal_password';
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.portal_members (
    user_id          uuid         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    student_name     text         NOT NULL CHECK (char_length(student_name) BETWEEN 2 AND 60),
    password_version integer      NOT NULL,
    created_at       timestamptz  NOT NULL DEFAULT now(),
    last_seen_at     timestamptz  NOT NULL DEFAULT now(),
    expires_at       timestamptz  NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portal_members_last_seen ON public.portal_members(last_seen_at DESC);

ALTER TABLE public.portal_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.portal_login_attempts (
    id           bigserial    PRIMARY KEY,
    attempted_at timestamptz  NOT NULL DEFAULT now(),
    user_id      uuid,
    ip_address   text,
    success      boolean      NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portal_attempts_user ON public.portal_login_attempts(user_id, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_attempts_ip   ON public.portal_login_attempts(ip_address, attempted_at DESC);

ALTER TABLE public.portal_login_attempts ENABLE ROW LEVEL SECURITY;
-- No policies: written by redeem_portal_access() only.

CREATE OR REPLACE FUNCTION public.has_portal_access()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
    SELECT public.is_admin() OR EXISTS (
        SELECT 1
        FROM public.portal_members m
        JOIN public.portal_config c ON c.id
        WHERE m.user_id = auth.uid()
          AND m.expires_at > now()
          AND m.password_version = c.password_version
    );
$$;

CREATE OR REPLACE FUNCTION public.portal_member_name()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
    SELECT student_name FROM public.portal_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.request_ip()
RETURNS text
LANGUAGE sql STABLE SET search_path = ''
AS $$
    SELECT NULLIF(trim(split_part(COALESCE(
        current_setting('request.headers', true)::json ->> 'cf-connecting-ip',
        current_setting('request.headers', true)::json ->> 'x-forwarded-for',
        ''), ',', 1)), '');
$$;

-- Verifies the portal password and grants the calling (anonymous) user access.
CREATE OR REPLACE FUNCTION public.redeem_portal_access(p_password text, p_student_name text)
RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_ip         text := public.request_ip();
    v_name       text := regexp_replace(trim(COALESCE(p_student_name, '')), '\s+', ' ', 'g');
    v_cfg        public.portal_config%ROWTYPE;
    v_fail_user  integer;
    v_fail_ip    integer;
    v_expires    timestamptz;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not signed in' USING ERRCODE = '28000';
    END IF;

    SELECT count(*) INTO v_fail_user FROM public.portal_login_attempts
    WHERE user_id = v_uid AND NOT success AND attempted_at > now() - interval '15 minutes';

    SELECT count(*) INTO v_fail_ip FROM public.portal_login_attempts
    WHERE v_ip IS NOT NULL AND ip_address = v_ip AND NOT success
      AND attempted_at > now() - interval '15 minutes';

    -- Per device: 5 failures. Per IP: generous, since a whole campus may share one NAT address.
    IF v_fail_user >= 5 OR v_fail_ip >= 60 THEN
        RAISE EXCEPTION 'Too many attempts. Please wait 15 minutes and try again.'
            USING ERRCODE = 'P0001';
    END IF;

    IF char_length(v_name) NOT BETWEEN 2 AND 60
       OR v_name !~ '^[[:alpha:] .''-]+$'
       OR char_length(regexp_replace(v_name, '[^[:alpha:]]', '', 'g')) < 2
       OR lower(v_name) = ANY (ARRAY['test','testing','tester','demo','sample','asdf','qwerty',
                                     'unknown','none','null','undefined','na','admin','arif']) THEN
        RAISE EXCEPTION 'Please enter a valid name (letters only).' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_cfg FROM public.portal_config WHERE id;

    IF v_cfg.password_hash IS NULL
       OR extensions.crypt(COALESCE(p_password, ''), v_cfg.password_hash) <> v_cfg.password_hash THEN
        INSERT INTO public.portal_login_attempts (user_id, ip_address, success) VALUES (v_uid, v_ip, false);
        RETURN json_build_object('ok', false, 'error', 'Incorrect password');
    END IF;

    INSERT INTO public.portal_login_attempts (user_id, ip_address, success) VALUES (v_uid, v_ip, true);

    v_expires := now() + make_interval(days => v_cfg.session_days);

    INSERT INTO public.portal_members (user_id, student_name, password_version, expires_at)
    VALUES (v_uid, v_name, v_cfg.password_version, v_expires)
    ON CONFLICT (user_id) DO UPDATE
        SET student_name     = EXCLUDED.student_name,
            password_version = EXCLUDED.password_version,
            expires_at       = EXCLUDED.expires_at,
            last_seen_at     = now();

    RETURN json_build_object('ok', true, 'student_name', v_name, 'expires_at', v_expires);
END;
$$;

-- Bootstrap call made by the client on load. Also refreshes last_seen_at.
CREATE OR REPLACE FUNCTION public.portal_status()
RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_uid uuid := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RETURN json_build_object('has_access', false, 'is_admin', false);
    END IF;

    UPDATE public.portal_members
    SET last_seen_at = now()
    WHERE user_id = v_uid AND last_seen_at < now() - interval '10 minutes';

    RETURN json_build_object(
        'has_access',   public.has_portal_access(),
        'is_admin',     public.is_admin(),
        'student_name', public.portal_member_name()
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_portal()
RETURNS void
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
    DELETE FROM public.portal_members WHERE user_id = auth.uid();
$$;

-- Admin: change the portal password. Always revokes every student session.
CREATE OR REPLACE FUNCTION public.set_portal_password(p_new_password text)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
    END IF;
    IF char_length(COALESCE(p_new_password, '')) < 8 THEN
        RAISE EXCEPTION 'Password must be at least 8 characters.' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.portal_config
    SET password_hash    = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
        password_version = password_version + 1,
        updated_at       = now()
    WHERE id;
END;
$$;

-- Admin: sign every student out without changing the password.
CREATE OR REPLACE FUNCTION public.revoke_all_portal_sessions()
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
    END IF;
    DELETE FROM public.portal_members WHERE true;
END;
$$;

-- Admin: settings overview.
CREATE OR REPLACE FUNCTION public.portal_overview()
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_cfg public.portal_config%ROWTYPE;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
    END IF;
    SELECT * INTO v_cfg FROM public.portal_config WHERE id;
    RETURN json_build_object(
        'password_updated_at', v_cfg.updated_at,
        'session_days',        v_cfg.session_days,
        'active_sessions',     (SELECT count(*) FROM public.portal_members
                                WHERE expires_at > now() AND password_version = v_cfg.password_version),
        'failed_attempts_24h', (SELECT count(*) FROM public.portal_login_attempts
                                WHERE NOT success AND attempted_at > now() - interval '24 hours')
    );
END;
$$;

-- Admin: housekeeping (also safe to schedule with pg_cron).
CREATE OR REPLACE FUNCTION public.cleanup_portal_data()
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
    END IF;
    DELETE FROM public.portal_members m
    USING public.portal_config c
    WHERE c.id AND (m.expires_at < now() OR m.password_version <> c.password_version);
    DELETE FROM public.portal_login_attempts WHERE attempted_at < now() - interval '30 days';
END;
$$;

DROP POLICY IF EXISTS "portal_members_read"         ON public.portal_members;
DROP POLICY IF EXISTS "portal_members_admin_delete" ON public.portal_members;
CREATE POLICY "portal_members_read" ON public.portal_members
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE POLICY "portal_members_admin_delete" ON public.portal_members
    FOR DELETE TO authenticated
    USING ((SELECT public.is_admin()));

REVOKE ALL ON FUNCTION public.is_admin()                        FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_portal_access()               FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_member_name()              FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.redeem_portal_access(text, text)  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_status()                   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.leave_portal()                    FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_portal_password(text)         FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_all_portal_sessions()      FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.portal_overview()                 FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cleanup_portal_data()             FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin()                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_portal_access()              TO authenticated;
GRANT EXECUTE ON FUNCTION public.portal_member_name()             TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_portal_access(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.portal_status()                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_portal()                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_portal_password(text)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_all_portal_sessions()     TO authenticated;
GRANT EXECUTE ON FUNCTION public.portal_overview()                TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_portal_data()            TO authenticated;


-- ============================================================
-- 4. CONTENT TABLES
-- ============================================================
-- updated_at for "last updated" in the UI
ALTER TABLE public.subjects   ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.subjects   ADD COLUMN IF NOT EXISTS additional_info text;
ALTER TABLE public.notes      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.events     ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.files      ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.info_notes ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['subjects','notes','events','files','info_notes'] LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_%1$s ON public.%1$I', t);
        EXECUTE format('CREATE TRIGGER trg_touch_%1$s BEFORE UPDATE ON public.%1$I
                        FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t);
    END LOOP;
END;
$$;

-- Read: portal members see active rows; admins see everything.
-- Write: admins only.
DO $$
DECLARE
    t text;
BEGIN
    FOREACH t IN ARRAY ARRAY['subjects','notes','events','files','info_categories','info_notes'] LOOP
        EXECUTE format($f$
            CREATE POLICY "%1$s_read" ON public.%1$I FOR SELECT TO authenticated
            USING ((SELECT public.is_admin()) OR ((SELECT public.has_portal_access()) AND is_active))
        $f$, t);
        EXECUTE format($f$
            CREATE POLICY "%1$s_admin_write" ON public.%1$I FOR ALL TO authenticated
            USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()))
        $f$, t);
    END LOOP;
END;
$$;

CREATE POLICY "semesters_read" ON public.semesters FOR SELECT TO authenticated
    USING ((SELECT public.has_portal_access()));
CREATE POLICY "semesters_admin_write" ON public.semesters FOR ALL TO authenticated
    USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- portal_settings: admin only (no longer holds the password)
CREATE POLICY "portal_settings_admin" ON public.portal_settings FOR ALL TO authenticated
    USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));


-- ============================================================
-- 5. FILES — private storage
-- ============================================================
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS storage_path text;

-- Backfill the object key from legacy public URLs.
UPDATE public.files
SET storage_path = regexp_replace(file_path, '^.*/storage/v1/object/public/icthub-files/', '')
WHERE storage_path IS NULL
  AND file_path LIKE '%/storage/v1/object/public/icthub-files/%';

UPDATE storage.buckets
SET public = false,
    file_size_limit = 52428800  -- 50 MB
WHERE id = 'icthub-files';

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
          AND (COALESCE(qual, '') || COALESCE(with_check, '')) LIKE '%icthub-files%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
    END LOOP;
END;
$$;

CREATE POLICY "icthub_files_member_read" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'icthub-files' AND (SELECT public.has_portal_access()));
CREATE POLICY "icthub_files_admin_insert" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'icthub-files' AND (SELECT public.is_admin()));
CREATE POLICY "icthub_files_admin_update" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'icthub-files' AND (SELECT public.is_admin()));
CREATE POLICY "icthub_files_admin_delete" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'icthub-files' AND (SELECT public.is_admin()));


-- ============================================================
-- 6. NOTIFICATIONS
-- ============================================================
-- Read state is now tracked per device on the client; is_read is kept
-- for backwards compatibility but students can no longer change it.
CREATE POLICY "notifications_read" ON public.notifications FOR SELECT TO authenticated
    USING ((SELECT public.has_portal_access()));
CREATE POLICY "notifications_admin_write" ON public.notifications FOR ALL TO authenticated
    USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

ALTER FUNCTION public.notify_on_note_insert()  SET search_path = '';
ALTER FUNCTION public.notify_on_file_insert()  SET search_path = '';
ALTER FUNCTION public.notify_on_event_insert() SET search_path = '';
ALTER FUNCTION public.ensure_single_current_semester() SET search_path = '';

-- Also notify when a draft is published (the functions dedupe by related_id).
DROP TRIGGER IF EXISTS trg_notify_note  ON public.notes;
DROP TRIGGER IF EXISTS trg_notify_file  ON public.files;
DROP TRIGGER IF EXISTS trg_notify_event ON public.events;
CREATE TRIGGER trg_notify_note  AFTER INSERT OR UPDATE OF is_active ON public.notes
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_note_insert();
CREATE TRIGGER trg_notify_file  AFTER INSERT OR UPDATE OF is_active ON public.files
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_file_insert();
CREATE TRIGGER trg_notify_event AFTER INSERT OR UPDATE OF is_active ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_event_insert();

-- Remove notifications that would point at deleted content.
CREATE OR REPLACE FUNCTION public.cleanup_notifications_on_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    DELETE FROM public.notifications WHERE type = TG_ARGV[0] AND related_id = OLD.id;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_note_notifications  ON public.notes;
DROP TRIGGER IF EXISTS trg_cleanup_file_notifications  ON public.files;
DROP TRIGGER IF EXISTS trg_cleanup_event_notifications ON public.events;
CREATE TRIGGER trg_cleanup_note_notifications  AFTER DELETE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_notifications_on_delete('note');
CREATE TRIGGER trg_cleanup_file_notifications  AFTER DELETE ON public.files
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_notifications_on_delete('file');
CREATE TRIGGER trg_cleanup_event_notifications AFTER DELETE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_notifications_on_delete('event');


-- ============================================================
-- 7. NOTE COMMENTS
-- ============================================================
ALTER TABLE public.note_comments ADD COLUMN IF NOT EXISTS author_role text NOT NULL DEFAULT 'student';
ALTER TABLE public.note_comments DROP CONSTRAINT IF EXISTS note_comments_content_length;
ALTER TABLE public.note_comments ADD  CONSTRAINT note_comments_content_length
    CHECK (char_length(content) <= 2000) NOT VALID;
ALTER TABLE public.note_comments DROP CONSTRAINT IF EXISTS note_comments_author_role_check;
ALTER TABLE public.note_comments ADD  CONSTRAINT note_comments_author_role_check
    CHECK (author_role IN ('student', 'admin'));

CREATE INDEX IF NOT EXISTS idx_note_comments_created ON public.note_comments(created_at DESC);

-- Server decides who the author is; clients cannot spoof it.
CREATE OR REPLACE FUNCTION public.prepare_note_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_recent integer;
    v_parent public.note_comments%ROWTYPE;
BEGIN
    NEW.user_id := auth.uid();
    NEW.content := trim(NEW.content);
    NEW.created_at := now();

    IF public.is_admin() THEN
        NEW.author_role := 'admin';
        NEW.author_name := 'ICTHub Admin';
    ELSE
        NEW.author_role := 'student';
        NEW.author_name := public.portal_member_name();
        IF NEW.author_name IS NULL THEN
            RAISE EXCEPTION 'Portal access required' USING ERRCODE = '42501';
        END IF;

        SELECT count(*) INTO v_recent FROM public.note_comments
        WHERE user_id = NEW.user_id AND created_at > now() - interval '1 minute';
        IF v_recent >= 5 THEN
            RAISE EXCEPTION 'You are commenting too quickly. Please wait a minute.' USING ERRCODE = 'P0001';
        END IF;
    END IF;

    IF NEW.parent_id IS NOT NULL THEN
        SELECT * INTO v_parent FROM public.note_comments WHERE id = NEW.parent_id;
        IF NOT FOUND OR v_parent.note_id <> NEW.note_id THEN
            RAISE EXCEPTION 'Invalid parent comment' USING ERRCODE = 'P0001';
        END IF;
        IF v_parent.parent_id IS NOT NULL THEN
            RAISE EXCEPTION 'Comments cannot be nested more than one level deep' USING ERRCODE = 'P0001';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_depth   ON public.note_comments;
DROP TRIGGER IF EXISTS trg_prepare_comment ON public.note_comments;
CREATE TRIGGER trg_prepare_comment BEFORE INSERT ON public.note_comments
    FOR EACH ROW EXECUTE FUNCTION public.prepare_note_comment();

CREATE POLICY "comments_read" ON public.note_comments FOR SELECT TO authenticated
    USING ((SELECT public.has_portal_access()));
CREATE POLICY "comments_insert" ON public.note_comments FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.has_portal_access()));
CREATE POLICY "comments_delete_own_or_admin" ON public.note_comments FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));


-- ============================================================
-- 8. PAGE VISITS (analytics)
-- ============================================================
ALTER TABLE public.page_visits ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_page_visits_user ON public.page_visits(user_id);

CREATE OR REPLACE FUNCTION public.prepare_page_visit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    NEW.user_id      := auth.uid();
    NEW.student_name := public.portal_member_name();
    NEW.created_at   := now();
    NEW.page         := left(NEW.page, 300);
    NEW.event_type   := left(COALESCE(NEW.event_type, 'page_view'), 50);
    NEW.event_label  := left(NEW.event_label, 300);
    NEW.entity_type  := left(NEW.entity_type, 50);
    NEW.entity_id    := left(NEW.entity_id, 50);
    NEW.ip_address   := left(NEW.ip_address, 64);
    NEW.country      := left(NEW.country, 80);
    NEW.city         := left(NEW.city, 80);
    NEW.user_agent   := left(NEW.user_agent, 400);
    NEW.referrer     := left(NEW.referrer, 400);
    NEW.session_id   := left(NEW.session_id, 64);
    IF NEW.metadata IS NOT NULL AND octet_length(NEW.metadata::text) > 2000 THEN
        NEW.metadata := '{}'::jsonb;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prepare_page_visit ON public.page_visits;
CREATE TRIGGER trg_prepare_page_visit BEFORE INSERT ON public.page_visits
    FOR EACH ROW EXECUTE FUNCTION public.prepare_page_visit();

CREATE POLICY "page_visits_member_insert" ON public.page_visits FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.has_portal_access()) AND NOT (SELECT public.is_admin()));
CREATE POLICY "page_visits_admin_read" ON public.page_visits FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));
CREATE POLICY "page_visits_admin_delete" ON public.page_visits FOR DELETE TO authenticated
    USING ((SELECT public.is_admin()));


-- ============================================================
-- 9. REALTIME
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
                       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END;
$$;

-- ============================================================
-- DONE
-- ============================================================
