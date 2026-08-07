import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

// Access control
import PortalProtectedRoute from "./components/PortalProtectedRoute";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import PortalLogin from "./pages/PortalLogin";
import SubjectsPage from "./pages/Subjects";
import SubjectDetailPage from "./pages/SubjectDetail";
import NotesPage from "./pages/Notes";
import NoteDetailPage from "./pages/NoteDetail";
import InformationPage from "./pages/Information";
import CalendarPage from "./pages/Calendar";
import FilesPage from "./pages/Files";
import ArchivePage from "./pages/Archive";
import NotificationsPage from "./pages/Notifications";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminSemesters from "./pages/admin/Semesters";
import AdminSemesterForm from "./pages/admin/SemesterForm";
import AdminSubjects from "./pages/admin/Subjects";
import AdminSubjectForm from "./pages/admin/SubjectForm";
import AdminNotes from "./pages/admin/Notes";
import AdminNoteForm from "./pages/admin/NoteForm";
import AdminInfoCategories from "./pages/admin/InfoCategories";
import AdminInfoCategoryForm from "./pages/admin/InfoCategoryForm";
import AdminInfoNotes from "./pages/admin/InfoNotes";
import AdminInfoNoteForm from "./pages/admin/InfoNoteForm";
import AdminCalendar from "./pages/admin/Calendar";
import AdminEventForm from "./pages/admin/EventForm";
import AdminFiles from "./pages/admin/Files";
import AdminFileForm from "./pages/admin/FileForm";
import AdminSettings from "./pages/admin/Settings";
import AdminAnalytics from "./pages/admin/Analytics";

// Admin-only protected route
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin/login" />;
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      {/* Portal login */}
      <Route path="/login" element={<PortalLogin />} />

      {/* Admin login */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/manage" element={<Navigate to="/admin/login" />} />
      <Route path="/student-login" element={<Navigate to="/login" />} />

      {/* Portal-protected public routes */}
      <Route
        path="/"
        element={
          <PortalProtectedRoute>
            <MainLayout />
          </PortalProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="subjects/:id" element={<SubjectDetailPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="notes/:id" element={<NoteDetailPage />} />
        <Route path="information" element={<InformationPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="files" element={<FilesPage />} />
        <Route path="archive" element={<ArchivePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Admin-only routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="semesters" element={<AdminSemesters />} />
        <Route path="semesters/new" element={<AdminSemesterForm />} />
        <Route path="semesters/:id" element={<AdminSemesterForm />} />
        <Route path="subjects" element={<AdminSubjects />} />
        <Route path="subjects/new" element={<AdminSubjectForm />} />
        <Route path="subjects/:id" element={<AdminSubjectForm />} />
        <Route path="notes" element={<AdminNotes />} />
        <Route path="notes/new" element={<AdminNoteForm />} />
        <Route path="notes/:id" element={<AdminNoteForm />} />
        <Route path="info-categories" element={<AdminInfoCategories />} />
        <Route path="info-categories/new" element={<AdminInfoCategoryForm />} />
        <Route path="info-categories/:id" element={<AdminInfoCategoryForm />} />
        <Route path="info-notes" element={<AdminInfoNotes />} />
        <Route path="info-notes/new" element={<AdminInfoNoteForm />} />
        <Route path="info-notes/:id" element={<AdminInfoNoteForm />} />
        <Route path="calendar" element={<AdminCalendar />} />
        <Route path="events/new" element={<AdminEventForm />} />
        <Route path="events/:id" element={<AdminEventForm />} />
        <Route path="files" element={<AdminFiles />} />
        <Route path="files/new" element={<AdminFileForm />} />
        <Route path="files/:id" element={<AdminFileForm />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="analytics" element={<AdminAnalytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
