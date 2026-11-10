import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { errorMessage, supabase } from "../lib/supabase";
import type { PortalStatus, RedeemResult } from "../types/supabase";
import { removeKey } from "../lib/storage";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  /** True until the session and its server-side permissions are known. */
  loading: boolean;
  /** Verified server-side via admin_users, never inferred from "has a session". */
  isAdmin: boolean;
  /** Student (or admin) may read portal content. */
  hasPortalAccess: boolean;
  studentName: string | null;
  /** An admin blocked the IP this student is using. */
  isBlocked: boolean;
  /** An admin blocked the name this student signed in with. */
  isNameBlocked: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterPortal: (password: string, studentName: string) => Promise<void>;
  leavePortal: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const EMPTY_STATUS: PortalStatus = { has_access: false, is_admin: false, student_name: null };

// Keys written by older versions of the app.
const LEGACY_KEYS = ["icthub_access", "ict_portal_student_name"];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [status, setStatus] = useState<PortalStatus>(EMPTY_STATUS);
  const [statusUserId, setStatusUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    LEGACY_KEYS.forEach(removeKey);

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });

    // Never await Supabase calls inside this callback (it can deadlock the client).
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSessionReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;

  const refreshStatus = useCallback(async (uid: string | null) => {
    if (!uid) {
      setStatus(EMPTY_STATUS);
      setStatusUserId(null);
      return;
    }
    const { data, error } = await supabase.rpc("portal_status");
    setStatus(error || !data ? EMPTY_STATUS : (data as PortalStatus));
    setStatusUserId(uid);
  }, []);

  // Re-check permissions only when the signed-in user changes, not on token refresh.
  useEffect(() => {
    if (!sessionReady) return;
    void refreshStatus(userId);
  }, [sessionReady, userId, refreshStatus]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error("Invalid email or password");

    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      await supabase.auth.signOut();
      throw new Error("This account does not have admin access");
    }
    setSession(data.session);
    await refreshStatus(data.user.id);
  }, [refreshStatus]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setStatus(EMPTY_STATUS);
  }, []);

  const enterPortal = useCallback(
    async (password: string, studentName: string) => {
      let uid = (await supabase.auth.getSession()).data.session?.user.id ?? null;
      if (!uid) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.user) {
          console.error("Anonymous sign-in failed:", error);
          const message = error?.message ?? "";
          // Both mean the Supabase project blocks new (anonymous) users.
          if (/signups? not allowed|anonymous sign-ins are disabled/i.test(message)) {
            throw new Error("Portal sign-in is currently disabled. Please contact the administrator.");
          }
          if (/rate limit/i.test(message)) {
            throw new Error("Too many sign-in attempts from this network. Please try again in a few minutes.");
          }
          if (/captcha/i.test(message)) {
            throw new Error("Sign-in verification failed. Please reload the page and try again.");
          }
          throw new Error("Could not start a session. Check your connection and try again.");
        }
        uid = data.user.id;
      }

      const { data, error } = await supabase.rpc("redeem_portal_access", {
        p_password: password,
        p_student_name: studentName,
      });
      if (error) throw new Error(errorMessage(error, "Could not verify password"));
      const result = data as RedeemResult;
      if (!result.ok) throw new Error(result.error);

      await refreshStatus(uid);
    },
    [refreshStatus],
  );

  const leavePortal = useCallback(async () => {
    if (status.is_admin) {
      await signOut();
      return;
    }
    await supabase.rpc("leave_portal");
    await supabase.auth.signOut();
    setStatus(EMPTY_STATUS);
  }, [status.is_admin, signOut]);

  const loading = !sessionReady || statusUserId !== userId;

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isAdmin: !loading && status.is_admin,
      hasPortalAccess: !loading && status.has_access,
      studentName: status.student_name ?? null,
      isBlocked: !loading && !!status.blocked,
      isNameBlocked: !loading && !!status.name_blocked,
      signIn,
      signOut,
      enterPortal,
      leavePortal,
    }),
    [session, loading, status, signIn, signOut, enterPortal, leavePortal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
