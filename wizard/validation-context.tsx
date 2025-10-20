/**
 * Validation Context
 * 
 * Shared validation bus for wizard steps.
 * Steps register their validation state, controller reads it.
 */

'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ValidationContextValue = {
  isValid: boolean
  setValid: (valid: boolean) => void
  onSubmit: (() => void) | null
  setSubmit: (handler: () => void) => void
  clearSubmit: () => void
}

const ValidationContext = createContext<ValidationContextValue | null>(null)

export function ValidationProvider({ children }: { children: ReactNode }) {
  const [isValid, setIsValid] = useState(false)
  const [onSubmit, setOnSubmitHandler] = useState<(() => void) | null>(null)
  
  const setValid = useCallback((valid: boolean) => {
    setIsValid(valid)
  }, [])
  
  const setSubmit = useCallback((handler: () => void) => {
    setOnSubmitHandler(() => handler)
  }, [])
  
  const clearSubmit = useCallback(() => {
    setOnSubmitHandler(null)
  }, [])
  
  return (
    <ValidationContext.Provider
      value={{
        isValid,
        setValid,
        onSubmit,
        setSubmit,
        clearSubmit
      }}
    >
      {children}
    </ValidationContext.Provider>
  )
}

export function useValidation() {
  const context = useContext(ValidationContext)
  
  if (!context) {
    throw new Error('useValidation must be used within ValidationProvider')
  }
  
  return context
}
