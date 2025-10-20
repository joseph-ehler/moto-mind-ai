/**
 * useDebounce Hook
 * 
 * Debounces a value with configurable delay.
 * Useful for autosave, search, and other frequent updates.
 */

import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up timeout if value changes before delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
