-- Create stories table
CREATE TABLE public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'draft',
    story_length_mode VARCHAR(20),
    story_format VARCHAR(20),
    art_style VARCHAR(50),
    plot_mode_manual BOOLEAN DEFAULT false,
    user_plot_input TEXT,
    child_interests TEXT,
    cover_image_url TEXT,
    pdf_url TEXT,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create characters table
CREATE TABLE public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    name VARCHAR(100),
    role VARCHAR(50),
    original_image_url TEXT,
    embedding_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pages table
CREATE TABLE public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    page_number INT,
    panel_layout_type VARCHAR(50),
    scene_description TEXT,
    generated_image_url TEXT,
    dialogue_text TEXT,
    is_regenerated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_characters_story_id ON public.characters(story_id);
CREATE INDEX idx_pages_story_id ON public.pages(story_id);
CREATE INDEX idx_pages_story_page ON public.pages(story_id, page_number);

-- Enable RLS on all tables (public access for now, no auth required yet)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (no auth)
CREATE POLICY "Allow all operations on stories" ON public.stories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on characters" ON public.characters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on pages" ON public.pages FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for character images
INSERT INTO storage.buckets (id, name, public) VALUES ('character-images', 'character-images', true);

-- Storage policy for character images
CREATE POLICY "Allow public access to character images" ON storage.objects FOR SELECT USING (bucket_id = 'character-images');
CREATE POLICY "Allow uploads to character images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'character-images');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stories updated_at
CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON public.stories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();