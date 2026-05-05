-- Apply this on an existing Supabase project to update RAG ranking.

CREATE INDEX IF NOT EXISTS idx_places_embedding_cosine
    ON public.places USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 20)
    WHERE embedding IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_embedding_cosine
    ON public.user_feedback USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 20)
    WHERE embedding IS NOT NULL;

CREATE OR REPLACE FUNCTION search_places_with_feedback(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 5,
    category_filter TEXT DEFAULT NULL,
    feedback_weight FLOAT DEFAULT 0.15,
    rating_weight FLOAT DEFAULT 0.10,
    positive_feedback_weight FLOAT DEFAULT 0.12
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
    WITH place_candidates AS (
        SELECT
            p.*,
            (1 - (p.embedding <=> query_embedding))::FLOAT AS place_similarity
        FROM public.places p
        WHERE p.is_active = TRUE
            AND p.embedding IS NOT NULL
            AND (category_filter IS NULL OR p.category = category_filter)
    ),
    feedback_stats AS (
        SELECT
            uf.place_id,
            AVG(
                CASE
                    WHEN uf.embedding IS NOT NULL THEN (1 - (uf.embedding <=> query_embedding))::FLOAT
                    ELSE NULL
                END
            ) AS feedback_similarity,
            AVG((uf.rating::FLOAT) / 5.0) AS feedback_rating_norm,
            AVG(CASE WHEN uf.rating >= 4 THEN 1.0 ELSE 0.0 END) AS positive_ratio,
            COUNT(*)::INT AS feedback_count,
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        'rating', uf.rating,
                        'comment', uf.comment,
                        'visited_at', uf.visited_at,
                        'created_at', uf.created_at
                    )
                    ORDER BY uf.created_at DESC
                ) FILTER (WHERE uf.id IS NOT NULL),
                '[]'::jsonb
            ) AS community_feedback
        FROM public.user_feedback uf
        GROUP BY uf.place_id
    )
    SELECT
        pc.id,
        pc.name,
        jsonb_build_object(
            'place_id', pc.id,
            'name', pc.name,
            'category', pc.category,
            'description', pc.short_description,
            'vibe_tags', pc.vibe_tags,
            'price_range', pc.price_range,
            'image_url', pc.image_url,
            'rating', pc.average_rating,
            'total_reviews', pc.total_reviews,
            'address', pc.address,
            'zone', pc.zone,
            'score_components', jsonb_build_object(
                'place_similarity', pc.place_similarity,
                'feedback_similarity', COALESCE(fs.feedback_similarity, 0),
                'positive_ratio', COALESCE(fs.positive_ratio, 0),
                'feedback_count', COALESCE(fs.feedback_count, 0)
            )
        ),
        (
            pc.place_similarity
            + (feedback_weight * COALESCE(fs.feedback_similarity, 0))
            + (
                rating_weight * COALESCE(
                    NULLIF(pc.average_rating, 0) / 5.0,
                    fs.feedback_rating_norm,
                    0
                )
            )
            + (
                positive_feedback_weight
                * COALESCE(fs.positive_ratio, 0)
                * LEAST(1.0, LN(1 + COALESCE(fs.feedback_count, 0)) / LN(11))
            )
        )::FLOAT AS similarity,
        COALESCE(fs.community_feedback, '[]'::jsonb) AS community_feedback
    FROM place_candidates pc
    LEFT JOIN feedback_stats fs ON fs.place_id = pc.id
    WHERE pc.place_similarity > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
