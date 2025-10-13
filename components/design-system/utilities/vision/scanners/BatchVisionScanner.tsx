/**
 * Batch Vision Scanner
 * 
 * Combines FileUpload UI with Vision processing pipeline.
 * Allows users to:
 * - Upload multiple images via drag & drop or file picker
 * - Capture multiple images with camera (sequential)
 * - Process all images through vision pipeline with plugins
 * - Review results with enriched data
 * 
 * Use Cases:
 * - Batch VIN scanning from photo gallery
 * - Multiple license plate scanning
 * - Document batch processing
 */

'use client'

import React, { useState, useCallback } from 'react'
import { FileUpload } from '../../file-upload/FileUpload'
import { VisionProcessingService } from '../services/visionProcessingService'
import type { CaptureResult, CaptureType } from '../types'
import type { VisionPlugin } from '../plugins/types'
import { Stack, Flex, Grid, Card, Button, Heading, Text } from '@/components/design-system'
import { Loader2, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

export interface BatchVisionScannerProps {
  /** Type of scanning (vin, license-plate, odometer, etc) */
  captureType?: CaptureType
  
  /** Maximum number of images to process */
  maxScans?: number
  
  /** Vision plugins to apply */
  plugins?: VisionPlugin[]
  
  /** Callback when all images are processed */
  onComplete?: (results: CaptureResult[]) => void
  
  /** Callback for individual scan completion */
  onScanComplete?: (result: CaptureResult, index: number) => void
  
  /** Callback for scanning errors */
  onError?: (error: Error, fileIndex: number) => void
  
  /** Vision API endpoint */
  apiEndpoint?: string
  
  /** Component title */
  title?: string
  
  /** Description text */
  description?: string
  
  /** Allow camera capture */
  showCamera?: boolean
  
  /** Camera overlay type */
  cameraOverlay?: 'vin' | 'odometer' | 'license-plate' | 'document' | 'none'
  
  /** Processing mode */
  processingMode?: 'parallel' | 'sequential'
}

interface ScanResult {
  fileIndex: number
  fileName: string
  status: 'pending' | 'processing' | 'success' | 'error'
  result?: CaptureResult
  error?: string
}

export function BatchVisionScanner({
  captureType = 'vin',
  maxScans = 10,
  plugins = [],
  onComplete,
  onScanComplete,
  onError,
  apiEndpoint = '/api/vision/process',
  title,
  description,
  showCamera = true,
  cameraOverlay = 'vin',
  processingMode = 'sequential'
}: BatchVisionScannerProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(0)
  
  // Initialize vision service
  const visionService = React.useMemo(() => 
    new VisionProcessingService({
      apiEndpoint,
      plugins,
      onAnalytics: (event, data) => {
        console.log('[BatchVisionScanner]', event, data)
      }
    }), [apiEndpoint, plugins]
  )
  
  /**
   * Handle file selection from FileUpload
   */
  const handleFilesChange = useCallback((files: File[]) => {
    setSelectedFiles(files)
    setScanResults(files.map((file, index) => ({
      fileIndex: index,
      fileName: file.name,
      status: 'pending'
    })))
  }, [])
  
  /**
   * Process all selected files
   */
  const handleProcessAll = useCallback(async () => {
    if (selectedFiles.length === 0) return
    
    setIsProcessing(true)
    setCurrentProgress(0)
    
    try {
      if (processingMode === 'parallel') {
        // Process all files in parallel
        const results = await visionService.processBatch(
          selectedFiles,
          { type: captureType }
        )
        
        // Update results
        setScanResults(prev => prev.map((scan, i) => ({
          ...scan,
          status: 'success',
          result: results[i]
        })))
        
        results.forEach((result, i) => onScanComplete?.(result, i))
        onComplete?.(results)
        
      } else {
        // Process files sequentially with progress
        const results = await visionService.processBatchSequential(
          selectedFiles,
          { type: captureType },
          (current, total) => {
            setCurrentProgress((current / total) * 100)
            
            // Update individual result status
            setScanResults(prev => prev.map((scan, i) => {
              if (i < current) {
                return { ...scan, status: 'success' }
              } else if (i === current - 1) {
                return { ...scan, status: 'processing' }
              }
              return scan
            }))
          }
        )
        
        // Update final results
        setScanResults(prev => prev.map((scan, i) => ({
          ...scan,
          status: 'success',
          result: results[i]
        })))
        
        results.forEach((result, i) => onScanComplete?.(result, i))
        onComplete?.(results)
      }
      
    } catch (error) {
      console.error('[BatchVisionScanner] Processing failed:', error)
      setScanResults(prev => prev.map(scan => ({
        ...scan,
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed'
      })))
      onError?.(error instanceof Error ? error : new Error('Processing failed'), 0)
      
    } finally {
      setIsProcessing(false)
    }
  }, [selectedFiles, visionService, captureType, processingMode, onComplete, onScanComplete, onError])
  
  /**
   * Remove a file from the selection
   */
  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])
  
  /**
   * Reset scanner
   */
  const handleReset = useCallback(() => {
    setSelectedFiles([])
    setScanResults([])
    setCurrentProgress(0)
  }, [])
  
  // Compute stats
  const stats = {
    total: scanResults.length,
    pending: scanResults.filter(r => r.status === 'pending').length,
    processing: scanResults.filter(r => r.status === 'processing').length,
    success: scanResults.filter(r => r.status === 'success').length,
    error: scanResults.filter(r => r.status === 'error').length
  }
  
  return (
    <Stack spacing="lg">
      {/* Header */}
      {(title || description) && (
        <Stack spacing="sm">
          {title && <Heading level="title">{title}</Heading>}
          {description && <Text>{description}</Text>}
        </Stack>
      )}
      
      {/* File Upload - Always show until processing starts */}
      {stats.success === 0 && (
        <FileUpload
          label={`Select ${captureType.toUpperCase()} Images`}
          helperText={`${selectedFiles.length}/${maxScans} images selected`}
          accept="image/*"
          multiple
          maxFiles={maxScans}
          showCamera={showCamera}
          cameraOverlay={cameraOverlay}
          enableBatchMode={true}
          value={selectedFiles}
          onChange={handleFilesChange}
          showPreview={false}
        />
      )}
      
      {/* Image Preview Grid */}
      {selectedFiles.length > 0 && stats.success === 0 && (
        <Stack spacing="md">
          <Card>
            <Stack spacing="md">
              <Flex justify="between" align="center">
                <div>
                  <Heading level="subtitle">{selectedFiles.length} Images Selected</Heading>
                  <Text size="sm">Review your images before processing</Text>
                </div>
                <Flex gap="sm">
                  <Button variant="outline" onClick={handleReset}>
                    Cancel
                  </Button>
                  <Button onClick={handleProcessAll}>
                    Process All
                  </Button>
                </Flex>
              </Flex>
            </Stack>
          </Card>
          
          {/* Thumbnail Grid */}
          <Grid columns="auto" gap="md" className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {selectedFiles.map((file, index) => {
              const previewUrl = URL.createObjectURL(file)
              return (
                <Card key={index} className="relative group overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={previewUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(previewUrl)}
                    />
                    {/* Overlay with file info */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <Text size="sm" className="text-white font-medium truncate">
                        {file.name}
                      </Text>
                      <Text size="xs" className="text-white/80">
                        {(file.size / 1024).toFixed(0)} KB
                      </Text>
                    </div>
                    {/* Image number badge */}
                    <div className="absolute top-2 left-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded">
                      #{index + 1}
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              )
            })}
          </Grid>
        </Stack>
      )}
      
      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <Stack spacing="md">
            <Flex align="center" gap="sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              <div>
                <Heading level="subtitle">Processing Images...</Heading>
                <Text size="sm">
                  {stats.success} of {stats.total} completed
                  {processingMode === 'sequential' && ` (${Math.round(currentProgress)}%)`}
                </Text>
              </div>
            </Flex>
            
            {processingMode === 'sequential' && (
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>
            )}
          </Stack>
        </Card>
      )}
      
      {/* Results List */}
      {scanResults.length > 0 && stats.success > 0 && (
        <Stack spacing="md">
          <Flex justify="between" align="center">
            <Heading level="subtitle">Results ({stats.success}/{stats.total})</Heading>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Start New Batch
            </Button>
          </Flex>
          
          <Stack spacing="sm">
            {scanResults.map((scan) => (
              <Card key={scan.fileIndex} className="p-4">
                <Flex justify="between" align="center">
                  <Flex align="center" gap="sm">
                    {scan.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {scan.status === 'error' && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {scan.status === 'processing' && (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    )}
                    {scan.status === 'pending' && (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                    
                    <div>
                      <Text className="font-medium">{scan.fileName}</Text>
                      {scan.result && (
                        <Text size="sm" className="text-gray-600">
                          {captureType === 'vin' && `VIN: ${scan.result.data?.vin || 'N/A'}`}
                          {scan.result.data?.make && ` • ${scan.result.data.make}`}
                          {scan.result.data?.model && ` ${scan.result.data.model}`}
                          {scan.result.data?.year && ` (${scan.result.data.year})`}
                        </Text>
                      )}
                      {scan.error && (
                        <Text size="sm" className="text-red-600">
                          Error: {scan.error}
                        </Text>
                      )}
                    </div>
                  </Flex>
                  
                  {scan.result?.confidence != null && (
                    <Text size="sm" className="text-gray-500">
                      {(scan.result.confidence * 100).toFixed(0)}% confident
                    </Text>
                  )}
                </Flex>
              </Card>
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}
