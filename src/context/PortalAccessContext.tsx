import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import {
  clearStoredStudentName,
  getStoredStudentName,
  persistStudentName,
} from "../utils/portalStudent";

type PortalAccessContextType = {
  isAuthenticated: boolean;
  studentName: string | null;
  loading: boolean;
  signIn: (password: string, studentName?: string) => Promise<void>;
  signOut: () => void;
};

const PortalAccessContext = createContext<PortalAccessContextType | undefined>(
  undefined,
);

export const PortalAccessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    const verify = async () => {
      const stored = localStorage.getItem("icthub_access");
      if (!stored) {
        setStudentName(getStoredStudentName());
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase
          .from("portal_settings")
          .select("value")
          .eq("key", "portal_password")
          .single();

        if (data?.value && btoa(data.value) === stored) {
          const savedName = getStoredStudentName();
          if (isAdmin || savedName) {
            setIsAuthenticated(true);
            setStudentName(savedName);
          } else {
            localStorage.removeItem("icthub_access");
            setIsAuthenticated(false);
            setStudentName(null);
          }
        } else {
          localStorage.removeItem("icthub_access");
          setIsAuthenticated(false);
          setStudentName(null);
        }
      } catch {
        localStorage.removeItem("icthub_access");
        setIsAuthenticated(false);
        setStudentName(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [authLoading, isAdmin]);

  const signIn = async (password: string, providedStudentName?: string) => {
    const { data, error } = await supabase
      .from("portal_settings")
      .select("value")
      .eq("key", "portal_password")
      .single();

    if (error || !data) throw new Error("Could not verify password");
    if (data.value !== password) throw new Error("Incorrect password");

    if (!isAdmin) {
      const normalized = (providedStudentName ?? "").trim();
      if (!normalized) {
        throw new Error("Student name is required");
      }
      setStudentName(persistStudentName(normalized));
    } else {
      setStudentName(getStoredStudentName());
    }

    localStorage.setItem("icthub_access", btoa(password));
    setIsAuthenticated(true);
  };

  const signOut = () => {
    localStorage.removeItem("icthub_access");
    clearStoredStudentName();
    setStudentName(null);
    setIsAuthenticated(false);
  };

  return (
    <PortalAccessContext.Provider
      value={{ isAuthenticated, studentName, loading, signIn, signOut }}
    >
      {children}
    </PortalAccessContext.Provider>
  );
};

export const usePortalAccess = () => {
  const ctx = useContext(PortalAccessContext);
  if (!ctx)
    throw new Error("usePortalAccess must be used inside PortalAccessProvider");
  return ctx;
};
