'use client'

/**
 * BatchDocumentScanner Component
 * 
 * Multi-page document scanner with sequential camera capture and batch file upload
 * Supports camera, file upload, and mixed workflows
 */

import React, { useState, useCallback } from 'react'
import { Camera, Upload } from 'lucide-react'
import { Stack, Flex } from '../../../primitives/Layout'
import { Heading, Text } from '../../../primitives/Typography'
import { Button } from '../../../primitives/Button'
import { Modal, Drawer } from '../../../feedback/Overlays'
import { UnifiedCameraCapture } from '../core/UnifiedCameraCapture'
import { PageGallery } from '../components/PageGallery'
import { useBatchCapture } from '../hooks/useBatchCapture'
import { useImagePreprocessing } from '../hooks/useImagePreprocessing'
import { useIsMobile } from '../hooks/useIsMobile'
import type { CaptureType, CaptureResult } from '../types'

export interface BatchDocumentScannerProps {
  // Core
  captureType?: CaptureType
  processingAPI: string
  onComplete: (pages: any[]) => void
  onCancel?: () => void
  
  // Limits
  maxPages?: number
  
  // Features
  allowCamera?: boolean
  allowUpload?: boolean
  enablePreprocessing?: boolean
  
  // UI
  title?: string
  instructions?: string
  
  // Analytics
  onAnalytics?: (event: any) => void
}

type ScanMode = 'selection' | 'camera' | 'upload' | 'review' | 'confirm'

/**
 * Batch document scanner with camera and upload support
 */
