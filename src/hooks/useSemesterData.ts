import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";

type Semester = Database["public"]["Tables"]["semesters"]["Row"];

export const useSemesterData = () => {
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all semesters
        const { data: semestersData, error: semestersError } = await supabase
          .from("semesters")
          .select("*")
          .order("start_date", { ascending: false });

        if (semestersError) throw semestersError;

        setAllSemesters(semestersData || []);

        // Find current semester
        const current = semestersData?.find((s) => s.is_current);
        setCurrentSemester(current || null);
      } catch (err) {
        console.error("Error fetching semesters:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load semesters"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSemesters();
  }, []);

  const updateCurrentSemester = async (semesterId: number) => {
    try {
      const { error } = await supabase
        .from("semesters")
        .update({ is_current: true })
        .eq("id", semesterId);

      if (error) throw error;

      // Refresh data
      const { data: semestersData } = await supabase
        .from("semesters")
        .select("*")
        .order("start_date", { ascending: false });

      setAllSemesters(semestersData || []);
      const current = semestersData?.find((s) => s.is_current);
      setCurrentSemester(current || null);

      return true;
    } catch (err) {
      console.error("Error updating current semester:", err);
      throw err;
    }
  };

  return {
    currentSemester,
    allSemesters,
    loading,
    error,
    updateCurrentSemester,
  };
};
