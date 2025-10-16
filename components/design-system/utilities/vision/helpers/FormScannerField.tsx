/**
 * FormScannerField Component
 * 
 * Easy form integration for vision scanners
 * Works with react-hook-form and standard forms
 */

'use client'

import React, { useState } from 'react'
import { Camera } from 'lucide-react'
import { Stack, Button, Text } from '@/components/design-system'
import { VINScanner } from '../scanners/VINScanner'
import type { VINData } from '../scanners/VINScanner'

export interface FormScannerFieldProps {
  // Field configuration
  name: string
  label?: string
  value?: string
  onChange?: (value: string) => void
  
  // Scanner type
  scannerType: 'vin' | 'odometer' | 'license_plate'
  
  // Optional configuration
  placeholder?: string
  disabled?: boolean
  helperText?: string
  
  // Callbacks
  onScanComplete?: (data: any) => void
  onScanError?: (error: string) => void
}

/**
 * Form field with integrated scanner
 * Makes it trivial to add vision capture to any form
 */
export function FormScannerField({
  name,
  label,
  value,
  onChange,
  scannerType,
  placeholder,
  disabled,
  helperText,
  onScanComplete,
  onScanError
}: FormScannerFieldProps) {
  const [showScanner, setShowScanner] = useState(false)
  const [scannedValue, setScannedValue] = useState<string>('')
  
  const handleScan = (data: VINData) => {
    const newValue = data.vin // TODO: Extract value based on scanner type
    setScannedValue(newValue)
    onChange?.(newValue)
    onScanComplete?.(data)
    setShowScanner(false)
  }
  
  const handleError = (error: string) => {
    onScanError?.(error)
    setShowScanner(false)
  }
  
  const displayValue = value || scannedValue
  
  return (
    <>
      <Stack spacing="xs">
        {label && (
          <Text className="text-sm font-medium text-slate-700">
            {label}
          </Text>
        )}
        
        <div className="flex gap-2">
          {/* Input field */}
          <input
            type="text"
            name={name}
            value={displayValue}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-500"
          />
          
          {/* Scan button */}
          <Button
            onClick={() => setShowScanner(true)}
            disabled={disabled}
            variant="outline"
            size="lg"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>
        
        {helperText && (
          <Text className="text-xs text-slate-500">
            {helperText}
          </Text>
        )}
      </Stack>
      
      {/* Scanner modal */}
      {showScanner && scannerType === 'vin' && (
        <VINScanner
          onVINDetected={handleScan}
          onCancel={() => setShowScanner(false)}
        />
      )}
    </>
  )
}
