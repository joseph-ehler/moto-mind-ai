/**
 * AlertModal (TYPE 6)
 * For destructive actions, important confirmations, warnings
 * Size: max-w-sm (384px)
 * Centered layout with prominent icon
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react'
import { BaseModal } from './BaseModal'
import { AlertModalProps } from './types'

const variantConfig = {
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonClass: 'bg-blue-600 hover:bg-blue-700',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonClass: 'bg-amber-600 hover:bg-amber-700',
  },
  danger: {
    icon: XCircle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonClass: 'bg-red-600 hover:bg-red-700',
  },
  success: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
  },
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  icon,
  variant = 'warning',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
}: AlertModalProps) {
  const config = variantConfig[variant]
  const IconComponent = icon || config.icon

  const handleConfirm = () => {
    onConfirm()
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      closeOnOverlayClick={!isLoading}
      showCloseButton={false}
      title={title}
      description={description}
    >
      <div className="p-6 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center`}>
            {typeof IconComponent === 'function' ? (
              <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
            ) : (
              IconComponent
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-6">{description}</p>

        {/* Actions */}
        <div className="flex gap-3">
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
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 h-11 rounded-xl text-white ${config.buttonClass}`}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </BaseModal>
  )
}
