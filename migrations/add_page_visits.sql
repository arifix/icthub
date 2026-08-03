-- Visitor analytics: tracks page views with IP, country, city, user agent
CREATE TABLE IF NOT EXISTS public.page_visits (
    id          bigserial    PRIMARY KEY,
    created_at  timestamptz  NOT NULL DEFAULT now(),
    page        text         NOT NULL,
    ip_address  text,
    country     text,
    city        text,
    user_agent  text,
    referrer    text,
    session_id  text         -- groups visits within a single browser session
);

CREATE INDEX IF NOT EXISTS idx_page_visits_created_at ON public.page_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_visits_page       ON public.page_visits(page);
CREATE INDEX IF NOT EXISTS idx_page_visits_country    ON public.page_visits(country);
CREATE INDEX IF NOT EXISTS idx_page_visits_session    ON public.page_visits(session_id);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "page_visits_insert"     ON public.page_visits;
DROP POLICY IF EXISTS "page_visits_admin_read" ON public.page_visits;

-- any visitor (including anonymous) can record a page view
CREATE POLICY "page_visits_insert"
    ON public.page_visits FOR INSERT WITH CHECK (true);

-- only authenticated users (admin) can read
CREATE POLICY "page_visits_admin_read"
    ON public.page_visits FOR SELECT TO authenticated USING (true);
