import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CityResult {
  id: string;
  city_name: string;
  province: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  similarity_score: number;
}

interface CityAutocompleteProps {
  value: string;
  province?: string;
  onCitySelect: (city: string, province: string, lat?: number, lng?: number) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

const CityAutocomplete = ({
  value,
  province,
  onCitySelect,
  onClear,
  placeholder = "e.g. Johannesburg",
  className,
}: CityAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CityResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchCities = async (term: string) => {
    if (term.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("search_cities", {
      search_term: term,
      result_limit: 8,
    });
    if (!error && data) {
      setSuggestions(data as CityResult[]);
      setIsOpen(data.length > 0);
    }
    setLoading(false);
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCities(val), 250);
    if (!val && onClear) onClear();
  };

  const handleSelect = (city: CityResult) => {
    setQuery(city.city_name);
    setIsOpen(false);
    onCitySelect(
      city.city_name,
      city.province,
      city.latitude ?? undefined,
      city.longitude ?? undefined
    );
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Find nearest city by distance
        const { data } = await supabase
          .from("cities")
          .select("*");
        if (data && data.length > 0) {
          let nearest = data[0];
          let minDist = Infinity;
          for (const city of data) {
            if (city.latitude == null || city.longitude == null) continue;
            const dist = Math.sqrt(
              Math.pow(city.latitude - latitude, 2) +
              Math.pow(city.longitude - longitude, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              nearest = city;
            }
          }
          setQuery(nearest.city_name);
          onCitySelect(
            nearest.city_name,
            nearest.province,
            nearest.latitude ?? undefined,
            nearest.longitude ?? undefined
          );
        }
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 10000 }
    );
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          className="pl-9 pr-10"
        />
        <button
          type="button"
          onClick={handleGeolocation}
          disabled={geoLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Use my location"
        >
          {geoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </button>
      </div>
      {loading && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        </div>
      )}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {suggestions.map((city) => (
              <li
                key={city.id}
                onClick={() => handleSelect(city)}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <span className="font-medium">{city.city_name}</span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {city.province}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete;
