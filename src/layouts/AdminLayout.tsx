import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { AdminConfirmProvider } from "../components/AdminConfirm";
import ErrorBoundary from "../components/ErrorBoundary";
import "../styles/admin.css";

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout flex h-screen bg-[#f9fafb]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <AdminConfirmProvider>
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </AdminConfirmProvider>
      </main>
    </div>
  );
};

export default AdminLayout;
