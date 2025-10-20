/**
 * Base Store Utilities
 * 
 * Helpers for creating namespaced Zustand stores.
 * Each flow gets its own slice with isolated persistence.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type BaseStoreState = {
  data: Record<string, any>
  currentIndex: number
  history: string[]
  completed: boolean
  startedAt: string | null
  completedAt: string | null
}

export type BaseStoreActions = {
  setData: (key: string, value: any) => void
  setCurrentIndex: (index: number) => void
  addToHistory: (stepId: string) => void
  setCompleted: (completed: boolean) => void
  reset: () => void
}

export type BaseStore = BaseStoreState & BaseStoreActions

const initialState: BaseStoreState = {
  data: {},
  currentIndex: 0,
  history: [],
  completed: false,
  startedAt: null,
  completedAt: null
}

/**
 * Create a namespaced onboarding store
 * 
 * @param namespace - Flow namespace (e.g., 'vehicle', 'user')
 * @param version - Flow version (e.g., 'v2')
 * @returns Zustand store
 */
export function createOnboardingStore(namespace: string, version: string = 'v1') {
  const persistenceKey = `onboarding:${namespace}:${version}`
  
  return create<BaseStore>()(
    persist(
      (set, get) => ({
        // State
        ...initialState,
        
        // Actions
        setData: (key: string, value: any) => {
          set((state) => ({
            data: {
              ...state.data,
              [key]: value
            },
            startedAt: state.startedAt || new Date().toISOString()
          }))
        },
        
        setCurrentIndex: (index: number) => {
          set({ currentIndex: index })
        },
        
        addToHistory: (stepId: string) => {
          set((state) => ({
            history: [...state.history, stepId]
          }))
        },
        
        setCompleted: (completed: boolean) => {
          set({
            completed,
            completedAt: completed ? new Date().toISOString() : null
          })
        },
        
        reset: () => {
          set(initialState)
        }
      }),
      {
        name: persistenceKey,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          data: state.data,
          currentIndex: state.currentIndex,
          history: state.history,
          completed: state.completed,
          startedAt: state.startedAt,
          completedAt: state.completedAt
        })
      }
    )
  )
}

/**
 * Check if a flow has saved progress
 */
export function hasFlowProgress(namespace: string, version: string = 'v1'): boolean {
  const persistenceKey = `onboarding:${namespace}:${version}`
  
  try {
    const saved = localStorage.getItem(persistenceKey)
    if (!saved) return false
    
    const parsed = JSON.parse(saved)
    return parsed.state?.currentIndex > 0 || Object.keys(parsed.state?.data || {}).length > 0
  } catch {
    return false
  }
}

/**
 * Clear flow progress
 */
export function clearFlowProgress(namespace: string, version: string = 'v1'): void {
  const persistenceKey = `onboarding:${namespace}:${version}`
  localStorage.removeItem(persistenceKey)
}
