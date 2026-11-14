-- Preserve existing roles and admin access. Commit before using the enum value.
ALTER TYPE public.app_role ADD VALUE 'operator';
