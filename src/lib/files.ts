import { STORAGE_BUCKET, supabase } from "./supabase";
import { safeExternalUrl } from "./sanitize";
import type { Tables } from "../types/supabase";

type FileLike = Pick<Tables<"files">, "name" | "file_path" | "storage_path" | "file_type">;

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

const LEGACY_PUBLIC_MARKER = `/storage/v1/object/public/${STORAGE_BUCKET}/`;

/** Object key inside the private bucket, or null for external links. */
export const storageKeyOf = (file: Pick<FileLike, "file_path" | "storage_path">): string | null => {
  if (file.storage_path) return file.storage_path;
  const index = file.file_path.indexOf(LEGACY_PUBLIC_MARKER);
  if (index >= 0) return decodeURIComponent(file.file_path.slice(index + LEGACY_PUBLIC_MARKER.length));
  return null;
};

/** Short-lived signed URL for stored files; validated URL for external links. */
export const resolveFileUrl = async (file: FileLike, download = false): Promise<string> => {
  const key = storageKeyOf(file);
  if (key) {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(key, 60 * 10, download ? { download: downloadName(file) } : undefined);
    if (error || !data) throw error ?? new Error("Could not create link");
    return data.signedUrl;
  }
  const external = safeExternalUrl(file.file_path);
  if (!external) throw new Error("This file link is invalid");
  return external;
};

const downloadName = (file: FileLike) => {
  const ext = file.file_type ? `.${file.file_type}` : "";
  return file.name.toLowerCase().endsWith(ext.toLowerCase()) ? file.name : `${file.name}${ext}`;
};

export const openFile = async (file: FileLike) => {
  // Open the tab synchronously so popup blockers allow it, then point it at the signed URL.
  const tab = window.open("about:blank", "_blank");
  try {
    const url = await resolveFileUrl(file);
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      window.location.href = url;
    }
  } catch (error) {
    tab?.close();
    throw error;
  }
};

export const downloadFile = async (file: FileLike) => {
  const url = await resolveFileUrl(file, true);
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  link.download = downloadName(file);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/** Collision-free, URL-safe object key that keeps a readable file name. */
export const buildStorageKey = (fileName: string): string => {
  const dot = fileName.lastIndexOf(".");
  const base = (dot > 0 ? fileName.slice(0, dot) : fileName)
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "file";
  const ext = dot > 0 ? fileName.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) : "";
  const stamp = new Date().toISOString().slice(0, 10);
  return `${stamp}/${crypto.randomUUID()}-${base}${ext ? `.${ext}` : ""}`;
};

export const fileExtension = (name: string) =>
  name.includes(".") ? name.split(".").pop()!.toLowerCase().slice(0, 10) : "";

export const FILE_TONES: Record<string, string> = {
  pdf: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  doc: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  docx: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  ppt: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  pptx: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  xls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  xlsx: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  zip: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

export const fileTone = (type: string) =>
  FILE_TONES[type?.toLowerCase()] ?? "bg-surface-2 text-ink-muted";
