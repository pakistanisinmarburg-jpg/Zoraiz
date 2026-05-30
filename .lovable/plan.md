# Marburg Connect — Phase 1 Plan

**Scope:** Auth + Profiles + Marketplace + Accommodation + Jobs + Landing + Admin shell.
**Design:** Warm Community (cream `#faf8f5`, forest green `#2d5a3d`, gold `#c9a84c`, ink `#1a1a1a`), serif display + clean sans, editorial layout.
**i18n:** English + German via `react-i18next` (language toggle in header, persisted).
**Auth:** Email/password + Google (via Lovable broker).
**Out of scope (Phase 2):** Communities, Q&A, Reports, Notifications, global search, full moderator workflow.

---

## 1. Backend (Lovable Cloud / Supabase)

### Tables (with RLS + grants)

- `profiles` — id (FK auth.users), full_name, nationality, designation, bio, hobbies (text[]), languages (text[]), phone, avatar_url, created_at. Auto-created via trigger on signup.
- `app_role` enum: `admin`, `moderator`, `user`. `user_roles` table + `has_role()` security-definer function (per Lovable user-roles pattern).
- `marketplace_listings` — id, user_id, title, category, price_cents, currency, description, location, status (`active`|`sold`|`archived`), created_at.
- `marketplace_images` — id, listing_id, url, position.
- `accommodations` — id, user_id, type (`room`|`apartment`|`shared_flat`), title, rent_cents, deposit_cents, available_from, address, description, status, created_at.
- `accommodation_images` — id, accommodation_id, url, position.
- `jobs` — id, user_id, company, position, employment_type, salary_text, location, description, status, created_at.
- `saved_jobs` — user_id, job_id (PK composite).
- `slider_images` — id, url, caption, position, created_at (admin-managed).
- `site_settings` — singleton row for hero text.

### Storage buckets (public-read, owner-write)
`profile-images`, `marketplace-images`, `accommodation-images`, `slider-images`.

### RLS rules (summary)
- Profiles: anyone authenticated reads; owner updates.
- Listings/Accommodations/Jobs: public read of `active`; owner full CRUD on own; admin full CRUD on all.
- Slider/site_settings: public read; admin write.
- user_roles: select via `has_role()` only; admin manages.

## 2. Frontend (TanStack Start)

### Routes
- `/` — Landing (hero slider, features, latest listings, CTA)
- `/login`, `/signup`, `/reset-password`
- `/_authenticated/dashboard` — tile grid (Marketplace, Accommodation, Jobs, Profile)
- `/_authenticated/profile` — view/edit, avatar upload
- `/marketplace` — list + filters (category, price, search); `/marketplace/new`, `/marketplace/$id`, `/marketplace/$id/edit`
- `/accommodation` — list + filters; `/accommodation/new`, `/accommodation/$id`, `/accommodation/$id/edit`
- `/jobs` — list + filters; `/jobs/new`, `/jobs/$id`, `/jobs/$id/edit`; saved jobs view
- `/_authenticated/_admin/...` — admin dashboard, slider manager, users, listings overview

### Patterns
- `_authenticated` layout route gates with `beforeLoad` + Supabase session.
- `_admin` nested layout checks `has_role('admin')` via server fn.
- Data: TanStack Query + server fns (`requireSupabaseAuth` where needed). Loaders use `ensureQueryData`.
- All forms: zod validation, toast on success/error, loading + empty + error states.
- Image uploads: direct to Storage from client; URLs saved to relational tables.
- i18n: `react-i18next` with `en` + `de` resource files for all UI strings.

## 3. Design system
- `src/styles.css` tokens in `oklch`: background cream, primary forest, accent gold, ink foreground; matching dark mode.
- Fonts: `Cormorant Garamond` (display) + `Inter` (body) via Google Fonts.
- Components: tailored shadcn variants (`hero`, `gold` buttons), generous spacing, rounded-2xl cards, subtle warm shadows.
- Dark mode toggle in header.

## 4. Deliverables this turn
1. Enable Lovable Cloud.
2. Migration with all Phase 1 tables, enums, trigger, RLS, grants, storage buckets + policies.
3. Design system + i18n setup + auth context.
4. All routes wired with real CRUD against Supabase — no placeholders.
5. Admin shell with slider image manager + user role management + listings overview.
6. Seed: insert a couple of slider images (Marburg public photos) so landing isn't empty on first load.

Phases 2 (Communities, Q&A, Reports, Notifications, global search, full moderation) will follow once Phase 1 is approved and live.
