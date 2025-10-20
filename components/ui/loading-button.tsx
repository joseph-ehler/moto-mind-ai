/**
 * Loading Button
 * 
 * First-class loading state primitive for inline tasks (< 7s).
 * Prevents double-clicks, shows progress, handles success/error.
 * 
 * Usage:
 * ```tsx
 * const [state, setState] = useState<LoadingButtonState>('idle')
 * 
 * <LoadingButton
 *   state={state}
 *   onClick={async () => {
 *     setState('loading')
 *     try {
 *       await saveData()
 *       setState('success')
 *       setTimeout(() => setState('idle'), 600)
 *     } catch {
 *       setState('error')
 *       setTimeout(() => setState('idle'), 2000)
 *     }
 *   }}
 *   loadingLabel="Saving..."
 *   successLabel="Saved"
 * >
 *   Save Changes
 * </LoadingButton>
 * ```
 */

'use client'

import * as React from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LoadingButtonState = 'idle' | 'loading' | 'success' | 'error'

export interface LoadingButtonProps extends Omit<ButtonProps, 'onClick'> {
  state?: LoadingButtonState
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>
  loadingLabel?: string
  successLabel?: string
  errorLabel?: string
  children: React.ReactNode
}

export function LoadingButton({
  state = 'idle',
  onClick,
  loadingLabel,
  successLabel,
  errorLabel,
  disabled,
  className,
  children,
  ...props
}: LoadingButtonProps) {
  const isLoading = state === 'loading'
  const isSuccess = state === 'success'
  const isError = state === 'error'
  const isDisabled = disabled || isLoading

  // Get the appropriate label based on state
  const getLabel = () => {
    if (isLoading && loadingLabel) return loadingLabel
    if (isSuccess && successLabel) return successLabel
    if (isError && errorLabel) return errorLabel
    return children
  }

  // Get the appropriate icon
  const getIcon = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />
    if (isSuccess) return <Check className="w-4 h-4" />
    if (isError) return <X className="w-4 h-4" />
    return null
  }

  const icon = getIcon()
  const label = getLabel()

  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
      aria-live="polite"
      className={cn(
        'touch-manipulation active:scale-95 transition-transform',
        className
      )}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </Button>
  )
}
