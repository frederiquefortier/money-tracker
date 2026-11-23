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
          import_batch_id: string | null
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
          import_batch_id?: string | null
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
          import_batch_id?: string | null
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
            foreignKeyName: "accounts_user_id_import_batch_id_fkey"
            columns: ["user_id", "import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["user_id", "id"]
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
          import_batch_id: string | null
          kind: string
          name: string
          necessity: string | null
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
          import_batch_id?: string | null
          kind?: string
          name: string
          necessity?: string | null
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
          import_batch_id?: string | null
          kind?: string
          name?: string
          necessity?: string | null
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_user_id_import_batch_id_fkey"
            columns: ["user_id", "import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["user_id", "id"]
          },
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
          via_category_id: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          effective_on: string
          id?: never
          status: string
          user_id?: string
          via_category_id?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          effective_on?: string
          id?: never
          status?: string
          user_id?: string
          via_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_status_events_user_id_category_id_fkey"
            columns: ["user_id", "category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "category_status_events_user_id_via_category_id_fkey"
            columns: ["user_id", "via_category_id"]
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
      event_default_skips: {
        Row: {
          category_id: string
          user_id: string
        }
        Insert: {
          category_id: string
          user_id?: string
        }
        Update: {
          category_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_default_skips_user_id_category_id_fkey"
            columns: ["user_id", "category_id"]
            isOneToOne: true
            referencedRelation: "categories"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      event_exclusions: {
        Row: {
          event_id: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          event_id: string
          transaction_id: string
          user_id?: string
        }
        Update: {
          event_id?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_exclusions_user_id_event_id_fkey"
            columns: ["user_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "event_exclusions_user_id_transaction_id_fkey"
            columns: ["user_id", "transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      event_people: {
        Row: {
          event_id: string
          person_id: string
          user_id: string
        }
        Insert: {
          event_id: string
          person_id: string
          user_id?: string
        }
        Update: {
          event_id?: string
          person_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_people_user_id_event_id_fkey"
            columns: ["user_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "event_people_user_id_person_id_fkey"
            columns: ["user_id", "person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      event_skips: {
        Row: {
          category_id: string
          event_id: string
          user_id: string
        }
        Insert: {
          category_id: string
          event_id: string
          user_id?: string
        }
        Update: {
          category_id?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_skips_user_id_category_id_fkey"
            columns: ["user_id", "category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "event_skips_user_id_event_id_fkey"
            columns: ["user_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      event_types: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          auto_link: boolean
          created_at: string
          ends_on: string | null
          id: string
          import_batch_id: string | null
          name: string
          skips_own: boolean
          starts_on: string | null
          type_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_link?: boolean
          created_at?: string
          ends_on?: string | null
          id?: string
          import_batch_id?: string | null
          name: string
          skips_own?: boolean
          starts_on?: string | null
          type_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          auto_link?: boolean
          created_at?: string
          ends_on?: string | null
          id?: string
          import_batch_id?: string | null
          name?: string
          skips_own?: boolean
          starts_on?: string | null
          type_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_import_batch_id_fkey"
            columns: ["user_id", "import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "events_user_id_type_id_fkey"
            columns: ["user_id", "type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["user_id", "id"]
          },
        ]
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
      holding_contributions: {
        Row: {
          amount: number
          created_at: string
          holding_id: string
          id: string
          import_batch_id: string | null
          label: string | null
          on_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          holding_id: string
          id?: string
          import_batch_id?: string | null
          label?: string | null
          on_date: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          holding_id?: string
          id?: string
          import_batch_id?: string | null
          label?: string | null
          on_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holding_contributions_user_id_holding_id_fkey"
            columns: ["user_id", "holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "holding_contributions_user_id_import_batch_id_fkey"
            columns: ["user_id", "import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      holding_snapshots: {
        Row: {
          amount: number
          created_at: string
          holding_id: string
          id: string
          import_batch_id: string | null
          on_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          holding_id: string
          id?: string
          import_batch_id?: string | null
          on_date: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          holding_id?: string
          id?: string
          import_batch_id?: string | null
          on_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holding_snapshots_user_id_holding_id_fkey"
            columns: ["user_id", "holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "holding_snapshots_user_id_import_batch_id_fkey"
            columns: ["user_id", "import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      holding_transfers: {
        Row: {
          amount: number
          created_at: string
          from_holding_id: string
          id: string
          import_batch_id: string | null
          on_date: string
          to_holding_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_holding_id: string
          id?: string
          import_batch_id?: string | null
          on_date: string
          to_holding_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_holding_id?: string
          id?: string
          import_batch_id?: string | null
          on_date?: string
          to_holding_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holding_transfers_user_id_from_holding_id_fkey"
            columns: ["user_id", "from_holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "holding_transfers_user_id_import_batch_id_fkey"
            columns: ["user_id", "import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "holding_transfers_user_id_to_holding_id_fkey"
            columns: ["user_id", "to_holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      holding_types: {
        Row: {
          code: string
          country: string | null
          kind: string
          label_en: string
          label_fr: string
        }
        Insert: {
          code: string
          country?: string | null
          kind: string
          label_en: string
          label_fr: string
        }
        Update: {
          code?: string
          country?: string | null
          kind?: string
          label_en?: string
          label_fr?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          closed_on: string | null
          country: string
          created_at: string
          currency: string
          id: string
          import_batch_id: string | null
          institution_id: string | null
          kind: string
          name: string | null
          opened_on: string
          type: string | null
          type_label: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_on?: string | null
          country: string
          created_at?: string
          currency: string
          id?: string
          import_batch_id?: string | null
          institution_id?: string | null
          kind: string
          name?: string | null
          opened_on?: string
          type?: string | null
          type_label?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          closed_on?: string | null
          country?: string
          created_at?: string
          currency?: string
          id?: string
          import_batch_id?: string | null
          institution_id?: string | null
          kind?: string
          name?: string | null
          opened_on?: string
          type?: string | null
          type_label?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_type_fkey"
            columns: ["type"]
            isOneToOne: false
            referencedRelation: "holding_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "holdings_user_id_currency_fkey"
            columns: ["user_id", "currency"]
            isOneToOne: false
            referencedRelation: "user_currencies"
            referencedColumns: ["user_id", "code"]
          },
          {
            foreignKeyName: "holdings_user_id_import_batch_id_fkey"
            columns: ["user_id", "import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "holdings_user_id_institution_id_fkey"
            columns: ["user_id", "institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      import_batches: {
        Row: {
          committed_at: string
          created_counts: Json
          file_names: string[]
          id: string
          restored: Json
          row_count: number
          undone_at: string | null
          user_id: string
        }
        Insert: {
          committed_at?: string
          created_counts?: Json
          file_names?: string[]
          id?: string
          restored?: Json
          row_count?: number
          undone_at?: string | null
          user_id?: string
        }
        Update: {
          committed_at?: string
          created_counts?: Json
          file_names?: string[]
          id?: string
          restored?: Json
          row_count?: number
          undone_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      institutions: {
        Row: {
          created_at: string
          id: string
          import_batch_id: string | null
          name: string
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          import_batch_id?: string | null
          name: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          import_batch_id?: string | null
          name?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institutions_user_id_import_batch_id_fkey"
            columns: ["user_id", "import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      merchant_aliases: {
        Row: {
          alias: string
          import_batch_id: string | null
          merchant_id: string
          user_id: string
        }
        Insert: {
          alias: string
          import_batch_id?: string | null
          merchant_id: string
          user_id?: string
        }
        Update: {
          alias?: string
          import_batch_id?: string | null
          merchant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_aliases_user_id_import_batch_id_fkey"
            columns: ["user_id", "import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "merchant_aliases_user_id_merchant_id_fkey"
            columns: ["user_id", "merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      merchants: {
        Row: {
          created_at: string
          default_category_id: string | null
          id: string
          import_batch_id: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_category_id?: string | null
          id?: string
          import_batch_id?: string | null
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          default_category_id?: string | null
          id?: string
          import_batch_id?: string | null
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
          {
            foreignKeyName: "merchants_user_id_import_batch_id_fkey"
            columns: ["user_id", "import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      people: {
        Row: {
          archived_on: string | null
          created_at: string
          id: string
          import_batch_id: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_on?: string | null
          created_at?: string
          id?: string
          import_batch_id?: string | null
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_on?: string | null
          created_at?: string
          id?: string
          import_batch_id?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_user_id_import_batch_id_fkey"
            columns: ["user_id", "import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      person_aliases: {
        Row: {
          alias: string
          import_batch_id: string | null
          person_id: string
          user_id: string
        }
        Insert: {
          alias: string
          import_batch_id?: string | null
          person_id: string
          user_id?: string
        }
        Update: {
          alias?: string
          import_batch_id?: string | null
          person_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_aliases_user_id_import_batch_id_fkey"
            columns: ["user_id", "import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "person_aliases_user_id_person_id_fkey"
            columns: ["user_id", "person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      person_group_members: {
        Row: {
          group_id: string
          person_id: string
          user_id: string
        }
        Insert: {
          group_id: string
          person_id: string
          user_id?: string
        }
        Update: {
          group_id?: string
          person_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_group_members_user_id_group_id_fkey"
            columns: ["user_id", "group_id"]
            isOneToOne: false
            referencedRelation: "person_groups"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "person_group_members_user_id_person_id_fkey"
            columns: ["user_id", "person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      person_groups: {
        Row: {
          archived_on: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_on?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_on?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      reimbursements: {
        Row: {
          amount: number
          created_at: string
          id: string
          income_id: string
          owed_line_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          income_id: string
          owed_line_id: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          income_id?: string
          owed_line_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reimbursements_user_id_income_id_fkey"
            columns: ["user_id", "income_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "reimbursements_user_id_owed_line_id_fkey"
            columns: ["user_id", "owed_line_id"]
            isOneToOne: false
            referencedRelation: "transaction_people"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      transaction_people: {
        Row: {
          amount: number | null
          amount_unknown: boolean
          created_at: string
          fills_rest: boolean
          head_count: number
          id: string
          input_mode: string
          input_value: number
          person_id: string | null
          position: number
          role: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          amount_unknown?: boolean
          created_at?: string
          fills_rest?: boolean
          head_count?: number
          id?: string
          input_mode: string
          input_value: number
          person_id?: string | null
          position: number
          role: string
          transaction_id: string
          user_id?: string
        }
        Update: {
          amount?: number | null
          amount_unknown?: boolean
          created_at?: string
          fills_rest?: boolean
          head_count?: number
          id?: string
          input_mode?: string
          input_value?: number
          person_id?: string | null
          position?: number
          role?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_people_user_id_person_id_fkey"
            columns: ["user_id", "person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "transaction_people_user_id_transaction_id_fkey"
            columns: ["user_id", "transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
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
          event_id: string | null
          event_source: string | null
          holding_id: string | null
          id: string
          import_batch_id: string | null
          import_ref: string | null
          kind: string
          merchant_id: string | null
          note: string | null
          occurred_on: string
          original_amount: number | null
          original_currency: string | null
          seller_person_id: string | null
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
          event_id?: string | null
          event_source?: string | null
          holding_id?: string | null
          id?: string
          import_batch_id?: string | null
          import_ref?: string | null
          kind: string
          merchant_id?: string | null
          note?: string | null
          occurred_on: string
          original_amount?: number | null
          original_currency?: string | null
          seller_person_id?: string | null
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
          event_id?: string | null
          event_source?: string | null
          holding_id?: string | null
          id?: string
          import_batch_id?: string | null
          import_ref?: string | null
          kind?: string
          merchant_id?: string | null
          note?: string | null
          occurred_on?: string
          original_amount?: number | null
          original_currency?: string | null
          seller_person_id?: string | null
          status?: string
          transfer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_event_fk"
            columns: ["user_id", "event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "transactions_holding_fk"
            columns: ["user_id", "holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["user_id", "id"]
          },
          {
            foreignKeyName: "transactions_user_id_account_id_currency_fkey"
            columns: ["user_id", "account_id", "currency"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["user_id", "id", "currency"]
          },
          {
            foreignKeyName: "transactions_user_id_import_batch_id_fkey"
            columns: ["user_id", "import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["user_id", "id"]
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
          {
            foreignKeyName: "transactions_user_id_seller_person_id_fkey"
            columns: ["user_id", "seller_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["user_id", "id"]
          },
        ]
      }
      user_currencies: {
        Row: {
          code: string
          created_at: string
          id: string
          removed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          removed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
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
      event_usage: {
        Row: {
          event_id: string | null
          transaction_count: number | null
        }
        Relationships: []
      }
      frequent_categories: {
        Row: {
          category_id: string | null
          kind: string | null
          rank: number | null
        }
        Relationships: []
      }
      holding_totals: {
        Row: {
          currency: string | null
          display_currency: string | null
          display_value: number | null
          holding_id: string | null
          latest_on: string | null
          latest_value: number | null
          placed: number | null
          profit: number | null
          profit_percent: number | null
          withdrawn: number | null
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
      merchant_suggested_category: {
        Row: {
          category_id: string | null
          merchant_id: string | null
        }
        Relationships: []
      }
      merchant_usage: {
        Row: {
          merchant_id: string | null
          transaction_count: number | null
        }
        Relationships: []
      }
      owed_lines: {
        Row: {
          amount_unknown: boolean | null
          back: number | null
          category: string | null
          category_id: string | null
          currency: string | null
          id: string | null
          merchant: string | null
          occurred_on: string | null
          open: boolean | null
          part: number | null
          person_id: string | null
          transaction_id: string | null
        }
        Relationships: []
      }
      person_balances: {
        Row: {
          currency: string | null
          open_amount: number | null
          person_id: string | null
          unknown_count: number | null
        }
        Relationships: []
      }
      person_usage: {
        Row: {
          last_on: string | null
          person_id: string | null
          recent_count: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      absorbs: {
        Args: {
          amount_unknown: boolean
          any_empty: boolean
          fills_rest: boolean
          input_mode: string
          role: string
        }
        Returns: boolean
      }
      account_balance_on: {
        Args: { account_id: string; on_date: string }
        Returns: number
      }
      add_category_pause: {
        Args: { active_from: string; archive_from: string; category: string }
        Returns: number
      }
      adjustment_balance_text: {
        Args: { account_id: string; adjustment_id?: string; on_date: string }
        Returns: string
      }
      adjustment_base: {
        Args: { account_id: string; adjustment_id: string; on_date: string }
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
      category_key: { Args: { path: string }; Returns: string }
      category_keys: {
        Args: never
        Returns: {
          color: string
          depth: number
          id: string
          key: string
          kind: string
        }[]
      }
      category_status: { Args: { category: string }; Returns: string }
      check_money_amount: {
        Args: { amount: number; currency: string }
        Returns: undefined
      }
      check_transaction_holding: {
        Args: { transaction: string }
        Returns: undefined
      }
      check_transaction_people: {
        Args: { transaction: string }
        Returns: undefined
      }
      check_transaction_splits: {
        Args: { transaction: string }
        Returns: undefined
      }
      check_transfer: { Args: { transfer: string }; Returns: undefined }
      delete_event: { Args: { event_id: string }; Returns: undefined }
      delete_transfer: { Args: { transfer_id: string }; Returns: undefined }
      empty_part_room: { Args: { transaction: string }; Returns: number }
      event_first_day: {
        Args: { ends: string; starts: string }
        Returns: string
      }
      event_last_day: {
        Args: { ends: string; starts: string }
        Returns: string
      }
      event_skips_categories: {
        Args: { category_ids: string[]; event: string }
        Returns: boolean
      }
      event_totals: {
        Args: never
        Returns: {
          display_total: string
          event_id: string
          transaction_count: number
        }[]
      }
      exchange_rate: {
        Args: { from_currency: string; on_date: string; to_currency: string }
        Returns: number
      }
      exchange_rate_text: {
        Args: { from_currency: string; on_date: string; to_currency: string }
        Returns: string
      }
      fold_name: { Args: { name: string }; Returns: string }
      holding_flows: {
        Args: never
        Returns: {
          display_amount: string
          holding_id: string
          on_date: string
        }[]
      }
      holdings_with_history: { Args: never; Returns: string[] }
      import_batch: {
        Args: { dry_run?: boolean; payload: Json }
        Returns: Json
      }
      import_holdings: {
        Args: { batch?: string; payload: Json }
        Returns: Json
      }
      import_undo: { Args: { batch: string }; Returns: Json }
      list_transactions: {
        Args: {
          account_ids?: string[]
          before?: string
          category_ids?: string[]
          event_ids?: string[]
          from_date?: string
          kinds?: string[]
          max_rows?: number
          merchant_ids?: string[]
          owed_only?: boolean
          pending_only?: boolean
          person_ids?: string[]
          search?: string
          to_date?: string
          without_event?: boolean
        }
        Returns: {
          account_name: string
          amount: string
          categories: Json
          conversion_cost: string
          currency: string
          day_net: string
          display_amount: string
          event: Json
          fee_amount: string
          fee_category: string
          from_account: string
          from_institution: string
          holding: Json
          id: string
          institution: string
          kind: string
          merchant: string
          more: boolean
          note: string
          occurred_on: string
          owed_count: number
          pending: boolean
          pending_count: number
          people: Json
          rate: string
          received_amount: string
          received_currency: string
          received_value: string
          reimburses: Json
          to_account: string
          to_institution: string
          total: number
          transfer_id: string
        }[]
      }
      matching_event: {
        Args: {
          category_ids?: string[]
          for_transaction?: string
          ignore_exclusions?: boolean
          on_date: string
          tx_kind: string
        }
        Returns: string
      }
      merchant_monthly: {
        Args: never
        Returns: {
          display_max: string
          display_min: string
          display_total: string
          merchant_id: string
          month: string
          visits: number
        }[]
      }
      merge_merchants: {
        Args: { source: string; target: string }
        Returns: undefined
      }
      merge_people: {
        Args: { source: string; target: string }
        Returns: undefined
      }
      my_lines: {
        Args: { from_date?: string; to_date?: string }
        Returns: {
          category_id: string
          display_amount: string
          event_id: string
          kind: string
          occurred_on: string
          owed_open: boolean
          pending: boolean
          transaction_id: string
        }[]
      }
      my_monthly: {
        Args: never
        Returns: {
          category_id: string
          display_amount: string
          month: string
        }[]
      }
      net_worth_series: {
        Args: never
        Returns: {
          display_value: string
          item_id: string
          kind: string
          on_date: string
        }[]
      }
      reactivate_category: {
        Args: { active_from: string; category: string }
        Returns: number
      }
      recolor_categories: { Args: { colors: Json }; Returns: undefined }
      recompute_people: { Args: { transaction: string }; Returns: undefined }
      relink_events: {
        Args: { from_date: string; to_date: string }
        Returns: undefined
      }
      save_adjustment: {
        Args: {
          account_id: string
          adjustment_id: string
          note?: string
          occurred_on: string
          real_balance: number
        }
        Returns: string
      }
      save_event: {
        Args: {
          auto_link?: boolean
          ends_on: string
          event_id: string
          name: string
          person_ids: string[]
          skip_category_ids?: string[]
          starts_on: string
          type_id: string
        }
        Returns: string
      }
      save_event_default_skips: {
        Args: { category_ids: string[] }
        Returns: undefined
      }
      save_event_type: {
        Args: { color: string; name: string; type_id: string }
        Returns: string
      }
      save_merchant: {
        Args: {
          aliases?: string[]
          default_category_id: string
          merchant_id: string
          name: string
        }
        Returns: string
      }
      save_person: {
        Args: {
          aliases?: string[]
          group_ids: string[]
          name: string
          person_id: string
        }
        Returns: string
      }
      save_person_group: {
        Args: { group_id: string; name: string; person_ids: string[] }
        Returns: string
      }
      save_transaction: {
        Args: {
          account_id: string
          amount: number
          event_choice?: string
          event_id?: string
          holding_id?: string
          kind: string
          merchant_id?: string
          note?: string
          occurred_on: string
          original_amount?: number
          original_currency?: string
          people?: Json
          reimburses?: string[]
          seller_id?: string
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
          from_account: string
          from_pending?: boolean
          note?: string
          occurred_on: string
          received?: number
          to_account: string
          to_pending?: boolean
          transfer_id: string
        }
        Returns: string
      }
      set_transfer_fee_category: {
        Args: { category: string }
        Returns: undefined
      }
      split_category_path: { Args: { path: string }; Returns: string[] }
      used_account_ids: { Args: never; Returns: string[] }
      used_category_ids: { Args: never; Returns: string[] }
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
