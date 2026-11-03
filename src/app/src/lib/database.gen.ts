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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_types: {
        Row: {
          code: string
          label_en: string
          label_fr: string
        }
        Insert: {
          code: string
          label_en: string
          label_fr: string
        }
        Update: {
          code?: string
          label_en?: string
          label_fr?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          closed_on: string | null
          created_at: string
          currency: string
          hidden_for_new: boolean
          id: string
          institution_id: string | null
          name: string
          opened_on: string
          opening_balance: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_on?: string | null
          created_at?: string
          currency: string
          hidden_for_new?: boolean
          id?: string
          institution_id?: string | null
          name: string
          opened_on?: string
          opening_balance?: number
          type: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          closed_on?: string | null
          created_at?: string
          currency?: string
          hidden_for_new?: boolean
          id?: string
          institution_id?: string | null
          name?: string
          opened_on?: string
          opening_balance?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_type_fkey"
            columns: ["type"]
            isOneToOne: false
            referencedRelation: "account_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "accounts_user_id_currency_fkey"
            columns: ["user_id", "currency"]
            isOneToOne: false
            referencedRelation: "user_currencies"
            referencedColumns: ["user_id", "code"]
          },
          {
            foreignKeyName: "accounts_user_id_institution_id_fkey"
            columns: ["user_id", "institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      currencies: {
        Row: {
          code: string
          minor_units: number
          name_en: string
          name_fr: string
          symbol: string
        }
        Insert: {
          code: string
          minor_units: number
          name_en: string
          name_fr: string
          symbol: string
        }
        Update: {
          code?: string
          minor_units?: number
          name_en?: string
          name_fr?: string
          symbol?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base: string
          quote: string
          rate: number
          rate_date: string
          source: string
        }
        Insert: {
          base?: string
          quote: string
          rate: number
          rate_date: string
          source: string
        }
        Update: {
          base?: string
          quote?: string
          rate?: number
          rate_date?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_rates_base_fkey"
            columns: ["base"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "exchange_rates_quote_fkey"
            columns: ["quote"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
      institutions: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          default_currency: string
          display_currency: string
          locale: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_currency?: string
          display_currency?: string
          locale?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_currency?: string
          display_currency?: string
          locale?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_currency_fkey"
            columns: ["user_id", "default_currency"]
            isOneToOne: false
            referencedRelation: "user_currencies"
            referencedColumns: ["user_id", "code"]
          },
          {
            foreignKeyName: "profiles_display_currency_fkey"
            columns: ["user_id", "display_currency"]
            isOneToOne: false
            referencedRelation: "user_currencies"
            referencedColumns: ["user_id", "code"]
          },
        ]
      }
      user_currencies: {
        Row: {
          code: string
          created_at: string
          id: string
          is_favourite: boolean
          removed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_favourite?: boolean
          removed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_favourite?: boolean
          removed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_currencies_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "currencies"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      account_balances: {
        Row: {
          account_id: string | null
          balance: number | null
          currency: string | null
          display_balance: number | null
          display_currency: string | null
          pending: number | null
        }
        Relationships: []
      }
      institution_totals: {
        Row: {
          converted: boolean | null
          display_currency: string | null
          institution_id: string | null
          total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      exchange_rate: {
        Args: { from_currency: string; on_date: string; to_currency: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
