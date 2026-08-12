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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      cash_sessions: {
        Row: {
          closed_at: string | null
          closing_amount: number | null
          created_at: string
          id: string
          notes: string
          opened_at: string
          opening_amount: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          closing_amount?: number | null
          created_at?: string
          id?: string
          notes?: string
          opened_at?: string
          opening_amount?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          closing_amount?: number | null
          created_at?: string
          id?: string
          notes?: string
          opened_at?: string
          opening_amount?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          city: string
          created_at: string
          id: string
          name: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string
          created_at?: string
          id?: string
          name: string
          phone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      extra_costs: {
        Row: {
          created_at: string
          id: string
          name: string
          unit: string
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          unit?: string
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          unit?: string
          unit_price?: number
          user_id?: string
        }
        Relationships: []
      }
      failures: {
        Row: {
          cost: number
          created_at: string
          filament_id: string | null
          id: string
          lost_g: number
          notes: string
          printer_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          filament_id?: string | null
          id?: string
          lost_g?: number
          notes?: string
          printer_id?: string | null
          reason?: string
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          filament_id?: string | null
          id?: string
          lost_g?: number
          notes?: string
          printer_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "failures_filament_id_fkey"
            columns: ["filament_id"]
            isOneToOne: false
            referencedRelation: "filaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "failures_printer_id_fkey"
            columns: ["printer_id"]
            isOneToOne: false
            referencedRelation: "printers"
            referencedColumns: ["id"]
          },
        ]
      }
      filaments: {
        Row: {
          brand: string
          color: string
          created_at: string
          hex: string
          id: string
          price_per_kg: number
          remaining_g: number
          total_g: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand: string
          color?: string
          created_at?: string
          hex?: string
          id?: string
          price_per_kg?: number
          remaining_g?: number
          total_g?: number
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string
          color?: string
          created_at?: string
          hex?: string
          id?: string
          price_per_kg?: number
          remaining_g?: number
          total_g?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_entries: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          due_date: string
          id: string
          invoice_name: string | null
          invoice_number: string
          invoice_path: string | null
          invoice_series: string
          kind: string
          paid_at: string | null
          party: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description: string
          due_date?: string
          id?: string
          invoice_name?: string | null
          invoice_number?: string
          invoice_path?: string | null
          invoice_series?: string
          kind?: string
          paid_at?: string | null
          party?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          invoice_name?: string | null
          invoice_number?: string
          invoice_path?: string | null
          invoice_series?: string
          kind?: string
          paid_at?: string | null
          party?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nfe_import_items: {
        Row: {
          created_at: string
          description: string
          id: string
          import_id: string
          qty: number
          target_id: string | null
          target_type: string
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          import_id: string
          qty?: number
          target_id?: string | null
          target_type?: string
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          import_id?: string
          qty?: number
          target_id?: string | null
          target_type?: string
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfe_import_items_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "nfe_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      nfe_imports: {
        Row: {
          access_key: string
          created_at: string
          file_name: string | null
          id: string
          issue_date: string | null
          status: string
          supplier: string
          total: number
          user_id: string
        }
        Insert: {
          access_key?: string
          created_at?: string
          file_name?: string | null
          id?: string
          issue_date?: string | null
          status?: string
          supplier?: string
          total?: number
          user_id: string
        }
        Update: {
          access_key?: string
          created_at?: string
          file_name?: string | null
          id?: string
          issue_date?: string | null
          status?: string
          supplier?: string
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          channel: string
          client: string
          cost: number
          created_at: string
          date: string
          hours: number
          id: string
          priority: string
          ref: string
          stage: string
          title: string
          updated_at: string
          user_id: string
          value: number
          weight_g: number
        }
        Insert: {
          channel?: string
          client?: string
          cost?: number
          created_at?: string
          date?: string
          hours?: number
          id?: string
          priority?: string
          ref: string
          stage?: string
          title: string
          updated_at?: string
          user_id: string
          value?: number
          weight_g?: number
        }
        Update: {
          channel?: string
          client?: string
          cost?: number
          created_at?: string
          date?: string
          hours?: number
          id?: string
          priority?: string
          ref?: string
          stage?: string
          title?: string
          updated_at?: string
          user_id?: string
          value?: number
          weight_g?: number
        }
        Relationships: []
      }
      printers: {
        Row: {
          created_at: string
          current_file: string | null
          depreciation_per_hour: number
          failures: number
          hours_run: number
          id: string
          model: string
          name: string
          progress: number | null
          remaining_min: number | null
          status: string
          updated_at: string
          user_id: string
          watts: number
        }
        Insert: {
          created_at?: string
          current_file?: string | null
          depreciation_per_hour?: number
          failures?: number
          hours_run?: number
          id?: string
          model?: string
          name: string
          progress?: number | null
          remaining_min?: number | null
          status?: string
          updated_at?: string
          user_id: string
          watts?: number
        }
        Update: {
          created_at?: string
          current_file?: string | null
          depreciation_per_hour?: number
          failures?: number
          hours_run?: number
          id?: string
          model?: string
          name?: string
          progress?: number | null
          remaining_min?: number | null
          status?: string
          updated_at?: string
          user_id?: string
          watts?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          hours: number
          id: string
          name: string
          price: number
          sold: number
          updated_at: string
          user_id: string
          weight_g: number
        }
        Insert: {
          category?: string
          created_at?: string
          hours?: number
          id?: string
          name: string
          price?: number
          sold?: number
          updated_at?: string
          user_id: string
          weight_g?: number
        }
        Update: {
          category?: string
          created_at?: string
          hours?: number
          id?: string
          name?: string
          price?: number
          sold?: number
          updated_at?: string
          user_id?: string
          weight_g?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          name: string
          product_id: string | null
          qty: number
          sale_id: string
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          product_id?: string | null
          qty?: number
          sale_id: string
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          product_id?: string | null
          qty?: number
          sale_id?: string
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cash_session_id: string | null
          client: string
          created_at: string
          discount: number
          id: string
          payment_method: string
          total: number
          user_id: string
        }
        Insert: {
          cash_session_id?: string | null
          client?: string
          created_at?: string
          discount?: number
          id?: string
          payment_method?: string
          total?: number
          user_id: string
        }
        Update: {
          cash_session_id?: string | null
          client?: string
          created_at?: string
          discount?: number
          id?: string
          payment_method?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          cnpj: string
          company: string
          default_margin: number
          energy_rate: number
          failure_rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cnpj?: string
          company?: string
          default_margin?: number
          energy_rate?: number
          failure_rate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cnpj?: string
          company?: string
          default_margin?: number
          energy_rate?: number
          failure_rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
    }
    Enums: {
      app_role: "admin" | "operador"
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
      app_role: ["admin", "operador"],
    },
  },
} as const
