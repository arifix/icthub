import React from "react";
import { Navigate } from "react-router-dom";
import { usePortalAccess } from "../context/PortalAccessContext";

const PortalProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = usePortalAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" />;

  return <>{children}</>;
};

export default PortalProtectedRoute;
