/**
 * AddressAutocomplete - Smart address input with Mapbox geocoding
 * 
 * Requires NEXT_PUBLIC_MAPBOX_TOKEN in .env
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string, coords?: { lat: number; lng: number }) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function AddressAutocomplete({
  value,
  onChange,
  onBlur,
  placeholder = 'Search for an address...',
  disabled = false,
  className
}: AddressAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const geocoderRef = useRef<MapboxGeocoder | null>(null)
  const [hasToken, setHasToken] = useState(true)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    if (!token) {
      console.warn('AddressAutocomplete: NEXT_PUBLIC_MAPBOX_TOKEN not found. Falling back to text input.')
      setHasToken(false)
      return
    }

    if (!containerRef.current || disabled) return

    // Initialize Mapbox Geocoder
    const geocoder = new MapboxGeocoder({
      accessToken: token,
      types: 'address,poi',
      countries: 'us', // Adjust as needed
      placeholder: placeholder,
      marker: false,
      mapboxgl: undefined // We don't need the map
    })

    // Handle result selection
    geocoder.on('result', (e) => {
      const result = e.result
      const address = result.place_name
      const [lng, lat] = result.geometry.coordinates
      onChange(address, { lat, lng })
    })

    // Handle clear
    geocoder.on('clear', () => {
      onChange('')
    })

    // Add to DOM
    if (containerRef.current) {
      containerRef.current.innerHTML = '' // Clear any existing
      // @ts-ignore - onAdd can be called without map for standalone usage
      const element = geocoder.onAdd()
      if (element) {
        containerRef.current.appendChild(element)
        
        // Attach blur handler to the input that Mapbox creates
        setTimeout(() => {
          const input = element.querySelector('input')
          if (input && onBlur) {
            input.addEventListener('blur', onBlur)
          }
        }, 0)
      }
    }

    geocoderRef.current = geocoder

    return () => {
      if (geocoder) {
        // Remove blur listener
        const element = containerRef.current?.querySelector('input')
        if (element && onBlur) {
          element.removeEventListener('blur', onBlur)
        }
        
        // @ts-ignore - cleanup
        geocoder.onRemove?.()
      }
    }
  }, [disabled, placeholder, onChange, onBlur])

  // Fallback to regular text input if no token
  if (!hasToken) {
    return (
      <div className={cn('relative', className)}>
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder || 'Enter address (autocomplete requires Mapbox token)'}
          disabled={disabled}
          className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          title="To enable autocomplete, add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local"
        />
        <div className="text-xs text-gray-500 mt-1">
          💡 For autocomplete: Add <code className="px-1 bg-gray-100 rounded">NEXT_PUBLIC_MAPBOX_TOKEN</code> to .env.local
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className={cn(
        'mapbox-geocoder-container',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    />
  )
}
