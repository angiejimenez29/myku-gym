export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      instructors: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          profile_image_url: string | null
          updated_at: string | null
          whatsapp_phone: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          profile_image_url?: string | null
          updated_at?: string | null
          whatsapp_phone?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          profile_image_url?: string | null
          updated_at?: string | null
          whatsapp_phone?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          approval_code: string | null
          created_at: string | null
          culqi_reference: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string | null
          reservation_id: string
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          approval_code?: string | null
          created_at?: string | null
          culqi_reference?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          reservation_id: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          approval_code?: string | null
          created_at?: string | null
          culqi_reference?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          reservation_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          id: string
          reservation_id: string
          amount: number
          status: string
          created_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          reservation_id: string
          amount: number
          status?: string
          created_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          reservation_id?: string
          amount?: number
          status?: string
          created_at?: string | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          }
        ]
      }
      reservation_spots: {
        Row: {
          created_at: string | null
          id: string
          reservation_id: string
          spot_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reservation_id: string
          spot_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reservation_id?: string
          spot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_spots_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_spots_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: true
            referencedRelation: "session_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          client_name: string
          client_phone: string
          estado_pago: string | null
          expira_en: string | null
          id: string
          mp_payment_id: string | null
          mp_preference_id: string | null
          refunded_at: string | null
          reserved_at: string | null
          session_id: string
          status: Database["public"]["Enums"]["reservation_status"]
          total_amount: number
        }
        Insert: {
          client_name: string
          client_phone: string
          estado_pago?: string | null
          expira_en?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          refunded_at?: string | null
          reserved_at?: string | null
          session_id: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_amount: number
        }
        Update: {
          client_name?: string
          client_phone?: string
          estado_pago?: string | null
          expira_en?: string | null
          id?: string
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          refunded_at?: string | null
          reserved_at?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "reservations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_occupancy"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "reservations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_spots: {
        Row: {
          created_at: string | null
          id: string
          session_id: string
          spot_number: number
          status: Database["public"]["Enums"]["spot_status"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          session_id: string
          spot_number: number
          status?: Database["public"]["Enums"]["spot_status"]
        }
        Update: {
          created_at?: string | null
          id?: string
          session_id?: string
          spot_number?: number
          status?: Database["public"]["Enums"]["spot_status"]
        }
        Relationships: [
          {
            foreignKeyName: "session_spots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_occupancy"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_spots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          client_phone: string
          current_week_streak: number
          longest_week_streak: number
          last_reservation_week: string | null
          classes_count: number
          free_classes_earned: number
          free_class_available: boolean
          updated_at: string
        }
        Insert: {
          client_phone: string
          current_week_streak?: number
          longest_week_streak?: number
          last_reservation_week?: string | null
          classes_count?: number
          free_classes_earned?: number
          free_class_available?: boolean
          updated_at?: string
        }
        Update: {
          client_phone?: string
          current_week_streak?: number
          longest_week_streak?: number
          last_reservation_week?: string | null
          classes_count?: number
          free_classes_earned?: number
          free_class_available?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          capacity: number
          class_type: string | null
          created_at: string | null
          id: string
          instructor_id: string
          price: number
          qr_code: string | null
          session_date: string
          special_guest: string | null
          start_time: string
          status: Database["public"]["Enums"]["session_status"]
          theme: string | null
          updated_at: string | null
          whatsapp_contact: string
        }
        Insert: {
          capacity: number
          class_type?: string | null
          created_at?: string | null
          id?: string
          instructor_id: string
          price: number
          qr_code?: string | null
          session_date: string
          special_guest?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["session_status"]
          theme?: string | null
          updated_at?: string | null
          whatsapp_contact: string
        }
        Update: {
          capacity?: number
          class_type?: string | null
          created_at?: string | null
          id?: string
          instructor_id?: string
          price?: number
          qr_code?: string | null
          session_date?: string
          special_guest?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["session_status"]
          theme?: string | null
          updated_at?: string | null
          whatsapp_contact?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      session_occupancy: {
        Row: {
          capacity: number | null
          occupied_spots: number | null
          session_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_in_spot: { Args: { p_spot_id: string }; Returns: undefined }
      create_reservation: {
        Args: {
          p_client_name: string
          p_client_phone: string
          p_session_id: string
          p_spot_ids: string[]
        }
        Returns: string
      }
      refund_reservation: {
        Args: { p_reservation_id: string }
        Returns: undefined
      }
    }
    Enums: {
      payment_method: "yape"
      payment_status: "pending" | "paid" | "refunded" | "failed"
      reservation_status: "pending" | "confirmed" | "refunded"
      session_status: "draft" | "published" | "cancelled" | "finished"
      spot_status: "available" | "reserved" | "present"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      payment_method: ["yape"],
      payment_status: ["pending", "paid", "refunded", "failed"],
      reservation_status: ["pending", "confirmed", "refunded"],
      session_status: ["draft", "published", "cancelled", "finished"],
      spot_status: ["available", "reserved", "present"],
    },
  },
} as const
