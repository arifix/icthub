import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  CornerDownLeft,
  File,
  FileText,
  Home,
  Info,
  Search,
  Bell,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatDate } from "../lib/format";

type Result = {
  key: string;
  group: string;
  title: string;
  subtitle?: string;
  to: string;
  icon: LucideIcon;
};

const PAGES: Result[] = [
  { key: "p-home", group: "Pages", title: "Home", to: "/", icon: Home },
  { key: "p-subjects", group: "Pages", title: "Subjects", to: "/subjects", icon: BookOpen },
  { key: "p-notes", group: "Pages", title: "Notes", to: "/notes", icon: FileText },
  { key: "p-calendar", group: "Pages", title: "Calendar", to: "/calendar", icon: Calendar },
  { key: "p-files", group: "Pages", title: "Files", to: "/files", icon: File },
  { key: "p-info", group: "Pages", title: "Information", to: "/information", icon: Info },
  { key: "p-notifications", group: "Pages", title: "Notifications", to: "/notifications", icon: Bell },
];

// Characters with meaning in PostgREST filter syntax or LIKE patterns.
const cleanTerm = (term: string) => term.replace(/[%_,()*\\"'.:]/g, " ").replace(/\s+/g, " ").trim();

const search = async (raw: string): Promise<Result[]> => {
  const term = cleanTerm(raw);
  if (term.length < 2) return [];
  const pattern = `%${term}%`;

  const [subjects, notes, files, events] = await Promise.all([
    supabase
      .from("subjects")
      .select("id, title, code, semester:semesters!inner(is_current)")
      .eq("semester.is_current", true)
      .or(`title.ilike.${pattern},code.ilike.${pattern}`)
      .limit(5),
    supabase
      .from("notes")
      .select("id, title, subjects:subject_id (code), semester:semesters!inner(is_current)")
      .eq("semester.is_current", true)
      .ilike("title", pattern)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("files")
      .select("id, name, file_type, semester:semesters!inner(is_current)")
      .eq("semester.is_current", true)
      .ilike("name", pattern)
      .limit(5),
    supabase
      .from("events")
      .select("id, title, date, semester:semesters!inner(is_current)")
      .eq("semester.is_current", true)
      .ilike("title", pattern)
      .order("date", { ascending: false })
      .limit(5),
  ]);

  return [
    ...(subjects.data ?? []).map((s) => ({
      key: `s-${s.id}`,
      group: "Subjects",
      title: s.title,
      subtitle: s.code,
      to: `/subjects/${s.id}`,
      icon: BookOpen,
    })),
    ...(notes.data ?? []).map((n) => ({
      key: `n-${n.id}`,
      group: "Notes",
      title: n.title,
      subtitle: n.subjects?.code,
      to: `/notes/${n.id}`,
      icon: FileText,
    })),
    ...(files.data ?? []).map((f) => ({
      key: `f-${f.id}`,
      group: "Files",
      title: f.name,
      subtitle: f.file_type?.toUpperCase(),
      to: `/files?q=${encodeURIComponent(f.name)}`,
      icon: File,
    })),
    ...(events.data ?? []).map((e) => ({
      key: `e-${e.id}`,
      group: "Events",
      title: e.title,
      subtitle: formatDate(e.date),
      to: `/calendar?date=${e.date}`,
      icon: Calendar,
    })),
  ];
};

const SearchPalette: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setActive(0);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (cleanTerm(query).length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const found = await search(query).catch(() => []);
      if (!cancelled) {
        setResults(found);
        setActive(0);
        setSearching(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open]);

  const items = useMemo(() => {
    if (query.trim().length < 2) return PAGES;
    const q = query.toLowerCase();
    return [...PAGES.filter((p) => p.title.toLowerCase().includes(q)), ...results];
  }, [query, results]);

  const go = (item: Result) => {
    onClose();
    navigate(item.to);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && items[active]) {
      event.preventDefault();
      go(items[active]);
    } else if (event.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    document.getElementById(`search-item-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  let lastGroup = "";

  // Portal to <body>: the header's backdrop-filter would otherwise trap position:fixed.
  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/40 px-4 pt-[10vh] backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search ICTHub"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-pop animate-rise-in"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-5 w-5 shrink-0 text-ink-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search subjects, notes, files, events…"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={items[active] ? `search-item-${active}` : undefined}
            className="h-14 flex-1 bg-transparent text-base text-ink placeholder:text-ink-subtle focus:outline-none"
          />
          <kbd className="kbd hidden sm:inline-flex">Esc</kbd>
        </div>

        <ul id="search-results" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
          {items.map((item, index) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <React.Fragment key={item.key}>
                {header && (
                  <li role="presentation" className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                    {header}
                  </li>
                )}
                <li
                  id={`search-item-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseMove={() => setActive(index)}
                  onClick={() => go(item)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${
                    index === active ? "bg-accent-soft" : ""
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                      index === active ? "bg-accent text-accent-fg" : "bg-surface-2 text-ink-subtle"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
                    {item.subtitle && <span className="block truncate text-xs text-ink-subtle">{item.subtitle}</span>}
                  </span>
                  {index === active && <CornerDownLeft className="h-4 w-4 text-ink-subtle" />}
                </li>
              </React.Fragment>
            );
          })}
          {query.trim().length >= 2 && !searching && items.length === 0 && (
            <li className="px-3 py-10 text-center text-sm text-ink-subtle">No results for “{query.trim()}”</li>
          )}
          {searching && <li className="px-3 py-3 text-center text-xs text-ink-subtle">Searching…</li>}
        </ul>

        <div className="hidden items-center gap-4 border-t border-line bg-surface-2 px-4 py-2 text-xs text-ink-subtle sm:flex">
          <span className="flex items-center gap-1">
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="kbd">↵</kbd> open
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SearchPalette;
