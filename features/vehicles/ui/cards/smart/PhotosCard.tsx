'use client'

import React from 'react'
import { Camera, Plus } from 'lucide-react'
import { SectionHeader } from '@/components/ui/PageHeader'

interface Photo {
  id: string
  url: string
  type: string
  captured_at: string
  thumbnail_url?: string
}

interface PhotosCardProps {
  recentPhotos: Photo[]
  onAddPhoto: () => void
}

export function PhotosCard({ recentPhotos, onAddPhoto }: PhotosCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
      <SectionHeader title="Photos" />
      
      {/* Horizontal scrolling photo gallery */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
        {/* Add Photo Button - Always first */}
        <button
          onClick={onAddPhoto}
          className="flex-shrink-0 w-32 h-32 rounded-2xl border-2 border-dashed border-black/20 
                     hover:border-black/40 hover:bg-black/5 transition-all duration-200
                     flex items-center justify-center group"
        >
          <Plus className="w-8 h-8 text-black/40 group-hover:text-black/60 transition-colors" />
        </button>
        
        {/* Existing Photos */}
        {recentPhotos.map((photo) => (
          <div 
            key={photo.id}
            className="flex-shrink-0 w-32 h-32 rounded-2xl bg-black/5 overflow-hidden 
                       cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onAddPhoto}
          >
            <img 
              src={photo.thumbnail_url || photo.url} 
              alt={`${photo.type} photo`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
