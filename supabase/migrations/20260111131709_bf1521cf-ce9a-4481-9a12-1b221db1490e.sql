-- Create examples table for managing the examples section
CREATE TABLE public.examples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  cover_url TEXT NOT NULL,
  style VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.examples ENABLE ROW LEVEL SECURITY;

-- Anyone can read visible examples (public facing)
CREATE POLICY "Anyone can view visible examples" 
ON public.examples 
FOR SELECT 
USING (is_visible = true);

-- Admins can do everything
CREATE POLICY "Admins can manage all examples" 
ON public.examples 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_examples_updated_at
BEFORE UPDATE ON public.examples
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for example images
INSERT INTO storage.buckets (id, name, public)
VALUES ('example-images', 'example-images', true);

-- Storage policies for example images
CREATE POLICY "Anyone can view example images"
ON storage.objects FOR SELECT
USING (bucket_id = 'example-images');

CREATE POLICY "Admins can upload example images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'example-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update example images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'example-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete example images"
ON storage.objects FOR DELETE
USING (bucket_id = 'example-images' AND is_admin(auth.uid()));

-- Insert default examples data
INSERT INTO public.examples (title, cover_url, style, display_order) VALUES
('The Dragon Adventure', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop', '3D Pixar Style', 1),
('Space Explorer', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop', 'Comic Book', 2),
('Magical Forest', 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop', 'Watercolor', 3),
('Ocean Friends', 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400&h=600&fit=crop', 'Anime Style', 4),
('Superhero Day', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop', 'Comic Book', 5),
('Dinosaur World', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop', '3D Pixar Style', 6);