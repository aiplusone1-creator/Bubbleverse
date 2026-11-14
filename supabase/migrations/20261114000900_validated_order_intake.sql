BEGIN;

ALTER TABLE public.story_orders
  ADD COLUMN story_configuration jsonb,
  ADD COLUMN intake_fingerprint bytea;

-- A restrictive policy also protects against permissive policies added elsewhere.
CREATE POLICY block_order_photo_client_access ON storage.objects AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (bucket_id IS DISTINCT FROM 'order-child-photos')
  WITH CHECK (bucket_id IS DISTINCT FROM 'order-child-photos');

CREATE FUNCTION public.validate_order_story(p_story jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  item jsonb;
  field text;
  field_limit integer;
  has_hero boolean := false;
BEGIN
  PERFORM public.require_order_account();
  IF p_story IS NULL OR octet_length(p_story::text) > 16000
    OR jsonb_typeof(p_story) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid story configuration' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT FROM jsonb_object_keys(p_story) AS k(key) WHERE key NOT IN (
    'storyLength', 'storyFormat', 'artStyle', 'customArtStyle', 'plotMode', 'customPlot', 'characters', 'interests'
  )) THEN
    RAISE EXCEPTION 'Unexpected story field' USING ERRCODE = '22023';
  END IF;
  FOR field, field_limit IN SELECT * FROM (VALUES
    ('storyLength', 20), ('storyFormat', 20), ('artStyle', 50), ('customArtStyle', 300),
    ('plotMode', 20), ('customPlot', 3000)
  ) AS limits(key, max_chars) LOOP
    IF jsonb_typeof(p_story->field) IS DISTINCT FROM 'string' OR
      char_length(p_story->>field) > field_limit THEN
      RAISE EXCEPTION 'Invalid story field' USING ERRCODE = '22023';
    END IF;
  END LOOP;
  IF p_story->>'storyLength' NOT IN ('short', 'medium', 'epic')
    OR p_story->>'storyFormat' NOT IN ('comic', 'storyboard')
    OR p_story->>'artStyle' NOT IN ('disney', 'pixar', 'watercolor', 'anime', 'realistic', 'comic', 'pastel', 'horror', 'custom')
    OR p_story->>'plotMode' NOT IN ('auto', 'manual')
    OR (p_story->>'artStyle' = 'custom' AND p_story->>'customArtStyle' !~ '[^[:space:]]')
    OR (p_story->>'plotMode' = 'manual' AND p_story->>'customPlot' !~ '[^[:space:]]') THEN
    RAISE EXCEPTION 'Invalid story options' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_story->'characters') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_story->'interests') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid story collections' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_story->'characters') NOT BETWEEN 1 AND 6
    OR jsonb_array_length(p_story->'interests') > 10 THEN
    RAISE EXCEPTION 'Invalid story collection size' USING ERRCODE = '22023';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_story->'characters') LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'Invalid character' USING ERRCODE = '22023';
    END IF;
    IF item - ARRAY['name', 'role'] <> '{}'::jsonb
      OR jsonb_typeof(item->'name') IS DISTINCT FROM 'string'
      OR item->>'name' !~ '[^[:space:]]' OR char_length(item->>'name') > 80
      OR jsonb_typeof(item->'role') IS DISTINCT FROM 'string'
      OR item->>'role' NOT IN ('hero', 'parent', 'pet', 'friend') THEN
      RAISE EXCEPTION 'Invalid character fields' USING ERRCODE = '22023';
    END IF;
    has_hero := has_hero OR item->>'role' = 'hero';
  END LOOP;
  IF NOT has_hero THEN
    RAISE EXCEPTION 'A hero is required' USING ERRCODE = '22023';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_story->'interests') LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'string'
      OR item#>>'{}' !~ '[^[:space:]]' OR char_length(item#>>'{}') > 80 THEN
      RAISE EXCEPTION 'Invalid interest' USING ERRCODE = '22023';
    END IF;
  END LOOP;
  RETURN p_story;
END;
$$;

