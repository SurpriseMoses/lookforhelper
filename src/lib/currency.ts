// Maps country names to currency symbols/codes
const COUNTRY_CURRENCY: Record<string, { symbol: string; code: string }> = {
  "South Africa": { symbol: "R", code: "ZAR" },
  "Kenya": { symbol: "KSh", code: "KES" },
  "Nigeria": { symbol: "₦", code: "NGN" },
  "Ghana": { symbol: "GH₵", code: "GHS" },
  "Uganda": { symbol: "USh", code: "UGX" },
  "Tanzania": { symbol: "TSh", code: "TZS" },
  "Zimbabwe": { symbol: "$", code: "USD" },
  "Botswana": { symbol: "P", code: "BWP" },
  "Mozambique": { symbol: "MT", code: "MZN" },
  "Zambia": { symbol: "ZK", code: "ZMW" },
  "Namibia": { symbol: "N$", code: "NAD" },
  "Eswatini": { symbol: "E", code: "SZL" },
  "Lesotho": { symbol: "M", code: "LSL" },
  "Malawi": { symbol: "MK", code: "MWK" },
  "Rwanda": { symbol: "FRw", code: "RWF" },
  "Ethiopia": { symbol: "Br", code: "ETB" },
  "Senegal": { symbol: "CFA", code: "XOF" },
  "Ivory Coast": { symbol: "CFA", code: "XOF" },
  "United Kingdom": { symbol: "£", code: "GBP" },
  "United States": { symbol: "$", code: "USD" },
  "Canada": { symbol: "C$", code: "CAD" },
  "Australia": { symbol: "A$", code: "AUD" },
  "New Zealand": { symbol: "NZ$", code: "NZD" },
  "Ireland": { symbol: "€", code: "EUR" },
  "UAE": { symbol: "AED", code: "AED" },
  "Saudi Arabia": { symbol: "SAR", code: "SAR" },
  "Qatar": { symbol: "QAR", code: "QAR" },
  "Kuwait": { symbol: "KD", code: "KWD" },
  "Bahrain": { symbol: "BD", code: "BHD" },
  "Oman": { symbol: "OMR", code: "OMR" },
  "Jordan": { symbol: "JD", code: "JOD" },
  "Lebanon": { symbol: "L£", code: "LBP" },
  "India": { symbol: "₹", code: "INR" },
  "Pakistan": { symbol: "Rs", code: "PKR" },
  "Bangladesh": { symbol: "৳", code: "BDT" },
  "Sri Lanka": { symbol: "Rs", code: "LKR" },
  "Singapore": { symbol: "S$", code: "SGD" },
  "Malaysia": { symbol: "RM", code: "MYR" },
  "Philippines": { symbol: "₱", code: "PHP" },
  "Thailand": { symbol: "฿", code: "THB" },
  "Indonesia": { symbol: "Rp", code: "IDR" },
  "Hong Kong": { symbol: "HK$", code: "HKD" },
  "Japan": { symbol: "¥", code: "JPY" },
  "South Korea": { symbol: "₩", code: "KRW" },
  "China": { symbol: "¥", code: "CNY" },
};

export function getCurrencyForCountry(country: string | null | undefined): { symbol: string; code: string } {
  if (!country) return { symbol: "R", code: "ZAR" };
  return COUNTRY_CURRENCY[country] ?? { symbol: "R", code: "ZAR" };
}

export function formatSalary(amount: number, country?: string | null): string {
  const { symbol } = getCurrencyForCountry(country);
  return `${symbol}${amount.toLocaleString()}`;
}
