export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Insert: columns with database defaults become optional.
type InsertOf<Row, Optional extends keyof Row> = Omit<Row, Optional> &
  Partial<Pick<Row, Optional>>;

type Rel<
  Name extends string,
  Column extends string,
  Target extends string,
> = {
  foreignKeyName: Name;
  columns: [Column];
  isOneToOne: false;
  referencedRelation: Target;
  referencedColumns: ["id"];
};

type Table<
  Row,
  Optional extends keyof Row,
  Relationships extends unknown[] = [],
> = {
  Row: Row;
  Insert: InsertOf<Row, Optional>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

type SemesterRow = {
  id: number;
  created_at: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

type SubjectRow = {
  id: number;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  additional_info: string | null;
  code: string;
  is_active: boolean;
  semester_id: number | null;
};

type NoteRow = {
  id: number;
  created_at: string;
  updated_at: string;
  subject_id: number;
  title: string;
  content: string;
  summary: string | null;
  is_active: boolean;
  semester_id: number | null;
};

type EventRow = {
  id: number;
  created_at: string;
  updated_at: string;
  date: string;
  title: string;
  description: string | null;
  subject_id: number | null;
  is_active: boolean;
  semester_id: number | null;
};

type FileRow = {
  id: number;
  created_at: string;
  updated_at: string;
  subject_id: number | null;
  name: string;
  file_path: string;
  storage_path: string | null;
  file_type: string;
  size: number;
  is_active: boolean;
  semester_id: number | null;
};

type NotificationRow = {
  id: number;
  created_at: string;
  type: "note" | "file" | "event";
  title: string;
  message: string;
  related_id: number;
  semester_id: number;
  subject_id: number | null;
  created_by: string;
  is_read: boolean;
};

type InfoCategoryRow = {
  id: number;
  created_at: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

type InfoNoteRow = {
  id: number;
  created_at: string;
  updated_at: string;
  category_id: number;
  title: string;
  content: string;
  sort_order: number;
  is_active: boolean;
};

export type ChatMessageKind = "message" | "suggestion" | "feedback";

type ChatMessageRow = {
  id: number;
  created_at: string;
  user_id: string | null;
  author_name: string;
  author_role: "student" | "admin";
  kind: ChatMessageKind;
  content: string;
};

type NoteCommentRow = {
  id: number;
  created_at: string;
  note_id: number;
  parent_id: number | null;
  user_id: string | null;
  author_name: string;
  author_role: "student" | "admin";
  content: string;
};

type PageVisitRow = {
  id: number;
  created_at: string;
  page: string;
  event_type: string;
  event_label: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Json | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  user_agent: string | null;
  referrer: string | null;
  session_id: string | null;
  student_name: string | null;
  user_id: string | null;
};

type PortalMemberRow = {
  user_id: string;
  student_name: string;
  password_version: number;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
};

type AdminUserRow = {
  user_id: string;
  created_at: string;
};

type PortalSettingRow = {
  id: number;
  created_at: string;
  key: string;
  value: string;
};

export type PortalStatus = {
  has_access: boolean;
  is_admin: boolean;
  student_name?: string | null;
};

export type RedeemResult =
  | { ok: true; student_name: string; expires_at: string }
  | { ok: false; error: string };

export type PortalOverview = {
  password_updated_at: string;
  session_days: number;
  active_sessions: number;
  failed_attempts_24h: number;
};

export interface Database {
  public: {
    Tables: {
      semesters: Table<SemesterRow, "id" | "created_at" | "is_current">;
      subjects: Table<
        SubjectRow,
        | "id"
        | "created_at"
        | "updated_at"
        | "description"
        | "additional_info"
        | "is_active"
        | "semester_id",
        [Rel<"subjects_semester_id_fkey", "semester_id", "semesters">]
      >;
      notes: Table<
        NoteRow,
        | "id"
        | "created_at"
        | "updated_at"
        | "content"
        | "summary"
        | "is_active"
        | "semester_id",
        [
          Rel<"notes_subject_id_fkey", "subject_id", "subjects">,
          Rel<"notes_semester_id_fkey", "semester_id", "semesters">,
        ]
      >;
      events: Table<
        EventRow,
        | "id"
        | "created_at"
        | "updated_at"
        | "description"
        | "subject_id"
        | "is_active"
        | "semester_id",
        [
          Rel<"events_subject_id_fkey", "subject_id", "subjects">,
          Rel<"events_semester_id_fkey", "semester_id", "semesters">,
        ]
      >;
      files: Table<
        FileRow,
        | "id"
        | "created_at"
        | "updated_at"
        | "subject_id"
        | "storage_path"
        | "file_type"
        | "size"
        | "is_active"
        | "semester_id",
        [
          Rel<"files_subject_id_fkey", "subject_id", "subjects">,
          Rel<"files_semester_id_fkey", "semester_id", "semesters">,
        ]
      >;
      notifications: Table<
        NotificationRow,
        | "id"
        | "created_at"
        | "message"
        | "related_id"
        | "subject_id"
        | "created_by"
        | "is_read",
        [
          Rel<"notifications_subject_id_fkey", "subject_id", "subjects">,
          Rel<"notifications_semester_id_fkey", "semester_id", "semesters">,
        ]
      >;
      info_categories: Table<
        InfoCategoryRow,
        "id" | "created_at" | "description" | "sort_order" | "is_active"
      >;
      info_notes: Table<
        InfoNoteRow,
        "id" | "created_at" | "updated_at" | "content" | "sort_order" | "is_active",
        [Rel<"info_notes_category_id_fkey", "category_id", "info_categories">]
      >;
      note_comments: Table<
        NoteCommentRow,
        // author fields are set server-side by a trigger
        "id" | "created_at" | "parent_id" | "user_id" | "author_name" | "author_role",
        [
          Rel<"note_comments_note_id_fkey", "note_id", "notes">,
          Rel<"note_comments_parent_id_fkey", "parent_id", "note_comments">,
        ]
      >;
      chat_messages: Table<
        ChatMessageRow,
        // author fields are set server-side by a trigger
        "id" | "created_at" | "user_id" | "author_name" | "author_role" | "kind"
      >;
      page_visits: Table<
        PageVisitRow,
        Exclude<keyof PageVisitRow, "page">
      >;
      portal_members: Table<PortalMemberRow, "created_at" | "last_seen_at">;
      admin_users: Table<AdminUserRow, "created_at">;
      portal_settings: Table<PortalSettingRow, "id" | "created_at">;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      has_portal_access: { Args: Record<string, never>; Returns: boolean };
      portal_status: { Args: Record<string, never>; Returns: Json };
      redeem_portal_access: {
        Args: { p_password: string; p_student_name: string };
        Returns: Json;
      };
      leave_portal: { Args: Record<string, never>; Returns: undefined };
      set_portal_password: {
        Args: { p_new_password: string };
        Returns: undefined;
      };
      revoke_all_portal_sessions: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      portal_overview: { Args: Record<string, never>; Returns: Json };
      cleanup_portal_data: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

type PublicTables = Database["public"]["Tables"];
export type Tables<T extends keyof PublicTables> = PublicTables[T]["Row"];
