-- Authorization hardening only. No credential changes or data repair.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

-- Refuse to silently hide/repair legacy data. Owner review is required if this fails.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.stories WHERE user_id IS NULL)
    OR EXISTS (
      SELECT 1 FROM public.characters c LEFT JOIN public.stories s ON s.id = c.story_id
      WHERE c.user_id IS NULL OR c.story_id IS NULL OR s.user_id IS DISTINCT FROM c.user_id
    ) OR EXISTS (
      SELECT 1 FROM public.pages p LEFT JOIN public.stories s ON s.id = p.story_id
      WHERE p.user_id IS NULL OR p.story_id IS NULL OR s.user_id IS DISTINCT FROM p.user_id
    ) THEN
    RAISE EXCEPTION 'Authorization migration blocked: legacy ownership requires owner review; no records changed';
  END IF;
END;
$$;

-- current_user is the database role, not a caller-editable JWT claim.
-- INVOKER preserves trusted auth signup/service/database maintenance workflows.
CREATE FUNCTION public.guard_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
    RAISE EXCEPTION 'Profile identity is immutable' USING ERRCODE = '42501';
  END IF;

  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id IS DISTINCT FROM auth.uid()
      OR NEW.is_premium IS DISTINCT FROM false
      OR NEW.is_banned IS DISTINCT FROM false THEN
      RAISE EXCEPTION 'Profile privilege fields are administrator-managed' USING ERRCODE = '42501';
    END IF;
  ELSE
    -- Fail closed for future columns. updated_at is set by the existing timestamp trigger.
    IF (to_jsonb(NEW) - ARRAY['display_name', 'avatar_url', 'preferred_currency', 'updated_at'])
      IS DISTINCT FROM
      (to_jsonb(OLD) - ARRAY['display_name', 'avatar_url', 'preferred_currency', 'updated_at']) THEN
      RAISE EXCEPTION 'Only parent-editable profile fields may be changed' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_profile_fields() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_profile_fields
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_fields();

-- Disallow ownership transfers through the Data API, including an admin session.
-- Existing administrative title/status/soft-delete workflows are unchanged.
CREATE FUNCTION public.guard_story_identity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role')
    AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
    RAISE EXCEPTION 'Story identity is immutable' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_story_identity() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_story_identity
BEFORE UPDATE ON public.stories
FOR EACH ROW EXECUTE FUNCTION public.guard_story_identity();

-- Enforce ownership integrity even for trusted writers; keep existing cascade behavior.
ALTER TABLE public.stories ADD CONSTRAINT stories_owner_required CHECK (user_id IS NOT NULL) NOT VALID;
ALTER TABLE public.stories VALIDATE CONSTRAINT stories_owner_required;
ALTER TABLE public.stories ADD CONSTRAINT stories_id_owner_unique UNIQUE (id, user_id);
ALTER TABLE public.characters ADD CONSTRAINT characters_owner_required CHECK (user_id IS NOT NULL AND story_id IS NOT NULL) NOT VALID;
ALTER TABLE public.characters VALIDATE CONSTRAINT characters_owner_required;
ALTER TABLE public.pages ADD CONSTRAINT pages_owner_required CHECK (user_id IS NOT NULL AND story_id IS NOT NULL) NOT VALID;
ALTER TABLE public.pages VALIDATE CONSTRAINT pages_owner_required;
ALTER TABLE public.characters ADD CONSTRAINT characters_story_owner_fk
  FOREIGN KEY (story_id, user_id) REFERENCES public.stories (id, user_id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.characters VALIDATE CONSTRAINT characters_story_owner_fk;
ALTER TABLE public.pages ADD CONSTRAINT pages_story_owner_fk
  FOREIGN KEY (story_id, user_id) REFERENCES public.stories (id, user_id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.pages VALIDATE CONSTRAINT pages_story_owner_fk;

-- Preserve owner policies but require the referenced story to have the same owner.
-- No new admin access to private character/page content is introduced.
ALTER POLICY "Users can view their own characters" ON public.characters
  USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = characters.story_id AND s.user_id = auth.uid()));
ALTER POLICY "Users can create their own characters" ON public.characters
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = characters.story_id AND s.user_id = auth.uid()));
ALTER POLICY "Users can update their own characters" ON public.characters
  USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = characters.story_id AND s.user_id = auth.uid()))
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = characters.story_id AND s.user_id = auth.uid()));
ALTER POLICY "Users can delete their own characters" ON public.characters
  USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = characters.story_id AND s.user_id = auth.uid()));
ALTER POLICY "Users can view their own pages" ON public.pages
  USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = pages.story_id AND s.user_id = auth.uid()));
ALTER POLICY "Users can create their own pages" ON public.pages
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = pages.story_id AND s.user_id = auth.uid()));
ALTER POLICY "Users can update their own pages" ON public.pages
  USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = pages.story_id AND s.user_id = auth.uid()))
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = pages.story_id AND s.user_id = auth.uid()));
ALTER POLICY "Users can delete their own pages" ON public.pages
  USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.stories s WHERE s.id = pages.story_id AND s.user_id = auth.uid()));
COMMIT;
