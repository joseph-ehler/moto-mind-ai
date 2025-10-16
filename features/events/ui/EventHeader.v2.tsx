'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Share2, 
  Download, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Droplet,
  Gauge,
  FileText,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  StickyNote,
  MoreVertical,
  Receipt,
  Trash2,
  Maximize2,
  Car
} from 'lucide-react'
import { Flex, Text, Stack, Heading } from '@/components/design-system'
import { FilePreview, type PreviewFile } from '@/components/design-system/utilities/FilePreview'
import { formatDateWithoutTimezone } from '@/lib/utils/eventUtils'

interface EventHeaderV2Props {
  event: any
  onBack: () => void
  onShare?: () => void
  onExport?: () => void
  onDelete?: () => void
}

export function EventHeaderV2({ event, onBack, onShare, onExport, onDelete }: EventHeaderV2Props) {
  // Preview modal state
  const [showPreview, setShowPreview] = useState(false)
  
  // Scroll state for sticky header
  const [scrollY, setScrollY] = useState(0)
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  
  // Detect scroll with improved logic
  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY
          
          // Only update if there's meaningful movement (>5px)
          if (Math.abs(currentScrollY - lastScrollY) > 5) {
            // Scrolling down
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
              setIsScrollingDown(true)
            } 
            // Scrolling up
            else if (currentScrollY < lastScrollY) {
              setIsScrollingDown(false)
            }
            
            setScrollY(currentScrollY)
            setLastScrollY(currentScrollY)
          }
          
          ticking = false
        })
        ticking = true
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])
  
  // Calculate sticky header state with zones
  // Zone 1: 0-150px = Hero with station name visible, hide sticky
  // Zone 2: 150-350px = Transition zone, sticky appearing
  // Zone 3: >350px = Sticky bar fully visible (stays until scroll back to zone 1)
  const hideThreshold = 150 // Hide when scrolled back to station name
  const transitionStart = 200
  const stickyThreshold = 350
  
  // Show sticky when past threshold, hide only when scrolled back to top (< hideThreshold)
  const showStickyHeader = scrollY > hideThreshold
  const stickyOpacity = Math.min(1, Math.max(0, (scrollY - transitionStart) / 150))

  // Format date without timezone conversion
  const formattedDate = formatDateWithoutTimezone(event.date, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  const time = event.payload?.time || ''

  // Get event type details
  const eventTypeConfig = {
    fuel: { 
      icon: '⛽', 
      title: 'Fuel Fill-Up',
      gradient: 'from-black via-gray-900 to-black',
      accentColor: 'blue'
    },
    maintenance: { 
      icon: '🔧', 
      title: 'Maintenance',
      gradient: 'from-black via-gray-900 to-black',
      accentColor: 'orange'
    },
    odometer: { 
      icon: '📊', 
      title: 'Odometer Reading',
      gradient: 'from-black via-gray-900 to-black',
      accentColor: 'green'
    }
  }

  const config = eventTypeConfig[event.type as keyof typeof eventTypeConfig] || eventTypeConfig.fuel
  
  // Vehicle info for chip
  const vehicleShortName = event.vehicle?.make && event.vehicle?.model 
    ? `${event.vehicle.year} ${event.vehicle.make} ${event.vehicle.model}`
    : null

  // Count data quality indicators
  const dataQuality = {
    hasPhoto: !!event.payload?.receipt_image_url,
    hasLocation: !!(event.vendor && event.geocoded_lat),
    hasOdometer: !!event.miles,
    hasNotes: !!(event.notes && event.notes.trim().length > 0),
    hasFinancials: !!(event.total_amount && event.gallons)
  }

  const completedItems = [
    { key: 'hasPhoto', label: 'Receipt', icon: ImageIcon, value: dataQuality.hasPhoto },
    { key: 'hasFinancials', label: 'Financials', icon: DollarSign, value: dataQuality.hasFinancials },
    { key: 'hasLocation', label: 'Location', icon: MapPin, value: dataQuality.hasLocation },
    { key: 'hasOdometer', label: 'Odometer', icon: Gauge, value: dataQuality.hasOdometer },
    { key: 'hasNotes', label: 'Notes', icon: StickyNote, value: dataQuality.hasNotes },
  ]

  const completedCount = completedItems.filter(item => item.value).length
  const totalCount = completedItems.length

  // Check for event photos
  const photos = event.photos || []
  const hasPhotos = photos.length > 0
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isSliding, setIsSliding] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const currentPhoto = photos[currentPhotoIndex]
  
  // Keyboard navigation
  useEffect(() => {
    if (!hasPhotos || photos.length <= 1) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setIsSliding(true)
        setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
        setTimeout(() => setIsSliding(false), 500)
      } else if (e.key === 'ArrowRight') {
        setIsSliding(true)
        setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
        setTimeout(() => setIsSliding(false), 500)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasPhotos, photos.length])
  
  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const minSwipeDistance = 50
    
    if (Math.abs(distance) > minSwipeDistance) {
      setIsSliding(true)
      if (distance > 0) {
        // Swiped left - next photo
        setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
      } else {
        // Swiped right - previous photo
        setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
      }
      setTimeout(() => setIsSliding(false), 500)
    }
    
    setTouchStart(0)
    setTouchEnd(0)
  }

  return (
    <>
    {/* Sticky Compact Header - Shows on scroll - Enhanced Glassmorphic Black */}
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
              onClick={onBack}
              className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Back</span>
            </button>
            
            {/* Center: Title + Context (like navbar) */}
            <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-4">
              <Text className="text-sm sm:text-base font-bold text-white truncate max-w-full">
                {event.display_vendor || event.vendor || 'Event Details'}
              </Text>
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <span className="truncate">
                  {config.icon} {config.title}
                </span>
                {vehicleShortName && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="truncate hidden sm:inline">
                      {vehicleShortName}
                    </span>
                  </>
                )}
              </div>
            </div>
          
            {/* Right: Actions */}
            <Flex align="center" gap="xs" className="flex-shrink-0">
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors hidden sm:flex"
                title="Export"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </Flex>
          </Flex>
        </div>
      </div>
    </div>
    
    {/* Main Hero Header */}
    <div 
      className={`w-full hero-gradient-animated py-6 sm:py-8 md:py-12 min-h-[400px] sm:min-h-[500px]`}
    >
      {/* Fixed glass overlay */}
      <div className="hero-glass-overlay" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Stack spacing="lg">
          {/* Back Button & Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="self-start flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-all duration-200 bg-transparent hover:bg-white/10 px-3 py-2 rounded-xl group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="hidden sm:inline">Back to timeline</span>
              <span className="sm:hidden">Back</span>
            </button>

            {/* Action Buttons - Mobile: icons only */}
            <div className="flex items-center gap-1 sm:gap-2">
              {onShare && (
                <button
                  onClick={onShare}
                  className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Share event"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden md:inline">Share</span>
                </button>
              )}
              {onExport && (
                <button
                  onClick={onExport}
                  className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Export as PDF"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden md:inline">Export</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden md:inline">Delete</span>
                </button>
              )}
            </div>
          </div>

          {/* Event Photos Carousel */}
          {hasPhotos ? (
            <div 
              className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-xl sm:rounded-2xl overflow-hidden bg-white/10 backdrop-blur group"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Sliding Images Container */}
              <div 
                className="relative w-full h-full"
                style={{
                  transform: `translateX(-${currentPhotoIndex * 100}%)`,
                  transition: isSliding ? 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)' : 'none',
                  display: 'flex',
                  flexDirection: 'row',
                }}
              >
                {photos.map((photo: any, idx: number) => (
                  <button
                    key={photo.id}
                    onClick={() => setShowPreview(true)}
                    className="relative w-full h-full flex-shrink-0 cursor-pointer"
                    style={{ width: '100%' }}
                  >
                    <img 
                      src={photo.public_url} 
                      alt={`Event photo ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent pointer-events-none" />
                    
                    {/* Hover Overlay - Only on current photo */}
                    {idx === currentPhotoIndex && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex flex-col items-center gap-2 text-white">
                          <Maximize2 className="w-8 h-8" />
                          <span className="text-sm font-semibold">Click to view full size</span>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Photo Counter */}
              {photos.length > 1 && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-white text-sm font-medium z-10">
                  {currentPhotoIndex + 1} / {photos.length}
                </div>
              )}
              
              {/* Carousel Controls */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsSliding(true)
                      setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
                      setTimeout(() => setIsSliding(false), 500)
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full text-white transition-colors z-10"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsSliding(true)
                      setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
                      setTimeout(() => setIsSliding(false), 500)
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 backdrop-blur-md hover:bg-black/80 rounded-full text-white transition-colors z-10"
                  >
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </button>
                  
                  {/* Thumbnail dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {photos.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsSliding(true)
                          setCurrentPhotoIndex(idx)
                          setTimeout(() => setIsSliding(false), 500)
                        }}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          idx === currentPhotoIndex ? 'w-8 bg-white' : 'bg-white/40 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full aspect-[21/9] rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
              <Stack spacing="md">
                <Flex align="center" justify="center" className="w-20 h-20 rounded-full bg-white/10 mx-auto">
                  <Receipt className="w-10 h-10 text-white/60" />
                </Flex>
                <Text className="text-lg font-semibold text-white/70 text-center">No Photos</Text>
              </Stack>
            </div>
          )}

          {/* Event Title + Stats Pills - Like Vehicle */}
          <Stack spacing="md">
            <Heading level="hero" className="text-white text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
              {event.display_vendor || event.vendor || 'Event Details'}
            </Heading>
            
            <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base text-white/70 font-medium">
              <span>{config.icon} {config.title}</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-xs sm:text-base">{formattedDate}</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">{time}</span>
            </div>

            {/* Stat Pills - Horizontal Scroll with Fade */}
            {event.type === 'fuel' && event.total_amount && event.gallons && (
              <div className="relative -mx-4 sm:mx-0">
                {/* Left fade gradient */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/60 to-transparent pointer-events-none z-10 sm:hidden" />
                
                {/* Scrollable container */}
                <div className="overflow-x-auto scrollbar-hide px-4 sm:px-0">
                  <Flex align="center" gap="sm" className="w-max sm:w-auto">
                    <Flex align="center" gap="xs" className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/10 flex-shrink-0">
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      <Text className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">${event.total_amount.toFixed(2)}</Text>
                    </Flex>
                    
                    <Flex align="center" gap="xs" className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/10 flex-shrink-0">
                      <Droplet className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      <Text className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">{event.gallons.toFixed(2)} gal</Text>
                    </Flex>
                    
                    <Flex align="center" gap="xs" className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/10 flex-shrink-0">
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      <Text className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">${(event.total_amount / event.gallons).toFixed(3)}/gal</Text>
                    </Flex>
                    
                    {event.miles && (
                      <Flex align="center" gap="xs" className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white/15 backdrop-blur-sm rounded-full border border-white/10 flex-shrink-0">
                        <Gauge className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        <Text className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">{event.miles.toLocaleString()} mi</Text>
                      </Flex>
                    )}
                    
                    {completedCount === totalCount ? (
                      <Flex align="center" gap="xs" className="px-3 sm:px-4 py-2 sm:py-2.5 bg-green-500 backdrop-blur-sm rounded-full flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        <Text className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">Complete</Text>
                      </Flex>
                    ) : (
                      <Flex align="center" gap="xs" className="px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-500 backdrop-blur-sm rounded-full flex-shrink-0">
                        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        <Text className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">{completedCount}/{totalCount} fields</Text>
                      </Flex>
                    )}
                  </Flex>
                </div>
                
                {/* Right fade gradient */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/60 to-transparent pointer-events-none z-10 sm:hidden" />
              </div>
            )}

            {/* Location + Vehicle pills */}
            <Flex align="center" gap="sm" className="mt-2 flex-wrap">
              {event.geocoded_address && (
                <Flex align="center" gap="xs" className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-white text-xs sm:text-sm">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{event.geocoded_address}</span>
                </Flex>
              )}
              
              {vehicleShortName && (
                <Flex align="center" gap="xs" className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-white text-xs sm:text-sm">
                  <Car className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>{vehicleShortName}</span>
                </Flex>
              )}
            </Flex>
          </Stack>
        </Stack>
      </div>
    </div>

    {/* Image Preview Modal */}
    {hasPhotos && showPreview && (
      <FilePreview
        files={photos.map((photo: any, idx: number) => ({
          id: photo.id,
          name: `Photo ${idx + 1} - ${photo.image_type}`,
          type: 'image',
          url: photo.public_url,
          uploadedAt: new Date(photo.created_at),
        }))}
        modal={true}
        onClose={() => setShowPreview(false)}
      />
    )}
    </>
  )
}
