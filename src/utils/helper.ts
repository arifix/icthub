import { excerpt } from "../lib/sanitize";
import { localISODate } from "../lib/format";

/** Plain-text excerpt of editor HTML. Render it as text, never as HTML. */
export const stripHtmlAndTruncate = (html: string | null | undefined, limit = 50): string =>
  excerpt(html, limit);

export const isPastDate = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  const iso = typeof date === "string" ? date.slice(0, 10) : localISODate(date);
  return iso < localISODate();
};

type AlertEvent = { id: number; date: string; is_active?: boolean };
export type UpcomingAlert<T extends AlertEvent> = { label: string; date: string; count: number; events: T[] };

/** Events today / tomorrow / the day after. After 5 pm, today is skipped. */
export const getUpcomingEventAlert = <T extends AlertEvent>(events: T[]): UpcomingAlert<T>[] => {
  const labels = ["Today", "Tomorrow", "Day after tomorrow"];
  const start = new Date().getHours() >= 17 ? 1 : 0;
  const alerts: UpcomingAlert<T>[] = [];
  for (let i = start; i < 3; i++) {
    const day = new Date();
    day.setDate(day.getDate() + i);
    const iso = localISODate(day);
    const dayEvents = events.filter((e) => e.is_active !== false && e.date === iso);
    if (dayEvents.length) alerts.push({ label: labels[i]!, date: iso, count: dayEvents.length, events: dayEvents });
  }
  return alerts;
};
