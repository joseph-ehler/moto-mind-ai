/**
 * TEST HELPERS
 * 
 * Utilities for testing MotoMind components and functions
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Mock Supabase client
export const mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  delete: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  then: jest.fn((callback) => callback({ data: null, error: null }))
}

// Mock user context
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z'
}

export const mockProfile = {
  id: 'test-user-id',
  user_id: 'test-user-id',
  tier: 'pro',
  created_at: '2024-01-01T00:00:00Z'
}

// Mock vehicle
export const mockVehicle = {
  id: 'test-vehicle-id',
  user_id: 'test-user-id',
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  vin: 'TEST123456789',
  license_plate: 'ABC123',
  current_miles: 50000,
  created_at: '2024-01-01T00:00:00Z'
}

// Mock event
export const mockEvent = {
  id: 'test-event-id',
  vehicle_id: 'test-vehicle-id',
  type: 'fuel',
  date: '2024-01-15T10:30:00Z',
  miles: 50100,
  total_amount: 52.50,
  vendor: 'Shell',
  created_at: '2024-01-15T10:30:00Z'
}

//Custom render with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options })
}

// Wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock localStorage
export const mockLocalStorage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    key: jest.fn((index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }),
    get length() {
      return Object.keys(store).length
    }
  }
})()

// Mock IndexedDB
export const mockIndexedDB = {
  open: jest.fn(() => ({
    result: {
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          add: jest.fn(),
          get: jest.fn(),
          getAll: jest.fn(),
          delete: jest.fn(),
          put: jest.fn()
        }))
      })),
      createObjectStore: jest.fn()
    },
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null
  }))
}

// Mock navigator.serviceWorker
export const mockServiceWorker = {
  register: jest.fn(() => Promise.resolve({
    installing: null,
    waiting: null,
    active: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  })),
  ready: Promise.resolve({
    sync: {
      register: jest.fn(() => Promise.resolve())
    },
    pushManager: {
      subscribe: jest.fn(() => Promise.resolve({
        endpoint: 'test-endpoint'
      })),
      getSubscription: jest.fn(() => Promise.resolve(null))
    }
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}

// Setup global mocks
export function setupGlobalMocks() {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
  })

  Object.defineProperty(window, 'indexedDB', {
    value: mockIndexedDB
  })

  Object.defineProperty(navigator, 'serviceWorker', {
    value: mockServiceWorker,
    configurable: true
  })
}

// Cleanup global mocks
export function cleanupGlobalMocks() {
  mockLocalStorage.clear()
  jest.clearAllMocks()
}
