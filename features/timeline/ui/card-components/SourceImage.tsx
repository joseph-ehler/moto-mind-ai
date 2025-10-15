/**
 * Source Image Component
 * 
 * Displays the user-uploaded image that was used for data extraction.
 * Builds trust by showing the source material.
 */

'use client'

import { useState } from 'react'
import { Eye, ZoomIn, X } from 'lucide-react'
import Image from 'next/image'

interface SourceImageProps {
  url: string
  thumbnail?: string
  alt: string
  onView?: () => void
}

export function SourceImage({ url, thumbnail, alt, onView }: SourceImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const displayUrl = thumbnail || url
  
  const handleClick = () => {
    if (onView) {
      onView()
    } else {
      setLightboxOpen(true)
    }
  }
  
  return (
    <>
      {/* Thumbnail */}
      <button
        onClick={handleClick}
        className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors group"
      >
        <Image
          src={displayUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
          <div className="flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-5 h-5" />
            <span className="text-sm font-medium">View full size</span>
          </div>
        </div>
      </button>
      
      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image
              src={url}
              alt={alt}
              fill
              className="object-contain"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-white text-sm font-medium flex items-center gap-2">
              <ZoomIn className="w-4 h-4" />
              {alt}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
