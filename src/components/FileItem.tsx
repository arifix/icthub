import React, { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { toast } from "react-hot-toast";
import { downloadFile, fileTone, openFile, storageKeyOf } from "../lib/files";
import { formatDate, formatFileSize } from "../lib/format";
import { useTrack } from "../hooks/usePageTracking";
import type { Tables } from "../types/supabase";

export type FileItemData = Pick<
  Tables<"files">,
  "id" | "name" | "file_path" | "storage_path" | "file_type" | "size" | "created_at" | "subject_id"
> & { subjects?: { title: string; code: string } | null };

const FileItem: React.FC<{ file: FileItemData; page: string; showSubject?: boolean }> = ({
  file,
  page,
  showSubject = true,
}) => {
  const track = useTrack();
  const [busy, setBusy] = useState<"open" | "download" | null>(null);
  const isStored = storageKeyOf(file) !== null;
  const type = (file.file_type || "file").toLowerCase();

  const meta = {
    fileType: file.file_type,
    subjectId: file.subject_id,
    subjectCode: file.subjects?.code ?? null,
  };

  const run = async (action: "open" | "download") => {
    setBusy(action);
    track({
      eventType: action === "open" ? "file_open" : "file_download",
      page,
      label: file.name,
      entityType: "file",
      entityId: file.id,
      metadata: meta,
    });
    try {
      if (action === "open") await openFile(file);
      else await downloadFile(file);
    } catch {
      toast.error("Couldn't access this file. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 transition hover:bg-surface-2">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[11px] font-bold uppercase ${fileTone(type)}`}>
        {type.slice(0, 4)}
      </span>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => void run("open")}
          className="block max-w-full truncate text-left font-medium text-ink hover:text-accent-ink"
          title={file.name}
        >
          {file.name}
        </button>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-subtle">
          {showSubject && <span className="font-medium">{file.subjects?.code ?? "General"}</span>}
          {showSubject && <span aria-hidden>·</span>}
          <span>{formatFileSize(file.size)}</span>
          <span aria-hidden>·</span>
          <span>{formatDate(file.created_at)}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => void run("open")}
          disabled={busy !== null}
          aria-label={`Open ${file.name}`}
          className="icon-btn h-9 w-9"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
        {isStored && (
          <button
            type="button"
            onClick={() => void run("download")}
            disabled={busy !== null}
            className="btn-secondary btn-sm hidden sm:inline-flex"
          >
            <Download className="h-3.5 w-3.5" />
            {busy === "download" ? "Preparing…" : "Download"}
          </button>
        )}
        {isStored && (
          <button
            type="button"
            onClick={() => void run("download")}
            disabled={busy !== null}
            aria-label={`Download ${file.name}`}
            className="icon-btn h-9 w-9 sm:hidden"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FileItem;
