# StudyHub - Educational Management Platform

A comprehensive educational management platform built with React, TypeScript, Tailwind CSS, and Supabase for the Spring 2025 MBA batch at Khulna Khan Bahadur Ahsanullah University.

## Features

### For Students
- **Dashboard**: Overview of subjects, recent notes, and upcoming events
- **Subjects**: Browse all available courses with detailed information
- **Notes**: Access study materials and notes for each subject
- **Calendar**: View academic events, class schedules, and important dates
- **Files**: Download study materials, presentations, and resources


### For Administrators
- **Complete Management System**: Manage all aspects of the platform
- **Semester Management**: Create and manage academic semesters
- **Subject Management**: Add subjects
- **Content Management**: Add notes, files, and events
- **Calendar Management**: Schedule and manage academic events

## In-App Notifications

The platform includes a comprehensive in-app notification system that alerts users when:
- New files are uploaded
- New notes are added
- New events are scheduled

### Notification Features

- **Real-time Updates**: Notifications appear instantly when new content is added
- **Unread Counter**: Bell icon shows count of unread notifications
- **Smart Grouping**: Notifications are organized by semester and subject
- **Mark as Read**: Individual or bulk mark as read functionality
- **Rich Content**: Shows relevant details like subject, semester, and creator
- **Direct Links**: Click notifications to go directly to the related content

### Notification Types

- **📁 File Uploads**: Shows file name, type, and subject
- **📝 New Notes**: Shows note title and subject
- **📅 New Events**: Shows event title, date, and subject

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, Authentication, Storage)
- **Rich Text Editor**: React Quill
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Routing**: React Router DOM
- **Password Hashing**: bcryptjs
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Installation

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Copy `.env.example` to `.env` and fill in your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**:
   - Create the required tables using the provided SQL schema
   - Set up Row Level Security (RLS) policies
   - Configure storage buckets for file uploads

5. **Start the development server**:
   ```bash
   npm run dev
   ```

## Authentication

### Student Login
- Students log in using their student ID (format: 10025100040830XX) and password
- Student IDs follow the university's numbering system


### Admin Login
- Administrators log in using email and password via Supabase Auth
- Have full access to all management features

## Database Schema

The application uses the following main tables:
- `semesters` - Academic semesters
- `subjects` - Course subjects
- `notes` - Study notes and materials
- `events` - Academic calendar events
- `files` - File uploads and resources
- `notifications` - In-app notifications for users

## Security Features

- Row Level Security (RLS) on all tables
- Password hashing using bcryptjs
- Secure file storage with Supabase Storage
- Role-based access control
- Input validation and sanitization

## Deployment

The application can be deployed to any static hosting service:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting service

3. **Configure environment variables** on your hosting platform

## Contributing

This is a private educational platform. For any issues or feature requests, please contact the development team.

## License

This project is proprietary software developed for Khulna Khan Bahadur Ahsanullah University.