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

## Actual app behavior

The current project includes these operational flows:

- Admin login uses Supabase Auth
- Student access uses a portal password stored in Supabase `portal_settings`
- The app tracks the current semester and filters active content for the portal
- Notification creation is handled in the app logic for file upload, note creation, and event creation
- Archive and club routes exist in the router but are currently hidden from the main navigation

## Tech stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Supabase (database + auth + storage)
- React Router DOM
- React Hot Toast
- Lucide React
- React Quill
- date-fns
- html2canvas, jsPDF, pdf-lib

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

4. Set up the Supabase database using the migration files in `migrations/` and configure the required storage bucket(s) for uploaded files.
5. Start the app:

   ```bash
   npm run dev
   ```

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
