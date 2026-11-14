-- Conservative call quotas, not a currency budget or a durable job queue.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE public.ai_generation_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  enabled boolean NOT NULL DEFAULT false,
  global_daily_limit integer NOT NULL DEFAULT 20 CHECK (global_daily_limit BETWEEN 0 AND 100),
  story_daily_limit integer NOT NULL DEFAULT 3 CHECK (story_daily_limit BETWEEN 0 AND 10),
  enhance_daily_limit integer NOT NULL DEFAULT 10 CHECK (enhance_daily_limit BETWEEN 0 AND 30)
);
INSERT INTO public.ai_generation_settings (id) VALUES (true);
CREATE TABLE public.ai_request_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation text NOT NULL CHECK (operation IN ('generate-story', 'enhance-plot')),
  request_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, request_key)
);
CREATE INDEX ai_requests_created_at ON public.ai_request_reservations (created_at);
CREATE INDEX ai_requests_user_created_at ON public.ai_request_reservations (user_id, created_at);
ALTER TABLE public.ai_generation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_request_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_generation_settings, public.ai_request_reservations FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.reserve_ai_request(p_operation text, p_request_key uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  caller uuid := auth.uid();
  settings public.ai_generation_settings%ROWTYPE;
  cutoff timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  per_user_limit integer;
BEGIN
  IF caller IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = caller AND is_banned = false
  ) THEN
    RAISE EXCEPTION 'Account not authorized' USING ERRCODE = '42501';
  END IF;
  IF p_operation NOT IN ('generate-story', 'enhance-plot') OR p_operation IS NULL OR p_request_key IS NULL THEN
    RAISE EXCEPTION 'Invalid reservation' USING ERRCODE = '22023';
  END IF;
  -- Serialize reservations across users: the global cap cannot race.
  PERFORM pg_advisory_xact_lock(724612031);
  SELECT * INTO settings FROM public.ai_generation_settings WHERE id = true FOR SHARE;
  IF NOT FOUND OR NOT settings.enabled THEN RETURN 'disabled'; END IF;
  IF EXISTS (SELECT 1 FROM public.ai_request_reservations WHERE user_id = caller AND request_key = p_request_key) THEN
    RETURN 'duplicate';
  END IF;
  per_user_limit := CASE WHEN p_operation = 'generate-story' THEN settings.story_daily_limit ELSE settings.enhance_daily_limit END;
  IF (SELECT count(*) FROM public.ai_request_reservations WHERE created_at >= cutoff) >= settings.global_daily_limit
    OR (SELECT count(*) FROM public.ai_request_reservations WHERE user_id = caller AND operation = p_operation AND created_at >= cutoff) >= per_user_limit THEN
    RETURN 'limited';
  END IF;
  INSERT INTO public.ai_request_reservations (user_id, operation, request_key) VALUES (caller, p_operation, p_request_key);
  RETURN 'reserved';
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_ai_request(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_ai_request(text, uuid) TO authenticated;
COMMIT;
