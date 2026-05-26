
# Institutions System — Build Plan

A large, multi-part feature. I'll build it in phased migrations + UI so each piece is shippable.

## Phase 1 — Database & Role

**Migration 1: Role + core tables**
- Add `'institution'` to `app_role` enum.
- Tables (all in `public`, with GRANTs + RLS):
  - `institutions` — profile, verification_status (`pending|verified|rejected`), reg docs, logo/banner, contact, socials.
  - `institution_courses` — name, category, duration, fee, certificate_included, description, installments_available.
  - `institution_gallery` — image_url, caption.
  - `institution_announcements` — title, caption, image_url, expires_at (14d default), is_paid.
  - `institution_payments` — amount, payment_type (`verification|extra_announcement`), status, reference.
  - `saved_institutions` — helper_id, institution_id.
- Triggers: auto-create institution row on signup (role=institution), validate enum-like status fields, updated_at.
- Helper function `public.is_verified_institution(uuid)`.
- Storage buckets: `institution-logos` (public), `institution-banners` (public), `institution-gallery` (public), `institution-documents` (private), `institution-announcements` (public).

**RLS highlights**
- Anyone can SELECT verified institutions, their courses, gallery, non-expired announcements.
- Owner (auth.uid()=user_id) can update own institution + manage own courses/gallery/announcements (insert gated by `is_verified_institution`, except for verification flow itself).
- Admin can SELECT/UPDATE all + view documents.
- `saved_institutions`: helper owns own rows.
- `institution_payments`: insert via edge function (service role); user reads own.

## Phase 2 — Auth & Signup
- Update `AuthContext` type: `AppRole = "seeker" | "helper" | "admin" | "institution"`.
- Add `isInstitution` shortcut in components that need it.
- New `/auth/institution` signup page with the full required-field form (validated via zod), uploads reg doc to `institution-documents` bucket, creates `institutions` row, redirects to dashboard with pending banner.
- Add "Are you an institution?" link on existing `/auth` page.

## Phase 3 — Institution Dashboard (`/institution-dashboard`)
Tabs (simple, mobile-first):
1. **Profile** — edit name, description, logo, banner, contact, socials, city/country.
2. **Verification** — upload reg doc + pay R149 via Paystack edge function `paystack-institution-verification` → on success sets `verification_status='pending'`. Show status badge.
3. **Courses** — CRUD list (gated to verified).
4. **Gallery** — upload up to N images, captions (free, verified only).
5. **Announcements** — create (1 free/week, then R30 each via `paystack-institution-announcement`), list active + expired, 14-day expiry.

## Phase 4 — Public Directory (`/institutions`)
- New nav tab "Institutions" (desktop Navbar + mobile BottomNav).
- Grid of institution cards: logo, name, verified badge, city/country, courses preview, starting fee, "View Institution".
- Filters: country, city (CityAutocomplete), course category (multi), verified-only toggle (default on), global/country scope.
- Search by name.
- Pagination (12/page).

## Phase 5 — Public Institution Profile (`/institution/:id`)
- Header (banner + logo overlay, name, verified badge, location, contact, socials).
- About section.
- Courses cards grid (category, duration, fee, certificate, description, requirements, installments).
- Gallery (lightboxed, reuse `HelperPhotoGallery` pattern).
- Active announcements feed.
- Save button (heart) + "Contact Institution" (mailto / phone / website).

## Phase 6 — Saved Institutions
- Add `/saved-institutions` page (mirror of `SavedHelpers`).
- Save button component reusing pattern of `SaveHelperButton`.

## Phase 7 — Admin
- New tab in `AdminDashboard`: "Institutions".
- Lists pending verification requests with doc preview, approve/reject buttons.
- Lists all institutions with suspend/remove.
- Lists announcements (remove abusive).
- Payments log.

## Phase 8 — Payments
Edge functions (Paystack, fixed ZAR pricing per project convention):
- `paystack-institution-verification` — R149 once-off.
- `paystack-institution-announcement` — R30 per extra post.
- Reuse `paystack-verify-payment` pattern; insert into `institution_payments` via service role; on verification payment success keep status `pending` until admin approves.

## Technical Notes
- Stack: existing React 18 + Vite + Tailwind + shadcn + Supabase. No new deps.
- Styling: existing teal/gold tokens, `Card`, `Badge`, `Button` variants. Mobile-first.
- Course categories: hardcoded constant `INSTITUTION_COURSE_CATEGORIES` in `src/lib/institutionCategories.ts`.
- "1 free announcement per week" enforced by counting announcements created in last 7 days where `is_paid=false`; if >=1, frontend forces payment.
- Realtime not needed initially.

## Out of Scope (future, schema-ready only)
- Graduate linking, helper badges, certificates, ratings, trained-helper filter.

## Files to Create (key)
- `supabase/migrations/*_institutions_system.sql` (single big migration)
- `supabase/functions/paystack-institution-verification/index.ts`
- `supabase/functions/paystack-institution-announcement/index.ts`
- `src/lib/institutionCategories.ts`
- `src/pages/InstitutionSignup.tsx`
- `src/pages/InstitutionDashboard.tsx`
- `src/pages/Institutions.tsx` (directory)
- `src/pages/InstitutionProfile.tsx`
- `src/pages/SavedInstitutions.tsx`
- `src/components/institutions/*` (Card, CourseCard, GalleryManager, AnnouncementForm, VerificationCard, SaveInstitutionButton, Filters)
- `src/components/admin/InstitutionsAdminTab.tsx`
- Edits: `App.tsx` routes, `AuthContext.tsx` role type, `Navbar.tsx`, `BottomNav.tsx`, `Auth.tsx`, `AdminDashboard.tsx`.

## Build Order
1. Migration (await approval) → 2. Auth + signup → 3. Dashboard → 4. Public directory + profile → 5. Payments edge functions → 6. Admin tab → 7. Saved + nav wiring.

Approve the plan and I'll start with the migration.
