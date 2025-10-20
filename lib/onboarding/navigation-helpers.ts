/**
 * Onboarding Navigation Helpers
 * 
 * Reusable patterns for wizard navigation, especially handling
 * loading/auto-advance steps that should be skipped on back.
 */

/**
 * Create a smart back handler that skips loading steps
 * 
 * Usage:
 * ```tsx
 * const handleBack = createSmartBackHandler({
 *   currentStep,
 *   loadingSteps: ['decoding', 'processing'],
 *   backDestinations: {
 *     input: 'input',
 *     decoding: 'input',    // Skip loading
 *     confirm: 'input',      // Skip loading
 *   },
 *   navigate: setCurrentStep
 * })
 * ```
 */
export function createSmartBackHandler<StepId extends string>({
  currentStep,
  loadingSteps,
  backDestinations,
  navigate,
}: {
  currentStep: StepId
  loadingSteps: StepId[]
  backDestinations: Record<StepId, StepId>
  navigate: (step: StepId) => void
}) {
  return () => {
    const destination = backDestinations[currentStep]
    
    // Navigate to destination (which skips loading steps)
    if (destination && destination !== currentStep) {
      navigate(destination)
    }
  }
}

/**
 * Check if a step is a loading step
 */
export function isLoadingStep<StepId extends string>(
  step: StepId,
  loadingSteps: StepId[]
): boolean {
  return loadingSteps.includes(step)
}

/**
 * Get the previous user-interactive step (skipping loading steps)
 * 
 * Usage:
 * ```tsx
 * const prevStep = getPreviousInteractiveStep({
 *   currentStep: 'confirm',
 *   allSteps: ['input', 'loading', 'confirm'],
 *   loadingSteps: ['loading']
 * })
 * // Returns: 'input'
 * ```
 */
export function getPreviousInteractiveStep<StepId extends string>({
  currentStep,
  allSteps,
  loadingSteps,
}: {
  currentStep: StepId
  allSteps: StepId[]
  loadingSteps: StepId[]
}): StepId | null {
  const currentIndex = allSteps.indexOf(currentStep)
  
  if (currentIndex <= 0) {
    return null // Already at first step
  }
  
  // Walk backwards to find first non-loading step
  for (let i = currentIndex - 1; i >= 0; i--) {
    const step = allSteps[i]
    if (!isLoadingStep(step, loadingSteps)) {
      return step
    }
  }
  
  return null
}

/**
 * Pattern: Loading Scene Back Handler
 * 
 * For loading scenes, the back button should go to the previous
 * user-interactive step, not just the previous step.
 * 
 * Example:
 * VIN Input → [Decoding] → Confirm
 * 
 * Back from Confirm should go to VIN Input, not Decoding
 * (because Decoding auto-advances immediately)
 */
export const LOADING_STEP_PATTERN = {
  /**
   * Mark steps as loading/auto-advance
   * These will be skipped on back navigation
   */
  markAsLoading: <StepId extends string>(steps: StepId[]) => steps,
  
  /**
   * Build a back destination map that skips loading steps
   */
  buildBackMap: <StepId extends string>(
    steps: { id: StepId; isLoading?: boolean }[]
  ): Record<StepId, StepId> => {
    const result = {} as Record<StepId, StepId>
    
    steps.forEach((step, index) => {
      // Find previous non-loading step
      let prevIndex = index - 1
      while (prevIndex >= 0 && steps[prevIndex].isLoading) {
        prevIndex--
      }
      
      // Set destination (or stay on same step if at start)
      result[step.id] = prevIndex >= 0 ? steps[prevIndex].id : step.id
    })
    
    return result
  },
}
