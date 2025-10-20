/**
 * Onboarding Wizard Controller
 * 
 * Core controller for multi-flow onboarding wizard.
 * Handles navigation, branching, validation, and persistence.
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  FlowRegistry,
  PredicateRegistry,
  StepConfig,
  StepItinerary,
  WizardConfig,
  WizardController
} from './types'
import { getBranchTemplatesFor } from './flow-registry'

export function useOnboardingWizard(config: WizardConfig): WizardController {
  const { steps: registry, store, predicates, weights = { parent: 1, mini: 0.5 }, persistenceKey } = config
  
  // Store state
  const data = store((s: any) => s.data)
  const currentIndex = store((s: any) => s.currentIndex)
  const setData = store((s: any) => s.setData)
  const setCurrentIndex = store((s: any) => s.setCurrentIndex)
  const addToHistory = store((s: any) => s.addToHistory)
  const resetStore = store((s: any) => s.reset)
  
  // Local state
  const [isValid, setIsValid] = useState(false)
  const [itinerary, setItinerary] = useState<StepItinerary>(() => {
    // Initialize with base flow
    return registry.baseFlow.map(step => ({
      config: step,
      weight: step.mini ? weights.mini! : weights.parent!,
      parent: undefined
    }))
  })
  
  // Autosave on data change
  useEffect(() => {
    if (registry.persistence?.autoSave === 'after each step submit') {
      // Data is already persisted via Zustand middleware
      // This effect just ensures we're tracking it
      const hasData = Object.keys(data).length > 0
      if (hasData && !store.getState().startedAt) {
        store.setState({ startedAt: new Date().toISOString() })
      }
    }
  }, [data, registry.persistence, store])
  
  // Current step
  const currentStep = useMemo(() => {
    return itinerary[currentIndex]?.config || null
  }, [itinerary, currentIndex])
  
  // Progress calculation
  const { totalSteps, progress } = useMemo(() => {
    const total = itinerary.reduce((sum, item) => sum + item.weight, 0)
    const completed = itinerary.slice(0, currentIndex).reduce((sum, item) => sum + item.weight, 0)
    const currentWeight = itinerary[currentIndex]?.weight || 0
    
    // Add partial credit for current step
    const progressWithPartial = completed + (currentWeight * 0.5)
    
    return {
      totalSteps: itinerary.length,
      progress: Math.round((progressWithPartial / total) * 100)
    }
  }, [itinerary, currentIndex])
  
  // Navigation state
  const canGoBack = currentIndex > 0
  const canGoNext = isValid || currentStep?.autoAdvance || false
  const canSkip = currentStep?.skippable || false
  
  /**
   * Append branch steps after parent
   */
  const appendBranches = useCallback((parentId: string, state: Record<string, any>) => {
    const templates = getBranchTemplatesFor(registry, parentId)
    if (templates.length === 0) return
    
    // Find parent index
    const parentIndex = itinerary.findIndex(item => item.config.id === parentId)
    if (parentIndex === -1) return
    
    // Evaluate which branches should exist
    const branchesToAdd = templates.filter(template => {
      const predicate = predicates[template.id]
      if (!predicate) return false
      return predicate(state)
    })
    
    if (branchesToAdd.length === 0) return
    
    // Build new branch items
    const newBranches: StepItinerary = branchesToAdd.map(branch => ({
      config: branch,
      weight: branch.mini ? weights.mini! : weights.parent!,
      parent: parentId
    }))
    
    // Insert after parent, avoiding duplicates
    setItinerary(current => {
      const updated = [...current]
      const insertIndex = parentIndex + 1
      
      // Remove existing branches with same IDs
      const branchIds = new Set(newBranches.map(b => b.config.id))
      const filtered = updated.filter(item => !branchIds.has(item.config.id))
      
      // Insert new branches
      filtered.splice(insertIndex, 0, ...newBranches)
      
      return filtered
    })
  }, [itinerary, registry, predicates, weights])
  
  /**
   * Prune branch steps from index onward
   */
  const pruneBranches = useCallback((fromIndex: number) => {
    setItinerary(current => {
      // Keep steps up to fromIndex, remove branches after
      const kept = current.slice(0, fromIndex + 1)
      const after = current.slice(fromIndex + 1)
      
      // Only keep non-branch steps (parent undefined)
      const nonBranches = after.filter(item => !item.parent)
      
      return [...kept, ...nonBranches]
    })
  }, [])
  
  /**
   * Navigate to next step
   */
  const next = useCallback(() => {
    if (!canGoNext) return
    
    const nextIndex = currentIndex + 1
    
    // Save current step to history
    if (currentStep) {
      addToHistory(currentStep.id)
    }
    
    // Check if we should append branches based on current step's answer
    if (currentStep?.branchOnComplete) {
      appendBranches(currentStep.id, data)
    }
    
    // Move to next step
    if (nextIndex < itinerary.length) {
      setCurrentIndex(nextIndex)
      setIsValid(false) // Reset validation for next step
    }
  }, [canGoNext, currentIndex, currentStep, data, itinerary.length, addToHistory, appendBranches, setCurrentIndex])
  
  /**
   * Navigate to previous step
   */
  const back = useCallback(() => {
    if (!canGoBack) return
    
    const prevIndex = currentIndex - 1
    
    // Prune any branches that were added after previous step
    pruneBranches(prevIndex)
    
    // Move to previous step
    setCurrentIndex(prevIndex)
    setIsValid(true) // Previous step was already valid
  }, [canGoBack, currentIndex, pruneBranches, setCurrentIndex])
  
  /**
   * Skip current step
   */
  const skip = useCallback(() => {
    if (!canSkip) return
    next()
  }, [canSkip, next])
  
  /**
   * Jump to specific step
   */
  const jumpTo = useCallback((stepId: string) => {
    const targetIndex = itinerary.findIndex(item => item.config.id === stepId)
    if (targetIndex === -1) return
    
    // Prune branches if jumping backward
    if (targetIndex < currentIndex) {
      pruneBranches(targetIndex - 1)
    }
    
    setCurrentIndex(targetIndex)
    setIsValid(false)
  }, [itinerary, currentIndex, pruneBranches, setCurrentIndex])
  
  /**
   * Resume from saved state
   */
  const resume = useCallback(() => {
    // Current index is already loaded from store
    // Rebuild itinerary with branches based on saved data
    const rebuilt = registry.baseFlow.map(step => ({
      config: step,
      weight: step.mini ? weights.mini! : weights.parent!,
      parent: undefined
    }))
    
    // TODO: Re-evaluate and append branches based on saved data
    // For now, just use base flow
    setItinerary(rebuilt)
  }, [registry, weights])
  
  /**
   * Exit wizard (save progress and return)
   */
  const exit = useCallback(() => {
    // Progress is already auto-saved via Zustand persistence
    // This is just a signal to parent component to close/navigate away
    if (typeof window !== 'undefined') {
      // If modal mode, parent should handle this via onExit callback
      // If fullscreen mode, navigate to previous page or dashboard
      window.history.back()
    }
  }, [])
  
  /**
   * Reset wizard
   */
  const reset = useCallback(() => {
    resetStore()
    setItinerary(registry.baseFlow.map(step => ({
      config: step,
      weight: step.mini ? weights.mini! : weights.parent!,
      parent: undefined
    })))
    setIsValid(false)
  }, [registry, weights, resetStore])
  
  return {
    // Navigation
    next,
    back,
    skip,
    jumpTo,
    exit,
    
    // State
    currentStep,
    currentIndex,
    totalSteps,
    progress,
    canGoBack,
    canGoNext,
    canSkip,
    
    // Validation
    isValid,
    setValid: setIsValid,
    
    // Data
    data,
    setData,
    
    // Persistence
    resume,
    reset,
    
    // Internal
    itinerary,
    appendBranches,
    pruneBranches
  }
}
