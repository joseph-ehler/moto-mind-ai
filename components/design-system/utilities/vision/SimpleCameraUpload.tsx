/**
 * SimpleCameraUpload Component
 * 
 * LIGHTWEIGHT camera/upload component for vision processing workflows
 * 
 * USE WHEN:
 * - You need a simple camera → preview → process flow
 * - Integrating with vision scanners
 * - Minimal UI is preferred
 * - Single file focus
 * 
 * DON'T USE WHEN:
 * - Need drag & drop
 * - Need auto-capture/OCR
 * - Need image compression
 * - Need batch mode (use FileUpload instead)
 * 
 * FLOW:
 * 1. Take photo OR upload files
 * 2. Preview added files
 * 3. Process button submits all
 * 
 * @example
 * ```tsx
 * <SimpleCameraUpload
 *   onProcess={(files) => handleVisionProcessing(files)}
 *   maxFiles={1}
 * />
 * ```
 */

'use client'

import React, { useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Stack, Flex, Text, Button, Grid } from '@/components/design-system'

export interface SimpleCameraUploadProps {
  onProcess: (files: File[]) => void
  accept?: string
  maxFiles?: number
  disabled?: boolean
}

export function SimpleCameraUpload({
  onProcess,
  accept = 'image/*',
  maxFiles = 1,
  disabled = false
}: SimpleCameraUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<Map<string, string>>(new Map())
  
  const cameraInputRef = React.useRef<HTMLInputElement>(null)
  const uploadInputRef = React.useRef<HTMLInputElement>(null)

  const addFile = (file: File) => {
    if (files.length >= maxFiles) return
    
    // Create preview
    const newPreviews = new Map(previews)
    if (file.type.startsWith('image/')) {
      newPreviews.set(file.name, URL.createObjectURL(file))
    }
    
    setFiles(prev => [...prev, file])
    setPreviews(newPreviews)
  }

  const removeFile = (fileName: string) => {
    const url = previews.get(fileName)
    if (url) URL.revokeObjectURL(url)
    
    const newPreviews = new Map(previews)
    newPreviews.delete(fileName)
    setPreviews(newPreviews)
    setFiles(prev => prev.filter(f => f.name !== fileName))
  }

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    selectedFiles.forEach(file => addFile(file))
    // Reset input value to allow same file again
    e.target.value = ''
  }

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    selectedFiles.forEach(file => addFile(file))
    // Reset input value to allow same file again
    e.target.value = ''
  }

  const handleProcess = () => {
    if (files.length > 0) {
      onProcess(files)
    }
  }

  const canAddMore = files.length < maxFiles

  return (
    <Stack spacing="md">
      {/* Camera & Upload Buttons */}
      {canAddMore && (
        <Grid columns={2} gap="sm">
          {/* Camera Capture */}
          <div style={{ position: 'relative' }}>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraChange}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ zIndex: 2 }}
            />
            <div 
              className="flex items-center justify-center gap-2 h-10 px-4 py-2 text-sm font-medium transition-colors bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
              style={{ position: 'relative', zIndex: 1 }}
            >
              📷 Camera
            </div>
          </div>

          {/* File Upload */}
          <div style={{ position: 'relative' }}>
            <input
              ref={uploadInputRef}
              type="file"
              accept={accept}
              multiple={maxFiles > 1}
              onChange={handleUploadChange}
              disabled={disabled}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ zIndex: 2 }}
            />
            <div 
              className="flex items-center justify-center gap-2 h-10 px-4 py-2 text-sm font-medium transition-colors border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
              style={{ position: 'relative', zIndex: 1 }}
            >
              <Upload className="w-4 h-4" />
              Upload
            </div>
          </div>
        </Grid>
      )}

      {/* Preview Grid */}
      {files.length > 0 && (
        <Stack spacing="sm">
          <Grid columns={maxFiles === 1 ? 1 : 2} gap="sm">
            {files.map((file) => (
              <div 
                key={file.name}
                className="border border-slate-200 rounded-lg p-3"
              >
                <Flex align="center" gap="sm">
                  {previews.get(file.name) ? (
                    <img 
                      src={previews.get(file.name)!} 
                      alt={file.name}
                      className="w-12 h-12 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <Text className="text-sm font-medium truncate">
                      {file.name}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </Text>
                  </div>
                  
                  <button
                    onClick={() => removeFile(file.name)}
                    disabled={disabled}
                    className="p-1 hover:bg-slate-100 rounded transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </Flex>
              </div>
            ))}
          </Grid>

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            disabled={disabled}
            className="w-full"
          >
            Process ({files.length})
          </Button>
        </Stack>
      )}
    </Stack>
  )
}
