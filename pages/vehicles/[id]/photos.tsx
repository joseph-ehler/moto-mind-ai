import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { 
  ArrowLeft, 
  Camera, 
  Plus,
  X,
  Image as ImageIcon,
  Star,
  MoreVertical,
  Download,
  RefreshCw,
  Trash2
} from 'lucide-react'
import Image from 'next/image'
import { AIBadge } from '@/components/ui/AIBadge'
interface VehicleImage {
  id: string
  public_url: string
  filename: string
  image_type: string
  is_primary: boolean
  created_at: string
  ai_category?: string
  ai_description?: string
  detected_text?: {
    vin?: string
    plate?: string
    odometer?: string
  }
  vehicle_details?: {
    make?: string
    model?: string
    color?: string
    year_range?: string
  }
  vehicle_match?: {
    matches_expected?: boolean
    confidence?: string
    notes?: string
  }
  condition_data?: {
    damage_detected?: boolean
    damage_description?: string
    wear_level?: string
    notes?: string
  }
  parts_visible?: string[]
  maintenance_indicators?: {
    warning_lights?: string[]
    fluid_levels?: string
    tire_condition?: string
  }
  suggested_actions?: string[]
  processing_status?: string
}

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  nickname?: string
  hero_image_url?: string
}

export default function VehiclePhotosPage() {
  const router = useRouter()
  const { id } = router.query
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [images, setImages] = useState<VehicleImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<VehicleImage | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [completedImages, setCompletedImages] = useState<Set<string>>(new Set())
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        // Fetch vehicle details
        const vehicleResponse = await fetch(`/api/vehicles/${id}`)
        if (vehicleResponse.ok) {
          const vehicleData = await vehicleResponse.json()
          setVehicle(vehicleData.vehicle)
        }
        
        // Fetch vehicle images
        const imagesResponse = await fetch(`/api/vehicles/${id}/images`)
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json()
          setImages(imagesData.images || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleSetPrimary = async (imageId: string, imageType: string) => {
    try {
      const response = await fetch(`/api/vehicles/${id}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId,
          action: 'set_primary',
          image_type: imageType
        })
      })

      if (response.ok) {
        // Refresh images
        const imagesResponse = await fetch(`/api/vehicles/${id}/images`)
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json()
          setImages(imagesData.images || [])
        }
      }
    } catch (error) {
      console.error('Error setting primary image:', error)
    }
  }

  const handleRemovePrimary = async (imageId: string) => {
    try {
      const response = await fetch(`/api/vehicles/${id}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId,
          action: 'remove_primary'
        })
      })

      if (response.ok) {
        await refreshImages()
      }
    } catch (error) {
    }
  }

  const refreshImages = async () => {
    try {
      const response = await fetch(`/api/vehicles/${id}/images`)
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      }
    } catch (error) {
      console.error('Error refreshing images:', error)
    }
  }

  // Poll for AI processing updates and track completions
  useEffect(() => {
    if (!images.length) return
    
    const hasProcessing = images.some(img => img.processing_status === 'pending' || img.processing_status === 'processing')
    if (!hasProcessing) return

    const interval = setInterval(async () => {
      console.log('🔄 Polling for AI processing updates...')
      const previousProcessing = images.filter(img => img.processing_status === 'pending' || img.processing_status === 'processing').map(img => img.id)
      
      await refreshImages()
      
      // Check for newly completed images
      const nowCompleted = previousProcessing.filter(id => {
        const img = images.find(i => i.id === id)
        return img && img.processing_status === 'completed'
      })
      
      if (nowCompleted.length > 0) {
        setCompletedImages(prev => new Set([...Array.from(prev), ...nowCompleted]))
        // Clear after 2 seconds
        setTimeout(() => {
          setCompletedImages(prev => {
            const next = new Set(Array.from(prev))
            nowCompleted.forEach(id => next.delete(id))
            return next
          })
        }, 2000)
      }
    }, 3000) // Check every 3 seconds

    return () => clearInterval(interval)
  }, [images, id])

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setMenuOpen(null)
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [menuOpen])

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new window.Image()
        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Calculate new dimensions (max 1920px width, maintain aspect ratio)
          const maxWidth = 1920
          const maxHeight = 1920
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (maxWidth / width) * height
            width = maxWidth
          }
          if (height > maxHeight) {
            width = (maxHeight / height) * width
            height = maxHeight
          }

          // Set canvas size
          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to base64 with 0.8 quality (80% compression)
          const compressed = canvas.toDataURL('image/jpeg', 0.8)
          
          console.log(`📉 Compressed: ${file.name} from ${(file.size / 1024).toFixed(0)}KB to ${(compressed.length / 1024).toFixed(0)}KB`)
          
          resolve(compressed)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file) // Read the file!
    })
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    
    try {
      // Upload files one by one
      for (const file of Array.from(files)) {
        console.log('📤 Processing:', file.name)
        
        // Compress image
        const compressedBase64 = await compressImage(file)

        console.log('📦 Uploading to API...')

        // Upload to API
        const response = await fetch(`/api/vehicles/${id}/photos/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photo: compressedBase64,
            filename: file.name,
          }),
        })

        const result = await response.json()
        console.log('📥 API Response:', result)

        if (!response.ok) {
          console.error('❌ Failed to upload:', file.name, result)
          alert(`Failed to upload ${file.name}: ${result.error || 'Unknown error'}`)
        } else {
          console.log('✅ Upload successful:', file.name)
        }
      }

      await refreshImages()
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('❌ Error uploading photos:', error)
      alert(`Error uploading photos: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSetHeroImage = async (imageUrl: string) => {
    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero_image_url: imageUrl
        })
      })

      if (response.ok) {
        // Update vehicle state to reflect new hero
        if (vehicle) {
          setVehicle({ ...vehicle, hero_image_url: imageUrl })
        }
      }
      setMenuOpen(null)
    } catch (error) {
      console.error('Error setting hero image:', error)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return
    
    try {
      const response = await fetch(`/api/vehicles/${id}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId })
      })

      if (response.ok) {
        await refreshImages()
        setSelectedImage(null)
      }
      setMenuOpen(null)
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  const handleReprocess = async (imageId: string, imageUrl: string) => {
    try {
      // Update status to processing
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, processing_status: 'processing' } : img
      ))
      setMenuOpen(null)

      const response = await fetch(`/api/vehicles/${id}/photos/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, imageUrl })
      })

      if (response.ok) {
        // Refresh after processing
        setTimeout(() => refreshImages(), 3000)
      }
    } catch (error) {
      console.error('Error reprocessing image:', error)
    }
  }

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      setMenuOpen(null)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="animate-pulse space-y-6 p-4">
          <div className="h-16 bg-slate-200 rounded"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  const displayName = vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Vehicle'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Photos</h1>
            <p className="text-sm text-slate-600">{displayName}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {images.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/5 p-12 shadow-sm">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-black/40" />
              </div>
              <h3 className="text-lg font-semibold text-black mb-2">No photos yet</h3>
              <p className="text-sm text-black/60 mb-6">
                Add photos to showcase your vehicle
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Photos
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Add Photo Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full mb-6 bg-white rounded-3xl border-2 border-dashed border-black/20 p-8 hover:border-black/40 hover:bg-black/5 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-6 h-6 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                  <span className="text-base font-medium text-black/60">Uploading...</span>
                </>
              ) : (
                <>
                  <Plus className="w-6 h-6 text-black/40" />
                  <span className="text-base font-medium text-black/60">Add Photos</span>
                </>
              )}
            </button>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 gap-4">
              {images.map((image) => {
                const isHero = vehicle?.hero_image_url === image.public_url
                const isProcessing = image.processing_status === 'pending' || image.processing_status === 'processing'
                const justCompleted = completedImages.has(image.id)
                
                return (
                  <div key={image.id} className="group relative">
                    {/* Animated Gradient Border - Light traveling around edge */}
                    {isProcessing && (
                      <>
                        <div className="absolute -inset-[3px] rounded-2xl overflow-hidden">
                          <div 
                            className="absolute -inset-[200%]"
                            style={{
                              background: 'conic-gradient(from 0deg, transparent 0%, #3b82f6 10%, #8b5cf6 15%, #ec4899 20%, transparent 30%, transparent 100%)',
                              animation: 'spin 3s linear infinite'
                            }}
                          ></div>
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-white"></div>
                      </>
                    )}
                    
                    {/* Success Flash */}
                    {justCompleted && (
                      <div className="absolute -inset-1 rounded-2xl bg-green-500 animate-ping pointer-events-none"></div>
                    )}
                    
                    <div className="aspect-square rounded-2xl overflow-hidden relative bg-white z-10">
                      <img
                        src={image.public_url}
                        alt={image.filename}
                        className={`w-full h-full object-cover cursor-pointer transition-opacity ${isProcessing ? 'opacity-70' : 'hover:opacity-90'}`}
                        onClick={() => setSelectedImage(image)}
                      />
                    </div>
                    
                    {/* Hero Badge */}
                    {isHero && (
                      <div className="absolute top-2 left-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full shadow-lg">
                          <Star className="w-3 h-3 text-white fill-white" />
                          <span className="text-xs font-semibold text-white">Hero</span>
                        </div>
                      </div>
                    )}
                    
                    {/* AI Processed Badge */}
                    {(image.ai_category || image.ai_description) && (
                      <div className="absolute bottom-2 left-2 z-10">
                        <AIBadge size="xs" />
                      </div>
                    )}
                    
                    {/* AI Enhancement Chip */}
                    {isProcessing && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full shadow-lg animate-pulse">
                          {/* Magic Sparkle Icon with Animation */}
                          <svg 
                            className="w-3.5 h-3.5 text-white animate-[spin_2s_ease-in-out_infinite]" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
                            />
                          </svg>
                          <span className="text-xs font-semibold text-white">Enhancing with AI</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Overflow Menu */}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpen(menuOpen === image.id ? null : image.id)
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4 text-black" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {menuOpen === image.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                          {!isHero && (
                            <button
                              onClick={() => handleSetHeroImage(image.public_url)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Star className="w-4 h-4" />
                              Set as Hero
                            </button>
                          )}
                          <button
                            onClick={() => handleReprocess(image.id, image.public_url)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Reprocess with AI
                          </button>
                          <button
                            onClick={() => handleDownload(image.public_url, image.filename)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                          <button
                            onClick={() => handleDeleteImage(image.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-slate-100"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Full Screen Image Viewer */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black z-50 flex"
            onClick={() => setSelectedImage(null)}
          >
            {/* Image Area */}
            <div className="flex-1 flex items-center justify-center p-8">
              <img
                src={selectedImage.public_url}
                alt={selectedImage.filename}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Sidebar */}
            <div 
              className="w-96 bg-slate-900 border-l border-slate-800 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 z-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold truncate">Photo Details</h3>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
                {(selectedImage.ai_category || selectedImage.ai_description) && (
                  <AIBadge size="md" />
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-b border-slate-800 space-y-2">
                {vehicle?.hero_image_url !== selectedImage.public_url && (
                  <button
                    onClick={() => handleSetHeroImage(selectedImage.public_url)}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Star className="w-4 h-4" />
                    Set as Hero Image
                  </button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleReprocess(selectedImage.id, selectedImage.public_url)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reprocess
                  </button>
                  <button
                    onClick={() => handleDownload(selectedImage.public_url, selectedImage.filename)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
                <button
                  onClick={() => handleDeleteImage(selectedImage.id)}
                  className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Photo
                </button>
              </div>

              {/* AI Metadata Sections */}
              <div className="p-4 space-y-4">
                {/* Category Badge */}
                {selectedImage.ai_category && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-medium capitalize">
                      {selectedImage.ai_category}
                    </span>
                    {selectedImage.processing_status === 'processing' && (
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-medium">
                        Processing...
                      </span>
                    )}
                  </div>
                )}

                {/* Vehicle Mismatch Warning */}
                {selectedImage.vehicle_match && selectedImage.vehicle_match.matches_expected === false && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-orange-400 text-lg">⚠️</span>
                      <div className="flex-1">
                        <p className="text-orange-200 text-sm font-semibold">Vehicle Mismatch</p>
                        {selectedImage.vehicle_match.notes && (
                          <p className="text-orange-100/90 text-xs mt-1">{selectedImage.vehicle_match.notes}</p>
                        )}
                        <p className="text-orange-100/70 text-xs mt-1">
                          Confidence: <span className="capitalize font-medium">{selectedImage.vehicle_match.confidence || 'unknown'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedImage.ai_description && (
                  <div className="pb-4 border-b border-slate-800">
                    <p className="text-slate-300 text-sm leading-relaxed">{selectedImage.ai_description}</p>
                  </div>
                )}
                
                {/* Detected Text */}
                {selectedImage.detected_text && Object.keys(selectedImage.detected_text).length > 0 && (
                  <div className="space-y-3 pb-4 border-b border-slate-800">
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Detected Information</h4>
                    <div className="space-y-2">
                      {selectedImage.detected_text.vin && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span className="text-xs text-slate-300"><span className="font-semibold text-blue-300">VIN:</span> {selectedImage.detected_text.vin}</span>
                        </div>
                      )}
                      {selectedImage.detected_text.plate && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-slate-300"><span className="font-semibold text-green-300">Plate:</span> {selectedImage.detected_text.plate}</span>
                        </div>
                      )}
                      {selectedImage.detected_text.odometer && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                          <span className="text-xs text-slate-300"><span className="font-semibold text-purple-300">Odometer:</span> {selectedImage.detected_text.odometer} mi</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Vehicle Details */}
                {selectedImage.vehicle_details && Object.keys(selectedImage.vehicle_details).length > 0 && (
                  <div className="space-y-3 pb-4 border-b border-slate-800">
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Vehicle Details</h4>
                    <div className="space-y-2">
                      {selectedImage.vehicle_details.make && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Make</span>
                          <span className="text-slate-200 font-medium">{selectedImage.vehicle_details.make}</span>
                        </div>
                      )}
                      {selectedImage.vehicle_details.model && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Model</span>
                          <span className="text-slate-200 font-medium">{selectedImage.vehicle_details.model}</span>
                        </div>
                      )}
                      {selectedImage.vehicle_details.color && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Color</span>
                          <span className="text-slate-200 font-medium capitalize">{selectedImage.vehicle_details.color}</span>
                        </div>
                      )}
                      {selectedImage.vehicle_details.year_range && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Year</span>
                          <span className="text-slate-200 font-medium">{selectedImage.vehicle_details.year_range}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Condition */}
                {selectedImage.condition_data && (
                  <div className="space-y-3 pb-4 border-b border-slate-800">
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Condition</h4>
                    {selectedImage.condition_data.damage_detected && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <span className="text-red-400 text-lg">⚠️</span>
                          <div className="flex-1">
                            <p className="text-red-200 text-sm font-semibold">Damage Detected</p>
                            {selectedImage.condition_data.damage_description && (
                              <p className="text-red-100/90 text-xs mt-1">{selectedImage.condition_data.damage_description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedImage.condition_data.wear_level && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Wear Level</span>
                        <span className="text-slate-200 font-medium capitalize">{selectedImage.condition_data.wear_level}</span>
                      </div>
                    )}
                    {selectedImage.condition_data.notes && (
                      <p className="text-slate-300 text-xs leading-relaxed">{selectedImage.condition_data.notes}</p>
                    )}
                  </div>
                )}

                {/* Parts Visible */}
                {selectedImage.parts_visible && selectedImage.parts_visible.length > 0 && (
                  <div className="space-y-3 pb-4 border-b border-slate-800">
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Parts Visible</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedImage.parts_visible.map((part, idx) => (
                        <div key={idx} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md">
                          <span className="text-xs text-slate-300">{part}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Maintenance Indicators */}
                {selectedImage.maintenance_indicators && (
                  <div className="space-y-3 pb-4 border-b border-slate-800">
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Maintenance</h4>
                    {selectedImage.maintenance_indicators.warning_lights && selectedImage.maintenance_indicators.warning_lights.length > 0 && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-yellow-200 text-xs font-semibold mb-1.5">Warning Lights</p>
                        <p className="text-yellow-100/90 text-xs">{selectedImage.maintenance_indicators.warning_lights.join(', ')}</p>
                      </div>
                    )}
                    {selectedImage.maintenance_indicators.fluid_levels && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Fluid Levels</span>
                        <span className="text-slate-200 font-medium">{selectedImage.maintenance_indicators.fluid_levels}</span>
                      </div>
                    )}
                    {selectedImage.maintenance_indicators.tire_condition && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Tire Condition</span>
                        <span className="text-slate-200 font-medium">{selectedImage.maintenance_indicators.tire_condition}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Suggested Actions */}
                {selectedImage.suggested_actions && selectedImage.suggested_actions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Suggested Actions</h4>
                    <ul className="space-y-2">
                      {selectedImage.suggested_actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-400 mt-0.5 font-bold">→</span>
                          <span className="text-slate-300">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
