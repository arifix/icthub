import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";
import PortalProtectedRoute from "./components/PortalProtectedRoute";
import { FullPageLoader } from "./components/ui";

// Portal
const Home = lazy(() => import("./pages/Home"));
const PortalLogin = lazy(() => import("./pages/PortalLogin"));
const SubjectsPage = lazy(() => import("./pages/Subjects"));
const SubjectDetailPage = lazy(() => import("./pages/SubjectDetail"));
const NotesPage = lazy(() => import("./pages/Notes"));
const NoteDetailPage = lazy(() => import("./pages/NoteDetail"));
const InformationPage = lazy(() => import("./pages/Information"));
const CalendarPage = lazy(() => import("./pages/Calendar"));
const FilesPage = lazy(() => import("./pages/Files"));
const ArchivePage = lazy(() => import("./pages/Archive"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const Club = lazy(() => import("./pages/Club"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminSemesters = lazy(() => import("./pages/admin/Semesters"));
const AdminSemesterForm = lazy(() => import("./pages/admin/SemesterForm"));
const AdminSubjects = lazy(() => import("./pages/admin/Subjects"));
const AdminSubjectForm = lazy(() => import("./pages/admin/SubjectForm"));
const AdminNotes = lazy(() => import("./pages/admin/Notes"));
const AdminNoteForm = lazy(() => import("./pages/admin/NoteForm"));
const AdminInfoCategories = lazy(() => import("./pages/admin/InfoCategories"));
const AdminInfoCategoryForm = lazy(() => import("./pages/admin/InfoCategoryForm"));
const AdminInfoNotes = lazy(() => import("./pages/admin/InfoNotes"));
const AdminInfoNoteForm = lazy(() => import("./pages/admin/InfoNoteForm"));
const AdminCalendar = lazy(() => import("./pages/admin/Calendar"));
const AdminEventForm = lazy(() => import("./pages/admin/EventForm"));
const AdminFiles = lazy(() => import("./pages/admin/Files"));
const AdminFileForm = lazy(() => import("./pages/admin/FileForm"));
const AdminComments = lazy(() => import("./pages/admin/Comments"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
};

function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/login" element={<PortalLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/manage" element={<Navigate to="/admin/login" replace />} />
        <Route path="/student-login" element={<Navigate to="/login" replace />} />

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
          <Route path="club" element={<Club />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
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
          <Route path="comments" element={<AdminComments />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
