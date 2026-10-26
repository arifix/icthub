import { htmlToText } from "./sanitize";

type CalendarEvent = {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  description?: string | null;
  subjectLabel?: string | null;
};

const escape = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

// RFC 5545: lines longer than 75 octets must be folded.
const fold = (line: string) => line.match(/.{1,73}/g)?.join("\r\n ") ?? line;

const compactDate = (dateOnly: string) => dateOnly.replace(/-/g, "");

const nextDay = (dateOnly: string) => {
  const date = new Date(`${dateOnly}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
};

export const buildICS = (events: CalendarEvent[], calendarName = "ICTHub"): string => {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ICTHub//Academic Calendar//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escape(calendarName)}`,
  ];
  for (const event of events) {
    const description = [event.subjectLabel, htmlToText(event.description)].filter(Boolean).join("\n\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:icthub-event-${event.id}@icthub`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compactDate(event.date)}`,
      `DTEND;VALUE=DATE:${nextDay(event.date)}`,
      `SUMMARY:${escape(event.title)}`,
      ...(description ? [`DESCRIPTION:${escape(description)}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n");
};

export const downloadICS = (events: CalendarEvent[], fileName: string, calendarName?: string) => {
  const blob = new Blob([buildICS(events, calendarName)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".ics") ? fileName : `${fileName}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
