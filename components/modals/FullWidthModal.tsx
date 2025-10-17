/**
 * FullWidthModal (TYPE 3)
 * For rich content, image upload, document processing, split layouts
 * Size: max-w-4xl (896px) or max-w-5xl (1024px)
 * Features generous spacing and optional 3-button footer
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'
import { BaseModal, ModalHeader, ModalContent, ModalFooter } from './BaseModal'
import { FullWidthModalProps } from './types'

export function FullWidthModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  icon,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  secondaryAction,
  isLoading = false,
  error,
  closeOnOverlayClick = true,
  showCloseButton = true,
  children,
}: FullWidthModalProps) {
  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    if (onSubmit) {
      onSubmit(e)
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
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
        variant="standard"
      />

      <ModalContent variant={onSubmit ? 'withFooter' : 'standard'}>
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        {children}
      </ModalContent>

      {onSubmit && (
        <ModalFooter>
          <form onSubmit={handleFormSubmit} className="flex gap-4">
            {secondaryAction && (
              <Button
                type="button"
                variant="outline"
                onClick={secondaryAction.onClick}
                disabled={isLoading}
                className="h-12 rounded-xl border-gray-200 hover:bg-gray-50"
              >
                {secondaryAction.label}
              </Button>
            )}
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="h-12 rounded-xl border-gray-200 hover:bg-gray-50 min-w-[120px]"
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </form>
        </ModalFooter>
      )}
    </BaseModal>
  )
}
