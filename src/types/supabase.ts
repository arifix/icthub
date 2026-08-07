export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      semesters: {
        Row: {
          id: number;
          created_at: string;
          name: string;
          start_date: string;
          end_date: string;
          is_current: boolean;
        };
        Insert: {
          id?: number;
          created_at?: string;
          name: string;
          start_date: string;
          end_date: string;
          is_current?: boolean;
        };
        Update: {
          id?: number;
          created_at?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          is_current?: boolean;
        };
      };
      subjects: {
        Row: {
          id: number;
          created_at: string;
          title: string;
          description: string;
          code: string;
          is_active?: boolean;
          semester_id: number | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          title: string;
          description: string;
          code: string;
          is_active?: boolean;
          semester_id?: number | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          title?: string;
          description?: string;
          code?: string;
          is_active?: boolean;
          semester_id?: number | null;
        };
      };
      info_categories: {
        Row: {
          id: number;
          created_at: string;
          name: string;
          description: string;
          sort_order: number;
          is_active?: boolean;
        };
        Insert: {
          id?: number;
          created_at?: string;
          name: string;
          description?: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: number;
          created_at?: string;
          name?: string;
          description?: string;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      info_notes: {
        Row: {
          id: number;
          created_at: string;
          category_id: number;
          title: string;
          content: string;
          sort_order: number;
          is_active?: boolean;
        };
        Insert: {
          id?: number;
          created_at?: string;
          category_id: number;
          title: string;
          content: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: number;
          created_at?: string;
          category_id?: number;
          title?: string;
          content?: string;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      note_comments: {
        Row: {
          id: number;
          created_at: string;
          note_id: number;
          parent_id: number | null;
          user_id: string | null;
          author_name: string;
          content: string;
        };
        Insert: {
          id?: number;
          created_at?: string;
          note_id: number;
          parent_id?: number | null;
          user_id?: string | null;
          author_name: string;
          content: string;
        };
        Update: {
          id?: number;
          created_at?: string;
          note_id?: number;
          parent_id?: number | null;
          user_id?: string | null;
          author_name?: string;
          content?: string;
        };
      };
      notes: {
        Row: {
          id: number;
          created_at: string;
          subject_id: number;
          title: string;
          content: string;
          summary: string | null;
          is_active?: boolean;
          semester_id: number | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          subject_id: number;
          title: string;
          content: string;
          summary?: string | null;
          is_active?: boolean;
          semester_id?: number | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          subject_id?: number;
          title?: string;
          content?: string;
          summary?: string | null;
          is_active?: boolean;
          semester_id?: number | null;
        };
      };
      events: {
        Row: {
          id: number;
          created_at: string;
          date: string;
          title: string;
          description: string;
          subject_id: number | null;
          is_active?: boolean;
          semester_id: number | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          date: string;
          title: string;
          description: string;
          subject_id?: number | null;
          is_active?: boolean;
          semester_id?: number | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          date?: string;
          title?: string;
          description?: string;
          subject_id?: number | null;
          is_active?: boolean;
          semester_id?: number | null;
        };
      };
      files: {
        Row: {
          id: number;
          created_at: string;
          subject_id: number;
          name: string;
          file_path: string;
          file_type: string;
          size: number;
          is_active?: boolean;
          semester_id: number | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          subject_id: number;
          name: string;
          file_path: string;
          file_type: string;
          size: number;
          is_active?: boolean;
          semester_id?: number | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          subject_id?: number;
          name?: string;
          file_path?: string;
          file_type?: string;
          size?: number;
          is_active?: boolean;
          semester_id?: number | null;
        };
      };
      notifications: {
        Row: {
          id: number;
          created_at: string;
          type: string;
          title: string;
          message: string;
          related_id: number;
          semester_id: number;
          subject_id: number | null;
          created_by: string;
          is_read: boolean;
        };
        Insert: {
          id?: number;
          created_at?: string;
          type: string;
          title: string;
          message: string;
          related_id: number;
          semester_id: number;
          subject_id?: number | null;
          created_by: string;
          is_read?: boolean;
        };
        Update: {
          id?: number;
          created_at?: string;
          type?: string;
          title?: string;
          message?: string;
          related_id?: number;
          semester_id?: number;
          subject_id?: number | null;
          created_by?: string;
          is_read?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}