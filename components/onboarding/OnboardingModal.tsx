/**
 * Onboarding Modal Wrapper
 * 
 * Example of using the wizard in modal mode.
 * Wraps OnboardingShell in a Dialog for modal UX.
 */

'use client'

import { type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type OnboardingModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  title?: string
  description?: string
}

export function OnboardingModal({
  open,
  onOpenChange,
  children,
  title = 'Setup Wizard',
  description = 'Complete the steps to get started'
}: OnboardingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="sr-only">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>
        
        {/* OnboardingShell with mode="modal" goes here */}
        <div className="h-[80vh]">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Usage example:
 * 
 * const [isOpen, setIsOpen] = useState(false)
 * 
 * <OnboardingModal open={isOpen} onOpenChange={setIsOpen}>
 *   <OnboardingShell
 *     mode="modal"
 *     onExit={() => setIsOpen(false)}
 *     {...wizardProps}
 *   >
 *     {stepContent}
 *   </OnboardingShell>
 * </OnboardingModal>
 */
