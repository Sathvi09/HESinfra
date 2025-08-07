export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          aadhaar_card_url: string | null
          age: number | null
          created_at: string
          current_step: number
          date_of_birth: string | null
          driving_license_url: string | null
          email: string | null
          full_name: string | null
          has_driving_license: boolean | null
          id: string
          identity_verified: boolean | null
          issuing_authority: string | null
          license_expiry_date: string | null
          license_issue_date: string | null
          license_number: string | null
          license_verified: boolean | null
          marital_status: string | null
          number_of_children: number | null
          pan_card_url: string | null
          phone_number: string | null
          present_address: string | null
          state: string | null
          status: string
          updated_at: string
          user_id: string | null
          vehicle_classes: string[] | null
        }
        Insert: {
          aadhaar_card_url?: string | null
          age?: number | null
          created_at?: string
          current_step?: number
          date_of_birth?: string | null
          driving_license_url?: string | null
          email?: string | null
          full_name?: string | null
          has_driving_license?: boolean | null
          id?: string
          identity_verified?: boolean | null
          issuing_authority?: string | null
          license_expiry_date?: string | null
          license_issue_date?: string | null
          license_number?: string | null
          license_verified?: boolean | null
          marital_status?: string | null
          number_of_children?: number | null
          pan_card_url?: string | null
          phone_number?: string | null
          present_address?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_classes?: string[] | null
        }
        Update: {
          aadhaar_card_url?: string | null
          age?: number | null
          created_at?: string
          current_step?: number
          date_of_birth?: string | null
          driving_license_url?: string | null
          email?: string | null
          full_name?: string | null
          has_driving_license?: boolean | null
          id?: string
          identity_verified?: boolean | null
          issuing_authority?: string | null
          license_expiry_date?: string | null
          license_issue_date?: string | null
          license_number?: string | null
          license_verified?: boolean | null
          marital_status?: string | null
          number_of_children?: number | null
          pan_card_url?: string | null
          phone_number?: string | null
          present_address?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_classes?: string[] | null
        }
        Relationships: []
      }
      education: {
        Row: {
          application_id: string | null
          certificate_url: string | null
          completion_month: number
          completion_year: number
          created_at: string
          id: string
          institution_address: string
          institution_name: string
          level_of_education: string
          marks_obtained: number
          maximum_marks: number
          percentage: number | null
        }
        Insert: {
          application_id?: string | null
          certificate_url?: string | null
          completion_month: number
          completion_year: number
          created_at?: string
          id?: string
          institution_address: string
          institution_name: string
          level_of_education: string
          marks_obtained: number
          maximum_marks: number
          percentage?: number | null
        }
        Update: {
          application_id?: string | null
          certificate_url?: string | null
          completion_month?: number
          completion_year?: number
          created_at?: string
          id?: string
          institution_address?: string
          institution_name?: string
          level_of_education?: string
          marks_obtained?: number
          maximum_marks?: number
          percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "education_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_history: {
        Row: {
          address: string
          application_id: string | null
          certificate_url: string | null
          created_at: string
          designation: string
          employer_name: string
          id: string
          joining_date: string
          leaving_date: string | null
          may_contact_employer: boolean | null
          reason_for_leaving: string | null
          take_home_salary: number | null
        }
        Insert: {
          address: string
          application_id?: string | null
          certificate_url?: string | null
          created_at?: string
          designation: string
          employer_name: string
          id?: string
          joining_date: string
          leaving_date?: string | null
          may_contact_employer?: boolean | null
          reason_for_leaving?: string | null
          take_home_salary?: number | null
        }
        Update: {
          address?: string
          application_id?: string | null
          certificate_url?: string | null
          created_at?: string
          designation?: string
          employer_name?: string
          id?: string
          joining_date?: string
          leaving_date?: string | null
          may_contact_employer?: boolean | null
          reason_for_leaving?: string | null
          take_home_salary?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employment_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
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
