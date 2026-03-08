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
      bookmarks: {
        Row: {
          created_at: string
          helper_user_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          helper_user_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          helper_user_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          city_name: string
          country: string
          id: string
          latitude: number | null
          longitude: number | null
          province: string
        }
        Insert: {
          city_name: string
          country?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          province: string
        }
        Update: {
          city_name?: string
          country?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          province?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          helper_user_id: string
          id: string
          seeker_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          helper_user_id: string
          id?: string
          seeker_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          helper_user_id?: string
          id?: string
          seeker_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      featured_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_reference: string | null
          plan: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_reference?: string | null
          plan: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_reference?: string | null
          plan?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      helper_details: {
        Row: {
          about_me: string | null
          age: number | null
          availability_status: string
          available_from: string | null
          average_rating: number | null
          background_check_available: boolean
          background_check_requested: boolean
          background_check_status: string
          city: string | null
          country: string | null
          created_at: string
          featured_status: string
          featured_type: string | null
          featured_until: string | null
          gender: string | null
          helper_references: Json | null
          id: string
          is_featured: boolean
          is_published: boolean | null
          languages: string[] | null
          preferred_hours: string | null
          salary_expectation: string | null
          salary_max: number | null
          salary_min: number | null
          salary_negotiable: boolean | null
          skills: string[] | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          video_introduction_url: string | null
          video_views: number
          willing_to_work_abroad: boolean | null
          work_authorization_status: string | null
          work_type: string[] | null
          years_experience: number | null
        }
        Insert: {
          about_me?: string | null
          age?: number | null
          availability_status?: string
          available_from?: string | null
          average_rating?: number | null
          background_check_available?: boolean
          background_check_requested?: boolean
          background_check_status?: string
          city?: string | null
          country?: string | null
          created_at?: string
          featured_status?: string
          featured_type?: string | null
          featured_until?: string | null
          gender?: string | null
          helper_references?: Json | null
          id?: string
          is_featured?: boolean
          is_published?: boolean | null
          languages?: string[] | null
          preferred_hours?: string | null
          salary_expectation?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_negotiable?: boolean | null
          skills?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          video_introduction_url?: string | null
          video_views?: number
          willing_to_work_abroad?: boolean | null
          work_authorization_status?: string | null
          work_type?: string[] | null
          years_experience?: number | null
        }
        Update: {
          about_me?: string | null
          age?: number | null
          availability_status?: string
          available_from?: string | null
          average_rating?: number | null
          background_check_available?: boolean
          background_check_requested?: boolean
          background_check_status?: string
          city?: string | null
          country?: string | null
          created_at?: string
          featured_status?: string
          featured_type?: string | null
          featured_until?: string | null
          gender?: string | null
          helper_references?: Json | null
          id?: string
          is_featured?: boolean
          is_published?: boolean | null
          languages?: string[] | null
          preferred_hours?: string | null
          salary_expectation?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_negotiable?: boolean | null
          skills?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          video_introduction_url?: string | null
          video_views?: number
          willing_to_work_abroad?: boolean | null
          work_authorization_status?: string | null
          work_type?: string[] | null
          years_experience?: number | null
        }
        Relationships: []
      }
      helper_reviews: {
        Row: {
          comment: string | null
          created_at: string
          helper_id: string
          id: string
          rating: number
          seeker_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          helper_id: string
          id?: string
          rating: number
          seeker_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          helper_id?: string
          id?: string
          rating?: number
          seeker_id?: string
        }
        Relationships: []
      }
      helper_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          featured_active: boolean
          featured_cancelled: boolean
          featured_cancelled_at: string | null
          featured_expires_at: string | null
          id: string
          status: string
          trial_end: string
          trial_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          featured_active?: boolean
          featured_cancelled?: boolean
          featured_cancelled_at?: string | null
          featured_expires_at?: string | null
          id?: string
          status?: string
          trial_end?: string
          trial_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          featured_active?: boolean
          featured_cancelled?: boolean
          featured_cancelled_at?: string | null
          featured_expires_at?: string | null
          id?: string
          status?: string
          trial_end?: string
          trial_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hires: {
        Row: {
          confirmed_at: string | null
          confirmed_by_helper: boolean
          confirmed_by_seeker: boolean
          conversation_id: string | null
          created_at: string
          ended_at: string | null
          helper_id: string
          id: string
          seeker_id: string
          status: string
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by_helper?: boolean
          confirmed_by_seeker?: boolean
          conversation_id?: string | null
          created_at?: string
          ended_at?: string | null
          helper_id: string
          id?: string
          seeker_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by_helper?: boolean
          confirmed_by_seeker?: boolean
          conversation_id?: string | null
          created_at?: string
          ended_at?: string | null
          helper_id?: string
          id?: string
          seeker_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hires_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          conversation_id: string | null
          created_at: string
          helper_response: string | null
          helper_user_id: string
          id: string
          interview_type: string
          location: string | null
          meeting_link: string | null
          meeting_method: string | null
          notes: string | null
          proposed_date: string
          seeker_message: string | null
          seeker_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          helper_response?: string | null
          helper_user_id: string
          id?: string
          interview_type?: string
          location?: string | null
          meeting_link?: string | null
          meeting_method?: string | null
          notes?: string | null
          proposed_date: string
          seeker_message?: string | null
          seeker_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          helper_response?: string | null
          helper_user_id?: string
          id?: string
          interview_type?: string
          location?: string | null
          meeting_link?: string | null
          meeting_method?: string | null
          notes?: string | null
          proposed_date?: string
          seeker_message?: string | null
          seeker_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_hires: {
        Row: {
          confirmed_at: string | null
          created_at: string
          helper_confirmed: boolean
          helper_user_id: string
          id: string
          interview_id: string
          seeker_confirmed: boolean
          seeker_user_id: string
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          helper_confirmed?: boolean
          helper_user_id: string
          id?: string
          interview_id: string
          seeker_confirmed?: boolean
          seeker_user_id: string
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          helper_confirmed?: boolean
          helper_user_id?: string
          id?: string
          interview_id?: string
          seeker_confirmed?: boolean
          seeker_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_hires_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: true
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_analytics: {
        Row: {
          id: string
          messages_received_last_7_days: number
          profile_views_last_7_days: number
          search_appearances_last_7_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          messages_received_last_7_days?: number
          profile_views_last_7_days?: number
          search_appearances_last_7_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          messages_received_last_7_days?: number
          profile_views_last_7_days?: number
          search_appearances_last_7_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_suspended: boolean
          is_verified: boolean
          last_active_at: string | null
          referral_code: string | null
          referred_by: string | null
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_suspended?: boolean
          is_verified?: boolean
          last_active_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_suspended?: boolean
          is_verified?: boolean
          last_active_at?: string | null
          referral_code?: string | null
          referred_by?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string | null
          referred_user_id: string
          referrer_id: string
          reward_given: boolean
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code?: string | null
          referred_user_id: string
          referrer_id: string
          reward_given?: boolean
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string | null
          referred_user_id?: string
          referrer_id?: string
          reward_given?: boolean
          status?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          context_id: string | null
          context_type: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_user_id: string
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          context_id?: string | null
          context_type?: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_user_id: string
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          context_id?: string | null
          context_type?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_user_id?: string
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      response_metrics: {
        Row: {
          avg_response_minutes: number
          id: string
          response_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_response_minutes?: number
          id?: string
          response_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_response_minutes?: number
          id?: string
          response_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          interview_id: string
          rating: number
          reviewee_user_id: string
          reviewer_user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          interview_id: string
          rating: number
          reviewee_user_id: string
          reviewer_user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          interview_id?: string
          rating?: number
          reviewee_user_id?: string
          reviewer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      seeker_subscriptions: {
        Row: {
          amount: number | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          payment_reference: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_reference?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_reference?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
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
      verification_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_reference: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          payment_reference?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_reference?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          created_at: string
          document_url: string
          id: string
          payment_id: string | null
          rejection_reason: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_url: string
          id?: string
          payment_id?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_url?: string
          id?: string
          payment_id?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "verification_payments"
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
      search_cities: {
        Args: { result_limit?: number; search_term: string }
        Returns: {
          city_name: string
          country: string
          id: string
          latitude: number
          longitude: number
          province: string
          similarity_score: number
        }[]
      }
      track_profile_view: {
        Args: { helper_user_id: string }
        Returns: undefined
      }
      track_search_appearances: {
        Args: { helper_user_ids: string[] }
        Returns: undefined
      }
      track_video_view: { Args: { helper_user_id: string }; Returns: undefined }
      update_last_active: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "seeker" | "helper" | "admin"
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
      app_role: ["seeker", "helper", "admin"],
    },
  },
} as const
