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
      categories: {
        Row: {
          color: string
          color_is_auto: boolean
          created_at: string
          icon: string
          icon_is_auto: boolean
          id: string
          kind: string
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color: string
          color_is_auto?: boolean
          created_at?: string
          icon?: string
          icon_is_auto?: boolean
          id?: string
          kind?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          color?: string
          color_is_auto?: boolean
          created_at?: string
          icon?: string
          icon_is_auto?: boolean
          id?: string
          kind?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_parent_id_fkey"
            columns: ["user_id", "parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      category_status_events: {
        Row: {
          category_id: string
          created_at: string
          effective_on: string
          id: number
          status: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          effective_on: string
          id?: never
          status: string
          user_id?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          effective_on?: string
          id?: never
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_status_events_user_id_category_id_fkey"
            columns: ["user_id", "category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
      merchants: {
        Row: {
          created_at: string
          default_category_id: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_category_id?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          default_category_id?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchants_user_id_default_category_id_fkey"
            columns: ["user_id", "default_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_currency: string
          display_currency: string
          locale: string
          transfer_fee_category_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_currency?: string
          display_currency?: string
          locale?: string
          transfer_fee_category_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_currency?: string
          display_currency?: string
          locale?: string
          transfer_fee_category_id?: string | null
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
          {
            foreignKeyName: "profiles_user_id_transfer_fee_category_id_fkey"
            columns: ["user_id", "transfer_fee_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      transaction_splits: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          id: string
          input_mode: string
          input_value: number
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          id?: string
          input_mode: string
          input_value: number
          transaction_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          id?: string
          input_mode?: string
          input_value?: number
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_splits_user_id_category_id_fkey"
            columns: ["user_id", "category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "transaction_splits_user_id_transaction_id_fkey"
            columns: ["user_id", "transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          currency: string
          id: string
          kind: string
          merchant_id: string | null
          note: string | null
          occurred_at_time: string | null
          occurred_on: string
          original_amount: number | null
          original_currency: string | null
          status: string
          transfer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          currency: string
          id?: string
          kind: string
          merchant_id?: string | null
          note?: string | null
          occurred_at_time?: string | null
          occurred_on: string
          original_amount?: number | null
          original_currency?: string | null
          status?: string
          transfer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          merchant_id?: string | null
          note?: string | null
          occurred_at_time?: string | null
          occurred_on?: string
          original_amount?: number | null
          original_currency?: string | null
          status?: string
          transfer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_account_id_currency_fkey"
            columns: ["user_id", "account_id", "currency"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id", "id", "currency"]
          },
          {
            foreignKeyName: "transactions_user_id_merchant_id_fkey"
            columns: ["user_id", "merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "transactions_user_id_original_currency_fkey"
            columns: ["user_id", "original_currency"]
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
      category_active_periods: {
        Row: {
          active_from: string | null
          active_to: string | null
          category_id: string | null
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
      account_balance_on: {
        Args: { account_id: string; on_date: string }
        Returns: number
      }
      add_category_pause: {
        Args: { active_from: string; archive_from: string; category: string }
        Returns: number
      }
      archive_category: {
        Args: { archive_from: string; category: string }
        Returns: number
      }
      category_active_through: {
        Args: { category: string; ends: string; starts: string }
        Returns: boolean
      }
      category_status: { Args: { category: string }; Returns: string }
      check_money_amount: {
        Args: { amount: number; currency: string }
        Returns: undefined
      }
      check_transaction_splits: {
        Args: { transaction: string }
        Returns: undefined
      }
      check_transfer: { Args: { transfer: string }; Returns: undefined }
      delete_transfer: { Args: { transfer_id: string }; Returns: undefined }
      exchange_rate: {
        Args: { from_currency: string; on_date: string; to_currency: string }
        Returns: number
      }
      fold_name: { Args: { name: string }; Returns: string }
      merge_merchants: {
        Args: { source: string; target: string }
        Returns: undefined
      }
      recolor_categories: { Args: { colors: Json }; Returns: undefined }
      save_adjustment: {
        Args: {
          account_id: string
          note?: string
          occurred_on: string
          real_balance: number
        }
        Returns: string
      }
      save_transaction: {
        Args: {
          account_id: string
          amount: number
          kind: string
          merchant_id?: string
          note?: string
          occurred_at_time?: string
          occurred_on: string
          original_amount?: number
          original_currency?: string
          splits: Json
          status?: string
          transaction_id: string
        }
        Returns: string
      }
      save_transfer: {
        Args: {
          amount: number
          fee?: number
          fee_category?: string
          from_account: string
          from_pending?: boolean
          note?: string
          occurred_at_time?: string
          occurred_on: string
          received?: number
          to_account: string
          to_pending?: boolean
          transfer_id: string
        }
        Returns: string
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
