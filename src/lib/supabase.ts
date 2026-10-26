import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill them in.",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const STORAGE_BUCKET = "icthub-files";

/** Turns a Supabase/PostgREST error into a message that is safe to show users. */
export const errorMessage = (error: unknown, fallback = "Something went wrong") => {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    // Messages raised deliberately by our SQL functions are user-facing.
    if ((error as { code?: string }).code === "P0001") return message;
    if (/jwt|token|session/i.test(message)) return "Your session expired. Please sign in again.";
    if (/permission|row-level security|42501/i.test(message)) return "You don't have permission to do that.";
    if (/network|fetch/i.test(message)) return "Network error. Check your connection and try again.";
  }
  return fallback;
};