CREATE FUNCTION public.submit_story_inquiry(
  p_request_key uuid, p_country text, p_format text, p_language text,
  p_child_first_name text, p_shipping_address text, p_story jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  caller uuid := public.require_order_account();
  saved public.story_orders%ROWTYPE;
  quote jsonb;
  fingerprint bytea;
BEGIN
  PERFORM public.validate_order_story(p_story);
  IF p_request_key IS NULL OR p_language IS NULL OR p_language NOT IN ('ar', 'en')
    OR p_child_first_name IS NULL OR p_child_first_name !~ '[^[:space:]]'
    OR char_length(btrim(p_child_first_name)) > 80
    OR (p_format = 'digital_pdf' AND p_shipping_address IS NOT NULL)
    OR (p_format = 'hardcopy_book' AND (p_shipping_address IS NULL
      OR p_shipping_address !~ '[^[:space:]]' OR char_length(btrim(p_shipping_address)) > 500)) THEN
    RAISE EXCEPTION 'Invalid order details' USING ERRCODE = '22023';
  END IF;
  quote := public.get_story_order_quote(p_country, p_format);
  fingerprint := sha256(convert_to(jsonb_build_array(p_country, p_format, p_language,
    btrim(p_child_first_name), btrim(p_shipping_address), p_story)::text, 'UTF8'));
  INSERT INTO public.story_orders(customer_id, request_key, country, format, language, child_first_name,
    shipping_address, price_version, total_minor, deposit_minor, story_configuration, intake_fingerprint)
  VALUES (caller, p_request_key, p_country, p_format, p_language, btrim(p_child_first_name),
    btrim(p_shipping_address), (quote->>'version')::integer, (quote->>'totalMinor')::integer,
    (quote->>'depositMinor')::integer, p_story, fingerprint)
  ON CONFLICT (customer_id, request_key) DO NOTHING RETURNING * INTO saved;
  IF FOUND THEN
    INSERT INTO public.story_order_events(order_id, actor_id, event_type) VALUES (saved.id, caller, 'inquiry_created');
  ELSE
    SELECT * INTO STRICT saved FROM public.story_orders WHERE customer_id = caller AND request_key = p_request_key;
    IF saved.intake_fingerprint IS DISTINCT FROM fingerprint THEN
      RAISE EXCEPTION 'Request key already used' USING ERRCODE = 'PT409';
    END IF;
  END IF;
  RETURN jsonb_build_object('id', saved.id, 'reference', saved.reference, 'status', saved.status,
    'country', saved.country, 'format', saved.format, 'currency', saved.currency);
END;
$$;

CREATE FUNCTION public.resume_story_inquiry(p_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  caller uuid := public.require_order_account();
  saved public.story_orders%ROWTYPE;
BEGIN
  SELECT * INTO saved FROM public.story_orders WHERE id = p_order_id AND customer_id = caller;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found' USING ERRCODE = 'PT404'; END IF;
  RETURN (public.get_story_order(p_order_id) - ARRAY['assignedOperatorId', 'internalNotes'])
    || jsonb_build_object('story', saved.story_configuration,
       'editable', saved.status = 'needs_customer_update', 'photoUploadEnabled', false);
END;
$$;

CREATE FUNCTION public.update_story_inquiry(
  p_order_id uuid, p_expected_updated_at timestamptz, p_child_first_name text,
  p_shipping_address text, p_story jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  caller uuid := public.require_order_account();
  saved public.story_orders%ROWTYPE;
BEGIN
  PERFORM public.validate_order_story(p_story);
  SELECT * INTO saved FROM public.story_orders WHERE id = p_order_id AND customer_id = caller FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found' USING ERRCODE = 'PT404'; END IF;
  IF saved.status <> 'needs_customer_update' OR saved.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'Correction unavailable or stale' USING ERRCODE = 'PT409';
  END IF;
  IF p_child_first_name IS NULL OR p_child_first_name !~ '[^[:space:]]'
    OR char_length(btrim(p_child_first_name)) > 80
    OR (saved.format = 'digital_pdf' AND p_shipping_address IS NOT NULL)
    OR (saved.format = 'hardcopy_book' AND (p_shipping_address IS NULL
      OR p_shipping_address !~ '[^[:space:]]' OR char_length(btrim(p_shipping_address)) > 500)) THEN
    RAISE EXCEPTION 'Invalid correction details' USING ERRCODE = '22023';
  END IF;
  UPDATE public.story_orders SET child_first_name = btrim(p_child_first_name),
    shipping_address = btrim(p_shipping_address), story_configuration = p_story,
    status = CASE WHEN payment_status = 'paid' THEN 'paid_pending_review' ELSE 'whatsapp_inquiry' END,
    correction_request = NULL, updated_at = clock_timestamp()
  WHERE id = p_order_id;
  INSERT INTO public.story_order_events(order_id, actor_id, event_type) VALUES (p_order_id, caller, 'correction_submitted');
  RETURN public.resume_story_inquiry(p_order_id);
END;
$$;

-- Retire the preliminary customer write contracts, which lack story validation.
REVOKE EXECUTE ON FUNCTION public.create_story_inquiry(uuid, text, text, text, text, text),
  public.correct_story_order(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_order_story(jsonb),
  public.submit_story_inquiry(uuid, text, text, text, text, text, jsonb),
  public.resume_story_inquiry(uuid),
  public.update_story_inquiry(uuid, timestamptz, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_order_story(jsonb),
  public.submit_story_inquiry(uuid, text, text, text, text, text, jsonb),
  public.resume_story_inquiry(uuid),
  public.update_story_inquiry(uuid, timestamptz, text, text, jsonb) TO authenticated;

COMMIT;
