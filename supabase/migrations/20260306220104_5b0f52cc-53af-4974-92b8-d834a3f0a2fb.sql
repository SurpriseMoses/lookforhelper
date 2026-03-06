
-- Drop dependent index first, then move extension
DROP INDEX IF EXISTS public.idx_cities_city_name_trgm;
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Recreate the trigram index using extensions schema
CREATE INDEX idx_cities_city_name_trgm ON public.cities USING gin (city_name extensions.gin_trgm_ops);

-- Recreate the function using extensions schema
CREATE OR REPLACE FUNCTION public.search_cities(search_term text, result_limit int DEFAULT 10)
RETURNS TABLE(id uuid, city_name text, province text, country text, latitude double precision, longitude double precision, similarity_score real)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT c.id, c.city_name, c.province, c.country, c.latitude, c.longitude,
         extensions.similarity(c.city_name, search_term) AS similarity_score
  FROM public.cities c
  WHERE extensions.similarity(c.city_name, search_term) > 0.15 OR c.city_name ILIKE '%' || search_term || '%'
  ORDER BY extensions.similarity(c.city_name, search_term) DESC
  LIMIT result_limit;
$$;
