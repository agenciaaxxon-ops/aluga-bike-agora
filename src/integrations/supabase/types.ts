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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      item_types: {
        Row: {
          block_duration_unit:
            | Database["public"]["Enums"]["pricing_unit"]
            | null
          block_duration_value: number | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          price_block: number | null
          price_fixed: number | null
          price_per_day: number | null
          price_per_minute: number | null
          pricing_model: string
          shop_id: string
          updated_at: string | null
        }
        Insert: {
          block_duration_unit?:
            | Database["public"]["Enums"]["pricing_unit"]
            | null
          block_duration_value?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          price_block?: number | null
          price_fixed?: number | null
          price_per_day?: number | null
          price_per_minute?: number | null
          pricing_model?: string
          shop_id: string
          updated_at?: string | null
        }
        Update: {
          block_duration_unit?:
            | Database["public"]["Enums"]["pricing_unit"]
            | null
          block_duration_value?: number | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          price_block?: number | null
          price_fixed?: number | null
          price_per_day?: number | null
          price_per_minute?: number | null
          pricing_model?: string
          shop_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_types_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          item_type_id: string | null
          name: string
          shop_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          item_type_id?: string | null
          name: string
          shop_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          item_type_id?: string | null
          name?: string
          shop_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_item_type_id_fkey"
            columns: ["item_type_id"]
            isOneToOne: false
            referencedRelation: "item_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          has_completed_tutorial: boolean | null
          id: string
          owner_name: string
          store_name: string
          subscription_status: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          has_completed_tutorial?: boolean | null
          id: string
          owner_name: string
          store_name: string
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          has_completed_tutorial?: boolean | null
          id?: string
          owner_name?: string
          store_name?: string
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rentals: {
        Row: {
          access_code: string
          actual_end_time: string | null
          block_duration_minutes: number | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          end_time: string
          extension_count: number
          id: string
          initial_cost: number | null
          initial_duration_minutes: number | null
          item_id: string | null
          last_extension_at: string | null
          price_block: number | null
          price_per_day: number | null
          price_per_minute: number | null
          pricing_model: string | null
          shop_id: string
          start_time: string
          status: string
          total_cost: number | null
          total_overage_minutes: number
        }
        Insert: {
          access_code?: string
          actual_end_time?: string | null
          block_duration_minutes?: number | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          end_time: string
          extension_count?: number
          id?: string
          initial_cost?: number | null
          initial_duration_minutes?: number | null
          item_id?: string | null
          last_extension_at?: string | null
          price_block?: number | null
          price_per_day?: number | null
          price_per_minute?: number | null
          pricing_model?: string | null
          shop_id: string
          start_time: string
          status?: string
          total_cost?: number | null
          total_overage_minutes?: number
        }
        Update: {
          access_code?: string
          actual_end_time?: string | null
          block_duration_minutes?: number | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          end_time?: string
          extension_count?: number
          id?: string
          initial_cost?: number | null
          initial_duration_minutes?: number | null
          item_id?: string | null
          last_extension_at?: string | null
          price_block?: number | null
          price_per_day?: number | null
          price_per_minute?: number | null
          pricing_model?: string | null
          shop_id?: string
          start_time?: string
          status?: string
          total_cost?: number | null
          total_overage_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "rentals_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_vehicle_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          admin_password: string | null
          contact_phone: string | null
          created_at: string | null
          document: string | null
          id: string
          name: string
          price_per_minute: number | null
          user_id: string
        }
        Insert: {
          address?: string | null
          admin_password?: string | null
          contact_phone?: string | null
          created_at?: string | null
          document?: string | null
          id?: string
          name: string
          price_per_minute?: number | null
          user_id: string
        }
        Update: {
          address?: string | null
          admin_password?: string | null
          contact_phone?: string | null
          created_at?: string | null
          document?: string | null
          id?: string
          name?: string
          price_per_minute?: number | null
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          invited_email: string | null
          role: Database["public"]["Enums"]["app_role"]
          shop_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          shop_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          shop_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_password: { Args: { password: string }; Returns: string }
      is_shop_owner: {
        Args: { _shop_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _shop_id: string; _user_id: string }
        Returns: boolean
      }
      verify_password: {
        Args: { hash: string; password: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "funcionario"
      pricing_unit: "minute" | "hour" | "day"
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
      app_role: ["admin", "funcionario"],
      pricing_unit: ["minute", "hour", "day"],
    },
  },
} as const
