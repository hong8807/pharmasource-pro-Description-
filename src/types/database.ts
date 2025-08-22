export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      files: {
        Row: {
          created_at: string | null
          entity_id: number
          entity_type: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          entity_id: number
          entity_type: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          entity_id?: number
          entity_type?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          cas_no: string | null
          created_at: string | null
          id: number
          product_name: string
          product_url: string | null
        }
        Insert: {
          cas_no?: string | null
          created_at?: string | null
          id?: number
          product_name: string
          product_url?: string | null
        }
        Update: {
          cas_no?: string | null
          created_at?: string | null
          id?: number
          product_name?: string
          product_url?: string | null
        }
        Relationships: []
      }
      sourcing_progress: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: number
          notes: string | null
          quoted_price: number | null
          task_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: number
          notes?: string | null
          quoted_price?: number | null
          task_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: number
          notes?: string | null
          quoted_price?: number | null
          task_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sourcing_progress_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourcing_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "sourcing_tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      sourcing_requests: {
        Row: {
          cas_no: string | null
          created_at: string | null
          created_by: string
          id: number
          notes: string | null
          product_name: string
          quantity_needed: string | null
          requested_price: number | null
          status: string | null
          target_country: string | null
          updated_at: string | null
        }
        Insert: {
          cas_no?: string | null
          created_at?: string | null
          created_by: string
          id?: number
          notes?: string | null
          product_name: string
          quantity_needed?: string | null
          requested_price?: number | null
          status?: string | null
          target_country?: string | null
          updated_at?: string | null
        }
        Update: {
          cas_no?: string | null
          created_at?: string | null
          created_by?: string
          id?: number
          notes?: string | null
          product_name?: string
          quantity_needed?: string | null
          requested_price?: number | null
          status?: string | null
          target_country?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sourcing_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sourcing_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: number
          request_id: number
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: number
          request_id: number
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: number
          request_id?: number
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sourcing_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourcing_tasks_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "sourcing_requests"
            referencedColumns: ["id"]
          }
        ]
      }
      suppliers: {
        Row: {
          company_name: string
          contact_info: string | null
          country: string | null
          created_at: string | null
          gmp_approved: boolean | null
          id: number
          product_id: number
          supplier_url: string | null
        }
        Insert: {
          company_name: string
          contact_info?: string | null
          country?: string | null
          created_at?: string | null
          gmp_approved?: boolean | null
          id?: number
          product_id: number
          supplier_url?: string | null
        }
        Update: {
          company_name?: string
          contact_info?: string | null
          country?: string | null
          created_at?: string | null
          gmp_approved?: boolean | null
          id?: number
          product_id?: number
          supplier_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          created_at: string | null
          department: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string
          email: string
          id: string
          name: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}