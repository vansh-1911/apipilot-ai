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
      api_endpoints: {
        Row: {
          id: string
          spec_id: string
          method: string
          path: string
          summary: string | null
          tags: string[]
          operation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          spec_id: string
          method: string
          path: string
          summary?: string | null
          tags?: string[]
          operation_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          spec_id?: string
          method?: string
          path?: string
          summary?: string | null
          tags?: string[]
          operation_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_endpoints_spec_id_fkey"
            columns: ["spec_id"]
            isOneToOne: false
            referencedRelation: "api_specs"
            referencedColumns: ["id"]
          },
        ]
      }
      api_specs: {
        Row: {
          api_version: string | null
          auth_type: string | null
          created_at: string
          description: string | null
          endpoint_count: number
          file_name: string
          file_path: string
          id: string
          name: string
          openapi_version: string | null
          servers: string[] | null
          status: Database["public"]["Enums"]["spec_status"]
          updated_at: string
          user_id: string
          api_version: string | null
          openapi_version: string | null
          auth_type: string | null
          servers: Json
        }
        Insert: {
          api_version?: string | null
          auth_type?: string | null
          created_at?: string
          description?: string | null
          endpoint_count?: number
          file_name: string
          file_path: string
          id?: string
          name: string
          openapi_version?: string | null
          servers?: string[] | null
          status?: Database["public"]["Enums"]["spec_status"]
          updated_at?: string
          user_id: string
          api_version?: string | null
          openapi_version?: string | null
          auth_type?: string | null
          servers?: Json
        }
        Update: {
          api_version?: string | null
          auth_type?: string | null
          created_at?: string
          description?: string | null
          endpoint_count?: number
          file_name?: string
          file_path?: string
          id?: string
          name?: string
          openapi_version?: string | null
          servers?: string[] | null
          status?: Database["public"]["Enums"]["spec_status"]
          updated_at?: string
          user_id?: string
          api_version?: string | null
          openapi_version?: string | null
          auth_type?: string | null
          servers?: Json
        }
        Relationships: []
      }
      generated_docs: {
        Row: {
          id: string
          spec_id: string
          overview: string | null
          auth_guide: string | null
          quick_start: string | null
          best_practices: string | null
          full_markdown: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          spec_id: string
          overview?: string | null
          auth_guide?: string | null
          quick_start?: string | null
          best_practices?: string | null
          full_markdown?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          spec_id?: string
          overview?: string | null
          auth_guide?: string | null
          quick_start?: string | null
          best_practices?: string | null
          full_markdown?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_docs_spec_id_fkey"
            columns: ["spec_id"]
            isOneToOne: false
            referencedRelation: "api_specs"
            referencedColumns: ["id"]
          },
        ]
      }
      api_endpoints: {
        Row: {
          id: string
          spec_id: string
          method: string
          path: string
          summary: string | null
          tags: string[]
          operation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          spec_id: string
          method: string
          path: string
          summary?: string | null
          tags?: string[]
          operation_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          spec_id?: string
          method?: string
          path?: string
          summary?: string | null
          tags?: string[]
          operation_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_endpoints_spec_id_fkey"
            columns: ["spec_id"]
            isOneToOne: false
            referencedRelation: "api_specs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      spec_status: "uploaded" | "processing" | "completed" | "failed"
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
      spec_status: ["uploaded", "processing", "completed", "failed"],
    },
  },
} as const
