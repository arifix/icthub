-- ============================================================
-- Student Chat
-- Portal-wide messages, suggestions and feedback.
-- Run in Supabase SQL Editor AFTER 2026_10_26_security_hardening.sql
-- (it relies on is_admin(), has_portal_access() and portal_member_name()).
-- Idempotent: safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id          bigserial    PRIMARY KEY,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    user_id     uuid         REFERENCES auth.users(id) ON DELETE SET NULL,
    author_name text         NOT NULL CHECK (trim(author_name) <> ''),
    author_role text         NOT NULL DEFAULT 'student' CHECK (author_role IN ('student', 'admin')),
    kind        text         NOT NULL DEFAULT 'message' CHECK (kind IN ('message', 'suggestion', 'feedback')),
    content     text         NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000)
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.chat_messages(user_id, created_at DESC);

-- Server decides who the author is; clients cannot spoof it.
CREATE OR REPLACE FUNCTION public.prepare_chat_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
    v_recent integer;
BEGIN
    NEW.user_id    := auth.uid();
    NEW.created_at := now();
    NEW.content    := btrim(NEW.content, E' \t\r\n');

    IF NEW.content = '' THEN
        RAISE EXCEPTION 'Message cannot be empty.' USING ERRCODE = 'P0001';
    END IF;
    IF char_length(NEW.content) > 1000 THEN
        RAISE EXCEPTION 'Message is too long (1000 characters max).' USING ERRCODE = 'P0001';
    END IF;

    IF public.is_admin() THEN
        NEW.author_role := 'admin';
        NEW.author_name := 'ICTHub Admin';
    ELSE
        NEW.author_role := 'student';
        NEW.author_name := public.portal_member_name();
        IF NEW.author_name IS NULL THEN
            RAISE EXCEPTION 'Portal access required' USING ERRCODE = '42501';
        END IF;

        SELECT count(*) INTO v_recent FROM public.chat_messages
        WHERE user_id = NEW.user_id AND created_at > now() - interval '1 minute';
        IF v_recent >= 10 THEN
            RAISE EXCEPTION 'You are sending messages too quickly. Please wait a minute.' USING ERRCODE = 'P0001';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prepare_chat_message ON public.chat_messages;
CREATE TRIGGER trg_prepare_chat_message BEFORE INSERT ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION public.prepare_chat_message();

-- Read and post: portal members and admins. Delete: own messages, or any as admin.
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_read"                ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert"              ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete_own_or_admin" ON public.chat_messages;

CREATE POLICY "chat_messages_read" ON public.chat_messages FOR SELECT TO authenticated
    USING ((SELECT public.has_portal_access()));
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT TO authenticated
    WITH CHECK ((SELECT public.has_portal_access()));
CREATE POLICY "chat_messages_delete_own_or_admin" ON public.chat_messages FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- Clients may only supply the message itself. No role can edit a message.
REVOKE ALL ON public.chat_messages FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.chat_messages TO authenticated;
GRANT INSERT (kind, content) ON public.chat_messages TO authenticated;
GRANT USAGE ON SEQUENCE public.chat_messages_id_seq TO authenticated;

-- Live updates for everyone with the chat open.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
                       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
    END IF;
END;
$$;
