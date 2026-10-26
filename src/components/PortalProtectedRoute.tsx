import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FullPageLoader } from "./ui";

const PortalProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasPortalAccess, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;

  if (!hasPortalAccess) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <>{children}</>;
};

export default PortalProtectedRoute;
