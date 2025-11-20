export type UserRole = "super_admin" | "admin"

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          auth_user_id: string
          company_id: string | null
          role: UserRole
          name: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          company_id?: string | null
          role: UserRole
          name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          company_id?: string | null
          role?: UserRole
          name?: string
          email?: string
        }
      }
      api_clients: {
        Row: {
          id: string
          company_id: string
          label: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          label: string
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          api_client_id: string
          key_hash: string
          key_prefix: string
          revoked: boolean
          created_at: string
          revoked_at: string | null
        }
        Insert: {
          id?: string
          api_client_id: string
          key_hash: string
          key_prefix: string
          revoked?: boolean
          created_at?: string
          revoked_at?: string | null
        }
        Update: {
          id?: string
          api_client_id?: string
          key_hash?: string
          key_prefix?: string
          revoked?: boolean
          revoked_at?: string | null
        }
      }
      professionals: {
        Row: {
          id: string
          company_id: string
          name: string
          email: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          email?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          email?: string | null
          phone?: string | null
        }
      }
      services: {
        Row: {
          id: string
          company_id: string
          name: string
          duration_minutes: number
          price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          duration_minutes: number
          price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          duration_minutes?: number
          price?: number | null
        }
      }
      availabilities: {
        Row: {
          id: string
          professional_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
        }
      }
      slots: {
        Row: {
          id: string
          professional_id: string
          service_id: string | null
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          service_id?: string | null
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          service_id?: string | null
          start_time?: string
          end_time?: string
          is_available?: boolean
        }
      }
      bookings: {
        Row: {
          id: string
          company_id: string
          professional_id: string
          service_id: string
          slot_id: string
          customer_name: string
          customer_email: string | null
          customer_phone: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          professional_id: string
          service_id: string
          slot_id: string
          customer_name: string
          customer_email?: string | null
          customer_phone?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          professional_id?: string
          service_id?: string
          slot_id?: string
          customer_name?: string
          customer_email?: string | null
          customer_phone?: string | null
          status?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          company_id: string | null
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          company_id?: string | null
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string | null
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          metadata?: Record<string, unknown> | null
        }
      }
    }
  }
}
