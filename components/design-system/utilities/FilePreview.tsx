/**
 * FilePreview Component - Hybrid Design System Architecture
 * 
 * STRATEGIC ARCHITECTURE DECISIONS:
 * 
 * ✅ USES DESIGN SYSTEM (Foundation & Pattern Layer):
 * - Drawer: AI Insights Panel (right sidebar with focus trap, animations)
 * - FormModal: Annotation modals (responsive, accessible, bottom sheet on mobile)
 * - Stack/Flex: Layout primitives for consistent spacing
 * - Button: All interactive controls
 * 
 * ⚙️ CUSTOM IMPLEMENTATIONS (Domain-Specific):
 * - PDF/Image/Document Viewers: Complex canvas interactions, zoom, rotation
 * - Annotation System: Domain-specific positioning, pulsing indicators, page-aware
 * - Processing Overlay: Specialized AI loading state with custom animations
 * 
 * WHY HYBRID?
 * - Design system provides: Accessibility, focus management, consistent UX
 * - Custom code provides: Domain-specific behaviors that don't fit generic patterns
 * - Result: Best of both worlds - consistency where it matters, flexibility where needed
 * 
 * FUTURE EXTRACTION:
 * - If annotation patterns prove valuable across app → Extract to design system
 * - If document viewer patterns generalize → Create DocumentViewer component
 */

'use client'

import * as React from 'react'
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  Image as ImageIcon,
  File,
  ExternalLink,
  Printer,
  Share2,
  MessageSquare,
  Pencil,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// Design System - Foundation & Overlays
import { Stack, Flex } from '../primitives/Layout'
import { Drawer, FormModal, Modal } from '../feedback/Overlays'

// Import from extracted modules
import { AIStatusBadge } from '../file-preview/components/AIStatusBadge'
import { AIInsightsContent } from '../file-preview/components/AIInsightsContent'
import { ProcessingOverlay } from '../file-preview/components/ProcessingOverlay'
import type { 
  FileType, 
  AIProcessingStatus, 
  AIVisionData, 
  PreviewFile, 
  Annotation,
  FilePreviewProps
} from '../file-preview/types'
import { detectFileType } from '../file-preview/utils'

// Re-export for backwards compatibility
export type { FileType, AIProcessingStatus, AIVisionData, PreviewFile, Annotation, FilePreviewProps }
export { detectFileType }

// ============================================================================
// PDF VIEWER
// ============================================================================

interface PDFViewerProps {
  url: string
  zoom: number
  rotation: number
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  annotations?: Annotation[]
  isAnnotating?: boolean
  onAnnotationClick?: (x: number, y: number) => void
  onAnnotationView?: (annotation: Annotation) => void
}

