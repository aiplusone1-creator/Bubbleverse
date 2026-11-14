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
      app_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
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
      examples: {
        Row: {
          cover_url: string
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          style: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_url: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          style: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          style?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_banned: boolean | null
          is_premium: boolean | null
          preferred_currency: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_banned?: boolean | null
          is_premium?: boolean | null
          preferred_currency?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_banned?: boolean | null
          is_premium?: boolean | null
          preferred_currency?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      showcase_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          art_style: string | null
          child_interests: string | null
          config_snapshot: Json | null
          cover_image_url: string | null
          created_at: string | null
          id: string
          is_deleted: boolean | null
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
          config_snapshot?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
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
          config_snapshot?: Json | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      submit_story_inquiry: {
        Args: {
          p_request_key: string
          p_country: string
          p_format: string
          p_language: string
          p_child_first_name: string
          p_shipping_address: string | null
          p_story: Json
        }
        Returns: Json
      }
      get_story_order_quote: {
        Args: { p_country: string; p_format: string }
        Returns: Json
      }
      list_story_orders: {
        Args: { p_before?: string }
        Returns: Json
      }
      list_order_queue: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_story_order: {
        Args: { p_order_id: string }
        Returns: Json
      }
      claim_story_order: {
        Args: { p_order_id: string }
        Returns: string
      }
      assign_story_order: {
        Args: { p_order_id: string; p_operator_id: string }
        Returns: string
      }
      request_order_correction: {
        Args: { p_order_id: string; p_message: string }
        Returns: undefined
      }
      validate_order_story: {
        Args: { p_story: Json }
        Returns: Json
      }
      resume_story_inquiry: {
        Args: { p_order_id: string }
        Returns: Json
      }
      update_story_inquiry: {
        Args: {
          p_order_id: string
          p_expected_updated_at: string
          p_child_first_name: string
          p_shipping_address: string | null
          p_story: Json
        }
        Returns: Json
      }
      is_order_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      submit_b2b_inquiry: {
        Args: {
          p_institution: string
          p_contact_name: string
          p_contact_email: string
          p_contact_phone: string
          p_country: string
          p_format: string
          p_language: string
          p_quantity: number
          p_notes: string | null
        }
        Returns: string
      }
      // Aligned with local migration 20261114000400; not a hosted schema refresh.
      save_generated_story: {
        Args: { p_expected_owner: string; p_request_key: string; p_payload: Json }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "operator"
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
    Enums: {
      app_role: ["admin", "moderator", "user", "operator"],
    },
  },
} as const
