-- Remove public access to app_config and restrict to authenticated users only

-- Drop the overly permissive policy that allows anyone to read
DROP POLICY IF EXISTS "Anyone can read app_config" ON public.app_config;

-- Create policy that only allows authenticated users to read app_config
CREATE POLICY "Authenticated users can read app_config" 
ON public.app_config 
FOR SELECT 
TO authenticated
USING (true);