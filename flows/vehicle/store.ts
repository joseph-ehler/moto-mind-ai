/**
 * Vehicle Onboarding Store
 * 
 * Zustand slice for vehicle onboarding flow.
 * Persists to localStorage with version gating.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type VehicleData = {
  vin: string
  year: number
  make: string
  model: string
  trim?: string
  engine?: string
  drivetrain?: string
  bodyClass?: string
  fuelType?: string
}

export type SafetyRollup = {
  riskLevel: 'low' | 'medium' | 'high'
  score?: number
}

export type EpaRollup = {
  class?: string
}

export type VehicleRollup = {
  safety?: SafetyRollup
  epa?: EpaRollup
}

export type VehicleOnboardingState = {
  // VIN
  vin: string | null
  
  // Decoded vehicle data
  vehicle: VehicleData | null
  
  // Tiny safety/EPA rollup
  rollup: VehicleRollup | null
  
  // Metadata
  startedAt: string | null
  completedAt: string | null
  
  // Actions
  setVin: (vin: string) => void
  setVehicle: (vehicle: VehicleData, rollup?: VehicleRollup) => void
  clearVehicle: () => void
  markComplete: () => void
  reset: () => void
}

const initialState = {
  vin: null,
  vehicle: null,
  rollup: null,
  startedAt: null,
  completedAt: null
}

export const useVehicleOnboarding = create<VehicleOnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setVin: (vin: string) => {
        const state = get()
        set({
          vin,
          // Mark started if not already
          startedAt: state.startedAt || new Date().toISOString()
        })
      },
      
      setVehicle: (vehicle: VehicleData, rollup?: VehicleRollup) => {
        set({
          vehicle,
          rollup: rollup || null
        })
      },
      
      clearVehicle: () => {
        set({
          vehicle: null,
          rollup: null
        })
      },
      
      markComplete: () => {
        set({
          completedAt: new Date().toISOString()
        })
      },
      
      reset: () => {
        set(initialState)
      }
    }),
    {
      name: 'onboarding:vehicle:v2',
      storage: createJSONStorage(() => localStorage),
      // Only persist essential data
      partialize: (state) => ({
        vin: state.vin,
        vehicle: state.vehicle,
        rollup: state.rollup,
        startedAt: state.startedAt,
        completedAt: state.completedAt
      })
    }
  )
)
