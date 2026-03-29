import { useAuth } from "@/contexts/AuthContext";
import { getCurrencyForCountry } from "@/lib/currency";

/**
 * Returns the current user's currency symbol based on their country.
 * Falls back to ZAR (R) if not logged in or country not set.
 */
export function useUserCurrency() {
  const { user } = useAuth();
  const country = user?.user_metadata?.country as string | undefined;
  const { symbol, code } = getCurrencyForCountry(country);

  /** Format an amount with the user's currency symbol */
  const formatAmount = (amount: number) => `${symbol}${amount.toLocaleString()}`;

  return { symbol, code, country, formatAmount };
}
