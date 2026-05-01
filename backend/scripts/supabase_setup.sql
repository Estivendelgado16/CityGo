-- =============================================================================
-- PARCERO DB SETUP — Ejecutar en Supabase SQL Editor (en orden)
-- =============================================================================

-- 1. Habilitar pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tablas
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    preferred_language TEXT DEFAULT 'es' CHECK (preferred_language IN ('es', 'en')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    budget_range TEXT CHECK (budget_range IN ('$', '$$', '$$$', '$$$$')),
    favorite_cuisines TEXT[] DEFAULT '{}',
    preferred_vibes TEXT[] DEFAULT '{}',
    preferred_zones TEXT[] DEFAULT '{}',
    dietary_restrictions TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    agent_detected_preferences JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('restaurante', 'bar', 'discoteca', 'cultura', 'deporte')),
    description TEXT,
    short_description TEXT,
    address TEXT,
    zone TEXT,
    price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
    vibe_tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    menu_url TEXT,
    social_links JSONB DEFAULT '{}',
    opening_hours JSONB DEFAULT '{}',
    latitude DECIMAL,
    longitude DECIMAL,
    average_rating DECIMAL DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'scraping_n8n', 'user_submitted')),
    embedding VECTOR(1536),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('concierto', 'fiesta', 'cultural', 'deportivo', 'gastronomico')),
    place_id UUID REFERENCES public.places(id),
    venue_name TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    price_range TEXT,
    image_url TEXT,
    ticket_url TEXT,
    vibe_tags TEXT[] DEFAULT '{}',
    embedding VECTOR(1536),
    source TEXT DEFAULT 'manual',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.saved_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, place_id)
);

CREATE TABLE public.user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    place_id UUID REFERENCES public.places(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    visited_at DATE,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    place_cards JSONB,
    event_cards JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices
CREATE INDEX idx_places_category ON public.places(category);
CREATE INDEX idx_places_zone ON public.places(zone);
CREATE INDEX idx_places_active ON public.places(is_active);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_active ON public.events(is_active);
CREATE INDEX idx_chat_user_conv ON public.chat_messages(user_id, conversation_id);
CREATE INDEX idx_chat_conv_date ON public.chat_messages(conversation_id, created_at);
CREATE INDEX idx_saved_user ON public.saved_places(user_id);
CREATE INDEX idx_feedback_place ON public.user_feedback(place_id);

-- 4. Trigger: crear perfil cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Función de búsqueda vectorial de lugares
CREATE OR REPLACE FUNCTION search_places_with_feedback(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 5,
    category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    place_id UUID,
    place_name TEXT,
    place_data JSONB,
    similarity FLOAT,
    community_feedback JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        jsonb_build_object(
            'place_id', p.id, 'name', p.name, 'category', p.category,
            'description', p.short_description, 'vibe_tags', p.vibe_tags,
            'price_range', p.price_range, 'image_url', p.image_url,
            'rating', p.average_rating, 'total_reviews', p.total_reviews,
            'address', p.address, 'zone', p.zone
        ),
        (1 - (p.embedding <=> query_embedding))::FLOAT,
        COALESCE(
            jsonb_agg(jsonb_build_object('rating', uf.rating, 'comment', uf.comment, 'visited_at', uf.visited_at))
            FILTER (WHERE uf.id IS NOT NULL), '[]'::jsonb
        )
    FROM public.places p
    LEFT JOIN public.user_feedback uf ON uf.place_id = p.id
    WHERE p.is_active = TRUE
        AND p.embedding IS NOT NULL
        AND 1 - (p.embedding <=> query_embedding) > match_threshold
        AND (category_filter IS NULL OR p.category = category_filter)
    GROUP BY p.id
    ORDER BY (1 - (p.embedding <=> query_embedding)) DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Función de búsqueda de eventos por fecha + similitud
CREATE OR REPLACE FUNCTION search_events_by_date_and_similarity(
    query_embedding VECTOR(1536),
    start_date DATE,
    end_date DATE,
    category_filter TEXT DEFAULT NULL,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    event_id UUID,
    event_data JSONB,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        jsonb_build_object(
            'event_id', e.id, 'name', e.name, 'category', e.category,
            'description', e.description, 'venue_name', COALESCE(e.venue_name, p.name),
            'event_date', e.event_date, 'start_time', e.start_time, 'end_time', e.end_time,
            'price_range', e.price_range, 'image_url', e.image_url,
            'ticket_url', e.ticket_url, 'vibe_tags', e.vibe_tags
        ),
        CASE WHEN e.embedding IS NOT NULL THEN (1 - (e.embedding <=> query_embedding))::FLOAT ELSE 0.5 END
    FROM public.events e
    LEFT JOIN public.places p ON e.place_id = p.id
    WHERE e.is_active = TRUE
        AND e.event_date >= start_date AND e.event_date <= end_date
        AND (category_filter IS NULL OR e.category = category_filter)
    ORDER BY CASE WHEN e.embedding IS NOT NULL THEN 1 - (e.embedding <=> query_embedding) ELSE 0.5 END DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- 7. RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "prefs_own" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "saved_own" ON public.saved_places FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "feedback_read" ON public.user_feedback FOR SELECT USING (true);
CREATE POLICY "feedback_create" ON public.user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_own" ON public.chat_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "places_read" ON public.places FOR SELECT USING (is_active = true);
CREATE POLICY "events_read" ON public.events FOR SELECT USING (is_active = true);
