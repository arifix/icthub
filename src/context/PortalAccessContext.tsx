import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type PortalAccessContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (password: string) => Promise<void>;
  signOut: () => void;
};

const PortalAccessContext = createContext<PortalAccessContextType | undefined>(
  undefined,
);

export const PortalAccessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      const stored = localStorage.getItem("portal_access");
      if (!stored) {
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
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("portal_access");
        }
      } catch {
        localStorage.removeItem("portal_access");
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const signIn = async (password: string) => {
    const { data, error } = await supabase
      .from("portal_settings")
      .select("value")
      .eq("key", "portal_password")
      .single();

    if (error || !data) throw new Error("Could not verify password");
    if (data.value !== password) throw new Error("Incorrect password");

    localStorage.setItem("portal_access", btoa(password));
    setIsAuthenticated(true);
  };

  const signOut = () => {
    localStorage.removeItem("portal_access");
    setIsAuthenticated(false);
  };

  return (
    <PortalAccessContext.Provider
      value={{ isAuthenticated, loading, signIn, signOut }}
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
