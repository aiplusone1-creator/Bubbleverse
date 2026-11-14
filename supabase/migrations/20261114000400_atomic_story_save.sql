-- Additive text-story persistence. No hosted data repair or provider calls.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

ALTER TABLE public.stories ADD COLUMN config_snapshot jsonb;
ALTER TABLE public.stories ADD CONSTRAINT stories_config_snapshot_object
  CHECK (config_snapshot IS NULL OR jsonb_typeof(config_snapshot) = 'object');

-- Private idempotency receipts survive story deletion as tombstones. A repeated
-- request must not silently recreate a book the owner deliberately deleted.
CREATE TABLE public.story_save_requests (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_key uuid NOT NULL,
  payload_hash bytea NOT NULL CHECK (octet_length(payload_hash) = 32),
  story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, request_key)
);
CREATE INDEX story_save_requests_story_id_idx ON public.story_save_requests (story_id);
ALTER TABLE public.story_save_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.story_save_requests FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.save_generated_story(
  p_expected_owner uuid,
  p_request_key uuid,
  p_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  caller uuid := auth.uid();
  banned boolean;
  config jsonb;
  book jsonb;
  item jsonb;
  field text;
  max_length integer;
  page_count integer;
  min_pages integer;
  max_pages integer;
  page_index integer := 0;
  has_hero boolean := false;
  fingerprint bytea;
  previous public.story_save_requests%ROWTYPE;
  saved_id uuid;
BEGIN
  -- The expected owner is a race check, never authority to write as that user.
  IF caller IS NULL OR p_expected_owner IS DISTINCT FROM caller THEN
    RAISE EXCEPTION 'Account not authorized' USING ERRCODE = '42501';
  END IF;
  SELECT is_banned INTO banned FROM public.profiles WHERE user_id = caller FOR SHARE;
  IF NOT FOUND OR banned IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Account not authorized' USING ERRCODE = '42501';
  END IF;
  IF p_request_key IS NULL OR p_payload IS NULL OR octet_length(p_payload::text) > 1048576
    OR jsonb_typeof(p_payload) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid story save request' USING ERRCODE = '22023';
  END IF;
  IF NOT (p_payload ?& ARRAY['config', 'story']) OR EXISTS (
    SELECT 1 FROM jsonb_object_keys(p_payload) AS fields(key) WHERE key NOT IN ('config', 'story')
  ) THEN
    RAISE EXCEPTION 'Invalid story save request' USING ERRCODE = '22023';
  END IF;
  config := p_payload->'config';
  book := p_payload->'story';
  IF jsonb_typeof(config) IS DISTINCT FROM 'object' OR jsonb_typeof(book) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid story configuration' USING ERRCODE = '22023';
  END IF;
  IF NOT (config ?& ARRAY['storyLength', 'format', 'artStyle', 'customArtStyle', 'language', 'characters', 'interests', 'plotMode', 'customPlot'])
    OR EXISTS (SELECT 1 FROM jsonb_object_keys(config) AS fields(key)
      WHERE key <> ALL (ARRAY['storyLength', 'format', 'artStyle', 'customArtStyle', 'language', 'characters', 'interests', 'plotMode', 'customPlot']))
    OR NOT (book ?& ARRAY['title', 'pages'])
    OR EXISTS (SELECT 1 FROM jsonb_object_keys(book) AS fields(key) WHERE key NOT IN ('title', 'pages')) THEN
    RAISE EXCEPTION 'Invalid story fields' USING ERRCODE = '22023';
  END IF;
  FOR field, max_length IN SELECT * FROM (VALUES
    ('storyLength', 20), ('format', 20), ('artStyle', 50), ('customArtStyle', 300),
    ('language', 10), ('plotMode', 20), ('customPlot', 3000)
  ) AS limits(key, max_chars) LOOP
    IF jsonb_typeof(config->field) IS DISTINCT FROM 'string' OR char_length(config->>field) > max_length THEN
      RAISE EXCEPTION 'Invalid story field' USING ERRCODE = '22023';
    END IF;
  END LOOP;
  IF config->>'storyLength' NOT IN ('short', 'medium', 'epic')
    OR config->>'format' NOT IN ('comic', 'storyboard')
    OR config->>'artStyle' NOT IN ('disney', 'pixar', 'watercolor', 'anime', 'realistic', 'comic', 'pastel', 'horror', 'custom')
    OR config->>'language' NOT IN ('ar', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'hi', 'tr', 'nl', 'pl', 'sv', 'id', 'th', 'vi', 'he')
    OR config->>'plotMode' NOT IN ('auto', 'manual')
    OR (config->>'artStyle' = 'custom' AND btrim(config->>'customArtStyle') = '')
    OR (config->>'plotMode' = 'manual' AND btrim(config->>'customPlot') = '') THEN
    RAISE EXCEPTION 'Invalid story options' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(config->'characters') IS DISTINCT FROM 'array'
    OR jsonb_typeof(config->'interests') IS DISTINCT FROM 'array'
    OR jsonb_typeof(book->'pages') IS DISTINCT FROM 'array'
    OR jsonb_typeof(book->'title') IS DISTINCT FROM 'string' THEN
    RAISE EXCEPTION 'Invalid story collections' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(config->'characters') NOT BETWEEN 1 AND 6
    OR jsonb_array_length(config->'interests') > 10
    OR (btrim(book->>'title') = '' OR char_length(book->>'title') > 255) THEN
    RAISE EXCEPTION 'Invalid story collection size' USING ERRCODE = '22023';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(config->'characters') LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'Invalid character' USING ERRCODE = '22023';
    END IF;
    IF NOT (item ?& ARRAY['name', 'role'])
      OR EXISTS (SELECT 1 FROM jsonb_object_keys(item) AS fields(key) WHERE key NOT IN ('name', 'role'))
      OR jsonb_typeof(item->'name') IS DISTINCT FROM 'string'
      OR (btrim(item->>'name') = '' OR char_length(item->>'name') > 80)
      OR jsonb_typeof(item->'role') IS DISTINCT FROM 'string'
      OR item->>'role' NOT IN ('hero', 'parent', 'pet', 'friend') THEN
      RAISE EXCEPTION 'Invalid character fields' USING ERRCODE = '22023';
    END IF;
    has_hero := has_hero OR item->>'role' = 'hero';
  END LOOP;
  IF NOT has_hero THEN RAISE EXCEPTION 'A hero is required' USING ERRCODE = '22023'; END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(config->'interests') LOOP
    IF jsonb_typeof(item) IS DISTINCT FROM 'string' OR (btrim(item#>>'{}') = '' OR char_length(item#>>'{}') > 80) THEN
      RAISE EXCEPTION 'Invalid interest' USING ERRCODE = '22023';
    END IF;
  END LOOP;
  min_pages := CASE config->>'storyLength' WHEN 'short' THEN 8 WHEN 'medium' THEN 12 ELSE 18 END;
  max_pages := CASE config->>'storyLength' WHEN 'short' THEN 10 WHEN 'medium' THEN 18 ELSE 25 END;
  page_count := jsonb_array_length(book->'pages');
  IF page_count NOT BETWEEN min_pages AND max_pages THEN
    RAISE EXCEPTION 'Invalid page count' USING ERRCODE = '22023';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(book->'pages') LOOP
    page_index := page_index + 1;
    IF jsonb_typeof(item) IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'Invalid page' USING ERRCODE = '22023';
    END IF;
    IF NOT (item ?& ARRAY['pageNumber', 'sceneDescription', 'dialogueText', 'panelLayoutType'])
      OR EXISTS (SELECT 1 FROM jsonb_object_keys(item) AS fields(key)
        WHERE key NOT IN ('pageNumber', 'sceneDescription', 'dialogueText', 'panelLayoutType'))
      OR jsonb_typeof(item->'pageNumber') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'Invalid page fields' USING ERRCODE = '22023';
    END IF;
    IF (item->>'pageNumber')::numeric <> page_index
      OR jsonb_typeof(item->'sceneDescription') IS DISTINCT FROM 'string'
      OR (btrim(item->>'sceneDescription') = '' OR char_length(item->>'sceneDescription') > 6000)
      OR jsonb_typeof(item->'dialogueText') IS DISTINCT FROM 'string'
      OR (btrim(item->>'dialogueText') = '' OR char_length(item->>'dialogueText') > 4000)
      OR jsonb_typeof(item->'panelLayoutType') IS DISTINCT FROM 'string'
      OR item->>'panelLayoutType' NOT IN ('single', 'two-panel', 'three-panel', 'action-splash') THEN
      RAISE EXCEPTION 'Invalid page content or order' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  fingerprint := sha256(convert_to(p_payload::text, 'UTF8'));
  -- Owner-scoped lock makes simultaneous retries observe the committed receipt.
  PERFORM pg_advisory_xact_lock(hashtextextended(caller::text || '/' || p_request_key::text, 50362));
  SELECT * INTO previous FROM public.story_save_requests
    WHERE user_id = caller AND request_key = p_request_key FOR UPDATE;
  IF FOUND THEN
    IF previous.payload_hash IS DISTINCT FROM fingerprint THEN
      RAISE EXCEPTION 'Save request payload changed' USING ERRCODE = 'PT409';
    END IF;
    IF previous.story_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.stories WHERE id = previous.story_id AND user_id = caller AND is_deleted IS NOT TRUE
    ) THEN
      RAISE EXCEPTION 'Saved story is no longer available' USING ERRCODE = 'PT410';
    END IF;
    RETURN previous.story_id;
  END IF;

  INSERT INTO public.stories (user_id, title, status, language, story_length_mode, story_format,
    art_style, plot_mode_manual, user_plot_input, child_interests, config_snapshot)
  VALUES (caller, btrim(book->>'title'), 'draft', config->>'language', config->>'storyLength', config->>'format',
    config->>'artStyle', config->>'plotMode' = 'manual', nullif(config->>'customPlot', ''),
    (SELECT string_agg(value, ', ' ORDER BY ordinal) FROM jsonb_array_elements_text(config->'interests') WITH ORDINALITY AS interests(value, ordinal)), config)
  RETURNING id INTO saved_id;
  INSERT INTO public.characters (story_id, user_id, name, role)
    SELECT saved_id, caller, btrim(value->>'name'), value->>'role'
    FROM jsonb_array_elements(config->'characters');
  INSERT INTO public.pages (story_id, user_id, page_number, scene_description, dialogue_text, panel_layout_type)
    SELECT saved_id, caller, ordinal::integer, value->>'sceneDescription', value->>'dialogueText', value->>'panelLayoutType'
    FROM jsonb_array_elements(book->'pages') WITH ORDINALITY AS pages(value, ordinal);
  UPDATE public.stories SET status = 'completed' WHERE id = saved_id AND user_id = caller;
  INSERT INTO public.story_save_requests (user_id, request_key, payload_hash, story_id)
    VALUES (caller, p_request_key, fingerprint, saved_id);
  RETURN saved_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_generated_story(uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.save_generated_story(uuid, uuid, jsonb) TO authenticated;
COMMENT ON FUNCTION public.save_generated_story(uuid, uuid, jsonb) IS
  'Atomic owner-scoped text-story save. Expected owner is an identity race check. No images, payment entitlement or provider provenance is asserted.';
COMMIT;
