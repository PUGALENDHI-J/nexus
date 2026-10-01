-- ============================================================
-- Saran Tours & Travels — Supabase Database Schema
-- Run this entire script in Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. CAB SERVICES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cab_services (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT        NOT NULL,
  type         TEXT        NOT NULL DEFAULT 'Sedan',
  price        NUMERIC     NOT NULL DEFAULT 12,
  availability TEXT        NOT NULL DEFAULT 'Available',
  image        TEXT                 DEFAULT 'images/sedan.png',
  created_at   TIMESTAMPTZ          DEFAULT NOW(),
  updated_at   TIMESTAMPTZ          DEFAULT NOW()
);

-- Seed default cabs
INSERT INTO public.cab_services (name, type, price, availability, image) VALUES
  ('Premium Hatchback', 'Hatchback', 9,  'Available', 'images/hatchback.png'),
  ('Executive Sedan',   'Sedan',     12, 'Available', 'images/sedan.png'),
  ('Luxury SUV',        'SUV',       16, 'Available', 'images/suv_premium.png'),
  ('Tempo Traveller',   'Tempo',     20, 'Available', 'images/tempo.png')
ON CONFLICT DO NOTHING;

-- RLS: public read, authenticated write
ALTER TABLE public.cab_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cabs"
  ON public.cab_services FOR SELECT USING (true);
CREATE POLICY "Auth write cabs"
  ON public.cab_services FOR ALL
  USING (auth.role() = 'authenticated');

-- ── 2. BOOKINGS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id          BIGSERIAL PRIMARY KEY,
  pickup      TEXT,
  drop        TEXT,
  travel_date TEXT,
  travel_time TEXT,
  return_date TEXT,
  car_type    TEXT,
  passengers  TEXT,
  luggage     TEXT,
  name        TEXT,
  phone       TEXT,
  email       TEXT,
  notes       TEXT,
  payment     TEXT,
  trip_type   TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ          DEFAULT NOW()
);

-- RLS: public insert (customers), authenticated full access (admin)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert bookings"
  ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth manage bookings"
  ON public.bookings FOR ALL
  USING (auth.role() = 'authenticated');

-- ── 3. CONTACT MESSAGES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT,
  phone      TEXT,
  email      TEXT,
  subject    TEXT,
  message    TEXT,
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ          DEFAULT NOW()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert messages"
  ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth manage messages"
  ON public.contact_messages FOR ALL
  USING (auth.role() = 'authenticated');

-- ── 4. TOUR PACKAGES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tour_packages (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  duration    TEXT,
  price       NUMERIC,
  description TEXT,
  image       TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ          DEFAULT NOW(),
  updated_at  TIMESTAMPTZ          DEFAULT NOW()
);

ALTER TABLE public.tour_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tours"
  ON public.tour_packages FOR SELECT USING (true);
CREATE POLICY "Auth manage tours"
  ON public.tour_packages FOR ALL
  USING (auth.role() = 'authenticated');

-- ── 5. TESTIMONIALS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testimonials (
  id          BIGSERIAL PRIMARY KEY,
  author_name TEXT        NOT NULL,
  rating      INTEGER     NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT        NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ          DEFAULT NOW()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read testimonials"
  ON public.testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Auth manage testimonials"
  ON public.testimonials FOR ALL
  USING (auth.role() = 'authenticated');

-- ── 6. GALLERY ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT,
  image_url  TEXT        NOT NULL,
  alt_text   TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ          DEFAULT NOW()
);

ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read gallery"
  ON public.gallery FOR SELECT USING (is_active = true);
CREATE POLICY "Auth manage gallery"
  ON public.gallery FOR ALL
  USING (auth.role() = 'authenticated');

-- ── 7. WEBSITE CONTENT (key-value store) ──────────────────────
CREATE TABLE IF NOT EXISTS public.website_content (
  key        TEXT        PRIMARY KEY,
  value      TEXT        NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ          DEFAULT NOW()
);

-- Seed default content keys
INSERT INTO public.website_content (key, value) VALUES
  ('hero_title',            'Your Trusted Travel Partner'),
  ('hero_subtitle',         'Safe · Reliable · Affordable cab services across South India'),
  ('about_description',     'Saran Tours & Travels has been serving South India since 2010. We offer premium cab services for all your travel needs.'),
  ('contact_phone',         '+91 89403 87531'),
  ('contact_email',         'dccabsandtours@gmail.com'),
  ('contact_address',       'Dindigul, Tamil Nadu, India'),
  ('whatsapp_number',       '918940387531'),
  ('footer_tagline',        'Your journey, our responsibility')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.website_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read content"
  ON public.website_content FOR SELECT USING (true);
CREATE POLICY "Auth manage content"
  ON public.website_content FOR ALL
  USING (auth.role() = 'authenticated');

-- ── 8. ENABLE REALTIME ────────────────────────────────────────
-- Run these in Dashboard → Database → Replication, or via SQL:
-- (Supabase may require toggling via the UI instead)

-- ALTER PUBLICATION supabase_realtime ADD TABLE public.cab_services;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;

-- ── 9. UPDATED_AT TRIGGER (optional but recommended) ──────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cab_services_updated_at
  BEFORE UPDATE ON public.cab_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tour_packages_updated_at
  BEFORE UPDATE ON public.tour_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER website_content_updated_at
  BEFORE UPDATE ON public.website_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
