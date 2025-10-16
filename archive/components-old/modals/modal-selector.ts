/**
 * Modal Selector - Interactive tool to choose the right modal type
 * Usage: Import and call selectModal() to get recommendations
 */

export type ModalPurpose =
  | 'delete-confirm'
  | 'success-message'
  | 'info-message'
  | 'warning-message'
  | 'single-field-edit'
  | 'multi-section-form'
  | 'multi-step-wizard'
  | 'onboarding-flow'
  | 'guided-capture'
  | 'image-upload'
  | 'document-processing'
  | 'rich-content'
  | 'settings'
  | 'create-entity'
  | 'edit-entity'
  | 'other'

export type ModalRecommendation = {
  type: 'AlertModal' | 'SimpleFormModal' | 'BlockFormModal' | 'FullWidthModal' | 'StepperModal'
  confidence: 'high' | 'medium' | 'low'
  reason: string
  example: string
  size: string
  imports: string[]
}

/**
 * Select the appropriate modal type based on content requirements
 */
export function selectModal(purpose: ModalPurpose, options?: {
  sectionCount?: number
  stepCount?: number
  hasImages?: boolean
  hasRichContent?: boolean
  isDestructive?: boolean
}): ModalRecommendation {
  const { sectionCount = 1, stepCount, hasImages = false, hasRichContent = false, isDestructive = false } = options || {}

  // Deletion or destructive confirmations
  if (purpose === 'delete-confirm' || isDestructive) {
    return {
      type: 'AlertModal',
      confidence: 'high',
      reason: 'Destructive action requires explicit confirmation with minimal UI',
      example: '<AlertModal variant="danger" title="Delete Vehicle?" ... />',
      size: '384px (max-w-sm)',
      imports: ["import { AlertModal } from '@/components/modals'"],
    }
  }

  // Success/info/warning messages
  if (['success-message', 'info-message', 'warning-message'].includes(purpose)) {
    const variant = purpose.replace('-message', '') as 'success' | 'info' | 'warning'
    return {
      type: 'AlertModal',
      confidence: 'high',
      reason: 'Simple notification messages use AlertModal with appropriate variant',
      example: `<AlertModal variant="${variant}" title="Success!" ... />`,
      size: '384px (max-w-sm)',
      imports: ["import { AlertModal } from '@/components/modals'"],
    }
  }

  // Multi-step wizards, onboarding, guided capture
  if (['multi-step-wizard', 'onboarding-flow', 'guided-capture'].includes(purpose) || (stepCount && stepCount >= 2)) {
    return {
      type: 'StepperModal',
      confidence: 'high',
      reason: 'Multi-step workflows use StepperModal for guided sequential interactions with progress tracking and flat card design',
      example: '<StepperModal steps={[{id: "1", title: "Step 1", content: ...}]} currentStepId={step} ... />',
      size: '672px (max-w-2xl)',
      imports: ["import { StepperModal, Step } from '@/components/modals'"],
    }
  }

  // Single field edits
  if (purpose === 'single-field-edit' && sectionCount === 1 && !hasImages && !hasRichContent) {
    return {
      type: 'SimpleFormModal',
      confidence: 'high',
      reason: 'Single-field forms use SimpleFormModal for compact, focused editing',
      example: '<SimpleFormModal title="Add Note"><TextArea /></SimpleFormModal>',
      size: '448px (max-w-md)',
      imports: ["import { SimpleFormModal } from '@/components/modals'"],
    }
  }

  // Image upload or document processing
  if (purpose === 'image-upload' || purpose === 'document-processing' || hasImages || hasRichContent) {
    return {
      type: 'FullWidthModal',
      confidence: 'high',
      reason: 'Rich content, images, or document processing requires FullWidthModal for space',
      example: '<FullWidthModal><div className="grid grid-cols-2">...</div></FullWidthModal>',
      size: '896px (max-w-4xl)',
      imports: ["import { FullWidthModal } from '@/components/modals'"],
    }
  }

  // Multi-section forms (most common case!)
  if (
    ['multi-section-form', 'settings', 'create-entity', 'edit-entity'].includes(purpose) ||
    sectionCount >= 2
  ) {
    return {
      type: 'BlockFormModal',
      confidence: 'high',
      reason: 'Multi-section forms are perfect for BlockFormModal - the most common modal type (90% of cases)',
      example: '<BlockFormModal sections={[{id: "1", title: "Section 1", content: ...}]} ... />',
      size: '672px (max-w-2xl)',
      imports: [
        "import { BlockFormModal, ModalSection } from '@/components/modals'",
      ],
    }
  }

  // Default fallback to BlockFormModal (safest choice)
  return {
    type: 'BlockFormModal',
    confidence: 'medium',
    reason: 'BlockFormModal is the default choice for most forms and can be adapted to many use cases',
    example: '<BlockFormModal sections={sections} ... />',
    size: '672px (max-w-2xl)',
    imports: [
      "import { BlockFormModal, ModalSection } from '@/components/modals'",
    ],
  }
}

