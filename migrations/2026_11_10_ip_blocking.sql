-- ============================================================
-- IP + name blocking for students using fake / inappropriate names
-- Run in Supabase SQL Editor AFTER 2026_10_26_security_hardening.sql.
-- Idempotent: safe to re-run.
--
-- What it does
--   • Records the IP each student signed in from (portal_members.ip_address),
--     refreshed while they use the portal.
--   • public.blocked_ips: admins add/remove IPs from Settings.
--   • A blocked IP cannot sign in to the portal, and any session already
--     open from that IP loses access immediately (has_portal_access()).
--
-- NOTE: students on the same Wi-Fi / campus network often share ONE
-- public IP. Blocking it blocks all of them. The admin UI shows how many
-- signed-in students share an IP before you block it.
-- ============================================================

ALTER TABLE public.portal_members ADD COLUMN IF NOT EXISTS ip_address text;
CREATE INDEX IF NOT EXISTS idx_portal_members_ip ON public.portal_members(ip_address);

CREATE TABLE IF NOT EXISTS public.blocked_ips (
    ip_address   text         PRIMARY KEY CHECK (char_length(ip_address) BETWEEN 3 AND 64),
    created_at   timestamptz  NOT NULL DEFAULT now(),
    blocked_by   uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
    student_name text,        -- name(s) seen on this IP when it was blocked
    reason       text         CHECK (char_length(reason) <= 200)
);

ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_ips_admin_read"   ON public.blocked_ips;
DROP POLICY IF EXISTS "blocked_ips_admin_delete" ON public.blocked_ips;
CREATE POLICY "blocked_ips_admin_read" ON public.blocked_ips FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));
CREATE POLICY "blocked_ips_admin_delete" ON public.blocked_ips FOR DELETE TO authenticated
    USING ((SELECT public.is_admin()));
-- Inserts go through block_portal_ip() only.
REVOKE ALL ON public.blocked_ips FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.blocked_ips TO authenticated;


-- Blocked student names (matched case-insensitively, spacing ignored,
-- from any IP). Inserts go through block_portal_name() only.
CREATE TABLE IF NOT EXISTS public.blocked_names (
    name_key     text         PRIMARY KEY CHECK (char_length(name_key) BETWEEN 1 AND 60),
    display_name text         NOT NULL,
    created_at   timestamptz  NOT NULL DEFAULT now(),
    blocked_by   uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
    reason       text         CHECK (char_length(reason) <= 200)
);

ALTER TABLE public.blocked_names ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_names_admin_read"   ON public.blocked_names;
DROP POLICY IF EXISTS "blocked_names_admin_delete" ON public.blocked_names;
CREATE POLICY "blocked_names_admin_read" ON public.blocked_names FOR SELECT TO authenticated
    USING ((SELECT public.is_admin()));
CREATE POLICY "blocked_names_admin_delete" ON public.blocked_names FOR DELETE TO authenticated
    USING ((SELECT public.is_admin()));
REVOKE ALL ON public.blocked_names FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.blocked_names TO authenticated;

