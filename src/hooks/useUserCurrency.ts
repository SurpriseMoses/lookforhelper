import { useAuth } from "@/contexts/AuthContext";
import { getCurrencyForCountry } from "@/lib/currency";
import { getPrice, getPricingForCountry, type ProductKey } from "@/lib/pricing";

/**
 * Returns the current user's currency symbol and country-specific pricing.
 */
export function useUserCurrency() {
  const { user } = useAuth();
  const country = user?.user_metadata?.country as string | undefined;
  const { symbol, code } = getCurrencyForCountry(country);

  /** Format an amount with the user's currency symbol */
  const formatAmount = (amount: number) => `${symbol}${amount.toLocaleString()}`;

  /** Get the fixed local price for a product */
  const price = (product: ProductKey) => getPrice(product, country);

  /** Format a product's local price with currency symbol */
  const formatPrice = (product: ProductKey) => formatAmount(price(product));

  const pricing = getPricingForCountry(country);

  return { symbol, code, country, formatAmount, price, formatPrice, pricing };
}
