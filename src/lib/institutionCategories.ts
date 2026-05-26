export const INSTITUTION_COURSE_CATEGORIES = [
  "Childcare / Nanny Training",
  "Elderly Caregiving",
  "Housekeeping",
  "Cleaning Services",
  "Cooking & Hospitality",
  "First Aid",
  "Au Pair Preparation",
  "Disability Care",
  "Laundry & Ironing",
  "Home Management",
  "Other",
] as const;

export type InstitutionCourseCategory = (typeof INSTITUTION_COURSE_CATEGORIES)[number];

// Fixed local pricing (display units, not cents) for institution products
export const INSTITUTION_PRICING: Record<string, { verification: number; announcement: number; currency: string }> = {
  "South Africa": { verification: 149, announcement: 30, currency: "ZAR" },
  Nigeria: { verification: 12000, announcement: 2500, currency: "NGN" },
  Kenya: { verification: 1500, announcement: 300, currency: "KES" },
  Ghana: { verification: 150, announcement: 30, currency: "GHS" },
};
export const INSTITUTION_DEFAULT_PRICING = { verification: 9, announcement: 2, currency: "USD" };

export function getInstitutionPricing(country?: string | null) {
  if (country && INSTITUTION_PRICING[country]) return INSTITUTION_PRICING[country];
  return INSTITUTION_DEFAULT_PRICING;
}
