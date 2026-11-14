BEGIN;

CREATE TABLE public.order_prices (
  country text NOT NULL CHECK (country IN ('EG', 'SA')),
  format text NOT NULL CHECK (format IN ('digital_pdf', 'hardcopy_book')),
  version integer NOT NULL CHECK (version > 0),
  total_minor integer NOT NULL CHECK (total_minor > 0),
  deposit_minor integer NOT NULL CHECK (deposit_minor BETWEEN 1 AND total_minor),
  PRIMARY KEY (country, format, version)
);

CREATE TABLE public.story_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('BV-' || upper(replace(gen_random_uuid()::text, '-', ''))),
  customer_id uuid NOT NULL REFERENCES auth.users(id),
  request_key uuid NOT NULL,
  country text NOT NULL CHECK (country IN ('EG', 'SA')),
  currency text GENERATED ALWAYS AS (CASE country WHEN 'EG' THEN 'EGP' ELSE 'SAR' END) STORED,
  format text NOT NULL CHECK (format IN ('digital_pdf', 'hardcopy_book')),
  language text NOT NULL CHECK (language IN ('ar', 'en')),
  status text NOT NULL DEFAULT 'whatsapp_inquiry' CHECK (status IN (
    'whatsapp_inquiry', 'pending_deposit', 'paid_pending_review', 'needs_customer_update',
    'approved_generating', 'generation_failed', 'ready_for_review', 'sent_to_print',
    'out_for_delivery', 'completed'
  )),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'verification_pending', 'paid')),
  generation_status text NOT NULL DEFAULT 'idle' CHECK (generation_status IN ('idle', 'running', 'failed', 'complete')),
  fulfillment_status text NOT NULL DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'printing', 'shipping', 'delivered')),
  price_version integer,
  total_minor integer,
  deposit_minor integer,
  child_first_name text NOT NULL CHECK (char_length(btrim(child_first_name)) BETWEEN 1 AND 80),
  shipping_address text,
  assigned_operator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  correction_request text,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, request_key),
  CHECK ((format = 'digital_pdf' AND shipping_address IS NULL) OR
    (format = 'hardcopy_book' AND shipping_address IS NOT NULL AND char_length(btrim(shipping_address)) BETWEEN 1 AND 500)),
  CHECK ((price_version IS NULL AND total_minor IS NULL AND deposit_minor IS NULL) OR
    (price_version > 0 AND total_minor > 0 AND deposit_minor BETWEEN 1 AND total_minor
     AND price_version IS NOT NULL AND total_minor IS NOT NULL AND deposit_minor IS NOT NULL))
);

CREATE TABLE public.story_order_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.story_orders(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.b2b_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id),
  institution text NOT NULL CHECK (char_length(btrim(institution)) BETWEEN 1 AND 160),
  contact_name text NOT NULL CHECK (char_length(btrim(contact_name)) BETWEEN 1 AND 120),
  contact_email text NOT NULL CHECK (char_length(contact_email) <= 254 AND contact_email ~ '^[^ @]+@[^ @]+[.][^ @]+$'),
  contact_phone text NOT NULL CHECK (contact_phone ~ '^[+][1-9][0-9]{7,14}$'),
  country text NOT NULL CHECK (country IN ('EG', 'SA')),
  format text NOT NULL CHECK (format IN ('digital_pdf', 'hardcopy_book')),
  language text NOT NULL CHECK (language IN ('ar', 'en')),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 10000),
  notes text CHECK (char_length(notes) <= 1000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'closed')),
  assigned_operator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_inquiries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.order_prices, public.story_orders, public.story_order_events, public.b2b_inquiries
  FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.require_order_account()
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE caller uuid := auth.uid();
BEGIN
  IF caller IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = caller AND is_banned = false
  ) THEN
    RAISE EXCEPTION 'Account not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN caller;
END;
$$;

CREATE FUNCTION public.is_order_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_banned = false)
    AND (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'operator'));
$$;

CREATE FUNCTION public.claim_story_order(p_order_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  caller uuid := public.require_order_account();
  claimed_id uuid;
BEGIN
  IF NOT public.has_role(caller, 'operator') THEN
    RAISE EXCEPTION 'Operator required' USING ERRCODE = '42501';
  END IF;
  UPDATE public.story_orders SET assigned_operator_id = caller, updated_at = now()
  WHERE id = p_order_id AND assigned_operator_id IS NULL AND status IN ('whatsapp_inquiry', 'pending_deposit', 'paid_pending_review')
  RETURNING id INTO claimed_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order unavailable for claim' USING ERRCODE = 'PT409';
  END IF;
  INSERT INTO public.story_order_events(order_id, actor_id, event_type) VALUES (claimed_id, caller, 'claimed');
  RETURN claimed_id;
END;
$$;

CREATE FUNCTION public.assign_story_order(p_order_id uuid, p_operator_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE caller uuid := public.require_order_account();
BEGIN
  IF NOT public.is_admin(caller) THEN
    RAISE EXCEPTION 'Administrator required' USING ERRCODE = '42501';
  END IF;
  IF p_operator_id IS NULL OR NOT public.has_role(p_operator_id, 'operator') OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = p_operator_id AND is_banned = false
  ) THEN
    RAISE EXCEPTION 'Ineligible operator' USING ERRCODE = '22023';
  END IF;
  UPDATE public.story_orders SET assigned_operator_id = p_operator_id, updated_at = now()
  WHERE id = p_order_id AND status IN ('whatsapp_inquiry', 'pending_deposit', 'paid_pending_review',
    'needs_customer_update', 'generation_failed', 'ready_for_review');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order unavailable for assignment' USING ERRCODE = 'PT409';
  END IF;
  INSERT INTO public.story_order_events(order_id, actor_id, event_type) VALUES (p_order_id, caller, 'assigned');
  RETURN p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.require_order_account() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_order_staff(), public.claim_story_order(uuid), public.assign_story_order(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_order_staff(), public.claim_story_order(uuid), public.assign_story_order(uuid, uuid) TO authenticated;

COMMIT;
