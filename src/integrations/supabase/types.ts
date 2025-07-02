export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ddaas_devices: {
        Row: {
          added_at: string
          device_name: string | null
          id: string
          ip_address: unknown | null
          last_ping_at: string | null
          last_seen: string | null
          latitude: number | null
          location_accuracy: number | null
          longitude: number | null
          mac_address: string
          manual_latitude: number | null
          manual_location_notes: string | null
          manual_longitude: number | null
          ping_response_time: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          device_name?: string | null
          id?: string
          ip_address?: unknown | null
          last_ping_at?: string | null
          last_seen?: string | null
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          mac_address: string
          manual_latitude?: number | null
          manual_location_notes?: string | null
          manual_longitude?: number | null
          ping_response_time?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          device_name?: string | null
          id?: string
          ip_address?: unknown | null
          last_ping_at?: string | null
          last_seen?: string | null
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          mac_address?: string
          manual_latitude?: number | null
          manual_location_notes?: string | null
          manual_longitude?: number | null
          ping_response_time?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      device_ping_history: {
        Row: {
          device_id: string | null
          error_message: string | null
          id: string
          ping_time: string
          response_time: number | null
          status: string
        }
        Insert: {
          device_id?: string | null
          error_message?: string | null
          id?: string
          ping_time?: string
          response_time?: number | null
          status: string
        }
        Update: {
          device_id?: string | null
          error_message?: string | null
          id?: string
          ping_time?: string
          response_time?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_ping_history_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "ddaas_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_ping_history_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "device_reward_summary"
            referencedColumns: ["device_id"]
          },
        ]
      }
      device_rewards: {
        Row: {
          device_id: string
          earned_at: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          reward_amount: number
          reward_type: string
          user_id: string
        }
        Insert: {
          device_id: string
          earned_at?: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          reward_amount?: number
          reward_type?: string
          user_id: string
        }
        Update: {
          device_id?: string
          earned_at?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          reward_amount?: number
          reward_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_rewards_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "ddaas_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_rewards_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "device_reward_summary"
            referencedColumns: ["device_id"]
          },
        ]
      }
      user_payment_preferences: {
        Row: {
          account_number: string | null
          bank_address: string | null
          bank_name: string | null
          created_at: string
          iban: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          routing_number: string | null
          sort_code: string | null
          swift_code: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          account_number?: string | null
          bank_address?: string | null
          bank_name?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          routing_number?: string | null
          sort_code?: string | null
          swift_code?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          account_number?: string | null
          bank_address?: string | null
          bank_name?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          routing_number?: string | null
          sort_code?: string | null
          swift_code?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      device_reward_summary: {
        Row: {
          device_id: string | null
          device_name: string | null
          last_reward_date: string | null
          mac_address: string | null
          rewards_30_days: number | null
          rewards_7_days: number | null
          total_reward_entries: number | null
          total_rewards: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_method: "fiat" | "usdc_solana"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      payment_method: ["fiat", "usdc_solana"],
    },
  },
} as const
