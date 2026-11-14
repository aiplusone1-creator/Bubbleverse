BEGIN;

CREATE FUNCTION public.get_story_order_quote(p_country text, p_format text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE price public.order_prices%ROWTYPE;
BEGIN
  PERFORM public.require_order_account();
  IF p_country IS NULL OR p_country NOT IN ('EG', 'SA') OR
    p_format IS NULL OR p_format NOT IN ('digital_pdf', 'hardcopy_book') THEN
    RAISE EXCEPTION 'Invalid quote options' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO price FROM public.order_prices WHERE country = p_country AND format = p_format
  ORDER BY version DESC LIMIT 1;
  RETURN jsonb_build_object('currency', CASE p_country WHEN 'EG' THEN 'EGP' ELSE 'SAR' END,
    'version', price.version, 'totalMinor', price.total_minor, 'depositMinor', price.deposit_minor,
    'checkoutEnabled', false);
END;
$$;

CREATE FUNCTION public.create_story_inquiry(
  p_request_key uuid, p_country text, p_format text, p_language text, p_child_first_name text, p_shipping_address text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  caller uuid := public.require_order_account();
  saved public.story_orders%ROWTYPE;
  quote jsonb;
BEGIN
  IF p_request_key IS NULL OR p_language IS NULL OR p_language NOT IN ('ar', 'en')
    OR p_child_first_name IS NULL OR char_length(btrim(p_child_first_name)) NOT BETWEEN 1 AND 80
    OR (p_format = 'digital_pdf' AND p_shipping_address IS NOT NULL)
    OR (p_format = 'hardcopy_book' AND (p_shipping_address IS NULL OR
      char_length(btrim(p_shipping_address)) NOT BETWEEN 1 AND 500)) THEN
    RAISE EXCEPTION 'Invalid order details' USING ERRCODE = '22023';
  END IF;
  quote := public.get_story_order_quote(p_country, p_format);
  INSERT INTO public.story_orders(customer_id, request_key, country, format, language, child_first_name,
    shipping_address, price_version, total_minor, deposit_minor)
  VALUES (caller, p_request_key, p_country, p_format, p_language, btrim(p_child_first_name),
    btrim(p_shipping_address), (quote->>'version')::integer,
    (quote->>'totalMinor')::integer, (quote->>'depositMinor')::integer)
  ON CONFLICT (customer_id, request_key) DO NOTHING RETURNING * INTO saved;
  IF FOUND THEN
    INSERT INTO public.story_order_events(order_id, actor_id, event_type) VALUES (saved.id, caller, 'inquiry_created');
  ELSE
    SELECT * INTO STRICT saved FROM public.story_orders WHERE customer_id = caller AND request_key = p_request_key;
    IF (saved.country, saved.format, saved.language, saved.child_first_name, saved.shipping_address)
      IS DISTINCT FROM (p_country, p_format, p_language, btrim(p_child_first_name), btrim(p_shipping_address)) THEN
      RAISE EXCEPTION 'Request key already used' USING ERRCODE = 'PT409';
    END IF;
  END IF;
  RETURN jsonb_build_object('id', saved.id, 'reference', saved.reference, 'status', saved.status,
    'country', saved.country, 'format', saved.format, 'currency', saved.currency);
END;
$$;

CREATE FUNCTION public.list_story_orders(p_before timestamptz DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE caller uuid := public.require_order_account();
BEGIN
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(summary) ORDER BY summary.created_at DESC, summary.id DESC)
    FROM (SELECT id, reference, country, format, status, payment_status, generation_status, fulfillment_status,
                 correction_request, created_at
          FROM public.story_orders WHERE customer_id = caller AND (p_before IS NULL OR created_at < p_before)
          ORDER BY created_at DESC, id DESC LIMIT 50) summary), '[]'::jsonb);
END;
$$;

CREATE FUNCTION public.list_order_queue()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE caller uuid := public.require_order_account();
BEGIN
  IF NOT public.is_order_staff() THEN
    RAISE EXCEPTION 'Staff required' USING ERRCODE = '42501';
  END IF;
  RETURN coalesce((SELECT jsonb_agg(to_jsonb(summary) ORDER BY summary.created_at, summary.id)
    FROM (SELECT id, reference, country, format, status, assigned_operator_id, created_at
          FROM public.story_orders WHERE public.is_admin(caller) OR assigned_operator_id = caller OR
            (assigned_operator_id IS NULL AND status IN ('whatsapp_inquiry', 'pending_deposit', 'paid_pending_review'))
          ORDER BY created_at, id LIMIT 100) summary), '[]'::jsonb);
END;
$$;

CREATE FUNCTION public.submit_b2b_inquiry(
  p_institution text, p_contact_name text, p_contact_email text, p_contact_phone text,
  p_country text, p_format text, p_language text, p_quantity integer, p_notes text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  caller uuid := public.require_order_account();
  inquiry_id uuid;
BEGIN
  INSERT INTO public.b2b_inquiries(customer_id, institution, contact_name, contact_email, contact_phone,
    country, format, language, quantity, notes)
  VALUES (caller, btrim(p_institution), btrim(p_contact_name), btrim(p_contact_email), btrim(p_contact_phone),
    p_country, p_format, p_language, p_quantity, btrim(p_notes)) RETURNING id INTO inquiry_id;
  RETURN inquiry_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_story_order_quote(text, text),
  public.create_story_inquiry(uuid, text, text, text, text, text), public.list_story_orders(timestamptz),
  public.list_order_queue(), public.submit_b2b_inquiry(text, text, text, text, text, text, text, integer, text)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_story_order_quote(text, text),
  public.create_story_inquiry(uuid, text, text, text, text, text), public.list_story_orders(timestamptz),
  public.list_order_queue(), public.submit_b2b_inquiry(text, text, text, text, text, text, text, integer, text)
TO authenticated;

COMMIT;
