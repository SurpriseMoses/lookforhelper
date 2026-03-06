
-- Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create cities table
CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  province text NOT NULL,
  country text NOT NULL DEFAULT 'South Africa',
  latitude double precision,
  longitude double precision
);

-- Create index for fuzzy search
CREATE INDEX idx_cities_city_name_trgm ON public.cities USING gin (city_name gin_trgm_ops);
CREATE INDEX idx_cities_province ON public.cities (province);

-- Enable RLS
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- Anyone can read cities
CREATE POLICY "Anyone can read cities" ON public.cities FOR SELECT USING (true);

-- Create fuzzy city search function
CREATE OR REPLACE FUNCTION public.search_cities(search_term text, result_limit int DEFAULT 10)
RETURNS TABLE(id uuid, city_name text, province text, country text, latitude double precision, longitude double precision, similarity_score real)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT c.id, c.city_name, c.province, c.country, c.latitude, c.longitude,
         similarity(c.city_name, search_term) AS similarity_score
  FROM public.cities c
  WHERE c.city_name % search_term OR c.city_name ILIKE '%' || search_term || '%'
  ORDER BY similarity(c.city_name, search_term) DESC
  LIMIT result_limit;
$$;

-- Seed South African cities with coordinates
INSERT INTO public.cities (city_name, province, country, latitude, longitude) VALUES
-- Gauteng
('Johannesburg', 'Gauteng', 'South Africa', -26.2041, 28.0473),
('Pretoria', 'Gauteng', 'South Africa', -25.7479, 28.2293),
('Centurion', 'Gauteng', 'South Africa', -25.8603, 28.1894),
('Sandton', 'Gauteng', 'South Africa', -26.1076, 28.0567),
('Midrand', 'Gauteng', 'South Africa', -25.9884, 28.1272),
('Randburg', 'Gauteng', 'South Africa', -26.0936, 28.0064),
('Roodepoort', 'Gauteng', 'South Africa', -26.1625, 27.8727),
('Soweto', 'Gauteng', 'South Africa', -26.2485, 27.8540),
('Benoni', 'Gauteng', 'South Africa', -26.1886, 28.3208),
('Boksburg', 'Gauteng', 'South Africa', -26.2125, 28.2625),
('Germiston', 'Gauteng', 'South Africa', -26.2178, 28.1672),
('Kempton Park', 'Gauteng', 'South Africa', -26.1000, 28.2333),
('Alberton', 'Gauteng', 'South Africa', -26.2667, 28.1167),
('Springs', 'Gauteng', 'South Africa', -26.2500, 28.4333),
('Vereeniging', 'Gauteng', 'South Africa', -26.6736, 27.9264),
('Vanderbijlpark', 'Gauteng', 'South Africa', -26.7000, 27.8333),
('Krugersdorp', 'Gauteng', 'South Africa', -26.0833, 27.7667),
('Tembisa', 'Gauteng', 'South Africa', -25.9964, 28.2269),
('Edenvale', 'Gauteng', 'South Africa', -26.1411, 28.1525),
('Fourways', 'Gauteng', 'South Africa', -26.0167, 28.0167),
-- Western Cape
('Cape Town', 'Western Cape', 'South Africa', -33.9249, 18.4241),
('Stellenbosch', 'Western Cape', 'South Africa', -33.9321, 18.8602),
('Paarl', 'Western Cape', 'South Africa', -33.7342, 18.9725),
('Somerset West', 'Western Cape', 'South Africa', -34.0833, 18.8500),
('George', 'Western Cape', 'South Africa', -33.9631, 22.4614),
('Knysna', 'Western Cape', 'South Africa', -34.0356, 23.0488),
('Mossel Bay', 'Western Cape', 'South Africa', -34.1833, 22.1333),
('Worcester', 'Western Cape', 'South Africa', -33.6464, 19.4431),
('Hermanus', 'Western Cape', 'South Africa', -34.4167, 19.2500),
('Malmesbury', 'Western Cape', 'South Africa', -33.4667, 18.7333),
('Franschhoek', 'Western Cape', 'South Africa', -33.9000, 19.1167),
('Bellville', 'Western Cape', 'South Africa', -33.9000, 18.6333),
('Durbanville', 'Western Cape', 'South Africa', -33.8333, 18.6500),
('Table View', 'Western Cape', 'South Africa', -33.8167, 18.5167),
('Milnerton', 'Western Cape', 'South Africa', -33.8667, 18.5167),
-- KwaZulu-Natal
('Durban', 'KwaZulu-Natal', 'South Africa', -29.8587, 31.0218),
('Pietermaritzburg', 'KwaZulu-Natal', 'South Africa', -29.6006, 30.3794),
('Richards Bay', 'KwaZulu-Natal', 'South Africa', -28.7830, 32.0377),
('Newcastle', 'KwaZulu-Natal', 'South Africa', -27.7500, 29.9333),
('Ballito', 'KwaZulu-Natal', 'South Africa', -29.5333, 31.2167),
('Umhlanga', 'KwaZulu-Natal', 'South Africa', -29.7333, 31.0833),
('Pinetown', 'KwaZulu-Natal', 'South Africa', -29.8167, 30.8500),
('Amanzimtoti', 'KwaZulu-Natal', 'South Africa', -30.0500, 30.8833),
('Ladysmith', 'KwaZulu-Natal', 'South Africa', -28.5500, 29.7833),
('Port Shepstone', 'KwaZulu-Natal', 'South Africa', -30.7333, 30.4500),
-- Eastern Cape
('Port Elizabeth', 'Eastern Cape', 'South Africa', -33.9608, 25.6022),
('East London', 'Eastern Cape', 'South Africa', -33.0292, 27.8546),
('Mthatha', 'Eastern Cape', 'South Africa', -31.5889, 28.7844),
('Grahamstown', 'Eastern Cape', 'South Africa', -33.3042, 26.5328),
('Queenstown', 'Eastern Cape', 'South Africa', -31.8975, 26.8753),
('Uitenhage', 'Eastern Cape', 'South Africa', -33.7667, 25.4000),
('King Williams Town', 'Eastern Cape', 'South Africa', -32.8811, 27.3944),
-- Free State
('Bloemfontein', 'Free State', 'South Africa', -29.0852, 26.1596),
('Welkom', 'Free State', 'South Africa', -27.9833, 26.7333),
('Kroonstad', 'Free State', 'South Africa', -27.6500, 27.2333),
('Bethlehem', 'Free State', 'South Africa', -28.2333, 28.3000),
('Sasolburg', 'Free State', 'South Africa', -26.8167, 27.8167),
-- Mpumalanga
('Nelspruit', 'Mpumalanga', 'South Africa', -25.4753, 30.9694),
('Witbank', 'Mpumalanga', 'South Africa', -25.8700, 29.2167),
('Middelburg', 'Mpumalanga', 'South Africa', -25.7750, 29.4625),
('Secunda', 'Mpumalanga', 'South Africa', -26.5167, 29.1667),
('Ermelo', 'Mpumalanga', 'South Africa', -26.5333, 29.9833),
('Barberton', 'Mpumalanga', 'South Africa', -25.7833, 31.0500),
('White River', 'Mpumalanga', 'South Africa', -25.3333, 31.0167),
-- Limpopo
('Polokwane', 'Limpopo', 'South Africa', -23.9045, 29.4689),
('Tzaneen', 'Limpopo', 'South Africa', -23.8333, 30.1667),
('Mokopane', 'Limpopo', 'South Africa', -24.2000, 29.0167),
('Thohoyandou', 'Limpopo', 'South Africa', -22.9500, 30.4833),
('Musina', 'Limpopo', 'South Africa', -22.3333, 30.0500),
('Lephalale', 'Limpopo', 'South Africa', -23.6833, 27.7000),
('Louis Trichardt', 'Limpopo', 'South Africa', -23.0500, 29.9000),
-- North West
('Rustenburg', 'North West', 'South Africa', -25.6667, 27.2500),
('Potchefstroom', 'North West', 'South Africa', -26.7167, 27.1000),
('Klerksdorp', 'North West', 'South Africa', -26.8667, 26.6667),
('Mahikeng', 'North West', 'South Africa', -25.8500, 25.6333),
('Brits', 'North West', 'South Africa', -25.6333, 27.7833),
-- Northern Cape
('Kimberley', 'Northern Cape', 'South Africa', -28.7282, 24.7499),
('Upington', 'Northern Cape', 'South Africa', -28.4500, 21.2500),
('Springbok', 'Northern Cape', 'South Africa', -29.6667, 17.8833),
('De Aar', 'Northern Cape', 'South Africa', -30.6500, 24.0167);
