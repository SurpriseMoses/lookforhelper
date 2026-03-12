
-- Add latitude/longitude to helper_details for distance-based search
ALTER TABLE public.helper_details 
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION DEFAULT NULL;

-- Backfill coordinates from cities table for existing helpers
UPDATE public.helper_details hd
SET latitude = c.latitude, longitude = c.longitude
FROM public.cities c
WHERE LOWER(hd.city) = LOWER(c.city_name)
  AND hd.latitude IS NULL;

-- Create a function to calculate distance between two points in km (Haversine)
CREATE OR REPLACE FUNCTION public.haversine_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 6371 * 2 * ASIN(SQRT(
    POWER(SIN(RADIANS(lat2 - lat1) / 2), 2) +
    COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
    POWER(SIN(RADIANS(lon2 - lon1) / 2), 2)
  ))
$$;
