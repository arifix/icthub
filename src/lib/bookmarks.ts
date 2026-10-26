import { useCallback, useState } from "react";
import { isNumberArray, readJSON, writeJSON } from "./storage";

const KEY = "icthub_bookmarked_notes";

export const useBookmarks = () => {
  const [ids, setIds] = useState<number[]>(() => readJSON(KEY, [], isNumberArray));

  const toggle = useCallback((id: number) => {
    setIds((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      writeJSON(KEY, next);
      return next;
    });
  }, []);

  return { ids, has: (id: number) => ids.includes(id), toggle };
};
