CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  amount_paise bigint NOT NULL CHECK (amount_paise >= 0),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','FAILED','REFUNDED','CANCELLED')),
  payment_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
COMMENT ON TABLE public.orders IS 'Customer purchases. Rows are written only by trusted server code (Phase 4 payment verification); clients may only read their own.';
CREATE INDEX orders_user_idx ON public.orders(user_id, created_at DESC);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Only image file extensions may be uploaded to the image bucket.
DROP POLICY IF EXISTS "Admins upload project images" ON storage.objects;
CREATE POLICY "Admins upload project images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin')
    AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp'));
DROP POLICY IF EXISTS "Admins update project images" ON storage.objects;
CREATE POLICY "Admins update project images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin')
    AND lower(storage.extension(name)) IN ('jpg','jpeg','png','webp'));