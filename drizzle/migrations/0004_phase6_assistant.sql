CREATE TABLE public.assistant_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  daily_limit_per_visitor int NOT NULL DEFAULT 30 CHECK (daily_limit_per_visitor BETWEEN 1 AND 1000),
  max_message_chars int NOT NULL DEFAULT 1000 CHECK (max_message_chars BETWEEN 50 AND 4000),
  support_contact text NOT NULL DEFAULT 'the Contact Us page',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.assistant_settings TO authenticated;
GRANT ALL ON public.assistant_settings TO service_role;
ALTER TABLE public.assistant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read assistant settings" ON public.assistant_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update assistant settings" ON public.assistant_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.assistant_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Counts only; no message content is stored. visitor_hash is a salted hash, never a raw IP.
CREATE TABLE public.assistant_usage (
  visitor_hash text NOT NULL,
  day date NOT NULL DEFAULT current_date,
  messages int NOT NULL DEFAULT 0,
  errors int NOT NULL DEFAULT 0,
  PRIMARY KEY (visitor_hash, day)
);
GRANT SELECT ON public.assistant_usage TO authenticated;
GRANT ALL ON public.assistant_usage TO service_role;
ALTER TABLE public.assistant_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read assistant usage" ON public.assistant_usage FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.assistant_take_quota(_visitor text, _limit int)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  INSERT INTO public.assistant_usage (visitor_hash, day, messages) VALUES (_visitor, current_date, 1)
  ON CONFLICT (visitor_hash, day) DO UPDATE SET messages = assistant_usage.messages + 1
  RETURNING messages INTO n;
  RETURN n <= _limit;
END $$;
REVOKE ALL ON FUNCTION public.assistant_take_quota(text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assistant_take_quota(text, int) TO service_role;