-- "  AsDfg   Khan " -> "asdfg khan"
CREATE OR REPLACE FUNCTION public.name_key(p_name text)
RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = ''
AS $$
    SELECT lower(regexp_replace(trim(COALESCE(p_name, '')), '\s+', ' ', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.is_name_blocked(p_name text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
    SELECT p_name IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.blocked_names WHERE name_key = public.name_key(p_name));
$$;


CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
    SELECT p_ip IS NOT NULL
       AND EXISTS (SELECT 1 FROM public.blocked_ips WHERE ip_address = lower(trim(p_ip)));
$$;


-- Access now also requires that neither the sign-in IP nor the current
-- request IP is blocked. Admins are never affected.
CREATE OR REPLACE FUNCTION public.has_portal_access()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
    SELECT public.is_admin() OR (
        EXISTS (
            SELECT 1
            FROM public.portal_members m
            JOIN public.portal_config c ON c.id
            WHERE m.user_id = auth.uid()
              AND m.expires_at > now()
              AND m.password_version = c.password_version
              AND NOT public.is_ip_blocked(m.ip_address)
              AND NOT public.is_name_blocked(m.student_name)
        )
        AND NOT public.is_ip_blocked(public.request_ip())
    );
$$;


-- Same as before, plus: refuse blocked IPs and remember the sign-in IP.
CREATE OR REPLACE FUNCTION public.redeem_portal_access(p_password text, p_student_name text)
RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_uid        uuid := auth.uid();
    v_ip         text := lower(public.request_ip());
    v_name       text := regexp_replace(trim(COALESCE(p_student_name, '')), '\s+', ' ', 'g');
    v_cfg        public.portal_config%ROWTYPE;
    v_fail_user  integer;
    v_fail_ip    integer;
    v_expires    timestamptz;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Not signed in' USING ERRCODE = '28000';
    END IF;

    IF public.is_ip_blocked(v_ip) THEN
        RAISE EXCEPTION 'Access from your network has been blocked by the administrator.'
            USING ERRCODE = 'P0001';
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

    IF public.is_name_blocked(v_name) THEN
        RAISE EXCEPTION 'This name has been blocked by the administrator. Please use your real name.'
            USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_cfg FROM public.portal_config WHERE id;

    IF v_cfg.password_hash IS NULL
       OR extensions.crypt(COALESCE(p_password, ''), v_cfg.password_hash) <> v_cfg.password_hash THEN
        INSERT INTO public.portal_login_attempts (user_id, ip_address, success) VALUES (v_uid, v_ip, false);
        RETURN json_build_object('ok', false, 'error', 'Incorrect password');
    END IF;

    INSERT INTO public.portal_login_attempts (user_id, ip_address, success) VALUES (v_uid, v_ip, true);

    v_expires := now() + make_interval(days => v_cfg.session_days);

    INSERT INTO public.portal_members (user_id, student_name, password_version, expires_at, ip_address)
    VALUES (v_uid, v_name, v_cfg.password_version, v_expires, v_ip)
    ON CONFLICT (user_id) DO UPDATE
        SET student_name     = EXCLUDED.student_name,
            password_version = EXCLUDED.password_version,
            expires_at       = EXCLUDED.expires_at,
            ip_address       = EXCLUDED.ip_address,
            last_seen_at     = now();

    RETURN json_build_object('ok', true, 'student_name', v_name, 'expires_at', v_expires);
END;
$$;


-- Same as before, plus: keep the member's IP current and report blocks.
CREATE OR REPLACE FUNCTION public.portal_status()
RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_ip  text := lower(public.request_ip());
BEGIN
    IF v_uid IS NULL THEN
        RETURN json_build_object('has_access', false, 'is_admin', false);
    END IF;

    -- Never overwrite a blocked sign-in IP: switching networks must not lift a block.
    UPDATE public.portal_members
    SET last_seen_at = now(),
        ip_address   = COALESCE(v_ip, ip_address)
    WHERE user_id = v_uid
      AND NOT public.is_ip_blocked(ip_address)
      AND (last_seen_at < now() - interval '10 minutes' OR ip_address IS DISTINCT FROM COALESCE(v_ip, ip_address));

    RETURN json_build_object(
        'has_access',   public.has_portal_access(),
        'is_admin',     public.is_admin(),
        'student_name', public.portal_member_name(),
        'blocked',      NOT public.is_admin() AND (
                            public.is_ip_blocked(v_ip)
                            OR public.is_ip_blocked((SELECT ip_address FROM public.portal_members WHERE user_id = v_uid))),
        'name_blocked', NOT public.is_admin() AND public.is_name_blocked(public.portal_member_name())
    );
END;
$$;


-- Admin: block an IP. Signs out every student currently using it.
CREATE OR REPLACE FUNCTION public.block_portal_ip(p_ip text, p_reason text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_ip      text := lower(trim(COALESCE(p_ip, '')));
    v_names   text;
    v_removed integer;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
    END IF;

    BEGIN
        PERFORM v_ip::inet;
    EXCEPTION WHEN others THEN
        RAISE EXCEPTION 'Enter a valid IPv4 or IPv6 address.' USING ERRCODE = 'P0001';
    END;

    IF v_ip = lower(COALESCE(public.request_ip(), '')) THEN
        RAISE EXCEPTION 'That is your own current IP address.' USING ERRCODE = 'P0001';
    END IF;

    SELECT left(string_agg(DISTINCT student_name, ', '), 300) INTO v_names
    FROM public.portal_members WHERE ip_address = v_ip;

    INSERT INTO public.blocked_ips (ip_address, blocked_by, student_name, reason)
    VALUES (v_ip, auth.uid(), v_names, NULLIF(left(trim(COALESCE(p_reason, '')), 200), ''))
    ON CONFLICT (ip_address) DO UPDATE
        SET reason       = COALESCE(EXCLUDED.reason, public.blocked_ips.reason),
            student_name = COALESCE(EXCLUDED.student_name, public.blocked_ips.student_name);

    DELETE FROM public.portal_members WHERE ip_address = v_ip;
    GET DIAGNOSTICS v_removed = ROW_COUNT;

    RETURN json_build_object('ip_address', v_ip, 'signed_out', v_removed);
END;
$$;


-- Admin: block a name. Signs out every student currently using it.
CREATE OR REPLACE FUNCTION public.block_portal_name(p_name text, p_reason text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    v_key     text := public.name_key(p_name);
    v_removed integer;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
    END IF;
    IF char_length(v_key) NOT BETWEEN 1 AND 60 THEN
        RAISE EXCEPTION 'Enter a name (up to 60 characters).' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.blocked_names (name_key, display_name, blocked_by, reason)
    VALUES (v_key, regexp_replace(trim(p_name), '\s+', ' ', 'g'), auth.uid(),
            NULLIF(left(trim(COALESCE(p_reason, '')), 200), ''))
    ON CONFLICT (name_key) DO UPDATE
        SET reason = COALESCE(EXCLUDED.reason, public.blocked_names.reason);

    DELETE FROM public.portal_members WHERE public.name_key(student_name) = v_key;
    GET DIAGNOSTICS v_removed = ROW_COUNT;

    RETURN json_build_object('name', v_key, 'signed_out', v_removed);
END;
$$;


-- ------------------------------------------------------------
-- Make sure every signed-in student has an IP.
-- ------------------------------------------------------------

-- Read the client IP from more proxy headers (Supabase may send any of these).
CREATE OR REPLACE FUNCTION public.request_ip()
RETURNS text
LANGUAGE sql STABLE SET search_path = ''
AS $$
    SELECT NULLIF(trim(split_part(COALESCE(
        NULLIF(current_setting('request.headers', true), '')::json ->> 'cf-connecting-ip',
        NULLIF(current_setting('request.headers', true), '')::json ->> 'x-real-ip',
        NULLIF(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for',
        ''), ',', 1)), '');
$$;

-- Students who signed in before this migration: take the IP of their latest
-- successful sign-in, otherwise the IP their latest page visit recorded.
UPDATE public.portal_members m
SET ip_address = lower(s.ip_address)
FROM (
    SELECT DISTINCT ON (user_id) user_id, ip_address
    FROM public.portal_login_attempts
    WHERE success AND user_id IS NOT NULL AND ip_address ~ '^[0-9A-Fa-f:.]{3,45}$'
    ORDER BY user_id, attempted_at DESC
) s
WHERE m.user_id = s.user_id AND m.ip_address IS NULL;

UPDATE public.portal_members m
SET ip_address = lower(s.ip_address)
FROM (
    SELECT DISTINCT ON (user_id) user_id, ip_address
    FROM public.page_visits
    WHERE user_id IS NOT NULL AND ip_address ~ '^[0-9A-Fa-f:.]{3,45}$'
    ORDER BY user_id, created_at DESC
) s
WHERE m.user_id = s.user_id AND m.ip_address IS NULL;

-- Going forward, if the server could not see an IP, fill it from the
-- student's next tracked page view.
CREATE OR REPLACE FUNCTION public.fill_member_ip_from_visit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
    IF NEW.user_id IS NOT NULL AND NEW.ip_address ~ '^[0-9A-Fa-f:.]{3,45}$' THEN
        UPDATE public.portal_members
        SET ip_address = lower(NEW.ip_address)
        WHERE user_id = NEW.user_id AND ip_address IS NULL;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_member_ip ON public.page_visits;
CREATE TRIGGER trg_fill_member_ip AFTER INSERT ON public.page_visits
    FOR EACH ROW EXECUTE FUNCTION public.fill_member_ip_from_visit();

REVOKE ALL ON FUNCTION public.fill_member_ip_from_visit() FROM PUBLIC, anon, authenticated;


-- is_ip_blocked() is internal (used by the SECURITY DEFINER functions above).
REVOKE ALL ON FUNCTION public.is_ip_blocked(text)         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_name_blocked(text)       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.block_portal_ip(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.block_portal_name(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.block_portal_ip(text, text)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.block_portal_name(text, text) TO authenticated;
-- has_portal_access / redeem_portal_access / portal_status keep their existing grants.
