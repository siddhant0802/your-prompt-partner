ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING','PAYMENT_PROCESSING','PAID','PAYMENT_FAILED','CANCELLED','REFUNDED'));
ALTER TABLE public.orders ADD COLUMN currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR');
ALTER TABLE public.orders ADD COLUMN gateway text NOT NULL DEFAULT 'razorpay';
ALTER TABLE public.orders ADD COLUMN gateway_order_id text UNIQUE;
ALTER TABLE public.orders ADD COLUMN gateway_payment_id text UNIQUE;
ALTER TABLE public.orders ADD COLUMN failure_reason text;
ALTER TABLE public.orders ADD COLUMN verified_at timestamptz;
COMMENT ON COLUMN public.orders.payment_reference IS 'DEPRECATED: replaced by gateway_payment_id';
-- At most one paid purchase per customer and project: repeated events can never create a second entitlement.
CREATE UNIQUE INDEX orders_one_paid_per_user_project ON public.orders(user_id, project_id) WHERE status = 'PAID';
CREATE INDEX orders_status_idx ON public.orders(status, created_at DESC);

CREATE TABLE public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  gateway_order_id text,
  gateway_payment_id text,
  amount_paise bigint,
  outcome text NOT NULL DEFAULT 'received',
  received_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.payment_events IS 'Verified gateway webhook events; unique event id makes processing idempotent. No card data stored.';
GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read payment events" ON public.payment_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.download_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  project_file_id uuid REFERENCES public.project_files(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX download_logs_order_idx ON public.download_logs(order_id, created_at DESC);
GRANT SELECT ON public.download_logs TO authenticated;
GRANT ALL ON public.download_logs TO service_role;
ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read own downloads" ON public.download_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read downloads" ON public.download_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.orders TO service_role;
GRANT INSERT ON public.audit_logs TO service_role;