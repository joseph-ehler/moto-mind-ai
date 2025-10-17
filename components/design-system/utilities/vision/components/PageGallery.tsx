'use client'

/**
 * PageGallery Component
 * 
 * Grid view of captured pages with preview, remove, and reorder functionality
 * Uses design system primitives only
 */

import React from 'react'
import { X, GripVertical } from 'lucide-react'
import { Grid, Stack, Flex } from '../../../primitives/Layout'
import { Heading, Text } from '../../../primitives/Typography'
import { Button } from '../../../primitives/Button'
import { Card } from '../../../patterns/Card'
import type { CapturedPage } from '../hooks/useBatchCapture'

export interface PageGalleryProps {
  pages: CapturedPage[]
  onRemove: (pageId: string) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  onAddMore?: () => void
  onProcess?: () => void
  showAddMore?: boolean
  showProcess?: boolean
  isProcessing?: boolean
}

/**
 * Page gallery with preview and management
 */
export function PageGallery({
  pages,
  onRemove,
  onReorder,
  onAddMore,
  onProcess,
  showAddMore = true,
  showProcess = true,
  isProcessing = false
}: PageGalleryProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    onReorder?.(draggedIndex, index)
    setDraggedIndex(index)
  }
  
  const handleDragEnd = () => {
    setDraggedIndex(null)
  }
  
  if (pages.length === 0) {
    return (
      <Stack spacing="lg" align="center" className="py-12">
        <Text className="text-slate-500">No pages captured yet</Text>
        {showAddMore && onAddMore && (
          <Button onClick={onAddMore} size="lg">
            Add First Page
          </Button>
        )}
      </Stack>
    )
  }
  
  return (
    <Stack spacing="lg">
      {/* Header */}
      <Flex justify="between" align="center">
        <Stack spacing="xs">
          <Heading level="subtitle">
            {pages.length} Page{pages.length !== 1 ? 's' : ''}
          </Heading>
          <Text className="text-sm text-slate-600">
            {pages[0].source === 'camera' ? 'Captured' : 'Uploaded'}
          </Text>
        </Stack>
        
        {showAddMore && onAddMore && (
          <Button onClick={onAddMore} variant="outline">
            ➕ Add More
          </Button>
        )}
      </Flex>
      
      {/* Gallery Grid */}
      <Grid 
        columns="auto" 
        gap="md"
        className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        {pages.map((page, index) => (
          <div
            key={page.id}
            draggable={!!onReorder}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              relative group cursor-move
              ${draggedIndex === index ? 'opacity-50' : ''}
            `}
          >
            <Card className="overflow-hidden p-0">
              {/* Image Preview */}
              <div className="relative aspect-[3/4] bg-slate-100">
                <img
                  src={page.thumbnail || page.base64}
                  alt={`Page ${page.pageNumber}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Page Number Badge */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium">
                  Page {page.pageNumber}
                </div>
                
                {/* Drag Handle (Desktop) */}
                {onReorder && (
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 rounded p-1">
                      <GripVertical className="w-4 h-4 text-slate-600" />
                    </div>
                  </div>
                )}
                
                {/* Remove Button */}
                <button
                  onClick={() => onRemove(page.id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label={`Remove page ${page.pageNumber}`}
                >
                  <X className="w-4 h-4" />
                </button>
                
                {/* Source Indicator */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 px-2 py-0.5 rounded text-xs text-slate-600">
                  {page.source === 'camera' ? '📷' : '📁'}
                </div>
              </div>
              
              {/* Info Footer */}
              {page.preprocessed && (
                <div className="p-2 bg-slate-50 border-t border-slate-200">
                  <Text className="text-xs text-slate-600">
                    {(page.preprocessed.processedSize / 1024).toFixed(0)}KB
                    {page.preprocessed.compression > 0 && (
                      <span className="text-green-600 ml-1">
                        ({page.preprocessed.compression.toFixed(0)}% saved)
                      </span>
                    )}
                  </Text>
                </div>
              )}
            </Card>
          </div>
        ))}
      </Grid>
      
      {/* Process Button */}
      {showProcess && onProcess && (
        <Button
          size="lg"
          onClick={onProcess}
          disabled={pages.length === 0 || isProcessing}
          className="w-full"
        >
          {isProcessing 
            ? `Processing ${pages.length} Page${pages.length !== 1 ? 's' : ''}...`
            : `Process ${pages.length} Page${pages.length !== 1 ? 's' : ''}`
          }
        </Button>
      )}
    </Stack>
  )
}
