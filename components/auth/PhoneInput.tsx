'use client'

/**
 * International Phone Input Component
 * 
 * Features:
 * - Country code picker with search
 * - Flag emojis for each country
 * - Defaults to +1 (US/Canada)
 * - Works on web and native
 * - Auto-formats phone numbers
 */

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ChevronDown, Search, X } from 'lucide-react'

interface Country {
  code: string // 'US', 'CA', 'GB', etc.
  name: string
  dialCode: string // '+1', '+44', etc.
  flag: string // Emoji flag
}

// Top countries - most commonly used
const PRIORITY_COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
]

// All supported countries
const ALL_COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷' },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  onCountryChange?: (country: Country) => void
  disabled?: boolean
  label?: string
  placeholder?: string
  error?: string
}

export function PhoneInput({
  value,
  onChange,
  onCountryChange,
  disabled = false,
  label = 'Phone Number',
  placeholder = '(555) 123-4567',
  error,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(PRIORITY_COUNTRIES[0]) // Default to US
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Calculate optimal dropdown position based on available space
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const dropdownHeight = 400 // Approximate max height of dropdown
      const viewportHeight = window.innerHeight
      const spaceBelow = viewportHeight - buttonRect.bottom
      const spaceAbove = buttonRect.top

      // If not enough space below but more space above, flip to top
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top')
      } else {
        setDropdownPosition('bottom')
      }
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // Filter countries by search query
  const filteredCountries = ALL_COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.dialCode.includes(searchQuery) ||
      country.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle country selection
  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    onCountryChange?.(country)
    setIsOpen(false)
    setSearchQuery('')
  }

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Remove all non-digits except leading +
    const cleaned = input.replace(/[^\d+]/g, '')
    onChange(cleaned)
  }

  // Format phone number for display (US format)
  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove dial code for formatting
    let cleaned = phoneNumber.replace(selectedCountry.dialCode, '').replace(/\D/g, '')
    
    // US/Canada formatting
    if (selectedCountry.dialCode === '+1' && cleaned.length >= 10) {
      const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})/)
      if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`
      }
    }
    
    return cleaned
  }

  // Get full E.164 format for backend
  const getE164Format = () => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.startsWith(selectedCountry.dialCode.replace('+', ''))) {
      return `+${cleaned}`
    }
    return `${selectedCountry.dialCode}${cleaned}`
  }

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="phone-input">{label}</Label>}
      
      <div className="flex gap-2">
        {/* Country Picker */}
        <div className="relative" ref={dropdownRef}>
          <Button
            ref={buttonRef}
            type="button"
            variant="outline"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="w-32 justify-between"
          >
            <span className="flex items-center gap-2">
              <span className="text-xl">{selectedCountry.flag}</span>
              <span className="text-sm">{selectedCountry.dialCode}</span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>

          {/* Dropdown */}
          {isOpen && (
            <div 
              className={`absolute z-50 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden ${
                dropdownPosition === 'top' 
                  ? 'bottom-full mb-2' 
                  : 'top-full mt-2'
              }`}
              style={{
                maxHeight: 'min(400px, calc(100vh - 100px))',
              }}
            >
              {/* Search */}
              <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search countries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Priority Countries (if no search) */}
              {!searchQuery && (
                <div className="border-b border-gray-200">
                  {PRIORITY_COUNTRIES.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                        selectedCountry.code === country.code ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span className="text-2xl flex-shrink-0">{country.flag}</span>
                      <span className="flex-1 text-left text-sm font-medium">{country.name}</span>
                      <span className="text-sm text-gray-500 flex-shrink-0">{country.dialCode}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* All Countries */}
              <div 
                className="overflow-y-auto overscroll-contain"
                style={{
                  maxHeight: 'min(256px, calc(100vh - 200px))',
                  WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                }}
              >
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                        selectedCountry.code === country.code ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span className="text-2xl flex-shrink-0">{country.flag}</span>
                      <span className="flex-1 text-left text-sm truncate">{country.name}</span>
                      <span className="text-sm text-gray-500 flex-shrink-0">{country.dialCode}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    No countries found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="flex-1">
          <Input
            id="phone-input"
            type="tel"
            inputMode="tel"
            placeholder={placeholder}
            value={formatPhoneNumber(value)}
            onChange={handlePhoneChange}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        </div>
      </div>

      {/* Helper Text */}
      <div className="flex items-center justify-between text-xs">
        {error ? (
          <span className="text-red-600">{error}</span>
        ) : (
          <span className="text-gray-500">
            Format: {selectedCountry.dialCode} {placeholder}
          </span>
        )}
      </div>

      {/* Hidden field for E.164 format (for form submission) */}
      <input
        type="hidden"
        name="phone_e164"
        value={getE164Format()}
      />
    </div>
  )
}