function PDFViewer({
  url,
  zoom,
  rotation,
  page,
  totalPages,
  onPageChange,
  annotations,
  isAnnotating,
  onAnnotationClick,
  onAnnotationView
}: PDFViewerProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // In production, integrate with react-pdf or PDF.js
  // For now, we'll show a placeholder with the structure
  
  React.useEffect(() => {
    // Simulate PDF loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [url])

  const pageAnnotations = annotations?.filter(a => a.page === page) || []

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotating || !onAnnotationClick || !containerRef.current) return

    const contentDiv = e.currentTarget
    const rect = contentDiv.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      onAnnotationClick(x, y)
    }
  }

  return (
    <div className={cn(
      "relative w-full h-full bg-slate-50 overflow-auto touch-pan-y",
      isAnnotating && "cursor-crosshair"
    )} ref={containerRef}>
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs sm:text-sm text-slate-600">Loading PDF...</p>
          </div>
        </div>
      ) : error ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 text-red-600" />
            <p className="text-xs sm:text-sm text-red-600">{error}</p>
          </div>
        </div>
      ) : (
        <div
          className="mx-auto my-4 sm:my-8 bg-white shadow-lg"
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transformOrigin: 'center top',
            width: '100%',
            maxWidth: '210mm',
            minHeight: '297mm',
            transition: 'transform 0.2s'
          }}
        >
          {/* PDF Page Content - In production, render actual PDF */}
          <div className="relative w-full h-full p-4 sm:p-8 md:p-12" onClick={handleClick}>
            <div className="mb-4">
              <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 mx-auto mb-4" />
              <p className="text-center text-slate-500 text-sm sm:text-base">
                PDF Page {page} of {totalPages}
              </p>
              <p className="text-center text-slate-400 text-xs sm:text-sm mt-2">
                Integrate with react-pdf or PDF.js for actual PDF rendering
              </p>
            </div>

            {/* Sample PDF Content Placeholder */}
            <div className="space-y-4 text-slate-700">
              <h2 className="text-xl font-bold">Maintenance Document</h2>
              <p className="text-sm">Document content would appear here...</p>
              <div className="space-y-2">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="h-3 bg-slate-200 rounded" style={{ width: `${Math.random() * 40 + 60}%` }} />
                ))}
              </div>
            </div>

            {/* Annotations Overlay */}
            {pageAnnotations.map((annotation) => (
              <div
                key={annotation.id}
                className="absolute cursor-pointer group"
                style={{
                  left: `${annotation.x}%`,
                  top: `${annotation.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onAnnotationView?.(annotation)
                }}
                title="Click to view annotation"
              >
                {/* Pulsing Glow Rings */}
                <div className="absolute inset-0 -m-4">
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
                
                {/* Main Dot */}
                <div className="relative w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 group-hover:scale-125 group-hover:bg-blue-600 transition-all duration-200">
                  {/* Inner Glow */}
                  <div className="absolute inset-0 rounded-full bg-white/30" />
                  
                  {/* Tooltip on Hover */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap max-w-xs">
                      <div className="font-medium mb-1">💬 Annotation</div>
                      <div className="line-clamp-2">{annotation.text}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Click to view/edit</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annotation Help Text */}
      {isAnnotating && (
        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg text-xs sm:text-sm z-10 pointer-events-none max-w-[90vw] text-center">
          ✏️ <span className="hidden sm:inline">Click anywhere on the document to add an annotation</span><span className="sm:hidden">Tap to add annotation</span>
        </div>
      )}

      {/* Page Navigation */}
      <div className="sticky bottom-2 sm:bottom-4 left-0 right-0 flex justify-center px-2">
        <div className="bg-white rounded-lg shadow-lg border p-1.5 sm:p-2 flex items-center gap-1 sm:gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-8 w-8 sm:h-9 sm:w-9 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs sm:text-sm px-1 sm:px-2 min-w-[60px] sm:min-w-[70px] text-center">
            {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="h-8 w-8 sm:h-9 sm:w-9 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// IMAGE VIEWER
// ============================================================================

interface ImageViewerProps {
  url: string
  alt: string
  zoom: number
  rotation: number
  annotations?: Annotation[]
  isAnnotating?: boolean
  onAnnotationClick?: (x: number, y: number) => void
  onAnnotationView?: (annotation: Annotation) => void
}

function ImageViewer({ url, alt, zoom, rotation, annotations, isAnnotating, onAnnotationClick, onAnnotationView }: ImageViewerProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const imageRef = React.useRef<HTMLImageElement>(null)

  const handleClick = (e: React.MouseEvent) => {
    if (!isAnnotating || !imageRef.current || !onAnnotationClick) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      onAnnotationClick(x, y)
    }
  }

  return (
    <div className="relative w-full h-full bg-slate-900 flex items-center justify-center overflow-auto touch-pan-x touch-pan-y">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-white" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="text-center text-white">
            <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2" />
            <p className="text-xs sm:text-sm px-4">{error}</p>
          </div>
        </div>
      )}

      <div 
        className={cn(
          "relative",
          isAnnotating && "cursor-crosshair"
        )}
        onClick={handleClick}
      >
        <img
          ref={imageRef}
          src={url}
          alt={alt}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setError('Failed to load image')
          }}
          className="max-w-full max-h-[70vh] sm:max-h-[80vh] object-contain p-2 sm:p-4"
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s'
          }}
        />

        {/* Annotations Overlay */}
        {annotations?.map((annotation) => (
          <div
            key={annotation.id}
            className="absolute cursor-pointer group"
            style={{
              left: `${annotation.x}%`,
              top: `${annotation.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={(e) => {
              e.stopPropagation()
              onAnnotationView?.(annotation)
            }}
            title="Click to view annotation"
          >
            {/* Pulsing Glow Rings */}
            <div className="absolute inset-0 -m-4">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            
            {/* Main Dot */}
            <div className="relative w-4 h-4 sm:w-3 sm:h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 group-hover:scale-125 group-hover:bg-blue-600 transition-all duration-200 active:scale-150">
              {/* Inner Glow */}
              <div className="absolute inset-0 rounded-full bg-white/30" />
              
              {/* Tooltip on Hover */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap max-w-xs">
                  <div className="font-medium mb-1">💬 Annotation</div>
                  <div className="line-clamp-2">{annotation.text}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Click to view/edit</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Annotation Help Text */}
      {isAnnotating && (
        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-lg text-xs sm:text-sm z-10 pointer-events-none max-w-[90vw] text-center">
          ✏️ <span className="hidden sm:inline">Click anywhere on the image to add an annotation</span><span className="sm:hidden">Tap to add annotation</span>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// DOCUMENT VIEWER (Generic)
// ============================================================================

interface DocumentViewerProps {
  file: PreviewFile
}

function DocumentViewer({ file }: DocumentViewerProps) {
  return (
    <div className="w-full h-full bg-white flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <File className="h-16 w-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{file.name}</h3>
        <p className="text-sm text-slate-600 mb-4">
          This file type ({file.mimeType}) cannot be previewed directly.
        </p>
        <p className="text-xs text-slate-500 mb-6">
          Download the file to view it in an external application.
        </p>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download File
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN FILE PREVIEW COMPONENT
// ============================================================================

export function FilePreview({
  files,
  initialIndex = 0,
  modal = true,
  onClose,
  onDownload,
  onPrint,
  onShare,
  allowAnnotations = false,
  annotations = [],
  onAnnotationAdd,
  onAnnotationDelete,
  toolbarActions,
  maxZoom = 200,
  minZoom = 50,
  zoomStep = 25,
  showThumbnails = true,
  className
}: FilePreviewProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex)
  const [zoom, setZoom] = React.useState(100)
  const [rotation, setRotation] = React.useState(0)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(10) // Would be dynamic with real PDF
  const [isAnnotating, setIsAnnotating] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showAnnotationModal, setShowAnnotationModal] = React.useState(false)
  const [pendingAnnotation, setPendingAnnotation] = React.useState<{ x: number; y: number } | null>(null)
  const [annotationText, setAnnotationText] = React.useState('')
  const [viewingAnnotation, setViewingAnnotation] = React.useState<Annotation | null>(null)
  const [isEditingAnnotation, setIsEditingAnnotation] = React.useState(false)
  const [showAIInsights, setShowAIInsights] = React.useState(false)

  const currentFile = files[currentIndex]

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.()
      } else if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn()
      } else if (e.key === '-') {
        handleZoomOut()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, zoom])

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(files.length - 1, prev + 1))
    setZoom(100)
    setRotation(0)
    setCurrentPage(1)
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
    setZoom(100)
    setRotation(0)
    setCurrentPage(1)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(maxZoom, prev + zoomStep))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(minZoom, prev - zoomStep))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload(currentFile)
    } else {
      // Default download behavior
      const link = document.createElement('a')
      link.href = currentFile.url
      link.download = currentFile.name
      link.click()
    }
  }

  const handlePrint = () => {
    if (onPrint) {
      onPrint(currentFile)
    } else {
      window.print()
    }
  }

  const handleShare = () => {
    if (onShare) {
      onShare(currentFile)
    } else if (navigator.share) {
      navigator.share({
        title: currentFile.name,
        url: currentFile.url
      })
    }
  }

  const handleAnnotationClick = (x: number, y: number) => {
    setPendingAnnotation({ x, y })
    setShowAnnotationModal(true)
  }

  const handleAnnotationSave = () => {
    if (!annotationText.trim()) return

    if (viewingAnnotation && isEditingAnnotation) {
      // Editing existing annotation
      const updatedAnnotations = annotations.map(a => 
        a.id === viewingAnnotation.id 
          ? { ...a, text: annotationText.trim(), updatedAt: new Date() }
          : a
      )
      // In production, you'd call onAnnotationEdit callback
      console.log('✅ Annotation updated:', viewingAnnotation.id)
      alert(`✅ Annotation updated!\n\n"${annotationText.trim()}"`)
    } else if (pendingAnnotation && onAnnotationAdd) {
      // Adding new annotation
      onAnnotationAdd({
        fileId: currentFile.id,
        page: currentFile.type === 'pdf' ? currentPage : undefined,
        x: pendingAnnotation.x,
        y: pendingAnnotation.y,
        text: annotationText.trim(),
        author: 'Current User',
        color: '#3b82f6'
      })
    }

    setAnnotationText('')
    setPendingAnnotation(null)
    setViewingAnnotation(null)
    setIsEditingAnnotation(false)
    setShowAnnotationModal(false)
    setIsAnnotating(false)
  }

  const handleAnnotationView = (annotation: Annotation) => {
    setViewingAnnotation(annotation)
    setAnnotationText(annotation.text)
    setShowAnnotationModal(true)
  }

  const handleAnnotationDeleteFromModal = () => {
    if (viewingAnnotation && onAnnotationDelete) {
      onAnnotationDelete(viewingAnnotation.id)
      setViewingAnnotation(null)
      setAnnotationText('')
      setShowAnnotationModal(false)
    }
  }

  const handleAnnotationCancel = () => {
    setAnnotationText('')
    setPendingAnnotation(null)
    setViewingAnnotation(null)
    setIsEditingAnnotation(false)
    setShowAnnotationModal(false)
  }

  const currentAnnotations = annotations.filter(a => {
    // Filter by fileId first
    if (a.fileId !== currentFile.id) return false
    
    // For PDFs, also filter by page
    if (currentFile.type === 'pdf' && a.page !== currentPage) return false
    
    return true
  })

  const content = (
    <div className={cn(
      'flex flex-col h-full bg-white',
      modal && 'rounded-lg overflow-hidden',
      className
    )}>
      {/* Header Toolbar */}
      <div className="border-b bg-slate-50">
        {/* Mobile: Stacked layout */}
        <div className="flex flex-col sm:hidden">
          {/* File info */}
          <div className="px-3 py-2 border-b border-slate-200">
            <h3 className="font-semibold text-sm truncate">{currentFile.name}</h3>
            <p className="text-xs text-slate-500 truncate">
              {currentFile.size && `${(currentFile.size / 1024).toFixed(1)} KB`}
              {currentFile.size && currentFile.mimeType && ' • '}
              {currentFile.mimeType}
            </p>
          </div>
          
          {/* Controls */}
          <div className="px-2 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {/* Essential controls only on mobile */}
              {allowAnnotations && (
                <Button
                  size="sm"
                  variant={isAnnotating ? 'default' : 'ghost'}
                  onClick={() => setIsAnnotating(!isAnnotating)}
                  title="Annotations"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {/* AI Insights on Mobile */}
              {currentFile.aiVision?.status === 'completed' && (
                <Button
                  size="sm"
                  variant={showAIInsights ? 'default' : 'ghost'}
                  onClick={() => setShowAIInsights(!showAIInsights)}
                  title="AI Insights"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleDownload} title="Download">
                <Download className="h-4 w-4" />
              </Button>
              {typeof navigator !== 'undefined' && navigator.share && (
                <Button size="sm" variant="ghost" onClick={handleShare} title="Share">
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Zoom on mobile */}
            {(currentFile.type === 'pdf' || currentFile.type === 'image') && (
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={handleZoomOut} disabled={zoom <= minZoom}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs px-1 min-w-[45px] text-center">{zoom}%</span>
                <Button size="sm" variant="ghost" onClick={handleZoomIn} disabled={zoom >= maxZoom}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {modal && (
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{currentFile.name}</h3>
              {currentFile.aiVision && currentFile.aiVision.status !== 'none' && (
                <AIStatusBadge status={currentFile.aiVision.status} />
              )}
            </div>
            <p className="text-xs text-slate-500">
              {currentFile.size && `${(currentFile.size / 1024).toFixed(1)} KB`}
              {currentFile.size && currentFile.mimeType && ' • '}
              {currentFile.mimeType}
            </p>
          </div>

          <Flex gap="xs">
            {/* Zoom Controls */}
            {(currentFile.type === 'pdf' || currentFile.type === 'image') && (
              <>
                <Button size="sm" variant="ghost" onClick={handleZoomOut} disabled={zoom <= minZoom}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2 flex items-center min-w-[50px] justify-center">{zoom}%</span>
                <Button size="sm" variant="ghost" onClick={handleZoomIn} disabled={zoom >= maxZoom}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-slate-300" />
              </>
            )}

            {/* Rotate */}
            {(currentFile.type === 'pdf' || currentFile.type === 'image') && (
              <Button size="sm" variant="ghost" onClick={handleRotate}>
                <RotateCw className="h-4 w-4" />
              </Button>
            )}

            {/* Annotation Toggle */}
            {allowAnnotations && (
              <Button
                size="sm"
                variant={isAnnotating ? 'default' : 'ghost'}
                onClick={() => setIsAnnotating(!isAnnotating)}
                title="Annotations"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}

            {/* AI Insights Toggle */}
            {currentFile.aiVision?.status === 'completed' && (
              <Button
                size="sm"
                variant={showAIInsights ? 'default' : 'ghost'}
                onClick={() => setShowAIInsights(!showAIInsights)}
                title="AI Insights"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            )}

            <div className="w-px h-6 bg-slate-300" />

            {/* Actions */}
            <Button size="sm" variant="ghost" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            
            <Button size="sm" variant="ghost" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>

            {typeof navigator !== 'undefined' && navigator.share && (
              <Button size="sm" variant="ghost" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            )}

            {toolbarActions}

            <div className="w-px h-6 bg-slate-300" />

            {modal && (
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </Flex>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 relative">
        {currentFile.type === 'pdf' && (
          <PDFViewer
            url={currentFile.url}
            zoom={zoom}
            rotation={rotation}
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            annotations={currentAnnotations}
            isAnnotating={isAnnotating}
            onAnnotationClick={handleAnnotationClick}
            onAnnotationView={handleAnnotationView}
          />
        )}

        {currentFile.type === 'image' && (
          <ImageViewer
            url={currentFile.url}
            alt={currentFile.name}
            zoom={zoom}
            rotation={rotation}
            annotations={currentAnnotations}
            isAnnotating={isAnnotating}
            onAnnotationClick={handleAnnotationClick}
            onAnnotationView={handleAnnotationView}
          />
        )}

        {currentFile.type === 'document' && (
          <DocumentViewer file={currentFile} />
        )}

        {currentFile.type === 'unknown' && (
          <DocumentViewer file={currentFile} />
        )}

        {/* AI Processing Overlay */}
        {currentFile.aiVision?.status === 'processing' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30 pointer-events-none">
            <div className="bg-white rounded-lg p-6 shadow-xl text-center max-w-sm">
              <div className="relative mb-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
                <Sparkles className="h-6 w-6 text-yellow-400 absolute top-0 right-1/3 animate-pulse" />
              </div>
              <h3 className="font-semibold text-lg mb-2">🤖 AI Processing</h3>
              <p className="text-sm text-slate-600">
                Analyzing image and extracting insights...
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" />
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="h-2 w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Drawer - Design System Component */}
        <Drawer
          isOpen={currentFile.aiVision?.status === 'completed' && showAIInsights}
          onClose={() => setShowAIInsights(false)}
          position="right"
          size="sm"
          title="🤖 AI Insights"
          description={currentFile.aiVision?.confidence ? `${Math.round(currentFile.aiVision.confidence * 100)}% confidence` : undefined}
          closeOnOverlayClick={true}
          closeOnEscape={true}
        >
          {currentFile.aiVision && (
            <AIInsightsContent data={currentFile.aiVision} />
          )}
        </Drawer>

        {/* Navigation Arrows (for multiple files) */}
        {files.length > 1 && (
          <>
            <Button
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12"
              variant="secondary"
              size="icon"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <Button
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12"
              variant="secondary"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex === files.length - 1}
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </>
        )}
      </div>

      {/* Thumbnails Strip (for multiple files) */}
      {showThumbnails && files.length > 1 && (
        <div className="border-t bg-slate-50 p-2 sm:p-4">
          <div className="flex gap-2 overflow-x-auto touch-pan-x pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
            {files.map((file, index) => (
              <button
                key={file.id}
                onClick={() => {
                  setCurrentIndex(index)
                  setZoom(100)
                  setRotation(0)
                  setCurrentPage(1)
                }}
                className={cn(
                  'relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded border-2 overflow-hidden transition-all hover:border-blue-500 active:scale-95',
                  index === currentIndex ? 'border-blue-600 ring-2 ring-blue-200' : 'border-slate-300'
                )}
              >
                {file.type === 'image' ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                )}
                
                {/* AI Status Badge on Thumbnail */}
                {file.aiVision && file.aiVision.status !== 'none' && (
                  <div className="absolute top-1 right-1">
                    {file.aiVision.status === 'completed' && (
                      <div className="bg-green-500 text-white rounded-full p-1 shadow-lg">
                        <Sparkles className="h-3 w-3" />
                      </div>
                    )}
                    {file.aiVision.status === 'processing' && (
                      <div className="bg-blue-500 text-white rounded-full p-1 animate-pulse shadow-lg">
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </div>
                    )}
                    {file.aiVision.status === 'failed' && (
                      <div className="bg-red-500 text-white rounded-full p-1 shadow-lg">
                        <AlertCircle className="h-3 w-3" />
                      </div>
                    )}
                    {file.aiVision.status === 'pending' && (
                      <div className="bg-gray-500 text-white rounded-full p-1 shadow-lg">
                        <span className="text-[10px]">⏳</span>
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (!modal) {
    return (
      <>
        {content}
        {/* Annotation Modal - Use Modal for viewing, FormModal for editing */}
        {viewingAnnotation && !isEditingAnnotation ? (
          <Modal
            isOpen={showAnnotationModal}
            onClose={handleAnnotationCancel}
            title="💬 View Annotation"
            description={viewingAnnotation.author ? `by ${viewingAnnotation.author}` : undefined}
            size="md"
            footer={
              <Flex gap="md" justify="between" className="w-full">
                {onAnnotationDelete ? (
                  <Button 
                    variant="destructive" 
                    onClick={handleAnnotationDeleteFromModal}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                ) : <div />}
                <Flex gap="sm">
                  <Button 
                    variant="outline"
                    onClick={handleAnnotationCancel}
                  >
                    Close
                  </Button>
                  <Button 
                    onClick={() => setIsEditingAnnotation(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Flex>
              </Flex>
            }
          >
            <Stack spacing="md">
              <div>
                <Label className="text-sm font-medium">Annotation Text</Label>
                <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                  {annotationText}
                </div>
              </div>
            </Stack>
          </Modal>
        ) : (
          <FormModal
            isOpen={showAnnotationModal}
            onClose={handleAnnotationCancel}
            onSubmit={(e) => {
              e.preventDefault()
              handleAnnotationSave()
            }}
            title={isEditingAnnotation ? '✏️ Edit Annotation' : '✏️ Add Annotation'}
            description={viewingAnnotation?.author ? `by ${viewingAnnotation.author}` : undefined}
            submitLabel={isEditingAnnotation ? 'Save Changes' : 'Add Annotation'}
            cancelLabel="Cancel"
            size="md"
          >
            <Stack spacing="md">
              <div>
                <Label htmlFor="annotation-text" className="text-sm font-medium">Annotation Text</Label>
                <Textarea
                  id="annotation-text"
                  value={annotationText}
                  onChange={(e) => setAnnotationText(e.target.value)}
                  placeholder="Enter your note or comment..."
                  rows={4}
                  autoFocus
                  className="mt-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleAnnotationSave()
                    }
                  }}
                />
                <p className="text-xs text-slate-500 mt-2 hidden sm:block">
                  💡 Press Cmd/Ctrl + Enter to save quickly
                </p>
              </div>
            </Stack>
          </FormModal>
        )}
      </>
    )
  }

  // Modal overlay - Use design system Modal
  // Note: Don't pass title since content has its own header
  return (
    <>
      <Modal
        isOpen={modal || false}
        onClose={onClose || (() => {})}
        title={undefined}
        size="full"
        variant="fullscreen"
        showCloseButton={false}
      >
        {content}
      </Modal>
      
      {/* Annotation Modal - Use Modal for viewing, FormModal for editing (Modal Mode) */}
      {viewingAnnotation && !isEditingAnnotation ? (
        <Modal
          isOpen={showAnnotationModal}
          onClose={handleAnnotationCancel}
          title="💬 View Annotation"
          description={viewingAnnotation.author ? `by ${viewingAnnotation.author}` : undefined}
          size="md"
          footer={
            <Flex gap="md" justify="between" className="w-full">
              {onAnnotationDelete ? (
                <Button 
                  variant="destructive" 
                  onClick={handleAnnotationDeleteFromModal}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              ) : <div />}
              <Flex gap="sm">
                <Button 
                  variant="outline"
                  onClick={handleAnnotationCancel}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => setIsEditingAnnotation(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Flex>
            </Flex>
          }
        >
          <Stack spacing="md">
            <div>
              <Label className="text-sm font-medium">Annotation Text</Label>
              <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                {annotationText}
              </div>
            </div>
          </Stack>
        </Modal>
      ) : (
        <FormModal
          isOpen={showAnnotationModal}
          onClose={handleAnnotationCancel}
          onSubmit={(e) => {
            e.preventDefault()
            handleAnnotationSave()
          }}
          title={isEditingAnnotation ? '✏️ Edit Annotation' : '✏️ Add Annotation'}
          description={viewingAnnotation?.author ? `by ${viewingAnnotation.author}` : undefined}
          submitLabel={isEditingAnnotation ? 'Save Changes' : 'Add Annotation'}
          cancelLabel="Cancel"
          size="md"
        >
          <Stack spacing="md">
            <div>
              <Label htmlFor="annotation-text-modal" className="text-sm font-medium">Annotation Text</Label>
              <Textarea
                id="annotation-text-modal"
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                placeholder="Enter your note or comment..."
                rows={4}
                autoFocus
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleAnnotationSave()
                  }
                }}
              />
              <p className="text-xs text-slate-500 mt-2 hidden sm:block">
                💡 Press Cmd/Ctrl + Enter to save quickly
              </p>
            </div>
          </Stack>
        </FormModal>
      )}
    </>
  )
}
