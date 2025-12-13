/**
 * Supabase Database 型別定義
 * 
 * 注意：此檔案可使用 Supabase CLI 自動產生：
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
 */

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
      users: {
        Row: {
          id: string
          line_id: string
          display_name: string
          picture_url: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          line_id: string
          display_name: string
          picture_url?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          line_id?: string
          display_name?: string
          picture_url?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lists: {
        Row: {
          id: string
          title: string
          description: string | null
          cover_image: string | null
          owner_id: string
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          cover_image?: string | null
          owner_id: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          cover_image?: string | null
          owner_id?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      list_members: {
        Row: {
          id: string
          list_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          invited_at: string
          joined_at: string | null
        }
        Insert: {
          id?: string
          list_id: string
          user_id: string
          role?: 'owner' | 'editor' | 'viewer'
          invited_at?: string
          joined_at?: string | null
        }
        Update: {
          id?: string
          list_id?: string
          user_id?: string
          role?: 'owner' | 'editor' | 'viewer'
          invited_at?: string
          joined_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          list_id: string
          name: string
          color: string
          icon: string | null
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          name: string
          color?: string
          icon?: string | null
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          name?: string
          color?: string
          icon?: string | null
          order?: number
          created_at?: string
        }
      }
      items: {
        Row: {
          id: string
          list_id: string
          category_id: string | null
          title: string
          description: string | null
          is_completed: boolean
          completed_at: string | null
          completed_by: string | null
          due_date: string | null
          priority: 'low' | 'medium' | 'high' | null
          order: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          category_id?: string | null
          title: string
          description?: string | null
          is_completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | null
          order?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          category_id?: string | null
          title?: string
          description?: string | null
          is_completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | null
          order?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      member_role: 'owner' | 'editor' | 'viewer'
      priority_level: 'low' | 'medium' | 'high'
    }
  }
}

// 便利型別匯出
export type User = Database['public']['Tables']['users']['Row']
export type List = Database['public']['Tables']['lists']['Row']
export type ListMember = Database['public']['Tables']['list_members']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Item = Database['public']['Tables']['items']['Row']
