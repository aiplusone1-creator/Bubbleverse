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
      characters: {
        Row: {
          created_at: string | null
          embedding_data: Json | null
          id: string
          name: string | null
          original_image_url: string | null
          role: string | null
          story_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          embedding_data?: Json | null
          id?: string
          name?: string | null
          original_image_url?: string | null
          role?: string | null
          story_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          embedding_data?: Json | null
          id?: string
          name?: string | null
          original_image_url?: string | null
          role?: string | null
          story_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string | null
          dialogue_text: string | null
          generated_image_url: string | null
          id: string
          is_regenerated: boolean | null
          page_number: number | null
          panel_layout_type: string | null
          scene_description: string | null
          story_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dialogue_text?: string | null
          generated_image_url?: string | null
          id?: string
          is_regenerated?: boolean | null
          page_number?: number | null
          panel_layout_type?: string | null
          scene_description?: string | null
          story_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dialogue_text?: string | null
          generated_image_url?: string | null
          id?: string
          is_regenerated?: boolean | null
          page_number?: number | null
          panel_layout_type?: string | null
          scene_description?: string | null
          story_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          art_style: string | null
          child_interests: string | null
          cover_image_url: string | null
          created_at: string | null
          id: string
          language: string | null
          pdf_url: string | null
          plot_mode_manual: boolean | null
          status: string | null
          story_format: string | null
          story_length_mode: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          user_plot_input: string | null
        }
        Insert: {
          art_style?: string | null
          child_interests?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          pdf_url?: string | null
          plot_mode_manual?: boolean | null
          status?: string | null
          story_format?: string | null
          story_length_mode?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_plot_input?: string | null
        }
        Update: {
          art_style?: string | null
          child_interests?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          language?: string | null
          pdf_url?: string | null
          plot_mode_manual?: boolean | null
          status?: string | null
          story_format?: string | null
          story_length_mode?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_plot_input?: string | null
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
