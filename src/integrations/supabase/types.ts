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
      despesas: {
        Row: {
          categoria: string | null
          criada_em: string | null
          data_despesa: string | null
          descricao: string | null
          id: string
          id_loja: string | null
          valor: number
        }
        Insert: {
          categoria?: string | null
          criada_em?: string | null
          data_despesa?: string | null
          descricao?: string | null
          id?: string
          id_loja?: string | null
          valor: number
        }
        Update: {
          categoria?: string | null
          criada_em?: string | null
          data_despesa?: string | null
          descricao?: string | null
          id?: string
          id_loja?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_id_loja_fkey"
            columns: ["id_loja"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_id_loja_fkey"
            columns: ["id_loja"]
            isOneToOne: false
            referencedRelation: "resumo_caixa"
            referencedColumns: ["id_loja"]
          },
          {
            foreignKeyName: "despesas_id_loja_fkey"
            columns: ["id_loja"]
            isOneToOne: false
            referencedRelation: "view_resumo_financeiro"
            referencedColumns: ["id_loja"]
          },
        ]
      }
      lojas: {
        Row: {
          criada_em: string | null
          id: string
          id_usuario: string | null
          nome: string
        }
        Insert: {
          criada_em?: string | null
          id?: string
          id_usuario?: string | null
          nome: string
        }
        Update: {
          criada_em?: string | null
          id?: string
          id_usuario?: string | null
          nome?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          criada_em: string | null
          data_venda: string | null
          descricao: string | null
          id: string
          id_loja: string | null
          valor: number
        }
        Insert: {
          criada_em?: string | null
          data_venda?: string | null
          descricao?: string | null
          id?: string
          id_loja?: string | null
          valor: number
        }
        Update: {
          criada_em?: string | null
          data_venda?: string | null
          descricao?: string | null
          id?: string
          id_loja?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_id_loja_fkey"
            columns: ["id_loja"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_id_loja_fkey"
            columns: ["id_loja"]
            isOneToOne: false
            referencedRelation: "resumo_caixa"
            referencedColumns: ["id_loja"]
          },
          {
            foreignKeyName: "vendas_id_loja_fkey"
            columns: ["id_loja"]
            isOneToOne: false
            referencedRelation: "view_resumo_financeiro"
            referencedColumns: ["id_loja"]
          },
        ]
      }
    }
    Views: {
      resumo_caixa: {
        Row: {
          id_loja: string | null
          saldo: number | null
          total_despesas: number | null
          total_vendas: number | null
        }
        Relationships: []
      }
      view_resumo_financeiro: {
        Row: {
          id_loja: string | null
          id_usuario: string | null
          nome_loja: string | null
          quantidade_despesas: number | null
          quantidade_vendas: number | null
          saldo: number | null
          total_despesas: number | null
          total_transacoes: number | null
          total_vendas: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_complete_schema: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
    Enums: {},
  },
} as const
