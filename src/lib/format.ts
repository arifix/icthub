import { htmlToText } from "./sanitize";

/** YYYY-MM-DD in the viewer's local timezone. */
export const localISODate = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Parses a date-only string (YYYY-MM-DD) as local midnight, not UTC. */
export const parseDateOnly = (value: string): Date => new Date(`${value}T00:00:00`);

export const formatDate = (
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" },
): string => {
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? parseDateOnly(value)
      : new Date(value);
  return date.toLocaleDateString(undefined, options);
};

export const daysUntil = (dateOnly: string): number => {
  const today = parseDateOnly(localISODate());
  return Math.round((parseDateOnly(dateOnly).getTime() - today.getTime()) / 86_400_000);
};

export const relativeDay = (dateOnly: string): string => {
  const diff = daysUntil(dateOnly);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff < -1 && diff > -7) return `${-diff} days ago`;
  return formatDate(dateOnly);
};

export const timeAgo = (iso: string): string => {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 7 * 86_400) return `${Math.floor(seconds / 86_400)}d ago`;
  return formatDate(iso);
};

export const formatFileSize = (bytes: number): string => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
};

export const readingMinutes = (html: string): number =>
  Math.max(1, Math.ceil(htmlToText(html).split(/\s+/).filter(Boolean).length / 200));

export const pluralize = (count: number, word: string, plural = `${word}s`) =>
  `${count} ${count === 1 ? word : plural}`;
