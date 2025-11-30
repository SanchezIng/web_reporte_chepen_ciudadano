export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          role: 'citizen' | 'authority'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          role?: 'citizen' | 'authority'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          role?: 'citizen' | 'authority'
          created_at?: string
          updated_at?: string
        }
      }
      incident_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          created_at?: string
        }
      }
      incidents: {
        Row: {
          id: string
          user_id: string
          category_id: string
          title: string
          description: string
          latitude: number | null
          longitude: number | null
          address: string | null
          status: 'pending' | 'in_progress' | 'resolved' | 'rejected'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          incident_date: string
          created_at: string
          updated_at: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          title: string
          description: string
          latitude?: number | null
          longitude?: number | null
          address?: string | null
          status?: 'pending' | 'in_progress' | 'resolved' | 'rejected'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          incident_date: string
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          title?: string
          description?: string
          latitude?: number | null
          longitude?: number | null
          address?: string | null
          status?: 'pending' | 'in_progress' | 'resolved' | 'rejected'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          incident_date?: string
          created_at?: string
          updated_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
      }
      incident_images: {
        Row: {
          id: string
          incident_id: string
          image_url: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          incident_id: string
          image_url: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          incident_id?: string
          image_url?: string
          uploaded_at?: string
        }
      }
      incident_updates: {
        Row: {
          id: string
          incident_id: string
          user_id: string
          old_status: string | null
          new_status: string
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          incident_id: string
          user_id: string
          old_status?: string | null
          new_status: string
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          incident_id?: string
          user_id?: string
          old_status?: string | null
          new_status?: string
          comment?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_: string]: never
    }
    Functions: {
      [_: string]: never
    }
    Enums: {
      [_: string]: never
    }
  }
}
