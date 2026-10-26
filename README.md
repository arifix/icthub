# ICTHub

ICTHub is a student portal and admin dashboard for the M.Sc. Eng. in ICT programme at the Institute of Information and Communication Technology (IICT), KUET. The app is built with React, TypeScript, Vite, Tailwind CSS, and Supabase.

## Overview

The platform provides a focused academic workspace for students and administrators:

- Student-facing portal with subject listings, notes, study files, calendar, and information resources
- Admin management area for semesters, subjects, notes, events, files, and content settings
- Real-time in-app notifications for new academic content
- Current-semester filtering so the portal stays focused on the active term

## Features

### Student portal

- Secure portal access with a shared access password and student name validation
- Home dashboard showing current subjects, recent notes, and upcoming events
- Subject browser with detailed subject pages
- Notes section with subject-linked academic material
- Calendar view for semester events and academic dates
- File/resource library for downloadable study materials
- Information center with categories and notes for academic updates and guidance
- Notification center for new files, notes, and events

### Admin panel

- Dashboard with counts for semesters, subjects, notes, events, and files
- Semester management and current-semester switching
- Subject management and semester-specific subject creation
- Notes management with subject assignment
- Information categories and information notes management
- Event management for calendar entries
- File management with upload-related metadata
- Settings and analytics sections

## Security model

- **Admins** sign in with Supabase Auth and must be listed in `public.admin_users`. Having an account is not enough.
- **Students** get a Supabase *anonymous* session. The server-side function `redeem_portal_access()` checks the shared portal password (stored bcrypt-hashed in `portal_config`) and grants that session access.
- Every table, the private `icthub-files` storage bucket and realtime notifications are protected by row-level security (`has_portal_access()` / `is_admin()`). Draft (inactive) content is hidden from students by the database itself.
- Password attempts are rate-limited (5 per device and 60 per IP every 15 minutes). Changing the password signs every student out.
- Comment authors and analytics identity are stamped server-side, so they cannot be spoofed.
- Files are served through short-lived signed URLs. Rich text is sanitized with DOMPurify both on save and on render, and production builds ship a Content-Security-Policy.

## Tech stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase (Postgres + row-level security, Auth, Storage, Realtime)
- React Router DOM
- React Hot Toast
- Lucide React
- React Quill
- DOMPurify

## Project structure

- `src/pages` — public portal and admin pages
- `src/components` — navigation, protected routes, layout components
- `src/context` — auth and portal access providers
- `src/hooks` — notifications, tracking, semester data helpers
- `src/lib` — Supabase client setup
- `migrations` — SQL migration files for database schema changes

## Getting started

### Prerequisites

- Node.js 18+
- npm
- Supabase project with the required tables and storage configuration

### Installation

1. Clone the repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root and add your Supabase variables:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```

4. Set up the database by running the files in `migrations/` in the Supabase SQL editor: first `complete_schema.sql`, then the `add_*.sql` files, then `allow_null_subject_on_files.sql`, and finally `2026_10_26_security_hardening.sql`.
5. In Supabase → Authentication → Sign In / Providers, enable **anonymous sign-ins** and keep **"Allow new users to sign up"** enabled. That switch is global; turning it off also blocks anonymous sign-ins, so students can't log in. Leaving it on is safe: new accounts are not admins and see nothing without the portal password. CAPTCHA is optional.
6. Make sure your admin account is in `public.admin_users` (the security migration seeds every existing non-anonymous user, so review that list):

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

7. Sign in at `/admin/login`, then set a new portal password under Settings. The default password is `iict@kuet`.
8. Start the app:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` starts the dev server
- `npm run build` creates the production build
- `npm run lint` and `npm run typecheck` run the checks

## Build

To create a production build:

```bash
npm run build
```

## Notes

- This project is tailored to the IICT KUET academic workflow and is intended for a specific institutional context.
- The README reflects the implemented features and current app behavior, rather than generic app scaffolding or outdated assumptions.
- Some routes such as archive and club are present in the codebase but are not currently active in the main navigation.

## License

This project is proprietary software for the ICTHub academic platform.
