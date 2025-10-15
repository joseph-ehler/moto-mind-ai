import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, ImageIcon, Upload, X, AlertCircle, Loader2 } from 'lucide-react'

interface VehiclePhotoUploadProps {
  onPhotoUploaded: (photoUrl: string) => void
  currentPhotoUrl?: string
  vehicleId?: string
  className?: string
}

export function VehiclePhotoUpload({ 
  onPhotoUploaded, 
  currentPhotoUrl, 
  vehicleId,
  className = "" 
}: VehiclePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Create FormData for multipart upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('vehicleId', vehicleId || 'temp')

      // Upload via our stable API endpoint (avoiding file numbering bug)
      // Try primary endpoint first, fallback to bulletproof endpoint
      let response
      try {
        response = await fetch('/api/vehicles/upload-photo', {
          method: 'POST',
          body: formData
        })
        
        // If we get 404, try the bulletproof endpoint
        if (response.status === 404) {
          console.warn('Primary upload endpoint not found, trying fallback...')
          response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })
        }
      } catch (error) {
        console.warn('Primary upload failed, trying bulletproof endpoint:', error)
        response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      // Our API returns URL in result.data.url
      const uploadedUrl = result.data?.url
      console.log('📸 Full API response:', result)
      console.log('📸 Extracted URL:', uploadedUrl)

      if (!uploadedUrl) {
        throw new Error('No URL returned from upload API')
      }

      setPreviewUrl(uploadedUrl)
      console.log('📸 Photo uploaded successfully, calling onPhotoUploaded with URL:', uploadedUrl)
      onPhotoUploaded(uploadedUrl)
      
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    // Reset the input so the same file can be selected again
    event.target.value = ''
  }

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    // Reset the input so the same file can be selected again
    event.target.value = ''
  }

  const removePhoto = () => {
    setPreviewUrl(null)
    onPhotoUploaded('')
    setError(null)
  }

  if (previewUrl) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative group">
          <img 
            src={previewUrl} 
            alt="Vehicle photo" 
            className="w-full h-full object-cover rounded-xl"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-xl flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/90 hover:bg-white text-gray-900"
              >
                <ImageIcon className="w-4 h-4 mr-1" />
                Change
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={removePhoto}
                className="bg-white/90 hover:bg-white text-gray-900"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors w-full h-full min-h-[200px]">
        <div className="p-4 sm:p-6 text-center h-full flex flex-col justify-center">
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 animate-spin" />
              <p className="text-xs sm:text-sm text-gray-600">Uploading photo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm">Add Vehicle Photo</h3>
                <p className="text-xs text-gray-600 mb-3 sm:mb-4">
                  Take a photo or choose from gallery
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2 px-3 flex-1"
                  size="sm"
                >
                  <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Take Photo</span>
                  <span className="sm:hidden">Camera</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 text-xs sm:text-sm py-2 px-3 flex-1"
                  size="sm"
                >
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Choose File</span>
                  <span className="sm:hidden">Gallery</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleCameraCapture}
        className="hidden"
      />
    </div>
  )
}
