/**
 * Vehicle Test Fixtures
 * 
 * Mock data for vehicle tests
 * Provides consistent test data across all test suites
 */

import type { Vehicle } from '@/lib/domain/types'

/**
 * Valid mock vehicle with all fields populated
 */
export const mockValidVehicle: Partial<Vehicle> = {
  id: 'test-vehicle-001',
  vin: '1HGBH41JXMN109186',
  year: 2020,
  make: 'Toyota',
  model: 'Camry',
  color: 'Silver',
  display_name: '2020 Toyota Camry',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z'
}

/**
 * Minimal valid vehicle (only required fields)
 */
export const mockMinimalVehicle: Partial<Vehicle> = {
  id: 'test-vehicle-002',
  vin: '5XYKT3A69CG123456',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z'
}

/**
 * Vehicle with custom display name
 */
export const mockCustomNameVehicle: Partial<Vehicle> = {
  id: 'test-vehicle-003',
  vin: '1G1BE5SM7H7123456',
  year: 2021,
  make: 'Chevrolet',
  model: 'Silverado',
  display_name: 'Fleet Truck #1',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z'
}

/**
 * Vehicle with missing optional fields
 */
export const mockIncompleteVehicle: Partial<Vehicle> = {
  id: 'test-vehicle-004',
  vin: 'JM1BK32F781234567',
  year: 2019,
  make: 'Mazda',
  // Missing model, color, display_name
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z'
}

/**
 * Vehicle with special characters
 */
export const mockSpecialCharsVehicle: Partial<Vehicle> = {
  id: 'test-vehicle-005',
  vin: '2HGFG12878H123456',
  year: 2022,
  make: "O'Reilly",
  model: 'Truck & Trailer',
  color: 'Blue/White',
  display_name: "Fleet #2 - O'Reilly Special",
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z'
}

/**
 * Array of valid vehicles for list tests
 */
export const mockVehicleList: Partial<Vehicle>[] = [
  mockValidVehicle,
  mockMinimalVehicle,
  mockCustomNameVehicle,
  mockIncompleteVehicle,
  mockSpecialCharsVehicle
]

/**
 * Invalid vehicle data for error testing
 */
export const mockInvalidVehicle = {
  id: 'test-vehicle-invalid',
  vin: 'INVALID',  // Invalid VIN
  year: 1800,  // Invalid year
  make: '',  // Empty string
  model: null,  // Null value
}

/**
 * Vehicle with invalid VIN characters (I, O, Q)
 */
export const mockInvalidVINVehicle = {
  id: 'test-vehicle-006',
  vin: '1HGBH41JXIN109186',  // Contains 'I' (invalid)
}

/**
 * Duplicate VIN for uniqueness testing
 */
export const mockDuplicateVINVehicle: Partial<Vehicle> = {
  id: 'test-vehicle-007',
  vin: '1HGBH41JXMN109186',  // Same VIN as mockValidVehicle
  year: 2021,
  make: 'Honda',
  model: 'Accord',
  created_at: '2025-01-02T00:00:00.000Z',
  updated_at: '2025-01-02T00:00:00.000Z'
}

/**
 * Vehicle for update testing
 */
export const mockVehicleUpdate = {
  color: 'Red',
  display_name: 'Updated Display Name',
  year: 2021
}

/**
 * Expected vehicle after update
 */
export const mockUpdatedVehicle: Partial<Vehicle> = {
  ...mockValidVehicle,
  ...mockVehicleUpdate,
  updated_at: '2025-01-02T00:00:00.000Z'  // Timestamp should update
}

/**
 * Vehicle with history for AI context testing
 */
export const mockVehicleWithHistory: Partial<Vehicle> = {
  id: 'test-vehicle-with-history',
  vin: '3VWDX7AJ5DM123456',
  year: 2023,
  make: 'Volkswagen',
  model: 'Jetta',
  display_name: '2023 VW Jetta',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z'
}

/**
 * Factory function to create custom vehicle
 */
export function createMockVehicle(overrides: Partial<Vehicle> = {}): Partial<Vehicle> {
  return {
    ...mockValidVehicle,
    ...overrides,
    id: overrides.id || `test-vehicle-${Date.now()}`,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: overrides.updated_at || new Date().toISOString()
  }
}

/**
 * Factory function to create vehicle list
 */
export function createMockVehicleList(count: number): Partial<Vehicle>[] {
  return Array.from({ length: count }, (_, i) => createMockVehicle({
    id: `test-vehicle-${i}`,
    vin: `1HGBH41JXMN${String(109186 + i).padStart(6, '0')}`,
    year: 2020 + (i % 5),
    make: ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Mazda'][i % 5],
    model: ['Camry', 'Accord', 'F-150', 'Silverado', 'CX-5'][i % 5]
  }))
}

/**
 * Mock VIN decode response (NHTSA API)
 */
export const mockNHTSAResponse = {
  Count: 1,
  Message: 'Results returned successfully',
  Results: [
    {
      Make: 'TOYOTA',
      Model: 'Camry',
      ModelYear: '2020',
      VehicleType: 'PASSENGER CAR',
      BodyClass: 'Sedan/Saloon',
      ErrorCode: '0'
    }
  ]
}

/**
 * Mock NHTSA error response
 */
export const mockNHTSAErrorResponse = {
  Count: 0,
  Message: 'VIN not found',
  Results: []
}

/**
 * Mock Supabase query response
 */
export const mockSupabaseQueryResponse = {
  data: mockValidVehicle,
  error: null,
  count: null,
  status: 200,
  statusText: 'OK'
}

/**
 * Mock Supabase error response
 */
export const mockSupabaseErrorResponse = {
  data: null,
  error: {
    message: 'Vehicle not found',
    details: '',
    hint: '',
    code: 'PGRST116'
  },
  count: null,
  status: 404,
  statusText: 'Not Found'
}

/**
 * Mock Supabase list response
 */
export const mockSupabaseListResponse = {
  data: mockVehicleList,
  error: null,
  count: mockVehicleList.length,
  status: 200,
  statusText: 'OK'
}
