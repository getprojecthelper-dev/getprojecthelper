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
      ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          mentor_thread_id: string | null
          project_id: string
          role: string
          thread: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          mentor_thread_id?: string | null
          project_id: string
          role: string
          thread?: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          mentor_thread_id?: string | null
          project_id?: string
          role?: string
          thread?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_mentor_thread_id_fkey"
            columns: ["mentor_thread_id"]
            isOneToOne: false
            referencedRelation: "mentor_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_events: {
        Row: {
          created_at: string
          credits: number
          feature: string
          id: string
          input_tokens: number
          model: string | null
          output_tokens: number
          project_id: string | null
          total_tokens: number
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          feature?: string
          id?: string
          input_tokens?: number
          model?: string | null
          output_tokens?: number
          project_id?: string | null
          total_tokens?: number
          user_id?: string
        }
        Update: {
          created_at?: string
          credits?: number
          feature?: string
          id?: string
          input_tokens?: number
          model?: string | null
          output_tokens?: number
          project_id?: string | null
          total_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      budget_lines: {
        Row: {
          actual: number
          category: string
          created_at: string
          id: string
          item_name: string | null
          notes: string | null
          planned: number
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual?: number
          category: string
          created_at?: string
          id?: string
          item_name?: string | null
          notes?: string | null
          planned?: number
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual?: number
          category?: string
          created_at?: string
          id?: string
          item_name?: string | null
          notes?: string | null
          planned?: number
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      build_sections: {
        Row: {
          blocks: Json
          business_connection: string | null
          code: string | null
          created_at: string
          explanation: Json
          files: Json
          fix_notes: Json | null
          id: string
          insights: Json
          kind: string
          language: string
          objective: string | null
          position: number
          project_id: string
          question: string | null
          status: string
          structure: string | null
          title: string
          updated_at: string
          user_id: string
          walkthrough: Json | null
        }
        Insert: {
          blocks?: Json
          business_connection?: string | null
          code?: string | null
          created_at?: string
          explanation?: Json
          files?: Json
          fix_notes?: Json | null
          id?: string
          insights?: Json
          kind?: string
          language?: string
          objective?: string | null
          position?: number
          project_id: string
          question?: string | null
          status?: string
          structure?: string | null
          title: string
          updated_at?: string
          user_id?: string
          walkthrough?: Json | null
        }
        Update: {
          blocks?: Json
          business_connection?: string | null
          code?: string | null
          created_at?: string
          explanation?: Json
          files?: Json
          fix_notes?: Json | null
          id?: string
          insights?: Json
          kind?: string
          language?: string
          objective?: string | null
          position?: number
          project_id?: string
          question?: string | null
          status?: string
          structure?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          walkthrough?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "build_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      code_redemptions: {
        Row: {
          code_id: string
          created_at: string
          credits: number
          id: string
          user_id: string
        }
        Insert: {
          code_id: string
          created_at?: string
          credits?: number
          id?: string
          user_id: string
        }
        Update: {
          code_id?: string
          created_at?: string
          credits?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_balances: {
        Row: {
          balance: number
          created_at: string
          lifetime_granted: number
          lifetime_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          lifetime_granted?: number
          lifetime_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          lifetime_granted?: number
          lifetime_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          created_at: string
          delta: number
          feature: string | null
          id: string
          kind: string
          reason: string | null
          ref_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta?: number
          feature?: string | null
          id?: string
          kind?: string
          reason?: string | null
          ref_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          feature?: string | null
          id?: string
          kind?: string
          reason?: string | null
          ref_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      document_sections: {
        Row: {
          content: string | null
          created_at: string
          id: string
          position: number
          project_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          position?: number
          project_id: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          position?: number
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          authors: Json
          created_at: string
          doc_type: string
          format: string
          id: string
          latex: string | null
          meta: Json
          project_id: string | null
          sections: Json
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          authors?: Json
          created_at?: string
          doc_type: string
          format: string
          id?: string
          latex?: string | null
          meta?: Json
          project_id?: string | null
          sections?: Json
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          authors?: Json
          created_at?: string
          doc_type?: string
          format?: string
          id?: string
          latex?: string | null
          meta?: Json
          project_id?: string | null
          sections?: Json
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          created_at: string
          dataset: string | null
          id: string
          metrics: string | null
          model: string | null
          name: string
          notes: string | null
          parameters: string | null
          project_id: string
          results: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dataset?: string | null
          id?: string
          metrics?: string | null
          model?: string | null
          name: string
          notes?: string | null
          parameters?: string | null
          project_id: string
          results?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          dataset?: string | null
          id?: string
          metrics?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          parameters?: string | null
          project_id?: string
          results?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_threads: {
        Row: {
          created_at: string
          id: string
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_threads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          preferences: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          preferences?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      project_catalog_pricing: {
        Row: {
          catalog_project_id: string
          created_at: string
          discount_percent: number
          environment: string
          id: string
          is_active: boolean
          price_external_id: string
          regular_price_minor: number
          updated_at: string
        }
        Insert: {
          catalog_project_id: string
          created_at?: string
          discount_percent?: number
          environment?: string
          id?: string
          is_active?: boolean
          price_external_id: string
          regular_price_minor: number
          updated_at?: string
        }
        Update: {
          catalog_project_id?: string
          created_at?: string
          discount_percent?: number
          environment?: string
          id?: string
          is_active?: boolean
          price_external_id?: string
          regular_price_minor?: number
          updated_at?: string
        }
        Relationships: []
      }
      project_purchases: {
        Row: {
          amount_minor: number | null
          catalog_project_id: string
          created_at: string
          currency: string | null
          environment: string
          id: string
          payment_customer_id: string | null
          payment_transaction_id: string
          project_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_minor?: number | null
          catalog_project_id: string
          created_at?: string
          currency?: string | null
          environment?: string
          id?: string
          payment_customer_id?: string | null
          payment_transaction_id: string
          project_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_minor?: number | null
          catalog_project_id?: string
          created_at?: string
          currency?: string | null
          environment?: string
          id?: string
          payment_customer_id?: string | null
          payment_transaction_id?: string
          project_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_purchases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          academic_level: string | null
          builder_step: string
          code_complexity: string
          created_at: string
          current_stage: string
          dataset: Json | null
          deadline: string | null
          description: string | null
          domain: string
          id: string
          idea: string | null
          name: string
          pm_profile: Json | null
          project_type: string | null
          purpose: string
          repo_url: string | null
          status: string
          tech_stack: Json
          template: string
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_level?: string | null
          builder_step?: string
          code_complexity?: string
          created_at?: string
          current_stage?: string
          dataset?: Json | null
          deadline?: string | null
          description?: string | null
          domain?: string
          id?: string
          idea?: string | null
          name: string
          pm_profile?: Json | null
          project_type?: string | null
          purpose?: string
          repo_url?: string | null
          status?: string
          tech_stack?: Json
          template?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          academic_level?: string | null
          builder_step?: string
          code_complexity?: string
          created_at?: string
          current_stage?: string
          dataset?: Json | null
          deadline?: string | null
          description?: string | null
          domain?: string
          id?: string
          idea?: string | null
          name?: string
          pm_profile?: Json | null
          project_type?: string | null
          purpose?: string
          repo_url?: string | null
          status?: string
          tech_stack?: Json
          template?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      raci_assignments: {
        Row: {
          created_at: string
          id: string
          project_id: string
          responsibility: string
          stakeholder_id: string | null
          task_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          responsibility: string
          stakeholder_id?: string | null
          task_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          responsibility?: string
          stakeholder_id?: string | null
          task_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raci_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raci_assignments_stakeholder_id_fkey"
            columns: ["stakeholder_id"]
            isOneToOne: false
            referencedRelation: "stakeholders"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          credits: number
          expires_at: string | null
          id: string
          is_active: boolean
          label: string | null
          max_redemptions: number | null
          redemption_count: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          credits?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_redemptions?: number | null
          redemption_count?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          credits?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          max_redemptions?: number | null
          redemption_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      requirements: {
        Row: {
          acceptance_criteria: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          priority: string
          project_id: string
          req_type: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acceptance_criteria?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          project_id: string
          req_type?: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          acceptance_criteria?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          project_id?: string
          req_type?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      research_notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          project_id: string
          theme: string | null
          title: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          project_id: string
          theme?: string | null
          title: string
          user_id?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          project_id?: string
          theme?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      research_sources: {
        Row: {
          authors: string | null
          created_at: string
          id: string
          notes: string | null
          project_id: string
          source_type: string
          title: string
          url: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          authors?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          source_type?: string
          title: string
          url?: string | null
          user_id?: string
          year?: number | null
        }
        Update: {
          authors?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          source_type?: string
          title?: string
          url?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "research_sources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      risks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          impact: string | null
          likelihood: string | null
          mitigation: string | null
          project_id: string
          severity: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          impact?: string | null
          likelihood?: string | null
          mitigation?: string | null
          project_id: string
          severity?: string
          status?: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          impact?: string | null
          likelihood?: string | null
          mitigation?: string | null
          project_id?: string
          severity?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_tasks: {
        Row: {
          created_at: string
          dependencies: string | null
          duration_days: number | null
          end_date: string | null
          id: string
          milestone: boolean
          name: string
          owner: string | null
          position: number
          project_id: string
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dependencies?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          milestone?: boolean
          name: string
          owner?: string | null
          position?: number
          project_id: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dependencies?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          milestone?: boolean
          name?: string
          owner?: string | null
          position?: number
          project_id?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholders: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          influence: string | null
          interest: string | null
          name: string
          notes: string | null
          project_id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          influence?: string | null
          interest?: string | null
          name: string
          notes?: string | null
          project_id: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          influence?: string | null
          interest?: string | null
          name?: string
          notes?: string | null
          project_id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      status_reports: {
        Row: {
          accomplishments: string | null
          blockers: string | null
          budget_snapshot: string | null
          created_at: string
          id: string
          next_steps: string | null
          overall_status: string | null
          period: string
          project_id: string
          risks_snapshot: string | null
          schedule_snapshot: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accomplishments?: string | null
          blockers?: string | null
          budget_snapshot?: string | null
          created_at?: string
          id?: string
          next_steps?: string | null
          overall_status?: string | null
          period: string
          project_id: string
          risks_snapshot?: string | null
          schedule_snapshot?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accomplishments?: string | null
          blockers?: string | null
          budget_snapshot?: string | null
          created_at?: string
          id?: string
          next_steps?: string | null
          overall_status?: string | null
          period?: string
          project_id?: string
          risks_snapshot?: string | null
          schedule_snapshot?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          current_period_end: string | null
          id: string
          plan: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          currency?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          project_id: string
          requirement_id: string | null
          stage: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id: string
          requirement_id?: string | null
          stage?: string
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          project_id?: string
          requirement_id?: string | null
          stage?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cases: {
        Row: {
          actual_result: string | null
          created_at: string
          expected_result: string | null
          id: string
          project_id: string
          requirement_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_result?: string | null
          created_at?: string
          expected_result?: string | null
          id?: string
          project_id: string
          requirement_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          actual_result?: string | null
          created_at?: string
          expected_result?: string | null
          id?: string
          project_id?: string
          requirement_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_cases_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
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
      wbs_items: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          owner: string | null
          parent_id: string | null
          position: number
          project_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner?: string | null
          parent_id?: string | null
          position?: number
          project_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner?: string | null
          parent_id?: string | null
          position?: number
          project_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wbs_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "wbs_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wbs_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_credits: {
        Args: { _amount: number; _reason: string; _user_id: string }
        Returns: number
      }
      ensure_credit_balance: { Args: { _user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hold_credits: {
        Args: { _amount: number; _feature: string; _user_id: string }
        Returns: string
      }
      redeem_referral_code: { Args: { _code: string }; Returns: number }
      release_credit_hold: { Args: { _hold_id: string }; Returns: undefined }
      settle_credit_hold: {
        Args: { _actual: number; _hold_id: string }
        Returns: number
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
