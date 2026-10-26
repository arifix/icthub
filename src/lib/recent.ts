import { readJSON, writeJSON } from "./storage";

export type RecentNote = { id: number; title: string; subject?: string | null; at: number };

const KEY = "icthub_recent_notes";
const isRecentList = (v: unknown) =>
  Array.isArray(v) && v.every((item) => item && typeof item.id === "number" && typeof item.title === "string");

export const getRecentNotes = (): RecentNote[] => readJSON<RecentNote[]>(KEY, [], isRecentList);

export const rememberNote = (note: Omit<RecentNote, "at">) => {
  const next = [{ ...note, at: Date.now() }, ...getRecentNotes().filter((n) => n.id !== note.id)].slice(0, 6);
  writeJSON(KEY, next);
};

export const forgetNote = (id: number) => writeJSON(KEY, getRecentNotes().filter((n) => n.id !== id));
