-- Add user_id column to stories table
ALTER TABLE public.stories 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to characters table
ALTER TABLE public.characters 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to pages table  
ALTER TABLE public.pages 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on stories" ON public.stories;
DROP POLICY IF EXISTS "Allow all operations on characters" ON public.characters;
DROP POLICY IF EXISTS "Allow all operations on pages" ON public.pages;

-- Create secure RLS policies for stories
CREATE POLICY "Users can view their own stories" 
ON public.stories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stories" 
ON public.stories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" 
ON public.stories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" 
ON public.stories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create secure RLS policies for characters
CREATE POLICY "Users can view their own characters" 
ON public.characters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own characters" 
ON public.characters 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters" 
ON public.characters 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characters" 
ON public.characters 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create secure RLS policies for pages
CREATE POLICY "Users can view their own pages" 
ON public.pages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pages" 
ON public.pages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pages" 
ON public.pages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pages" 
ON public.pages 
FOR DELETE 
USING (auth.uid() = user_id);