/**
 * Interactive modal selector - answers questions to recommend modal type
 */
export class ModalSelector {
  private answers: Partial<{
    hasForm: boolean
    sectionCount: number
    hasImages: boolean
    hasRichContent: boolean
    isDestructive: boolean
    isSingleField: boolean
  }> = {}

  ask(question: keyof typeof this.answers, answer: boolean | number) {
    this.answers[question] = answer as any
    return this
  }

  getRecommendation(): ModalRecommendation {
    // Determine purpose from answers
    if (this.answers.isDestructive) {
      return selectModal('delete-confirm')
    }

    if (this.answers.isSingleField && !this.answers.hasImages) {
      return selectModal('single-field-edit')
    }

    if (this.answers.hasImages || this.answers.hasRichContent) {
      return selectModal('image-upload', {
        hasImages: this.answers.hasImages,
        hasRichContent: this.answers.hasRichContent,
      })
    }

    if (this.answers.hasForm && (this.answers.sectionCount || 0) >= 2) {
      return selectModal('multi-section-form', {
        sectionCount: this.answers.sectionCount,
      })
    }

    // Default
    return selectModal('other')
  }

  reset() {
    this.answers = {}
    return this
  }
}

/**
 * Quick helper functions for common scenarios
 */
export const modalHelpers = {
  forDelete: () => selectModal('delete-confirm'),
  forSuccess: (message?: string) => selectModal('success-message'),
  forSingleField: () => selectModal('single-field-edit'),
  forForm: (sectionCount: number) =>
    selectModal('multi-section-form', { sectionCount }),
  forWizard: (stepCount: number) =>
    selectModal('multi-step-wizard', { stepCount }),
  forOnboarding: (stepCount: number) =>
    selectModal('onboarding-flow', { stepCount }),
  forGuidedCapture: (stepCount: number) =>
    selectModal('guided-capture', { stepCount }),
  forImageUpload: () => selectModal('image-upload', { hasImages: true }),
  forEdit: (sectionCount: number = 3) =>
    selectModal('edit-entity', { sectionCount }),
  forCreate: (sectionCount: number = 2) =>
    selectModal('create-entity', { sectionCount }),
}

/**
 * Validate if a modal type is appropriate for the use case
 */
export function validateModalChoice(
  chosenType: ModalRecommendation['type'],
  purpose: ModalPurpose,
  options?: Parameters<typeof selectModal>[1]
): { valid: boolean; message: string } {
  const recommended = selectModal(purpose, options)

  if (chosenType === recommended.type) {
    return {
      valid: true,
      message: `✅ ${chosenType} is the recommended choice for this use case`,
    }
  }

  if (recommended.confidence === 'high') {
    return {
      valid: false,
      message: `⚠️ ${recommended.type} is strongly recommended instead of ${chosenType}. Reason: ${recommended.reason}`,
    }
  }

  return {
    valid: true,
    message: `ℹ️ ${recommended.type} is recommended, but ${chosenType} may work if you have specific needs`,
  }
}

/**
 * Example usage in code:
 * 
 * // Quick helper
 * const rec = modalHelpers.forEdit(3)
 * console.log(rec.type) // "BlockFormModal"
 * console.log(rec.example)
 * 
 * // Interactive selector
 * const selector = new ModalSelector()
 *   .ask('hasForm', true)
 *   .ask('sectionCount', 3)
 *   .ask('hasImages', false)
 * 
 * const recommendation = selector.getRecommendation()
 * console.log(recommendation.type) // "BlockFormModal"
 * console.log(recommendation.reason)
 * 
 * // Direct selection
 * const rec2 = selectModal('edit-entity', { sectionCount: 4 })
 * console.log(rec2.imports) // Import statements needed
 * 
 * // Validation
 * const validation = validateModalChoice('SimpleFormModal', 'edit-entity', { sectionCount: 3 })
 * console.log(validation.message) // Warning that BlockFormModal is better
 */
