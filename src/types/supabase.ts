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
      teachers: {
        Row: {
          id: number;
          created_at: string;
          name: string;
          email: string;
          password: string | null;
          phone: string | null;
          department: string | null;
          designation: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: number;
          created_at?: string;
          name: string;
          email: string;
          password?: string | null;
          phone?: string | null;
          department?: string | null;
          designation?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: number;
          created_at?: string;
          name?: string;
          email?: string;
          password?: string | null;
          phone?: string | null;
          department?: string | null;
          designation?: string | null;
          is_active?: boolean;
        };
      };
      subject_teachers: {
        Row: {
          id: number;
          created_at: string;
          teacher_id: number;
          subject_id: number;
          semester_id: number;
          is_active: boolean;
        };
        Insert: {
          id?: number;
          created_at?: string;
          teacher_id: number;
          subject_id: number;
          semester_id: number;
          is_active?: boolean;
        };
        Update: {
          id?: number;
          created_at?: string;
          teacher_id?: number;
          subject_id?: number;
          semester_id?: number;
          is_active?: boolean;
        };
      };
      students: {
        Row: {
          id: number;
          created_at: string;
          name: string;
          id_no: string;
          program: string;
          semester: string;
          address: string;
          mobile_no: string;
          blood_group: string;
          email: string;
          company: string | null;
          position: string | null;
          company_address: string | null;
          specialization: string | null;
          is_active?: boolean;
          password?: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          name: string;
          id_no: string;
          program: string;
          semester: string;
          address: string;
          mobile_no: string;
          blood_group: string;
          email: string;
          company?: string | null;
          position?: string | null;
          company_address?: string | null;
          specialization?: string | null;
          is_active?: boolean;
          password?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          name?: string;
          id_no?: string;
          program?: string;
          semester?: string;
          address?: string;
          mobile_no?: string;
          blood_group?: string;
          email?: string;
          company?: string | null;
          position?: string | null;
          company_address?: string | null;
          specialization?: string | null;
          is_active?: boolean;
          password?: string | null;
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
      note_comments: {
        Row: {
          id: number;
          created_at: string;
          updated_at: string;
          note_id: number;
          user_id: string;
          user_type: string;
          user_name: string;
          content: string;
          parent_id: number | null;
          is_active: boolean;
        };
        Insert: {
          id?: number;
          created_at?: string;
          updated_at?: string;
          note_id: number;
          user_id: string;
          user_type: string;
          user_name: string;
          content: string;
          parent_id?: number | null;
          is_active?: boolean;
        };
        Update: {
          id?: number;
          created_at?: string;
          updated_at?: string;
          note_id?: number;
          user_id?: string;
          user_type?: string;
          user_name?: string;
          content?: string;
          parent_id?: number | null;
          is_active?: boolean;
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