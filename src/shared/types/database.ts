/**
 * Tipos generados automáticamente por `pnpm db:gen-types`.
 *
 * Este archivo se reemplaza completo cuando se corre el comando contra una DB
 * local (con migraciones aplicadas) o remota (con CLI autenticado). El stub
 * actual permite compilar antes de levantar Supabase local.
 *
 * Para regenerar:
 *   pnpm db:start
 *   pnpm db:gen-types
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

type Phase = "started" | "completed" | "blocked" | "failed"
type Locale = "es" | "en"
type AppRole = "client" | "admin"
type IdentityStatus =
  | "submitted"
  | "extracting"
  | "awaiting_user_review"
  | "pending_admin"
  | "approved"
  | "rejected"

export type IntakeStatus =
  | "created"
  | "contract_pending"
  | "contract_signed"
  | "payment_pending"
  | "in_progress"
  | "review_pending"
  | "needs_correction"
  | "approved"
  | "finalized"
  | "archived"
  | "cancelled"

export type SignatureStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "signed"
  | "declined"
  | "expired"
  | "cancelled"

export type PaymentMethod =
  | "cash"
  | "zelle"
  | "bank_transfer"
  | "check"
  | "money_order"
  | "cashapp"
  | "venmo"
  | "other"

export type PaymentStatus = "reported" | "verified" | "rejected" | "refunded"
export type InstallmentStatus = "pending" | "reported" | "verified" | "overdue" | "waived"
export type PaymentPlanStatus = "active" | "completed" | "cancelled" | "in_default"
export type DocumentStatus = "uploaded" | "approved" | "rejected" | "archived"
export type ActorType = "client" | "admin" | "system" | "ai"

export type ComplaintCategory =
  | "inaccurate_result"
  | "failed_exercise_rights"
  | "unnecessary_service"
  | "billing"
  | "technical"
  | "other"

export type ComplaintStatus = "open" | "investigating" | "resolved" | "escalated"

export type AiTaskType =
  | "chat"
  | "extract_document"
  | "classify_intent"
  | "classify_output"
  | "filing_narrative"
  | "other"

export type ExtractionStatus =
  | "pending"
  | "extracting"
  | "extracted"
  | "extraction_failed"
  | "skipped"

export type DocumentSlotKind = "single" | "dual_es_en" | "multiple_named"

export type FormResponseStatus = "draft" | "submitted" | "printed"

// ============================================================================
// Filing — pestaña Radicación por Distrito
// ============================================================================
export type CourtType = "district" | "justice" | "juvenile"

export type FormFormat = "pdf" | "docx" | "mypaperwork" | "html"

export type IntakeChannel = "in_person" | "mail" | "email" | "mycase" | "efile" | "hybrid"

export type FilingResolvedFrom = "identity_doc" | "client_zip" | "client_address" | "manual_county"

export type FilingPrintType =
  | "full_packet"
  | "intake_only"
  | "case_only"
  | "single_form"
  | "cover_sheet"

export interface FilingStep {
  step: number
  title: string
  detail: string
  estimated_time?: string
  requires_client_action: boolean
}

export interface FilingFormSnapshot {
  form_code: string
  name_es: string
  name_en: string
  description_es?: string | null
  description_en?: string | null
  url_official: string
  format: FormFormat
  is_mandatory: boolean
  ordering: number
  cached_sha256?: string | null
}

export interface FilingWarning {
  type: string
  message_es: string
  message_en: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          date_of_birth: string | null
          phone: string | null
          preferred_language: Locale
          utah_residency_verified: boolean
          utah_residency_verified_at: string | null
          utah_residency_method: string | null
          consents: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          date_of_birth?: string | null
          phone?: string | null
          preferred_language?: Locale
          utah_residency_verified?: boolean
          utah_residency_verified_at?: string | null
          utah_residency_method?: string | null
          consents?: Json
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      user_roles: {
        Row: {
          user_id: string
          role: AppRole
          granted_at: string
          granted_by: string | null
        }
        Insert: {
          user_id: string
          role: AppRole
          granted_by?: string | null
        }
        Update: never
        Relationships: []
      }
      audit_log: {
        Row: {
          id: number
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          ip_address: string | null
          user_agent: string | null
          pii_accessed: boolean
          phase: Phase
          metadata: Json | null
          created_at: string
        }
        Insert: {
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          pii_accessed?: boolean
          phase?: Phase
          metadata?: Json | null
        }
        Update: never
        Relationships: []
      }
      consents: {
        Row: {
          id: string
          user_id: string
          consent_key: string
          consent_version: string
          text_snapshot: string
          locale: Locale
          ip_address: string | null
          user_agent: string | null
          accepted_at: string
        }
        Insert: {
          user_id: string
          consent_key: string
          consent_version: string
          text_snapshot: string
          locale: Locale
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: never
        Relationships: []
      }
      service_categories: {
        Row: {
          id: string
          slug: string
          name_es: string
          name_en: string
          description_es: string | null
          description_en: string | null
          icon: string | null
          color_hex: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          slug: string
          name_es: string
          name_en: string
          description_es?: string | null
          description_en?: string | null
          icon?: string | null
          color_hex: string
          display_order?: number
          is_active?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["service_categories"]["Insert"]>
        Relationships: []
      }
      services: {
        Row: {
          id: string
          category_id: string
          slug: string
          name_es: string
          name_en: string
          short_description_es: string
          short_description_en: string
          long_description_es: string | null
          long_description_en: string | null
          what_it_includes_es: Json
          what_it_includes_en: Json
          what_it_does_not_include_es: Json
          what_it_does_not_include_en: Json
          base_price_cents: number
          estimated_duration_minutes: number | null
          workflow_slug: string
          required_documents: Json
          pdf_template_path: string | null
          beneficiary_label_es: string | null
          beneficiary_label_en: string | null
          allows_multiple_beneficiaries: boolean
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          category_id: string
          slug: string
          name_es: string
          name_en: string
          short_description_es: string
          short_description_en: string
          long_description_es?: string | null
          long_description_en?: string | null
          what_it_includes_es?: Json
          what_it_includes_en?: Json
          what_it_does_not_include_es?: Json
          what_it_does_not_include_en?: Json
          base_price_cents: number
          estimated_duration_minutes?: number | null
          workflow_slug: string
          required_documents?: Json
          pdf_template_path?: string | null
          beneficiary_label_es?: string | null
          beneficiary_label_en?: string | null
          allows_multiple_beneficiaries?: boolean
          is_active?: boolean
          display_order?: number
        }
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          id: string
          slug: string
          name_es: string
          name_en: string
          description_es: string | null
          description_en: string | null
          applicable_services: string[]
          is_required_default: boolean
          accepts_file_types: string[]
          max_size_bytes: number
          is_per_minor: boolean
          slot_kind: DocumentSlotKind
          extraction_schema_slug: string | null
          conditional_logic: Json | null
          created_at: string
        }
        Insert: {
          slug: string
          name_es: string
          name_en: string
          description_es?: string | null
          description_en?: string | null
          applicable_services?: string[]
          is_required_default?: boolean
          accepts_file_types?: string[]
          max_size_bytes?: number
          is_per_minor?: boolean
          slot_kind?: DocumentSlotKind
          extraction_schema_slug?: string | null
          conditional_logic?: Json | null
        }
        Update: Partial<Database["public"]["Tables"]["document_types"]["Insert"]>
        Relationships: []
      }
      identity_verifications: {
        Row: {
          id: string
          user_id: string
          status: IdentityStatus
          document_front_path: string | null
          document_back_path: string | null
          document_proof_path: string | null
          extracted_full_name: string | null
          extracted_date_of_birth: string | null
          extracted_address_street: string | null
          extracted_address_city: string | null
          extracted_address_state: string | null
          extracted_address_zip: string | null
          extracted_id_number_last4: string | null
          extracted_id_state: string | null
          extracted_expiration_date: string | null
          client_confirmed_at: string | null
          admin_reviewed_by: string | null
          admin_reviewed_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          status?: IdentityStatus
          document_front_path?: string | null
          document_back_path?: string | null
          document_proof_path?: string | null
          extracted_full_name?: string | null
          extracted_date_of_birth?: string | null
          extracted_address_street?: string | null
          extracted_address_city?: string | null
          extracted_address_state?: string | null
          extracted_address_zip?: string | null
          extracted_id_number_last4?: string | null
          extracted_id_state?: string | null
          extracted_expiration_date?: string | null
          client_confirmed_at?: string | null
          admin_reviewed_by?: string | null
          admin_reviewed_at?: string | null
          rejection_reason?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["identity_verifications"]["Insert"]>
        Relationships: []
      }
      cases: {
        Row: {
          id: string
          case_number: string
          client_id: string
          service_id: string
          service_tier_id: string | null
          beneficiary_count: number | null
          display_name: string
          beneficiary_data: Json | null
          intake_status: IntakeStatus
          service_status: string | null
          form_data: Json
          current_step: string | null
          completed_steps: string[]
          agreed_price_cents: number | null
          payment_plan_type: "one_time" | "installments" | null
          assigned_admin_id: string | null
          qa_review_required: boolean
          qa_reviewed_at: string | null
          qa_reviewed_by: string | null
          qa_review_notes: string | null
          filing_county_fips: string | null
          filing_district_id: number | null
          filing_court_id: string | null
          created_at: string
          updated_at: string
          finalized_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
        }
        Insert: {
          client_id: string
          service_id: string
          service_tier_id?: string | null
          beneficiary_count?: number | null
          display_name: string
          beneficiary_data?: Json | null
          intake_status?: IntakeStatus
          form_data?: Json
          current_step?: string | null
          completed_steps?: string[]
          agreed_price_cents?: number | null
          payment_plan_type?: "one_time" | "installments" | null
          assigned_admin_id?: string | null
          qa_review_required?: boolean
          filing_county_fips?: string | null
          filing_district_id?: number | null
          filing_court_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["cases"]["Insert"]> & {
          intake_status?: IntakeStatus
          service_status?: string | null
          current_step?: string | null
          completed_steps?: string[]
          qa_reviewed_at?: string | null
          qa_reviewed_by?: string | null
          qa_review_notes?: string | null
          filing_county_fips?: string | null
          filing_district_id?: number | null
          filing_court_id?: string | null
          finalized_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
        }
        Relationships: []
      }
      case_activities: {
        Row: {
          id: number
          case_id: string
          actor_id: string | null
          actor_type: ActorType
          activity_type: string
          description: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          case_id: string
          actor_id?: string | null
          actor_type: ActorType
          activity_type: string
          description?: string | null
          metadata?: Json | null
        }
        Update: never
        Relationships: []
      }
      contracts: {
        Row: {
          id: string
          case_id: string
          client_id: string
          contract_number: string
          template_version: string
          pdf_storage_path: string | null
          terms_snapshot: Json
          dropbox_sign_request_id: string | null
          signature_status: SignatureStatus
          signed_at: string | null
          signed_pdf_storage_path: string | null
          signature_audit_trail: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          case_id: string
          client_id: string
          template_version?: string
          pdf_storage_path?: string | null
          terms_snapshot: Json
          dropbox_sign_request_id?: string | null
          signature_status?: SignatureStatus
        }
        Update: Partial<Database["public"]["Tables"]["contracts"]["Insert"]> & {
          signed_at?: string | null
          signed_pdf_storage_path?: string | null
          signature_audit_trail?: Json | null
        }
        Relationships: []
      }
      payment_plans: {
        Row: {
          id: string
          case_id: string
          client_id: string
          total_amount_cents: number
          payment_type: "one_time" | "installments"
          num_installments: number
          down_payment_cents: number
          status: PaymentPlanStatus
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          case_id: string
          client_id: string
          total_amount_cents: number
          payment_type: "one_time" | "installments"
          num_installments?: number
          down_payment_cents?: number
          status?: PaymentPlanStatus
          notes?: string | null
          created_by: string
        }
        Update: Partial<Database["public"]["Tables"]["payment_plans"]["Insert"]>
        Relationships: []
      }
      installments: {
        Row: {
          id: string
          payment_plan_id: string
          installment_number: number
          amount_cents: number
          due_date: string
          status: InstallmentStatus
          payment_id: string | null
          created_at: string
        }
        Insert: {
          payment_plan_id: string
          installment_number: number
          amount_cents: number
          due_date: string
          status?: InstallmentStatus
          payment_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["installments"]["Insert"]>
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          payment_plan_id: string
          installment_id: string | null
          client_id: string
          case_id: string
          amount_cents: number
          currency: string
          payment_method: PaymentMethod
          payment_method_details: string | null
          payment_date: string
          status: PaymentStatus
          reported_by: string
          reported_by_role: "client" | "admin"
          reported_at: string
          verified_by: string | null
          verified_at: string | null
          verification_notes: string | null
          rejection_reason: string | null
          refunded_at: string | null
          refunded_by: string | null
          refund_amount_cents: number | null
          refund_reason: string | null
          created_at: string
        }
        Insert: {
          payment_plan_id: string
          installment_id?: string | null
          client_id: string
          case_id: string
          amount_cents: number
          currency?: string
          payment_method: PaymentMethod
          payment_method_details?: string | null
          payment_date: string
          status?: PaymentStatus
          reported_by: string
          reported_by_role: "client" | "admin"
        }
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]> & {
          verified_by?: string | null
          verified_at?: string | null
          verification_notes?: string | null
          rejection_reason?: string | null
        }
        Relationships: []
      }
      payment_proofs: {
        Row: {
          id: string
          payment_id: string
          storage_path: string
          filename: string
          mime_type: string
          size_bytes: number
          sha256_hash: string
          uploaded_by: string
          uploaded_at: string
        }
        Insert: {
          payment_id: string
          storage_path: string
          filename: string
          mime_type: string
          size_bytes: number
          sha256_hash: string
          uploaded_by: string
        }
        Update: never
        Relationships: []
      }
      payment_receipts: {
        Row: {
          id: string
          payment_id: string
          receipt_number: string
          pdf_storage_path: string | null
          generated_at: string
          emailed_to: string | null
          emailed_at: string | null
        }
        Insert: {
          payment_id: string
          pdf_storage_path?: string | null
          emailed_to?: string | null
          emailed_at?: string | null
        }
        Update: never
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          case_id: string
          client_id: string
          document_type_id: string | null
          minor_id: string | null
          minor_label: string | null
          storage_path: string
          filename: string
          mime_type: string
          size_bytes: number
          sha256_hash: string
          uploaded_by: string
          is_generated: boolean
          is_signed: boolean
          status: DocumentStatus
          review_notes: string | null
          version: number
          extraction_status: ExtractionStatus
          extraction_attempts: number
          extracted_text: string | null
          extracted_data: Json | null
          extracted_at: string | null
          extraction_error: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          case_id: string
          client_id: string
          document_type_id?: string | null
          minor_id?: string | null
          minor_label?: string | null
          storage_path: string
          filename: string
          mime_type: string
          size_bytes: number
          sha256_hash: string
          uploaded_by: string
          is_generated?: boolean
          is_signed?: boolean
          status?: DocumentStatus
          version?: number
          extraction_status?: ExtractionStatus
          extraction_attempts?: number
          extracted_text?: string | null
          extracted_data?: Json | null
          extracted_at?: string | null
          extraction_error?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]> & {
          status?: DocumentStatus
          review_notes?: string | null
          deleted_at?: string | null
          extraction_status?: ExtractionStatus
          extraction_attempts?: number
          extracted_text?: string | null
          extracted_data?: Json | null
          extracted_at?: string | null
          extraction_error?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          link: string | null
          read_at: string | null
          delivered_via: string[]
          created_at: string
        }
        Insert: {
          user_id: string
          type: string
          title: string
          body?: string | null
          link?: string | null
          read_at?: string | null
          delivered_via?: string[]
        }
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>
        Relationships: []
      }
      complaints: {
        Row: {
          id: string
          complaint_number: string
          case_id: string | null
          client_id: string | null
          reporter_email: string
          reporter_name: string | null
          category: ComplaintCategory
          subject: string
          description: string
          locale: Locale
          status: ComplaintStatus
          assigned_to: string | null
          resolution: string | null
          resolved_at: string | null
          reported_to_innovation_office: boolean
          reported_to_innovation_office_at: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          client_id?: string | null
          reporter_email: string
          reporter_name?: string | null
          category: ComplaintCategory
          subject: string
          description: string
          locale: Locale
          status?: ComplaintStatus
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["complaints"]["Insert"]> & {
          status?: ComplaintStatus
          assigned_to?: string | null
          resolution?: string | null
          resolved_at?: string | null
          reported_to_innovation_office?: boolean
          reported_to_innovation_office_at?: string | null
        }
        Relationships: []
      }
      ai_interactions: {
        Row: {
          id: number
          user_id: string | null
          case_id: string | null
          model: string
          task_type: AiTaskType
          prompt_tokens: number | null
          completion_tokens: number | null
          user_message: string | null
          ai_response: string | null
          function_call_name: string | null
          function_call_arguments: Json | null
          guardrails_triggered: string[]
          blocked: boolean
          block_reason: string | null
          user_flagged_inappropriate: boolean
          user_flagged_at: string | null
          latency_ms: number | null
          created_at: string
        }
        Insert: {
          user_id?: string | null
          case_id?: string | null
          model: string
          task_type: AiTaskType
          prompt_tokens?: number | null
          completion_tokens?: number | null
          user_message?: string | null
          ai_response?: string | null
          function_call_name?: string | null
          function_call_arguments?: Json | null
          guardrails_triggered?: string[]
          blocked?: boolean
          block_reason?: string | null
          latency_ms?: number | null
        }
        Update: never
        Relationships: []
      }
      lawyers: {
        Row: {
          id: string
          profile_id: string | null
          full_name: string
          bar_number: string
          bar_state: string
          practice_areas: string[]
          languages: string[]
          bio_es: string | null
          bio_en: string | null
          hourly_rate_cents: number | null
          email: string | null
          phone: string | null
          website_url: string | null
          is_supervisor: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          profile_id?: string | null
          full_name: string
          bar_number: string
          bar_state?: string
          practice_areas?: string[]
          languages?: string[]
          bio_es?: string | null
          bio_en?: string | null
          hourly_rate_cents?: number | null
          email?: string | null
          phone?: string | null
          website_url?: string | null
          is_supervisor?: boolean
          is_active?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["lawyers"]["Insert"]>
        Relationships: []
      }
      judicial_districts: {
        Row: {
          id: number
          name_es: string
          name_en: string
          seat_city: string
          seat_address: string | null
          phone: string | null
          website_url: string
          email_filing_supported: boolean
          notes_es: string | null
          notes_en: string | null
          updated_at: string
        }
        Insert: {
          id: number
          name_es: string
          name_en: string
          seat_city: string
          seat_address?: string | null
          phone?: string | null
          website_url: string
          email_filing_supported?: boolean
          notes_es?: string | null
          notes_en?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["judicial_districts"]["Insert"]>
        Relationships: []
      }
      utah_counties: {
        Row: {
          fips_code: string
          name: string
          district_id: number
          has_juvenile_court: boolean
          has_justice_court: boolean
        }
        Insert: {
          fips_code: string
          name: string
          district_id: number
          has_juvenile_court?: boolean
          has_justice_court?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["utah_counties"]["Insert"]>
        Relationships: []
      }
      court_locations: {
        Row: {
          id: string
          district_id: number
          county_fips: string | null
          court_type: CourtType
          name_es: string
          name_en: string
          street: string
          city: string
          state: string
          zip: string
          phone: string | null
          hours: string | null
          website_url: string | null
          efiling_url: string | null
          self_help_center_phone: string | null
          google_maps_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          district_id: number
          county_fips?: string | null
          court_type: CourtType
          name_es: string
          name_en: string
          street: string
          city: string
          state?: string
          zip: string
          phone?: string | null
          hours?: string | null
          website_url?: string | null
          efiling_url?: string | null
          self_help_center_phone?: string | null
          google_maps_url?: string | null
          is_active?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["court_locations"]["Insert"]>
        Relationships: []
      }
      official_court_forms: {
        Row: {
          id: string
          form_code: string
          service_slugs: string[]
          district_specific: number | null
          name_es: string
          name_en: string
          description_es: string | null
          description_en: string | null
          url_official: string
          url_official_alt: string | null
          format: FormFormat
          cached_storage_path: string | null
          cached_sha256: string | null
          cached_at: string | null
          cache_size_bytes: number | null
          last_url_check_at: string | null
          last_url_status: number | null
          is_mandatory: boolean
          ordering: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          form_code: string
          service_slugs?: string[]
          district_specific?: number | null
          name_es: string
          name_en: string
          description_es?: string | null
          description_en?: string | null
          url_official: string
          url_official_alt?: string | null
          format?: FormFormat
          cached_storage_path?: string | null
          cached_sha256?: string | null
          cached_at?: string | null
          cache_size_bytes?: number | null
          last_url_check_at?: string | null
          last_url_status?: number | null
          is_mandatory?: boolean
          ordering?: number
          is_active?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["official_court_forms"]["Insert"]>
        Relationships: []
      }
      case_filing_procedures: {
        Row: {
          id: string
          service_slug: string
          district_id: number | null
          intake_channel: IntakeChannel
          intake_steps_es: Json
          intake_steps_en: Json
          intake_filing_fee_cents: number
          intake_fee_waiver_form_code: string | null
          case_steps_es: Json
          case_steps_en: Json
          case_typical_duration_days: number | null
          venue_rule_es: string
          venue_rule_en: string
          venue_statute_ref: string
          source_urls: Json
          last_verified_at: string
          verified_by: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          service_slug: string
          district_id?: number | null
          intake_channel: IntakeChannel
          intake_steps_es?: Json
          intake_steps_en?: Json
          intake_filing_fee_cents: number
          intake_fee_waiver_form_code?: string | null
          case_steps_es?: Json
          case_steps_en?: Json
          case_typical_duration_days?: number | null
          venue_rule_es: string
          venue_rule_en: string
          venue_statute_ref: string
          source_urls?: Json
          last_verified_at?: string
          verified_by?: string | null
          is_active?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["case_filing_procedures"]["Insert"]>
        Relationships: []
      }
      case_filing_packets: {
        Row: {
          id: string
          case_id: string
          district_id: number
          procedure_id: string
          intake_steps_snapshot_es: Json
          intake_steps_snapshot_en: Json
          case_steps_snapshot_es: Json
          case_steps_snapshot_en: Json
          forms_snapshot: Json
          fee_snapshot_cents: number
          ai_narrative_es: string | null
          ai_narrative_en: string | null
          ai_warnings: Json
          ai_model: string | null
          ai_grounded_sources: Json
          resolved_from: FilingResolvedFrom
          resolved_county_fips: string
          generated_at: string
          generated_by: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          last_printed_at: string | null
          print_count: number
        }
        Insert: {
          case_id: string
          district_id: number
          procedure_id: string
          intake_steps_snapshot_es: Json
          intake_steps_snapshot_en: Json
          case_steps_snapshot_es: Json
          case_steps_snapshot_en: Json
          forms_snapshot: Json
          fee_snapshot_cents: number
          ai_narrative_es?: string | null
          ai_narrative_en?: string | null
          ai_warnings?: Json
          ai_model?: string | null
          ai_grounded_sources?: Json
          resolved_from: FilingResolvedFrom
          resolved_county_fips: string
          generated_by?: string | null
        }
        Update: {
          ai_narrative_es?: string | null
          ai_narrative_en?: string | null
          ai_warnings?: Json
          ai_model?: string | null
          ai_grounded_sources?: Json
          reviewed_by?: string | null
          reviewed_at?: string | null
          last_printed_at?: string | null
          print_count?: number
        }
        Relationships: []
      }
      filing_packet_prints: {
        Row: {
          id: number
          packet_id: string
          case_id: string
          user_id: string | null
          user_role: "client" | "admin"
          print_type: FilingPrintType
          form_codes: string[]
          pdf_storage_path: string
          pdf_sha256: string
          pdf_size_bytes: number
          ip_address: string | null
          user_agent: string | null
          printed_at: string
        }
        Insert: {
          packet_id: string
          case_id: string
          user_id?: string | null
          user_role: "client" | "admin"
          print_type: FilingPrintType
          form_codes?: string[]
          pdf_storage_path: string
          pdf_sha256: string
          pdf_size_bytes: number
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: never
        Relationships: []
      }
      service_tiers: {
        Row: {
          id: string
          service_id: string
          beneficiaries_count: number
          price_cents: number
          label_es: string
          label_en: string
          description_es: string | null
          description_en: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          service_id: string
          beneficiaries_count: number
          price_cents: number
          label_es: string
          label_en: string
          description_es?: string | null
          description_en?: string | null
          display_order?: number
          is_active?: boolean
        }
        Update: Partial<Database["public"]["Tables"]["service_tiers"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "service_tiers_service_id_fkey"
            columns: ["service_id"]
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      case_minors: {
        Row: {
          id: string
          case_id: string
          display_index: number
          full_name: string
          date_of_birth: string | null
          document_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          case_id: string
          display_index: number
          full_name: string
          date_of_birth?: string | null
          document_number?: string | null
          notes?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["case_minors"]["Insert"]>
        Relationships: [
          {
            foreignKeyName: "case_minors_case_id_fkey"
            columns: ["case_id"]
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          id: string
          case_id: string
          client_id: string
          form_slug: string
          responses: Json
          prefilled_from: Json | null
          status: FormResponseStatus
          last_printed_at: string | null
          print_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          case_id: string
          client_id: string
          form_slug: string
          responses?: Json
          prefilled_from?: Json | null
          status?: FormResponseStatus
        }
        Update: Partial<Database["public"]["Tables"]["form_responses"]["Insert"]> & {
          status?: FormResponseStatus
          last_printed_at?: string | null
          print_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_case_id_fkey"
            columns: ["case_id"]
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      has_role: { Args: { check_role: string }; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
