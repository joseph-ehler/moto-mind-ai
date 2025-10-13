/**
 * VehicleHeader v2 - Animated Hero + Glassmorphic Sticky Header
 * 
 * Based on EventHeader.v2 template with vehicle-specific theming
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Car, Gauge, Calendar, Download, Settings, Camera, Maximize2, Upload } from 'lucide-react'
import { Container, Flex, Button, ButtonGroup, Stack, Text, Heading } from '@/components/design-system'

interface VehicleHeaderProps {
  vehicle: {
    id: string
    year: number
    make: string
    model: string
    trim?: string
    nickname?: string
    license_plate?: string
    vin?: string
    odometer_miles?: number
    purchase_date?: string
    image_url?: string
  }
  onExport?: () => void
  onSettings?: () => void
  onPhotoUpload?: (file: File) => void
  onPhotoView?: () => void
}

export function VehicleHeaderV2({ vehicle, onExport, onSettings, onPhotoUpload, onPhotoView }: VehicleHeaderProps) {
  const router = useRouter()
  const [showStickyHeader, setShowStickyHeader] = useState(false)
  const [stickyOpacity, setStickyOpacity] = useState(0)

  // Scroll handler for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const heroHeight = 400 // Approximate hero height
      
      // Show sticky header after scrolling past hero
      if (scrollY > 150) {
        setShowStickyHeader(true)
        // Fade in progressively from 150px to 350px
        const fadeProgress = Math.min((scrollY - 150) / 200, 1)
        setStickyOpacity(fadeProgress)
      } else {
        setShowStickyHeader(false)
        setStickyOpacity(0)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const vehicleDisplayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const vehicleFullName = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`
  const hasPhoto = !!vehicle.image_url

  // Handle photo upload
  const handlePhotoUpload = () => {
    if (typeof window === 'undefined') return
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0]
      if (file && onPhotoUpload) {
        onPhotoUpload(file)
      }
    }
    input.click()
  }

  return (
    <>
      {/* Sticky Compact Header - Enhanced Glassmorphic Black */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 border-b border-white/20 shadow-lg transition-all duration-300 ease-in-out ${
          showStickyHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{
          background: `linear-gradient(180deg, 
            rgba(0, 0, 0, ${0.70 + (stickyOpacity * 0.20)}) 0%, 
            rgba(0, 0, 0, ${0.65 + (stickyOpacity * 0.20)}) 50%,
            rgba(0, 0, 0, ${0.68 + (stickyOpacity * 0.20)}) 100%)`,
          backdropFilter: `blur(${24 + (stickyOpacity * 12)}px) saturate(1.4) brightness(1.1)`,
          WebkitBackdropFilter: `blur(${24 + (stickyOpacity * 12)}px) saturate(1.4) brightness(1.1)`,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{
            opacity: stickyOpacity,
            transform: `translateY(${(1 - stickyOpacity) * -10}px)`,
            transition: 'opacity 0.2s ease-out, transform 0.2s ease-out'
          }}>
            <Flex align="center" justify="between" className="h-14 sm:h-16">
              {/* Left: Back Button */}
              <button
                onClick={() => router.push('/vehicles')}
                className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Garage</span>
              </button>

              {/* Center: Vehicle Name */}
              <Flex align="center" gap="sm" className="flex-1 justify-center">
                <Car className="w-5 h-5 text-white/80" />
                <Text className="text-white font-semibold text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                  {vehicleDisplayName}
                </Text>
              </Flex>

              {/* Right: Actions */}
              <Flex align="center" gap="xs">
                <button
                  onClick={onExport}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Export"
                >
                  <Download className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={onSettings}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>
              </Flex>
            </Flex>
          </div>
        </div>
      </div>

      {/* Main Hero Section - Full Height with Image */}
      <div
        className={`w-full hero-gradient-animated-vehicle py-6 sm:py-8 md:py-12 min-h-[500px] sm:min-h-[600px]`}
      >
        {/* Fixed glass overlay */}
        <div className="hero-glass-overlay" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Stack spacing="lg">
            {/* Back Button & Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/vehicles')}
                className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-all duration-200 bg-transparent hover:bg-white/10 px-3 py-2 rounded-xl group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="hidden sm:inline">Back to Garage</span>
                <span className="sm:hidden">Back</span>
              </button>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                {onExport && (
                  <button
                    onClick={onExport}
                    className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="Export report"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden md:inline">Export</span>
                  </button>
                )}
                {onSettings && (
                  <button
                    onClick={onSettings}
                    className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden md:inline">Settings</span>
                  </button>
                )}
              </div>
            </div>

            {/* Vehicle Photo or Upload Placeholder */}
            {hasPhoto ? (
              <button
                onClick={onPhotoView || (() => {})}
                className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-xl sm:rounded-2xl overflow-hidden bg-white/10 backdrop-blur group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              >
                <img 
                  src={vehicle.image_url} 
                  alt={vehicleDisplayName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent pointer-events-none" />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex flex-col items-center gap-2 text-white">
                    <Maximize2 className="w-8 h-8" />
                    <span className="text-sm font-semibold">Click to view full size</span>
                  </div>
                </div>

                {/* Upload New Photo Button (Overlay) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePhotoUpload()
                  }}
                  className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white text-sm font-medium transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Change Photo</span>
                </button>
              </button>
            ) : (
              <button
                onClick={handlePhotoUpload}
                className="w-full aspect-[21/9] rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300 border-2 border-dashed border-white/20 hover:border-white/40 cursor-pointer flex items-center justify-center group"
              >
                <Stack spacing="md">
                  <Flex align="center" justify="center" className="w-20 h-20 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300 mx-auto">
                    <Camera className="w-10 h-10 text-white/60" />
                  </Flex>
                  <Text className="text-lg font-semibold text-white/70 text-center">Add Vehicle Photo</Text>
                  <Text className="text-sm text-white/50 text-center">Click to upload</Text>
                </Stack>
              </button>
            )}

            {/* Vehicle Title + Stats */}
            <Stack spacing="md">
              <Heading level="hero" className="text-white text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                {vehicleDisplayName}
              </Heading>
              
              <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base text-white/70 font-medium">
                <span>{vehicleFullName}</span>
                {vehicle.license_plate && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 font-mono text-xs sm:text-sm text-white">
                      {vehicle.license_plate}
                    </span>
                  </>
                )}
              </div>

              {/* Stat Pills - Scrollable on Mobile */}
              <div className="relative -mx-4 sm:mx-0">
                {/* Left fade gradient (mobile only) */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/60 to-transparent pointer-events-none z-10 sm:hidden" />
                
                {/* Scrollable container */}
                <div className="overflow-x-auto no-scrollbar px-4 sm:px-0">
                  <Flex gap="sm" className="flex-nowrap sm:flex-wrap min-w-min">
                    {/* Odometer */}
                    {vehicle.odometer_miles && (
                      <Flex align="center" gap="xs" className="px-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/10 flex-shrink-0">
                        <Gauge className="w-4 h-4 text-white" />
                        <Text className="text-sm font-semibold text-white whitespace-nowrap">{vehicle.odometer_miles.toLocaleString()} mi</Text>
                      </Flex>
                    )}
                    
                    {/* Age */}
                    <Flex align="center" gap="xs" className="px-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/10 flex-shrink-0">
                      <Calendar className="w-4 h-4 text-white" />
                      <Text className="text-sm font-semibold text-white whitespace-nowrap">{new Date().getFullYear() - vehicle.year} years old</Text>
                    </Flex>

                    {/* Owned Since */}
                    {vehicle.purchase_date && (
                      <Flex align="center" gap="xs" className="px-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/10 flex-shrink-0">
                        <Car className="w-4 h-4 text-white" />
                        <Text className="text-sm font-semibold text-white whitespace-nowrap">
                          Since {new Date(vehicle.purchase_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                </div>

                {/* Right fade gradient (mobile only) */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/60 to-transparent pointer-events-none z-10 sm:hidden" />
              </div>
            </Stack>
          </Stack>
        </div>
      </div>
    </>
  )
}
