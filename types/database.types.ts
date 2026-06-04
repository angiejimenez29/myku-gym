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
      instructors: {
        Row: {
          id: string
          nombre: string
          email: string
          telefono_whatsapp: string
          bio: string | null
          anos_experiencia: number | null
          foto: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          email: string
          telefono_whatsapp: string
          bio?: string | null
          anos_experiencia?: number | null
          foto?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          email?: string
          telefono_whatsapp?: string
          bio?: string | null
          anos_experiencia?: number | null
          foto?: string | null
          created_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          instructor_id: string
          fecha: string
          hora: string
          invitado_especial: string | null
          tematica: string | null
          costo: number
          whatsapp_contacto: string
          capacidad: number
          estado: string // 'activa' | 'cancelada'
          created_at: string
        }
        Insert: {
          id?: string
          instructor_id: string
          fecha: string
          hora: string
          invitado_especial?: string | null
          tematica?: string | null
          costo: number
          whatsapp_contacto: string
          capacidad: number
          estado?: string
          created_at?: string
        }
        Update: {
          id?: string
          instructor_id?: string
          fecha?: string
          hora?: string
          invitado_especial?: string | null
          tematica?: string | null
          costo?: number
          whatsapp_contacto?: string
          capacidad?: number
          estado?: string
          created_at?: string
        }
      }
      session_spots: {
        Row: {
          id: string
          session_id: string
          numero: number
          estado: string // 'libre' | 'reservado' | 'presente'
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          numero: number
          estado?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          numero?: number
          estado?: string
          created_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          session_id: string
          cliente_nombre: string
          cliente_celular: string
          fecha_reserva: string
          monto_total: number
          estado: string // 'confirmada' | 'devuelta'
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          cliente_nombre: string
          cliente_celular: string
          fecha_reserva?: string
          monto_total: number
          estado?: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          cliente_nombre?: string
          cliente_celular?: string
          fecha_reserva?: string
          monto_total?: number
          estado?: string
          created_at?: string
        }
      }
      reservation_spots: {
        Row: {
          id: string
          reserva_id: string
          espacio_id: string
          created_at: string
        }
        Insert: {
          id?: string
          reserva_id: string
          espacio_id: string
          created_at?: string
        }
        Update: {
          id?: string
          reserva_id?: string
          espacio_id?: string
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          reserva_id: string
          metodo: string // 'yape'
          referencia_culqi: string | null
          monto: number
          estado: string // 'pagado' | 'devuelto'
          fecha: string
        }
        Insert: {
          id?: string
          reserva_id: string
          metodo?: string
          referencia_culqi?: string | null
          monto: number
          estado?: string
          fecha?: string
        }
        Update: {
          id?: string
          reserva_id?: string
          metodo?: string
          referencia_culqi?: string | null
          monto?: number
          estado?: string
          fecha?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
