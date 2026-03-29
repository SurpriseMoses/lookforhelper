// Fixed local prices per Paystack-supported currency
// Countries not using ZAR/NGN/KES/GHS are charged in USD

export type ProductKey =
  | "seeker_subscription"
  | "helper_listing"
  | "verification"
  | "boost_7"
  | "boost_21"
  | "boost_30"
  | "background_check";

type CurrencyPricing = Record<ProductKey, number>;

// Prices in display units (not cents)
const PRICING_BY_CURRENCY: Record<string, CurrencyPricing> = {
  ZAR: {
    seeker_subscription: 25,
    helper_listing: 25,
    verification: 49,
    boost_7: 49,
    boost_21: 99,
    boost_30: 139,
    background_check: 149,
  },
  NGN: {
    seeker_subscription: 2000,
    helper_listing: 2000,
    verification: 4000,
    boost_7: 4000,
    boost_21: 8000,
    boost_30: 11000,
    background_check: 12000,
  },
  KES: {
    seeker_subscription: 250,
    helper_listing: 250,
    verification: 500,
    boost_7: 500,
    boost_21: 1000,
    boost_30: 1400,
    background_check: 1500,
  },
  GHS: {
    seeker_subscription: 25,
    helper_listing: 25,
    verification: 50,
    boost_7: 50,
    boost_21: 100,
    boost_30: 140,
    background_check: 150,
  },
  USD: {
    seeker_subscription: 2,
    helper_listing: 2,
    verification: 3,
    boost_7: 3,
    boost_21: 6,
    boost_30: 8,
    background_check: 9,
  },
};

// Map country names to Paystack-supported currencies
const COUNTRY_TO_PAYSTACK_CURRENCY: Record<string, string> = {
  "South Africa": "ZAR",
  "Nigeria": "NGN",
  "Kenya": "KES",
  "Ghana": "GHS",
  // All other countries default to USD
};

export function getPaystackCurrency(country: string | null | undefined): string {
  if (!country) return "ZAR";
  return COUNTRY_TO_PAYSTACK_CURRENCY[country] || "USD";
}

export function getPrice(product: ProductKey, country: string | null | undefined): number {
  const currency = getPaystackCurrency(country);
  return PRICING_BY_CURRENCY[currency]?.[product] ?? PRICING_BY_CURRENCY.USD[product];
}

export function getPricingForCountry(country: string | null | undefined): CurrencyPricing {
  const currency = getPaystackCurrency(country);
  return PRICING_BY_CURRENCY[currency] ?? PRICING_BY_CURRENCY.USD;
}
