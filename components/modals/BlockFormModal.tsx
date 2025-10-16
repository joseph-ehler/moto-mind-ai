/**
 * BlockFormModal (TYPE 2)
 * For medium complexity forms with 2-4 sections, multiple field types
 * Size: max-w-2xl (672px)
 * Features clean block sections with headers and dividers (no nested cards)
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'
import { BaseModal, ModalHeader, ModalContent, ModalFooter } from './BaseModal'
import { BlockFormModalProps } from './types'

export function BlockFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  icon,
  submitLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  isLoading = false,
  error,
  sections,
  closeOnOverlayClick = true,
  showCloseButton = true,
}: BlockFormModalProps) {
  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
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

      <ModalContent variant="withFooter">
        <div className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {sections.map((section) => {
            // Skip sections with show=false
            if (section.show === false) return null

            return (
              <div key={section.id} className="space-y-6">
                {/* Block Header */}
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-black">{section.title}</h3>
                  {section.description && (
                    <p className="text-sm text-gray-500">{section.description}</p>
                  )}
                </div>
                
                {/* Block Content */}
                <div className="space-y-6">{section.content}</div>
                
                {/* Divider (except for last section) */}
                <div className="h-px bg-gray-200" />
              </div>
            )
          })}
        </div>
      </ModalContent>

      <ModalFooter>
        <form onSubmit={onSubmit} className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50"
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </form>
      </ModalFooter>
    </BaseModal>
  )
}
