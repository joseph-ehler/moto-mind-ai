/**
 * Event Detail Types
 * 
 * Centralized type definitions for event detail page
 */

export interface EventData {
  id: string
  type: string
  date: string
  total_amount: number
  gallons: number
  vendor: string
  station_address: string | null
  geocoded_address: string | null
  geocoded_lat: number | null
  geocoded_lng: number | null
  display_vendor: string | null
  display_summary: string | null
  miles: number | null
  notes: string | null
  payload: any
  created_at: string
  edited_at: string | null
  edit_changes: Array<{
    edited_at: string
    reason: string
    changes: Array<{
      field: string
      old_value: any
      new_value: any
    }>
  }> | null
  weather_temperature_f: number | null
  weather_condition: string | null
  weather_precipitation_mm: number | null
  weather_windspeed_mph: number | null
  weather_humidity_percent: number | null
  weather_pressure_inhg: number | null
  products: Array<{
    brand: string
    product_name: string
    type?: string
    size?: string
    purpose?: string
  }> | null
  photos: Array<{
    id: string
    public_url: string
    filename: string
    image_type: string
    is_primary: boolean
    created_at: string
  }> | null
  vehicle: {
    id: string
    name: string
    year: number
    make: string
    model: string
  } | null
}

export interface ChangeEntry {
  field: string
  oldValue: any
  newValue: any
}
