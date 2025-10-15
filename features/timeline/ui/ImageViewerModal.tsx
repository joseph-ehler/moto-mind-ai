import { X, ZoomIn, ZoomOut, Download } from 'lucide-react'
import { useState } from 'react'

interface ImageViewerModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  imageName?: string
}

export function ImageViewerModal({ isOpen, onClose, imageUrl, imageName }: ImageViewerModalProps) {
  const [zoom, setZoom] = useState(100)

  if (!isOpen) return null

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))
  const handleDownload = () => {
    window.open(imageUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-white font-medium">
            {imageName || 'View Image'}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white/70 text-sm font-medium w-16 text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            
            <div className="w-px h-6 bg-white/20 mx-2" />
            
            <button
              onClick={handleDownload}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Image Container */}
      <div 
        className="relative max-w-full max-h-full overflow-auto cursor-pointer"
        onClick={onClose}
      >
        <img
          src={imageUrl}
          alt={imageName || 'Event image'}
          className="max-w-full max-h-[calc(100vh-120px)] object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom / 100})` }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Close hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        Click outside image or press ESC to close
      </div>
    </div>
  )
}