export function BatchDocumentScanner({
  captureType = 'document',
  processingAPI,
  onComplete,
  onCancel,
  maxPages = 20,
  allowCamera = true,
  allowUpload = true,
  enablePreprocessing = false, // DISABLED by default for batch uploads to prevent blocking
  title = 'Scan Document',
  instructions = 'Capture all pages of your document',
  onAnalytics
}: BatchDocumentScannerProps) {
  const [mode, setMode] = useState<ScanMode>('selection')
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastCapturedPage, setLastCapturedPage] = useState<string | null>(null)
  
  const batch = useBatchCapture({ 
    maxPages,
    onPageAdded: (page) => {
      onAnalytics?.({ 
        type: 'page_captured', 
        data: { 
          pageNumber: page.pageNumber, 
          source: page.source,
          captureType 
        } 
      })
    }
  })
  
  const preprocessing = useImagePreprocessing({ enabled: enablePreprocessing })
  const isMobile = useIsMobile()
  
  /**
   * Handle camera capture
   */
  const handleCameraCapture = useCallback(async (result: CaptureResult) => {
    console.log('📸 Page captured from camera')
    
    // Add to batch
    batch.addPage({
      base64: result.base64 || '',
      source: 'camera',
      timestamp: Date.now()
    })
    
    setLastCapturedPage(result.base64 || '')
    setMode('confirm')
  }, [batch])
  
  /**
   * Handle file upload - deferred processing to avoid blocking
   */
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    // Clear input so same file can be selected again
    event.target.value = ''
    
    if (files.length === 0) return
    
    console.log(`📁 Processing ${files.length} uploaded file(s)`)
    onAnalytics?.({ type: 'batch_upload_started', data: { fileCount: files.length, captureType } })
    
    // Process files asynchronously (non-blocking)
    setMode('review') // Show review immediately
    setIsProcessing(true)
    
    // Process files one at a time with yielding to prevent blocking
    const processFilesSequentially = async () => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate
        if (!file.type.startsWith('image/')) {
          console.warn('Skipping non-image file:', file.name)
          continue
        }
        
        // Process one file
        let base64: string
        
        if (enablePreprocessing) {
          const preprocessed = await preprocessing.preprocess(file)
          if (!preprocessed) {
            console.error('Failed to preprocess:', file.name)
            continue
          }
          base64 = preprocessed.base64
          
          // Add immediately after processing each file
          batch.addPage({
            base64,
            source: 'upload' as const,
            timestamp: Date.now(),
            fileName: file.name,
            preprocessed: {
              originalSize: preprocessed.originalSize,
              processedSize: preprocessed.processedSize,
              compression: preprocessed.compression
            }
          })
        } else {
          // No preprocessing - direct base64
          const reader = new FileReader()
          base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          
          batch.addPage({
            base64,
            source: 'upload' as const,
            timestamp: Date.now(),
            fileName: file.name
          })
        }
        
        // Yield to browser between files to prevent blocking
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }
      
      onAnalytics?.({ type: 'batch_upload_completed', data: { pagesAdded: batch.pageCount, captureType } })
      setIsProcessing(false)
    }
    
    // Start processing
    processFilesSequentially()
  }, [batch, preprocessing, enablePreprocessing, onAnalytics, captureType])
  
  /**
   * Process all pages
   */
  const handleProcessAll = useCallback(async () => {
    if (batch.pages.length === 0) return
    
    console.log(`🔄 Processing ${batch.pages.length} pages...`)
    onAnalytics?.({ type: 'batch_processing_started', data: { pageCount: batch.pages.length, captureType } })
    
    setIsProcessing(true)
    
    try {
      // For now, just return the pages (API integration would go here)
      // In production, you'd send batch.pages to your vision API
      
      const results = batch.pages.map(page => ({
        pageNumber: page.pageNumber,
        base64: page.base64,
        source: page.source,
        // Mock OCR data - replace with actual API response
        data: { text: `Page ${page.pageNumber} content` }
      }))
      
      onAnalytics?.({ 
        type: 'batch_processing_completed', 
        data: { 
          pageCount: batch.pages.length,
          captureType,
          successCount: results.length 
        } 
      })
      
      onComplete(results)
      
    } catch (error) {
      console.error('Batch processing error:', error)
      onAnalytics?.({ 
        type: 'batch_processing_failed', 
        data: { 
          pageCount: batch.pages.length,
          error: error instanceof Error ? error.message : 'Unknown error',
          captureType
        } 
      })
    } finally {
      setIsProcessing(false)
    }
  }, [batch.pages, onComplete, onAnalytics, captureType])
  
  /**
   * Mode Selection (Camera or Upload)
   */
  const renderSelection = () => {
    const content = (
      <Stack spacing="lg">
        <Stack spacing="sm" align="center">
          <Heading level="title">{title}</Heading>
          <Text className="text-center text-slate-600">{instructions}</Text>
          {batch.pageCount > 0 && (
            <Text className="text-sm text-slate-500">
              {batch.pageCount} page{batch.pageCount !== 1 ? 's' : ''} captured
            </Text>
          )}
        </Stack>
        
        <Stack spacing="sm">
          {allowCamera && (
            <Button
              onClick={() => setMode('camera')}
              size="lg"
              className="w-full h-14 text-lg"
            >
              <Camera className="w-5 h-5 mr-3" />
              Take Photo
            </Button>
          )}
          
          {allowUpload && (
            <>
              <input
                id="batch-file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="batch-file-input" className="block cursor-pointer">
                <div className="w-full h-14 text-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-center font-medium transition-colors">
                  <Upload className="w-5 h-5 mr-3" />
                  Upload Photos
                </div>
              </label>
            </>
          )}
          
          {batch.pageCount > 0 && (
            <Button
              onClick={() => setMode('review')}
              variant="outline"
              className="w-full"
            >
              Review {batch.pageCount} Page{batch.pageCount !== 1 ? 's' : ''}
            </Button>
          )}
          
          {onCancel && (
            <Button onClick={onCancel} variant="ghost" className="w-full">
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>
    )
    
    return isMobile ? (
      <Drawer isOpen={mode === 'selection'} onClose={onCancel || (() => {})} position="bottom">
        <div 
          style={{
            marginLeft: '-1.5rem',
            marginRight: '-1.5rem',
            marginTop: '-1rem',
            marginBottom: '-1rem',
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
            paddingTop: '0',
            paddingBottom: '1rem',
            borderTopLeftRadius: '1.5rem',
            borderTopRightRadius: '1.5rem',
            backgroundColor: 'white',
            overflow: 'hidden'
          }}
        >
          <Flex justify="center" className="py-3">
            <div className="w-10 h-1 bg-slate-300 rounded-full" aria-hidden="true" />
          </Flex>
          {content}
        </div>
      </Drawer>
    ) : (
      <Modal isOpen={mode === 'selection'} onClose={onCancel || (() => {})} size="sm">
        {content}
      </Modal>
    )
  }
  
  /**
   * Confirm after camera capture
   */
  const renderConfirm = () => (
    <Modal isOpen={mode === 'confirm'} onClose={() => setMode('selection')} size="md">
      <Stack spacing="lg">
        <Heading level="title">Page {batch.pageCount} Captured</Heading>
        
        {lastCapturedPage && (
          <div className="relative aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden">
            <img src={lastCapturedPage} alt="Last captured page" className="w-full h-full object-cover" />
          </div>
        )}
        
        <Stack spacing="sm">
          <Button
            onClick={() => setMode('camera')}
            size="lg"
            disabled={!batch.canAddMore}
            className="w-full"
          >
            ➕ Add Page {batch.pageCount + 1}
          </Button>
          
          <Button
            onClick={() => setMode('review')}
            variant="outline"
            className="w-full"
          >
            ✅ Done ({batch.pageCount} page{batch.pageCount !== 1 ? 's' : ''})
          </Button>
        </Stack>
      </Stack>
    </Modal>
  )
  
  // Render based on mode
  if (mode === 'camera') {
    return (
      <UnifiedCameraCapture
        captureType={captureType}
        frameGuide="document"
        instructions="Center the document in the frame"
        processingAPI={processingAPI}
        onCapture={handleCameraCapture}
        onCancel={() => setMode('selection')}
        onAnalytics={onAnalytics}
        enablePreprocessing={enablePreprocessing}
      />
    )
  }
  
  if (mode === 'review') {
    return (
      <PageGallery
        pages={batch.pages}
        onRemove={batch.removePage}
        onReorder={batch.reorderPages}
        onAddMore={() => setMode('selection')}
        onProcess={handleProcessAll}
        isProcessing={isProcessing}
      />
    )
  }
  
  if (mode === 'confirm') {
    return renderConfirm()
  }
  
  return renderSelection()
}
