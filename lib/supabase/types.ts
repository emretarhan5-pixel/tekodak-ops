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
      announcement_reads: {
        Row: {
          announcement_id: string
          device_type: string | null
          read_at: string | null
          user_id: string
        }
        Insert: {
          announcement_id: string
          device_type?: string | null
          read_at?: string | null
          user_id: string
        }
        Update: {
          announcement_id?: string
          device_type?: string | null
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          expires_at: string | null
          id: string
          is_archived: boolean | null
          is_published: boolean | null
          priority: string
          publish_at: string | null
          target_audience: string
          target_branch_ids: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_published?: boolean | null
          priority?: string
          publish_at?: string | null
          target_audience: string
          target_branch_ids?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_published?: boolean | null
          priority?: string
          publish_at?: string | null
          target_audience?: string
          target_branch_ids?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          branch_id: string | null
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string
          id: number
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          branch_id?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type: string
          id?: number
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          branch_id?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: number
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_headquarters: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_headquarters?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_headquarters?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string | null
          default_warranty_years: number | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_warranty_years?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_warranty_years?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          category_type: string
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          display_name: string
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          updated_at: string | null
        }
        Insert: {
          category_type: string
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category_type?: string
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_devices: {
        Row: {
          added_at: string | null
          added_by: string | null
          contract_id: string
          device_id: string
          id: string
          removed_at: string | null
          removed_by: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          contract_id: string
          device_id: string
          id?: string
          removed_at?: string | null
          removed_by?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          contract_id?: string
          device_id?: string
          id?: string
          removed_at?: string | null
          removed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_devices_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_devices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_devices_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_devices_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_files: {
        Row: {
          category: string | null
          contract_id: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          file_name: string
          file_size_bytes: number
          id: string
          is_primary_document: boolean | null
          mime_type: string
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          contract_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          file_name: string
          file_size_bytes: number
          id?: string
          is_primary_document?: boolean | null
          mime_type: string
          storage_path: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          category?: string | null
          contract_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          file_name?: string
          file_size_bytes?: number
          id?: string
          is_primary_document?: boolean | null
          mime_type?: string
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_files_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_files_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_renewal_reminders: {
        Row: {
          contract_id: string
          days_before: number
          id: string
          notification_count: number | null
          notified_user_ids: string[]
          triggered_at: string | null
        }
        Insert: {
          contract_id: string
          days_before: number
          id?: string
          notification_count?: number | null
          notified_user_ids: string[]
          triggered_at?: string | null
        }
        Update: {
          contract_id?: string
          days_before?: number
          id?: string
          notification_count?: number | null
          notified_user_ids?: string[]
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_renewal_reminders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          agreed_price: number
          annual_maintenance_count: number | null
          completed_maintenance_count: number
          branch_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          contract_number: string
          contract_type: string
          currency: string
          created_at: string | null
          created_by: string
          customer_id: string
          deleted_at: string | null
          deleted_by: string | null
          end_date: string
          id: string
          list_price: number | null
          minimum_price: number | null
          notes: string | null
          override_reason: string | null
          parts_included: boolean | null
          payment_method: string | null
          renewed_from_id: string | null
          renewed_to_id: string | null
          responsible_user_id: string
          sla_response_hours: number | null
          special_terms: string | null
          start_date: string
          status: string
          total_maintenance_count: number
          travel_included: boolean | null
          updated_at: string | null
          updated_by: string | null
          vat_included: boolean | null
          vat_rate: number | null
          working_hours: string | null
        }
        Insert: {
          agreed_price: number
          annual_maintenance_count?: number | null
          completed_maintenance_count?: number
          branch_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contract_number: string
          contract_type: string
          currency?: string
          created_at?: string | null
          created_by: string
          customer_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          end_date: string
          id?: string
          list_price?: number | null
          minimum_price?: number | null
          notes?: string | null
          override_reason?: string | null
          parts_included?: boolean | null
          payment_method?: string | null
          renewed_from_id?: string | null
          renewed_to_id?: string | null
          responsible_user_id: string
          sla_response_hours?: number | null
          special_terms?: string | null
          start_date: string
          status?: string
          total_maintenance_count?: number
          travel_included?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          vat_included?: boolean | null
          vat_rate?: number | null
          working_hours?: string | null
        }
        Update: {
          agreed_price?: number
          annual_maintenance_count?: number | null
          completed_maintenance_count?: number
          branch_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contract_number?: string
          contract_type?: string
          currency?: string
          created_at?: string | null
          created_by?: string
          customer_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          end_date?: string
          id?: string
          list_price?: number | null
          minimum_price?: number | null
          notes?: string | null
          override_reason?: string | null
          parts_included?: boolean | null
          payment_method?: string | null
          renewed_from_id?: string | null
          renewed_to_id?: string | null
          responsible_user_id?: string
          sla_response_hours?: number | null
          special_terms?: string | null
          start_date?: string
          status?: string
          total_maintenance_count?: number
          travel_included?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          vat_included?: boolean | null
          vat_rate?: number | null
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "contracts_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_renewed_from_id_fkey"
            columns: ["renewed_from_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_renewed_to_id_fkey"
            columns: ["renewed_to_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_job_log: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          ended_at: string | null
          error_message: string | null
          id: number
          job_name: string
          output_summary: Json | null
          rows_processed: number | null
          started_at: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          ended_at?: string | null
          error_message?: string | null
          id?: number
          job_name: string
          output_summary?: Json | null
          rows_processed?: number | null
          started_at: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          ended_at?: string | null
          error_message?: string | null
          id?: number
          job_name?: string
          output_summary?: Json | null
          rows_processed?: number | null
          started_at?: string
          status?: string | null
        }
        Relationships: []
      }
      customer_contacts: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          email: string | null
          full_name: string
          id: string
          is_primary: boolean | null
          notes: string | null
          phone: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          email?: string | null
          full_name: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          phone?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          email?: string | null
          full_name?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          phone?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_files: {
        Row: {
          category: string | null
          customer_id: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          file_name: string
          file_size_bytes: number
          id: string
          mime_type: string
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          customer_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          file_name: string
          file_size_bytes: number
          id?: string
          mime_type: string
          storage_path: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          category?: string | null
          customer_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          file_name?: string
          file_size_bytes?: number
          id?: string
          mime_type?: string
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_files_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_files_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_pins: {
        Row: {
          customer_id: string
          pinned_at: string | null
          user_id: string
        }
        Insert: {
          customer_id: string
          pinned_at?: string | null
          user_id: string
        }
        Update: {
          customer_id?: string
          pinned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_pins_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_responsible_users: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          customer_id: string
          id: string
          is_primary: boolean | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          customer_id: string
          id?: string
          is_primary?: boolean | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          customer_id?: string
          id?: string
          is_primary?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_responsible_users_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_responsible_users_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_responsible_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          branch_id: string
          city: string | null
          created_at: string | null
          created_by: string
          customer_type: string
          deleted_at: string | null
          deleted_by: string | null
          district: string | null
          email: string | null
          full_address: string | null
          id: string
          main_phone: string | null
          name: string
          notes: string | null
          sector: string | null
          tax_number: string
          tax_office: string | null
          updated_at: string | null
          updated_by: string | null
          website: string | null
        }
        Insert: {
          branch_id: string
          city?: string | null
          created_at?: string | null
          created_by: string
          customer_type: string
          deleted_at?: string | null
          deleted_by?: string | null
          district?: string | null
          email?: string | null
          full_address?: string | null
          id?: string
          main_phone?: string | null
          name: string
          notes?: string | null
          sector?: string | null
          tax_number: string
          tax_office?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          branch_id?: string
          city?: string | null
          created_at?: string | null
          created_by?: string
          customer_type?: string
          deleted_at?: string | null
          deleted_by?: string | null
          district?: string | null
          email?: string | null
          full_address?: string | null
          id?: string
          main_phone?: string | null
          name?: string
          notes?: string | null
          sector?: string | null
          tax_number?: string
          tax_office?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      data_exports: {
        Row: {
          created_at: string | null
          export_type: string
          file_size_bytes: number | null
          filters_applied: Json | null
          format: string
          id: string
          ip_address: unknown
          record_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          export_type: string
          file_size_bytes?: number | null
          filters_applied?: Json | null
          format: string
          id?: string
          ip_address?: unknown
          record_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          export_type?: string
          file_size_bytes?: number | null
          filters_applied?: Json | null
          format?: string
          id?: string
          ip_address?: unknown
          record_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      device_files: {
        Row: {
          category: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          device_id: string
          file_name: string
          file_size_bytes: number
          id: string
          mime_type: string
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          device_id: string
          file_name: string
          file_size_bytes: number
          id?: string
          mime_type: string
          storage_path: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          category?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          device_id?: string
          file_name?: string
          file_size_bytes?: number
          id?: string
          mime_type?: string
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_files_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_files_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      device_models: {
        Row: {
          brand_id: string
          category: string | null
          created_at: string | null
          default_capacity: string | null
          default_power_watt: number | null
          default_voltage: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          model_name: string
          warranty_years: number | null
        }
        Insert: {
          brand_id: string
          category?: string | null
          created_at?: string | null
          default_capacity?: string | null
          default_power_watt?: number | null
          default_voltage?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          model_name: string
          warranty_years?: number | null
        }
        Update: {
          brand_id?: string
          category?: string | null
          created_at?: string | null
          default_capacity?: string | null
          default_power_watt?: number | null
          default_voltage?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          model_name?: string
          warranty_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "device_models_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      device_pins: {
        Row: {
          device_id: string
          pinned_at: string | null
          user_id: string
        }
        Insert: {
          device_id: string
          pinned_at?: string | null
          user_id: string
        }
        Update: {
          device_id?: string
          pinned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_pins_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_pins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          branch_id: string
          brand_id: string
          capacity: string | null
          color: string | null
          created_at: string | null
          created_by: string
          customer_id: string
          deleted_at: string | null
          deleted_by: string | null
          dimensions: string | null
          id: string
          location_address: string | null
          location_note: string | null
          manufacturing_year: number | null
          model_id: string
          notes: string | null
          power_watt: number | null
          responsible_user_id: string | null
          serial_number: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
          voltage: string | null
          warranty_end_date: string | null
          warranty_start_date: string | null
          weight_kg: number | null
        }
        Insert: {
          branch_id: string
          brand_id: string
          capacity?: string | null
          color?: string | null
          created_at?: string | null
          created_by: string
          customer_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          dimensions?: string | null
          id?: string
          location_address?: string | null
          location_note?: string | null
          manufacturing_year?: number | null
          model_id: string
          notes?: string | null
          power_watt?: number | null
          responsible_user_id?: string | null
          serial_number: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          voltage?: string | null
          warranty_end_date?: string | null
          warranty_start_date?: string | null
          weight_kg?: number | null
        }
        Update: {
          branch_id?: string
          brand_id?: string
          capacity?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string
          customer_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          dimensions?: string | null
          id?: string
          location_address?: string | null
          location_note?: string | null
          manufacturing_year?: number | null
          model_id?: string
          notes?: string | null
          power_watt?: number | null
          responsible_user_id?: string | null
          serial_number?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          voltage?: string | null
          warranty_end_date?: string | null
          warranty_start_date?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "devices_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "device_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          attempt_count: number | null
          body_html: string
          body_text: string | null
          context_id: string | null
          context_type: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          last_attempt_at: string | null
          priority: string | null
          sent_at: string | null
          status: string
          subject: string
          template_data: Json | null
          template_name: string | null
          to_email: string
          to_user_id: string | null
        }
        Insert: {
          attempt_count?: number | null
          body_html: string
          body_text?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          priority?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_data?: Json | null
          template_name?: string | null
          to_email: string
          to_user_id?: string | null
        }
        Update: {
          attempt_count?: number | null
          body_html?: string
          body_text?: string | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          priority?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_data?: Json | null
          template_name?: string | null
          to_email?: string
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      individual_targets: {
        Row: {
          achieved_value: number | null
          assigned_by: string
          completion_percentage: number | null
          created_at: string | null
          id: string
          individual_value: number
          target_id: string
          user_id: string
        }
        Insert: {
          achieved_value?: number | null
          assigned_by: string
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          individual_value: number
          target_id: string
          user_id: string
        }
        Update: {
          achieved_value?: number | null
          assigned_by?: string
          completion_percentage?: number | null
          created_at?: string | null
          id?: string
          individual_value?: number
          target_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "individual_targets_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_targets_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "target_progress"
            referencedColumns: ["target_id"]
          },
          {
            foreignKeyName: "individual_targets_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "individual_targets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          branch_id: string
          created_at: string | null
          created_by: string
          id: string
          movement_type: string
          notes: string | null
          part_id: string
          quantity_change: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          supplier_order_number: string | null
          unit_cost: number | null
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          created_by: string
          id?: string
          movement_type: string
          notes?: string | null
          part_id: string
          quantity_change: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          supplier_order_number?: string | null
          unit_cost?: number | null
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          movement_type?: string
          notes?: string | null
          part_id?: string
          quantity_change?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          supplier_order_number?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_movements_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transfers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          delivery_method: string | null
          id: string
          part_id: string
          quantity: number
          reason: string
          rejection_reason: string | null
          requested_at: string | null
          requested_by: string
          source_branch_id: string
          source_movement_id: string | null
          status: string
          target_branch_id: string
          target_movement_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          delivery_method?: string | null
          id?: string
          part_id: string
          quantity: number
          reason: string
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by: string
          source_branch_id: string
          source_movement_id?: string | null
          status?: string
          target_branch_id: string
          target_movement_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          delivery_method?: string | null
          id?: string
          part_id?: string
          quantity?: number
          reason?: string
          rejection_reason?: string | null
          requested_at?: string | null
          requested_by?: string
          source_branch_id?: string
          source_movement_id?: string | null
          status?: string
          target_branch_id?: string
          target_movement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transfers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "inventory_transfers_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_source_branch_id_fkey"
            columns: ["source_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_source_branch_id_fkey"
            columns: ["source_branch_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "inventory_transfers_source_movement_id_fkey"
            columns: ["source_movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_target_branch_id_fkey"
            columns: ["target_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_target_branch_id_fkey"
            columns: ["target_branch_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "inventory_transfers_target_movement_id_fkey"
            columns: ["target_movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_movements"
            referencedColumns: ["id"]
          },
        ]
      }
      materialized_view_refresh_log: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: number
          refresh_ended_at: string | null
          refresh_started_at: string
          status: string | null
          triggered_by: string | null
          view_name: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: number
          refresh_ended_at?: string | null
          refresh_started_at: string
          status?: string | null
          triggered_by?: string | null
          view_name: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: number
          refresh_ended_at?: string | null
          refresh_started_at?: string
          status?: string | null
          triggered_by?: string | null
          view_name?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string
          priority: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          priority?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          priority?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      part_branch_stock: {
        Row: {
          branch_id: string
          created_at: string | null
          id: string
          max_stock: number | null
          min_stock: number | null
          part_id: string
          updated_at: string | null
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          id?: string
          max_stock?: number | null
          min_stock?: number | null
          part_id: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          id?: string
          max_stock?: number | null
          min_stock?: number | null
          part_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_branch_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_branch_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "part_branch_stock_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_branch_stock_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      part_compatibility: {
        Row: {
          added_at: string | null
          device_model_id: string
          notes: string | null
          part_id: string
        }
        Insert: {
          added_at?: string | null
          device_model_id: string
          notes?: string | null
          part_id: string
        }
        Update: {
          added_at?: string | null
          device_model_id?: string
          notes?: string | null
          part_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_compatibility_device_model_id_fkey"
            columns: ["device_model_id"]
            isOneToOne: false
            referencedRelation: "device_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_compatibility_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "part_compatibility_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          brand_id: string | null
          category: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string
          id: string
          lead_time_days: number | null
          list_price: number | null
          minimum_price: number | null
          notes: string | null
          part_code: string
          photo_url: string | null
          supplier_code: string | null
          supplier_name: string | null
          unit: string
          unit_cost: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          brand_id?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          id?: string
          lead_time_days?: number | null
          list_price?: number | null
          minimum_price?: number | null
          notes?: string | null
          part_code: string
          photo_url?: string | null
          supplier_code?: string | null
          supplier_name?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          brand_id?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          id?: string
          lead_time_days?: number | null
          list_price?: number | null
          minimum_price?: number | null
          notes?: string | null
          part_code?: string
          photo_url?: string | null
          supplier_code?: string | null
          supplier_name?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          brand_id: string | null
          contract_type: string | null
          created_at: string | null
          created_by: string | null
          device_model_id: string | null
          id: string
          is_active: boolean | null
          list_price: number
          minimum_price: number
          name: string
          notes: string | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          brand_id?: string | null
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          device_model_id?: string | null
          id?: string
          is_active?: boolean | null
          list_price: number
          minimum_price: number
          name: string
          notes?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          brand_id?: string | null
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          device_model_id?: string | null
          id?: string
          is_active?: boolean | null
          list_price?: number
          minimum_price?: number
          name?: string
          notes?: string | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_device_model_id_fkey"
            columns: ["device_model_id"]
            isOneToOne: false
            referencedRelation: "device_models"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string | null
          created_by: string
          description: string
          id: string
          notes: string | null
          reward_date: string
          reward_type: string | null
          target_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          notes?: string | null
          reward_date: string
          reward_type?: string | null
          target_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          notes?: string | null
          reward_date?: string
          reward_type?: string | null
          target_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rewards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "target_progress"
            referencedColumns: ["target_id"]
          },
          {
            foreignKeyName: "rewards_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "targets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      periodic_maintenance_devices: {
        Row: {
          completed_at: string | null
          created_at: string
          device_id: string
          id: string
          is_completed: boolean
          maintenance_plan_id: string
          serial_number: string
          work_notes: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          device_id: string
          id?: string
          is_completed?: boolean
          maintenance_plan_id: string
          serial_number: string
          work_notes?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          device_id?: string
          id?: string
          is_completed?: boolean
          maintenance_plan_id?: string
          serial_number?: string
          work_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "periodic_maintenance_devices_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodic_maintenance_devices_maintenance_plan_id_fkey"
            columns: ["maintenance_plan_id"]
            isOneToOne: false
            referencedRelation: "periodic_maintenance_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      periodic_maintenance_plans: {
        Row: {
          assigned_technician_id: string
          branch_id: string
          completed_at: string | null
          contract_id: string
          created_at: string
          created_by: string
          deleted_at: string | null
          id: string
          notes: string | null
          planned_date: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_technician_id: string
          branch_id: string
          completed_at?: string | null
          contract_id: string
          created_at?: string
          created_by: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          planned_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_technician_id?: string
          branch_id?: string
          completed_at?: string | null
          contract_id?: string
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          planned_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodic_maintenance_plans_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodic_maintenance_plans_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodic_maintenance_plans_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "periodic_maintenance_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request_parts: {
        Row: {
          created_at: string
          created_by: string
          id: string
          inventory_movement_id: string | null
          notes: string | null
          part_id: string
          quantity: number
          service_request_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          inventory_movement_id?: string | null
          notes?: string | null
          part_id: string
          quantity: number
          service_request_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          inventory_movement_id?: string | null
          notes?: string | null
          part_id?: string
          quantity?: number
          service_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_parts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_parts_inventory_movement_id_fkey"
            columns: ["inventory_movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_parts_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request_photos: {
        Row: {
          created_at: string
          file_name: string
          file_size_bytes: number
          id: string
          mime_type: string
          service_request_id: string
          step: number
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size_bytes: number
          id?: string
          mime_type: string
          service_request_id: string
          step: number
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size_bytes?: number
          id?: string
          mime_type?: string
          service_request_id?: string
          step?: number
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_photos_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_request_quote_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          line_total: number
          quantity: number
          service_request_id: string
          sort_order: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity: number
          service_request_id: string
          sort_order?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          service_request_id?: string
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_request_quote_lines_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          address: string
          assigned_technician_id: string
          branch_id: string
          brand_model: string
          company_name: string
          completed_at: string | null
          contact_name: string
          created_at: string
          created_by: string
          current_step: number
          customer_decision: string
          customer_statement: string | null
          deleted_at: string | null
          deleted_by: string | null
          delivered: boolean
          delivery_method: string | null
          device_model_id: string | null
          device_returned: boolean
          device_type: string
          diagnosed_fault: string | null
          id: string
          invoice_issued: boolean
          invoice_number: string | null
          labor_cost: number | null
          payment_received: boolean
          phone: string
          quote_sent_to_customer: boolean
          quote_subtotal: number | null
          quote_total: number | null
          reported_fault: string
          request_number: string
          serial_number: string
          shipping_cost: number | null
          status: string
          technical_inspection_result: string | null
          under_warranty: boolean
          updated_at: string
          vat_option: string | null
          work_description: string | null
          wrong_usage_detected: boolean
        }
        Insert: {
          address: string
          assigned_technician_id: string
          branch_id: string
          brand_model: string
          company_name: string
          completed_at?: string | null
          contact_name: string
          created_at?: string
          created_by: string
          current_step?: number
          customer_decision?: string
          customer_statement?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          delivered?: boolean
          delivery_method?: string | null
          device_model_id?: string | null
          device_returned?: boolean
          device_type: string
          diagnosed_fault?: string | null
          id?: string
          invoice_issued?: boolean
          invoice_number?: string | null
          labor_cost?: number | null
          payment_received?: boolean
          phone: string
          quote_sent_to_customer?: boolean
          quote_subtotal?: number | null
          quote_total?: number | null
          reported_fault: string
          request_number: string
          serial_number: string
          shipping_cost?: number | null
          status?: string
          technical_inspection_result?: string | null
          under_warranty?: boolean
          updated_at?: string
          vat_option?: string | null
          work_description?: string | null
          wrong_usage_detected?: boolean
        }
        Update: {
          address?: string
          assigned_technician_id?: string
          branch_id?: string
          brand_model?: string
          company_name?: string
          completed_at?: string | null
          contact_name?: string
          created_at?: string
          created_by?: string
          current_step?: number
          customer_decision?: string
          customer_statement?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          delivered?: boolean
          delivery_method?: string | null
          device_model_id?: string | null
          device_returned?: boolean
          device_type?: string
          diagnosed_fault?: string | null
          id?: string
          invoice_issued?: boolean
          invoice_number?: string | null
          labor_cost?: number | null
          payment_received?: boolean
          phone?: string
          quote_sent_to_customer?: boolean
          quote_subtotal?: number | null
          quote_total?: number | null
          reported_fault?: string
          request_number?: string
          serial_number?: string
          shipping_cost?: number | null
          status?: string
          technical_inspection_result?: string | null
          under_warranty?: boolean
          updated_at?: string
          vat_option?: string | null
          work_description?: string | null
          wrong_usage_detected?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_assigned_technician_id_fkey"
            columns: ["assigned_technician_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_device_model_id_fkey"
            columns: ["device_model_id"]
            isOneToOne: false
            referencedRelation: "device_models"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_checks: {
        Row: {
          check_name: string
          check_type: string | null
          checked_at: string | null
          details: Json | null
          id: number
          status: string | null
          unit: string | null
          value: number | null
        }
        Insert: {
          check_name: string
          check_type?: string | null
          checked_at?: string | null
          details?: Json | null
          id?: number
          status?: string | null
          unit?: string | null
          value?: number | null
        }
        Update: {
          check_name?: string
          check_type?: string | null
          checked_at?: string | null
          details?: Json | null
          id?: number
          status?: string | null
          unit?: string | null
          value?: number | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      target_period_snapshots: {
        Row: {
          finalized_at: string | null
          finalized_by: string
          id: string
          individual_results: Json | null
          snapshot_date: string
          target_id: string
          team_achieved_value: number
          team_completion_pct: number
          team_target_value: number
          top_performer_user_id: string | null
        }
        Insert: {
          finalized_at?: string | null
          finalized_by: string
          id?: string
          individual_results?: Json | null
          snapshot_date: string
          target_id: string
          team_achieved_value: number
          team_completion_pct: number
          team_target_value: number
          top_performer_user_id?: string | null
        }
        Update: {
          finalized_at?: string | null
          finalized_by?: string
          id?: string
          individual_results?: Json | null
          snapshot_date?: string
          target_id?: string
          team_achieved_value?: number
          team_completion_pct?: number
          team_target_value?: number
          top_performer_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "target_period_snapshots_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_period_snapshots_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: true
            referencedRelation: "target_progress"
            referencedColumns: ["target_id"]
          },
          {
            foreignKeyName: "target_period_snapshots_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: true
            referencedRelation: "targets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_period_snapshots_top_performer_user_id_fkey"
            columns: ["top_performer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      targets: {
        Row: {
          branch_id: string | null
          completion_percentage: number | null
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string
          final_value: number | null
          finalized_at: string | null
          has_individual_targets: boolean | null
          id: string
          metric_type: string
          name: string
          period_type: string
          reward_config: Json | null
          reward_model: string | null
          start_date: string
          status: string
          target_value: number
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date: string
          final_value?: number | null
          finalized_at?: string | null
          has_individual_targets?: boolean | null
          id?: string
          metric_type: string
          name: string
          period_type: string
          reward_config?: Json | null
          reward_model?: string | null
          start_date: string
          status?: string
          target_value: number
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string
          final_value?: number | null
          finalized_at?: string | null
          has_individual_targets?: boolean | null
          id?: string
          metric_type?: string
          name?: string
          period_type?: string
          reward_config?: Json | null
          reward_model?: string | null
          start_date?: string
          status?: string
          target_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "targets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "targets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "targets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          device_type: string | null
          ended_at: string | null
          id: string
          ip_address: unknown
          last_activity_at: string | null
          started_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown
          last_activity_at?: string | null
          started_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown
          last_activity_at?: string | null
          started_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          phone: string | null
          role: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          phone?: string | null
          role: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          phone?: string | null
          role?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          id: string
          new_value: Json | null
          old_value: Json | null
          user_id: string
          work_order_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id: string
          work_order_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_activities_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_files: {
        Row: {
          category: string | null
          deleted_at: string | null
          description: string | null
          file_name: string
          file_size_bytes: number
          id: string
          mime_type: string
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string
          work_order_id: string
        }
        Insert: {
          category?: string | null
          deleted_at?: string | null
          description?: string | null
          file_name: string
          file_size_bytes: number
          id?: string
          mime_type: string
          storage_path: string
          uploaded_at?: string | null
          uploaded_by: string
          work_order_id: string
        }
        Update: {
          category?: string | null
          deleted_at?: string | null
          description?: string | null
          file_name?: string
          file_size_bytes?: number
          id?: string
          mime_type?: string
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_files_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_parts: {
        Row: {
          added_at: string | null
          added_by: string
          id: string
          inventory_movement_id: string | null
          is_chargeable: boolean | null
          notes: string | null
          part_id: string
          quantity: number
          total_price: number | null
          unit_price: number | null
          work_order_id: string
        }
        Insert: {
          added_at?: string | null
          added_by: string
          id?: string
          inventory_movement_id?: string | null
          is_chargeable?: boolean | null
          notes?: string | null
          part_id: string
          quantity: number
          total_price?: number | null
          unit_price?: number | null
          work_order_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string
          id?: string
          inventory_movement_id?: string | null
          is_chargeable?: boolean | null
          notes?: string | null
          part_id?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_parts_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_parts_inventory_movement_id_fkey"
            columns: ["inventory_movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["part_id"]
          },
          {
            foreignKeyName: "work_order_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_parts_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_photos: {
        Row: {
          caption: string | null
          file_size_bytes: number
          id: string
          photo_type: string | null
          storage_path: string
          taken_at: string | null
          thumbnail_path: string | null
          uploaded_at: string | null
          uploaded_by: string
          work_order_id: string
        }
        Insert: {
          caption?: string | null
          file_size_bytes: number
          id?: string
          photo_type?: string | null
          storage_path: string
          taken_at?: string | null
          thumbnail_path?: string | null
          uploaded_at?: string | null
          uploaded_by: string
          work_order_id: string
        }
        Update: {
          caption?: string | null
          file_size_bytes?: number
          id?: string
          photo_type?: string | null
          storage_path?: string
          taken_at?: string | null
          thumbnail_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_photos_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_duration_hours: number | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          branch_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          contract_id: string | null
          created_at: string | null
          created_by: string
          cross_branch_approved_at: string | null
          cross_branch_approved_by: string | null
          customer_acknowledged_by: string | null
          customer_contact_id: string | null
          customer_id: string
          customer_signature_url: string | null
          deleted_at: string | null
          deleted_by: string | null
          device_id: string | null
          estimated_duration_hours: number | null
          hold_reason: string | null
          hold_started_at: string | null
          id: string
          internal_notes: string | null
          is_billable: boolean | null
          is_cross_branch: boolean | null
          is_under_contract: boolean | null
          next_maintenance_created: boolean | null
          next_maintenance_suggested: string | null
          priority: string
          problem_description: string
          resolution_status: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          service_location: string | null
          service_location_note: string | null
          sla_breached: boolean | null
          sla_deadline: string | null
          status: string
          total_paused_seconds: number | null
          updated_at: string | null
          updated_by: string | null
          work_ended_at: string | null
          work_order_number: string
          work_performed: string | null
          work_started_at: string | null
          work_type: string
        }
        Insert: {
          actual_duration_hours?: number | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          branch_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by: string
          cross_branch_approved_at?: string | null
          cross_branch_approved_by?: string | null
          customer_acknowledged_by?: string | null
          customer_contact_id?: string | null
          customer_id: string
          customer_signature_url?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          device_id?: string | null
          estimated_duration_hours?: number | null
          hold_reason?: string | null
          hold_started_at?: string | null
          id?: string
          internal_notes?: string | null
          is_billable?: boolean | null
          is_cross_branch?: boolean | null
          is_under_contract?: boolean | null
          next_maintenance_created?: boolean | null
          next_maintenance_suggested?: string | null
          priority?: string
          problem_description: string
          resolution_status?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_location?: string | null
          service_location_note?: string | null
          sla_breached?: boolean | null
          sla_deadline?: string | null
          status?: string
          total_paused_seconds?: number | null
          updated_at?: string | null
          updated_by?: string | null
          work_ended_at?: string | null
          work_order_number: string
          work_performed?: string | null
          work_started_at?: string | null
          work_type: string
        }
        Update: {
          actual_duration_hours?: number | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          branch_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string
          cross_branch_approved_at?: string | null
          cross_branch_approved_by?: string | null
          customer_acknowledged_by?: string | null
          customer_contact_id?: string | null
          customer_id?: string
          customer_signature_url?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          device_id?: string | null
          estimated_duration_hours?: number | null
          hold_reason?: string | null
          hold_started_at?: string | null
          id?: string
          internal_notes?: string | null
          is_billable?: boolean | null
          is_cross_branch?: boolean | null
          is_under_contract?: boolean | null
          next_maintenance_created?: boolean | null
          next_maintenance_suggested?: string | null
          priority?: string
          problem_description?: string
          resolution_status?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_location?: string | null
          service_location_note?: string | null
          sla_breached?: boolean | null
          sla_deadline?: string | null
          status?: string
          total_paused_seconds?: number | null
          updated_at?: string | null
          updated_by?: string | null
          work_ended_at?: string | null
          work_order_number?: string
          work_performed?: string | null
          work_started_at?: string | null
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "work_orders_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_cross_branch_approved_by_fkey"
            columns: ["cross_branch_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_customer_contact_id_fkey"
            columns: ["customer_contact_id"]
            isOneToOne: false
            referencedRelation: "customer_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      current_stock: {
        Row: {
          branch_id: string | null
          branch_name: string | null
          current_quantity: number | null
          description: string | null
          max_stock: number | null
          min_stock: number | null
          part_code: string | null
          part_id: string | null
          stock_status: string | null
        }
        Relationships: []
      }
      target_progress: {
        Row: {
          branch_id: string | null
          completion_percentage: number | null
          current_value: number | null
          days_remaining: number | null
          end_date: string | null
          metric_type: string | null
          name: string | null
          progress_status: string | null
          start_date: string | null
          target_id: string | null
          target_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "targets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "targets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "current_stock"
            referencedColumns: ["branch_id"]
          },
        ]
      }
    }
    Functions: {
      calculate_target_current_value: {
        Args: { target_uuid: string }
        Returns: number
      }
      is_active_user: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      refresh_current_stock: { Args: never; Returns: undefined }
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
