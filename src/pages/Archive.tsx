import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Archive as ArchiveIcon, BookOpen, Calendar, ChevronDown, File, FileText } from "lucide-react";
import { supabase } from "../lib/supabase";
import { excerpt } from "../lib/sanitize";
import { formatDate } from "../lib/format";
import FileItem, { type FileItemData } from "../components/FileItem";
import { EmptyState, ErrorState, ListSkeleton, PageHeader, Segmented } from "../components/ui";
import type { Tables } from "../types/supabase";

type Semester = Tables<"semesters">;
type Subject = Pick<Tables<"subjects">, "id" | "title" | "code" | "description">;
type Note = Pick<Tables<"notes">, "id" | "title" | "content" | "created_at"> & { subjects: { code: string } | null };
type Event = Pick<Tables<"events">, "id" | "title" | "date"> & { subjects: { code: string } | null };
type Tab = "subjects" | "notes" | "files" | "events";

const ArchivePage: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("subjects");
  const [data, setData] = useState<{ subjects: Subject[]; notes: Note[]; files: FileItemData[]; events: Event[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    document.title = "Archive — ICTHub";
    supabase
      .from("semesters")
      .select("*")
      .eq("is_current", false)
      .order("start_date", { ascending: false })
      .then(({ data: rows }) => setSemesters(rows ?? []));
  }, []);

  useEffect(() => {
    if (!semesterId) {
      setData(null);
      return;
    }
    let active = true;
    setLoading(true);
    setFailed(false);
    Promise.all([
      supabase.from("subjects").select("id, title, code, description").eq("semester_id", semesterId).order("code"),
      supabase
        .from("notes")
        .select("id, title, content, created_at, subjects:subject_id (code)")
        .eq("semester_id", semesterId)
        .order("created_at", { ascending: false }),
      supabase
        .from("files")
        .select("id, name, file_path, storage_path, file_type, size, created_at, subject_id, subjects:subject_id (title, code)")
        .eq("semester_id", semesterId)
        .order("created_at", { ascending: false }),
      supabase.from("events").select("id, title, date, subjects:subject_id (code)").eq("semester_id", semesterId).order("date"),
    ]).then(([s, n, f, e]) => {
      if (!active) return;
      if (s.error || n.error || f.error || e.error) setFailed(true);
      else
        setData({
          subjects: s.data ?? [],
          notes: (n.data ?? []) as Note[],
          files: (f.data ?? []) as FileItemData[],
          events: (e.data ?? []) as Event[],
        });
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [semesterId]);

  return (
    <div>
      <PageHeader title="Archive" description="Browse material from previous semesters.">
        <div className="relative mt-6 max-w-xs">
          <select
            aria-label="Choose a semester"
            value={semesterId ?? ""}
            onChange={(e) => setSemesterId(Number(e.target.value) || null)}
            className="field cursor-pointer appearance-none pr-9"
          >
            <option value="">Choose a semester…</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
        </div>
      </PageHeader>

      <div className="container-page py-8">
        {!semesterId ? (
          <EmptyState
            icon={ArchiveIcon}
            title={semesters.length ? "Pick a semester" : "No past semesters"}
            description={semesters.length ? "Choose a previous semester above to see its material." : "Archived semesters will appear here."}
          />
        ) : failed ? (
          <ErrorState />
        ) : loading || !data ? (
          <ListSkeleton rows={5} />
        ) : (
          <>
            <div className="mb-6 overflow-x-auto">
              <Segmented<Tab>
                label="Archive content"
                value={tab}
                onChange={setTab}
                options={[
                  { value: "subjects", label: "Subjects", count: data.subjects.length },
                  { value: "notes", label: "Notes", count: data.notes.length },
                  { value: "files", label: "Files", count: data.files.length },
                  { value: "events", label: "Events", count: data.events.length },
                ]}
              />
            </div>

            {tab === "subjects" &&
              (data.subjects.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.subjects.map((s) => (
                    <Link key={s.id} to={`/subjects/${s.id}`} className="card-link p-5">
                      <span className="chip-accent font-mono">{s.code}</span>
                      <h3 className="mt-3 font-semibold text-ink">{s.title}</h3>
                      {s.description && <p className="mt-1 line-clamp-1 text-sm text-ink-subtle">{s.description}</p>}
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState compact icon={BookOpen} title="No subjects" />
              ))}

            {tab === "notes" &&
              (data.notes.length ? (
                <ul className="card divide-y divide-line overflow-hidden">
                  {data.notes.map((n) => (
                    <li key={n.id}>
                      <Link to={`/notes/${n.id}`} className="block p-4 transition hover:bg-surface-2">
                        <p className="text-xs text-ink-subtle">
                          {n.subjects?.code ?? "General"} · {formatDate(n.created_at)}
                        </p>
                        <p className="mt-0.5 font-medium text-ink">{n.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-sm text-ink-subtle">{excerpt(n.content, 160)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact icon={FileText} title="No notes" />
              ))}

            {tab === "files" &&
              (data.files.length ? (
                <div className="card divide-y divide-line overflow-hidden">
                  {data.files.map((f) => (
                    <FileItem key={f.id} file={f} page="/archive" />
                  ))}
                </div>
              ) : (
                <EmptyState compact icon={File} title="No files" />
              ))}

            {tab === "events" &&
              (data.events.length ? (
                <ul className="card divide-y divide-line overflow-hidden">
                  {data.events.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-4 p-4">
                      <span className="font-medium text-ink">{e.title}</span>
                      <span className="shrink-0 text-sm text-ink-subtle">
                        {e.subjects?.code ?? "General"} · {formatDate(e.date)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact icon={Calendar} title="No events" />
              ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ArchivePage;
