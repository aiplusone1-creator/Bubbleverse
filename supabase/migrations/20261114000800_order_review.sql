BEGIN;

-- No browser policy grants access to this bucket. Uploads stay disabled until
-- trusted content validation and asset registration are available.
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-child-photos', 'order-child-photos', false);

CREATE FUNCTION public.get_story_order(p_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE
  caller uuid := public.require_order_account();
  saved public.story_orders%ROWTYPE;
  staff_access boolean;
  result jsonb;
BEGIN
  SELECT * INTO saved FROM public.story_orders WHERE id = p_order_id;
  staff_access := public.is_order_staff() AND
    (public.is_admin(caller) OR saved.assigned_operator_id IS NOT DISTINCT FROM caller);
  IF NOT FOUND OR (saved.customer_id IS DISTINCT FROM caller AND NOT staff_access) THEN
    RAISE EXCEPTION 'Order not found' USING ERRCODE = 'PT404';
  END IF;
  result := jsonb_build_object('id', saved.id, 'reference', saved.reference,
    'country', saved.country, 'currency', saved.currency, 'format', saved.format, 'language', saved.language,
    'status', saved.status, 'paymentStatus', saved.payment_status, 'generationStatus', saved.generation_status,
    'fulfillmentStatus', saved.fulfillment_status, 'childFirstName', saved.child_first_name,
    'shippingAddress', saved.shipping_address, 'correctionRequest', saved.correction_request,
    'priceVersion', saved.price_version, 'totalMinor', saved.total_minor, 'depositMinor', saved.deposit_minor,
    'createdAt', saved.created_at, 'updatedAt', saved.updated_at);
  IF staff_access THEN
    result := result || jsonb_build_object('assignedOperatorId', saved.assigned_operator_id,
      'internalNotes', saved.internal_notes);
  END IF;
  RETURN result;
END;
$$;

CREATE FUNCTION public.request_order_correction(p_order_id uuid, p_message text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE caller uuid := public.require_order_account();
BEGIN
  IF NOT public.is_order_staff() THEN
    RAISE EXCEPTION 'Staff required' USING ERRCODE = '42501';
  END IF;
  IF p_message IS NULL OR char_length(btrim(p_message)) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Invalid correction message' USING ERRCODE = '22023';
  END IF;
  UPDATE public.story_orders SET status = 'needs_customer_update', correction_request = btrim(p_message), updated_at = now()
  WHERE id = p_order_id AND (public.is_admin(caller) OR assigned_operator_id = caller)
    AND status IN ('whatsapp_inquiry', 'pending_deposit', 'paid_pending_review');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Correction unavailable' USING ERRCODE = 'PT409';
  END IF;
  INSERT INTO public.story_order_events(order_id, actor_id, event_type) VALUES (p_order_id, caller, 'correction_requested');
END;
$$;

CREATE FUNCTION public.correct_story_order(p_order_id uuid, p_child_first_name text, p_shipping_address text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE caller uuid := public.require_order_account();
BEGIN
  UPDATE public.story_orders SET child_first_name = btrim(p_child_first_name), shipping_address = btrim(p_shipping_address),
    status = CASE payment_status WHEN 'paid' THEN 'paid_pending_review' ELSE 'whatsapp_inquiry' END,
    correction_request = NULL, updated_at = now()
  WHERE id = p_order_id AND customer_id = caller AND status = 'needs_customer_update';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Correction unavailable' USING ERRCODE = 'PT409';
  END IF;
  INSERT INTO public.story_order_events(order_id, actor_id, event_type) VALUES (p_order_id, caller, 'correction_submitted');
END;
$$;

REVOKE ALL ON FUNCTION public.get_story_order(uuid), public.request_order_correction(uuid, text),
  public.correct_story_order(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_story_order(uuid), public.request_order_correction(uuid, text),
  public.correct_story_order(uuid, text, text) TO authenticated;

COMMIT;
