import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Tables } from "../types/supabase";

type Semester = Tables<"semesters">;

let cached: Promise<Semester | null> | null = null;

const fetchCurrent = async (): Promise<Semester | null> => {
  const { data, error } = await supabase
    .from("semesters")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();
  if (error) {
    cached = null; // don't cache failures
    throw error;
  }
  return data;
};

export const invalidateCurrentSemester = () => {
  cached = null;
};

/** Current semester, fetched once and shared across components. */
export const useCurrentSemester = () => {
  const [semester, setSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    cached ??= fetchCurrent();
    cached
      .then((value) => active && setSemester(value))
      .catch(() => active && setSemester(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { semester, loading };
};
