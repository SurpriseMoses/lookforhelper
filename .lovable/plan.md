

# Look For Helper — v1 Plan

## Overview
A clean, professional marketplace connecting South African households with trusted helpers (nannies, babysitters, cleaners, caregivers). This v1 focuses on profiles, browsing, and filtering — laying the foundation for chat, payments, and admin features in future versions.

## Color Palette & Style
- **Primary**: Deep teal/navy — conveys trust and professionalism
- **Accent**: Warm amber/gold — approachable and inviting
- **Clean white backgrounds**, subtle card shadows, professional typography
- Mobile-first responsive design

---

## Pages & Features

### 1. Landing Page
- Hero section with tagline: "Find Trusted Household Help"
- How it works (3 steps: Browse → Connect → Hire)
- Featured helper cards preview
- Call-to-action buttons for Seekers and Helpers

### 2. Authentication (Lovable Cloud)
- Sign up / Log in (email-based)
- Choose role on signup: **Seeker** or **Helper**
- Profile creation flow after signup

### 3. Helper Profile Creation
- Multi-step form to fill in:
  - Profile photo upload
  - Full name, age, gender
  - Languages spoken
  - Location (City & Country)
  - Willing to work abroad (Yes/No)
  - Years of experience
  - Skills (multi-select: Nanny, Babysitter, Cleaner, Caregiver, etc.)
  - Salary expectation (with "Negotiable" option)
  - About Me text
  - References (name, contact, relationship)
- Profile preview before publishing

### 4. Helper Profile Page
- Clean card/page layout showing all profile details
- Profile photo prominently displayed
- Skills shown as badges
- Contact button (disabled for free seekers — placeholder for v2 messaging)

### 5. Browse & Search Helpers
- Grid of helper profile cards (photo, name, location, skills, experience)
- **Filter sidebar/bar** with:
  - Skills (multi-select)
  - Gender
  - Age range
  - Location (city/country)
  - Languages
  - Years of experience
- Sort by: Newest, Most experienced
- Pagination

### 6. Seeker Dashboard
- View saved/bookmarked helpers (bookmark feature)
- View own profile info

### 7. Helper Dashboard
- View/edit own profile
- Profile visibility status

---

## Backend (Lovable Cloud / Supabase)
- **Auth**: Email-based authentication with role assignment
- **Database tables**: profiles, helper_details, user_roles, bookmarks
- **Storage**: Profile photo uploads
- **RLS policies**: Helpers can edit own profile; seekers can browse all published helpers

---

## What's Deferred to v2
- In-app messaging & chat
- Video/intro video uploads
- Subscription payments (R25/month via Stripe)
- Smart search (keyword-based CV matching)
- Interview scheduling & hiring flow
- Admin moderation dashboard
- Report/block user
- Review system
- Profile verification badges
- International expansion features

