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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      essays: {
        Row: {
          collection_text: string | null
          content: string
          created_at: string
          exam_id: string
          feedback: string | null
          id: string
          score: Json | null
          status: string
          theme: string
          user_id: string
        }
        Insert: {
          collection_text?: string | null
          content?: string
          created_at?: string
          exam_id: string
          feedback?: string | null
          id?: string
          score?: Json | null
          status?: string
          theme: string
          user_id: string
        }
        Update: {
          collection_text?: string | null
          content?: string
          created_at?: string
          exam_id?: string
          feedback?: string | null
          id?: string
          score?: Json | null
          status?: string
          theme?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "essays_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          edital_url: string | null
          exam_type: string
          id: string
          mind_map: Json | null
          name: string
          syllabus: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          edital_url?: string | null
          exam_type?: string
          id?: string
          mind_map?: Json | null
          name: string
          syllabus?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          edital_url?: string | null
          exam_type?: string
          id?: string
          mind_map?: Json | null
          name?: string
          syllabus?: string | null
          user_id?: string
        }
        Relationships: []
      }
      flashcard_reviews: {
        Row: {
          flashcard_id: string
          id: string
          quality: number
          reviewed_at: string
          user_id: string
        }
        Insert: {
          flashcard_id: string
          id?: string
          quality: number
          reviewed_at?: string
          user_id: string
        }
        Update: {
          flashcard_id?: string
          id?: string
          quality?: number
          reviewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          alternatives: Json | null
          back: string
          created_at: string
          ease_factor: number
          front: string
          id: string
          interval_days: number
          next_review: string
          repetitions: number
          study_note_id: string
          user_id: string
        }
        Insert: {
          alternatives?: Json | null
          back: string
          created_at?: string
          ease_factor?: number
          front: string
          id?: string
          interval_days?: number
          next_review?: string
          repetitions?: number
          study_note_id: string
          user_id: string
        }
        Update: {
          alternatives?: Json | null
          back?: string
          created_at?: string
          ease_factor?: number
          front?: string
          id?: string
          interval_days?: number
          next_review?: string
          repetitions?: number
          study_note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_study_note_id_fkey"
            columns: ["study_note_id"]
            isOneToOne: false
            referencedRelation: "study_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_sales: {
        Row: {
          buyer_user_id: string
          commission_amount: number
          created_at: string
          id: string
          influencer_id: string
          paid_out: boolean
          sale_amount: number
          sale_date: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          buyer_user_id: string
          commission_amount?: number
          created_at?: string
          id?: string
          influencer_id: string
          paid_out?: boolean
          sale_amount?: number
          sale_date?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          buyer_user_id?: string
          commission_amount?: number
          created_at?: string
          id?: string
          influencer_id?: string
          paid_out?: boolean
          sale_amount?: number
          sale_date?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_sales_buyer_user_id_fkey"
            columns: ["buyer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_sales_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      note_highlights: {
        Row: {
          annotation: string | null
          color: string
          created_at: string
          end_offset: number
          id: string
          start_offset: number
          study_note_id: string
          text: string
          user_id: string
        }
        Insert: {
          annotation?: string | null
          color?: string
          created_at?: string
          end_offset?: number
          id?: string
          start_offset?: number
          study_note_id: string
          text: string
          user_id: string
        }
        Update: {
          annotation?: string | null
          color?: string
          created_at?: string
          end_offset?: number
          id?: string
          start_offset?: number
          study_note_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_highlights_study_note_id_fkey"
            columns: ["study_note_id"]
            isOneToOne: false
            referencedRelation: "study_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notebooks: {
        Row: {
          created_at: string
          description: string | null
          exam_id: string
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          exam_id: string
          id?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          exam_id?: string
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebooks_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          influencer_code: string | null
          is_influencer: boolean | null
          referral_code: string | null
          referred_by: string | null
          stripe_customer_id: string | null
          subscription_end_date: string | null
          subscription_status: string | null
          successful_referrals: number | null
          trial_start_date: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          influencer_code?: string | null
          is_influencer?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          successful_referrals?: number | null
          trial_start_date?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          influencer_code?: string | null
          is_influencer?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          successful_referrals?: number | null
          trial_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          notebook_id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          notebook_id: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          notebook_id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_notes_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          created_at: string
          essays_written: number
          flashcards_reviewed: number
          id: string
          minutes_studied: number
          notes_read: number
          session_date: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          essays_written?: number
          flashcards_reviewed?: number
          id?: string
          minutes_studied?: number
          notes_read?: number
          session_date?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          essays_written?: number
          flashcards_reviewed?: number
          id?: string
          minutes_studied?: number
          notes_read?: number
          session_date?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string
          current_streak: number
          daily_flashcards_goal: number
          daily_minutes_goal: number
          daily_notes_goal: number
          id: string
          last_study_date: string | null
          level: number
          longest_streak: number
          total_xp: number
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          daily_flashcards_goal?: number
          daily_minutes_goal?: number
          daily_notes_goal?: number
          id?: string
          last_study_date?: string | null
          level?: number
          longest_streak?: number
          total_xp?: number
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          daily_flashcards_goal?: number
          daily_minutes_goal?: number
          daily_notes_goal?: number
          id?: string
          last_study_date?: string | null
          level?: number
          longest_streak?: number
          total_xp?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
