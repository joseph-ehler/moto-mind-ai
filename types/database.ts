/**
 * Auto-generated TypeScript types from Supabase schema
 * Generated: 2025-10-15T20:22:42.217Z
 * 
 * DO NOT EDIT MANUALLY - Changes will be overwritten
 * Run: npm run supabase:admin generate-types
 */

export interface Vehicles {
  id: string
  tenant_id: string
  year: number
  make: string
  model: string
  vin: string
  display_name: any | null
  created_at: string
  garage_id: any | null
  trim: any | null
  license_plate: string
  nickname: string
  manufacturer_mpg: any | null
  manufacturer_service_interval_miles: any | null
  hero_image_url: any | null
  specs_enhancement_status: string
  specs_last_enhanced: any | null
  specs_categories_completed: number
  current_mileage: number
  current_mileage_override: any | null
  mileage_last_updated_at: string
  mileage_computed_from: string
}

export interface VehicleEvents {
  // No data available to generate types
}

export interface VehicleImages {
  id: string
  tenant_id: string
  vehicle_id: string
  storage_path: string
  public_url: string
  filename: string
  image_type: string
  is_primary: boolean
  description: any | null
  created_at: string
  updated_at: string
  ai_category: any | null
  ai_description: any | null
  detected_text: any | null
  processing_status: string
  processed_at: any | null
  vehicle_details: any | null
  condition_data: any | null
  parts_visible: any | null
  maintenance_indicators: any | null
  suggested_actions: any | null
  vehicle_match: any | null
  event_id: any | null
}

export interface PhotoMetadata {
  id: string
  image_id: string
  tenant_id: string
  captured_at: string
  capture_method: string
  event_type: string
  step_id: string
  gps_latitude: any | null
  gps_longitude: any | null
  gps_accuracy: any | null
  gps_timestamp: any | null
  quality_score: number
  quality_issues: any
  original_size_bytes: number
  compressed_size_bytes: number
  compression_ratio: number
  output_format: string
  width: number
  height: number
  aspect_ratio: any | null
  flash_mode: string
  facing_mode: string
  retake_count: number
  capture_duration_ms: number
  quality_warnings_shown: any | null
  platform: string
  user_agent: string
  was_heic_converted: boolean
  heic_original_size_bytes: any | null
  was_edited: boolean
  edit_operations: any | null
  created_at: string
  updated_at: string
}

export interface Tenants {
  id: string
  name: string
  created_at: string
  is_active: boolean
}

export interface UserTenants {
  id: string
  user_id: string
  tenant_id: string
  role: string
  created_at: string
}

export interface ConversationMessages {
  id: string
  thread_id: string
  role: string
  content: string
  created_at: string
  tokens_used: number
  feedback_rating: any | null
  feedback_comment: any | null
  actions: any
  context_references: any | null
  model_used: any | null
  model_version: any | null
  was_helpful: any | null
  resolved_issue: any | null
  follow_up_needed: any | null
  feedback_tags: any | null
  metadata: any | null
}

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: Vehicles
        Insert: Partial<Vehicles>
        Update: Partial<Vehicles>
      }
      vehicle_events: {
        Row: VehicleEvents
        Insert: Partial<VehicleEvents>
        Update: Partial<VehicleEvents>
      }
      vehicle_images: {
        Row: VehicleImages
        Insert: Partial<VehicleImages>
        Update: Partial<VehicleImages>
      }
      photo_metadata: {
        Row: PhotoMetadata
        Insert: Partial<PhotoMetadata>
        Update: Partial<PhotoMetadata>
      }
      tenants: {
        Row: Tenants
        Insert: Partial<Tenants>
        Update: Partial<Tenants>
      }
      user_tenants: {
        Row: UserTenants
        Insert: Partial<UserTenants>
        Update: Partial<UserTenants>
      }
      conversation_messages: {
        Row: ConversationMessages
        Insert: Partial<ConversationMessages>
        Update: Partial<ConversationMessages>
      }
    }
  }
}