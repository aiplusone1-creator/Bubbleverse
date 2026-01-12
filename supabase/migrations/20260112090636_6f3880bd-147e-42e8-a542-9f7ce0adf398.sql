-- Create showcase_images table for hero section
CREATE TABLE public.showcase_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.showcase_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view active showcase images (public facing)
CREATE POLICY "Anyone can view active showcase images" 
ON public.showcase_images 
FOR SELECT 
USING (is_active = true);

-- Admins can manage all showcase images
CREATE POLICY "Admins can manage showcase images" 
ON public.showcase_images 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_showcase_images_updated_at
BEFORE UPDATE ON public.showcase_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add preferred_currency column to profiles
ALTER TABLE public.profiles 
ADD COLUMN preferred_currency VARCHAR(3) DEFAULT 'EGP';

-- Insert some default showcase images
INSERT INTO public.showcase_images (image_url, alt_text, display_order) VALUES
('https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop', 'Magical storybook adventure', 1),
('https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop', 'Space exploration story', 2),
('https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop', 'Enchanted forest tale', 3);