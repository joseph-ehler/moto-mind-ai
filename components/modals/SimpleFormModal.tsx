/**
 * SimpleFormModal (TYPE 1)
 * For quick edits, single-purpose forms, and simple confirmations with input
 * Size: max-w-md (448px)
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'
import { BaseModal, ModalHeader, ModalContent, ModalFooter } from './BaseModal'
import { SimpleFormModalProps } from './types'

export function SimpleFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  icon,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  isLoading = false,
  error,
  closeOnOverlayClick = true,
  showCloseButton = true,
  children,
}: SimpleFormModalProps) {
  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      closeOnOverlayClick={closeOnOverlayClick && !isLoading}
      showCloseButton={showCloseButton}
      title={title}
      description={description}
      icon={icon}
    >
      <ModalHeader
        title={title}
        description={description}
        icon={icon}
        onClose={handleClose}
        showCloseButton={showCloseButton}
        variant="simple"
      />

      <ModalContent variant="simple">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        <div className="space-y-4">{children}</div>
      </ModalContent>

      <ModalFooter>
        <form onSubmit={onSubmit} className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl border-gray-200 hover:bg-gray-50"
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </form>
      </ModalFooter>
    </BaseModal>
  )
}
