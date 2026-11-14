-- Synthetic, password-free fixtures only. Auth signup trigger creates profiles/roles.
INSERT INTO auth.users (id, email) VALUES
  ('00000000-0000-0000-0000-000000000001', 'parent-a@example.invalid'),
  ('00000000-0000-0000-0000-000000000002', 'parent-b@example.invalid'),
  ('00000000-0000-0000-0000-000000000003', 'admin@example.invalid');
INSERT INTO public.user_roles (user_id, role) VALUES ('00000000-0000-0000-0000-000000000003', 'admin');
INSERT INTO public.stories (id, user_id, title) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Synthetic A'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Synthetic B');
INSERT INTO public.characters (id, story_id, user_id, name) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Synthetic A'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Synthetic B');
INSERT INTO public.pages (id, story_id, user_id, page_number) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 1);
INSERT INTO storage.objects (bucket_id, name) VALUES
  ('character-images', '00000000-0000-0000-0000-000000000001/reference.jpg'),
  ('character-images', '00000000-0000-0000-0000-000000000002/reference.jpg');
-- Model common Supabase Data API grants so RLS/trigger checks, not missing grants,
-- must enforce the authorization boundary. This does not verify live grants.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, storage TO anon, authenticated, service_role;
