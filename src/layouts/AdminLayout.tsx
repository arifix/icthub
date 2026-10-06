import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { AdminConfirmProvider } from "../components/AdminConfirm";

const AdminLayout: React.FC = () => {
  return (
    <div className="admin-layout flex h-screen bg-[#f9fafb]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <AdminConfirmProvider>
          <Outlet />
        </AdminConfirmProvider>
      </main>
    </div>
  );
};

export default AdminLayout;
