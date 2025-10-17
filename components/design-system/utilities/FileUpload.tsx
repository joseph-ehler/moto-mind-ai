'use client'

import * as React from 'react'
import { Upload, X, File, Image as ImageIcon, FileText, AlertCircle, Check, Grid3x3, List, Maximize2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Stack, Flex } from './Layout'
import { Button } from '@/components/ui/button'
import { useIsMobile, useIsTouch } from './Search'

// ============================================================================
// ENHANCED FILE UPLOAD - MotoMind patterns
// ============================================================================

export type FileUploadVariant = 'gallery' | 'sidebar' | 'inline' | 'mobile' | 'auto'

export interface FileUploadProps {
  /** File Upload ID */
  id?: string
  /** Label text */
  label?: string
  /** Description text shown below label */
  description?: string
  /** Helper text shown below upload area */
  helperText?: string
  /** Error message (shows error state) */
  error?: string
  /** Success message (shows success state) */
  success?: string
  /** Warning message (shows warning state) */
  warning?: string
  /** Accepted file types (e.g., "image/*", ".pdf", etc.) */
  accept?: string
  /** Allow multiple files */
  multiple?: boolean
  /** Maximum file size in bytes */
  maxSize?: number
  /** Maximum number of files */
  maxFiles?: number
  /** Current files */
  value?: File[]
  /** Change handler */
  onChange?: (files: File[]) => void
  /** Disabled state */
  disabled?: boolean
  /** Required field */
  required?: boolean
  /** Show preview for images */
  showPreview?: boolean
  /** Variant: gallery (default), sidebar, inline, mobile, or auto (responsive) */
  variant?: FileUploadVariant
  /** Additional className */
  className?: string
}

/**
 * Enhanced FileUpload - Drag & drop file upload with MotoMind patterns
 * 
 * Features:
 * - Drag & drop or click to upload
 * - Image preview
 * - File validation (type, size, count)
 * - Multiple file support
 * - Remove files
 * - Validation states
 * 
 * @example
 * <FileUpload
 *   label="Vehicle Photos"
 *   accept="image/*"
 *   multiple
 *   maxSize={5242880} // 5MB
 *   maxFiles={10}
 *   value={files}
 *   onChange={setFiles}
 *   showPreview
 * />
 */
export function FileUpload({
  id,
  label,
  description,
  helperText,
  error,
  success,
  warning,
  accept = '*',
  multiple = false,
  maxSize = 10485760, // 10MB default
  maxFiles = 10,
  value = [],
  onChange,
  disabled,
  required,
  showPreview = true,
  variant = 'auto',
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [currentVariant, setCurrentVariant] = React.useState<FileUploadVariant>(variant)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const uploadId = id || React.useId()

  // Auto-detect variant based on container size
  const containerRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (variant !== 'auto') {
      setCurrentVariant(variant)
      return
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width
      if (width < 400) {
        setCurrentVariant('mobile')
      } else if (width < 600) {
        setCurrentVariant('inline')
      } else if (width < 800) {
        setCurrentVariant('sidebar')
      } else {
        setCurrentVariant('gallery')
      }
    })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [variant])

  // Cleanup object URLs on unmount to prevent memory leaks
  const previewUrlsRef = React.useRef<Set<string>>(new Set())
  React.useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
      previewUrlsRef.current.clear()
    }
  }, [])

  const createPreviewUrl = React.useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    previewUrlsRef.current.add(url)
    return url
  }, [])

  const revokePreviewUrl = React.useCallback((url: string) => {
    URL.revokeObjectURL(url)
    previewUrlsRef.current.delete(url)
  }, [])

  // Determine validation state
  const validationState = error ? 'error' : success ? 'success' : warning ? 'warning' : 'default'
  const validationMessage = error || success || warning

  const messageClasses = {
    default: 'text-muted-foreground',
    error: 'text-red-600',
    success: 'text-green-600',
    warning: 'text-amber-600'
  }

  const borderClasses = {
    default: 'border-black/10',
    error: 'border-red-500',
    success: 'border-green-500',
    warning: 'border-amber-500'
  }

  const handleDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = React.useCallback(() => {
    setIsDragging(false)
  }, [])

  const validateFile = React.useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" exceeds ${formatFileSize(maxSize)}`
    }

    // Check file type if accept is specified
    if (accept !== '*') {
      const acceptedTypes = accept.split(',').map(t => t.trim())
      const fileType = file.type
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', ''))
        }
        return type === fileExt || type === fileType
      })

      if (!isAccepted) {
        return `File type "${fileType}" not accepted`
      }
    }

    return null
  }, [maxSize, accept])

  const handleFiles = React.useCallback((newFiles: FileList | null) => {
    if (!newFiles || disabled) return

    const filesArray = Array.from(newFiles)
    const validFiles: File[] = []
    const errors: string[] = []

    // Validate each file
    for (const file of filesArray) {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    }

    // Check if adding would exceed maxFiles
    if (value.length + validFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
    }

    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...value, ...validFiles] : validFiles
      onChange?.(updatedFiles)
    }

    // Show errors if any
    if (errors.length > 0) {
      console.error('File upload errors:', errors)
    }
  }, [disabled, validateFile, value, maxFiles, multiple, onChange])

  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset input value to allow re-uploading the same file
    e.target.value = ''
  }, [handleFiles])

  const removeFile = React.useCallback((index: number) => {
    const newFiles = value.filter((_, i) => i !== index)
    onChange?.(newFiles)
  }, [value, onChange])

  const formatFileSize = React.useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }, [])

  const getFileIcon = React.useCallback((file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="h-5 w-5" />
    if (file.type === 'application/pdf') return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }, [])

  const isImage = React.useCallback((file: File) => file.type.startsWith('image/'), [])

  // Render file item based on variant
  const renderFileItem = (file: File, index: number) => {
    const isImg = isImage(file)
    
    if (currentVariant === 'mobile') {
      return (
        <div key={`${file.name}-${index}`} className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 hover:border-slate-300 transition-colors">
          {showPreview && isImg ? (
            <img
              src={createPreviewUrl(file)}
              alt={file.name}
              className="h-8 w-8 object-cover rounded"
            />
          ) : (
            <div className="h-8 w-8 flex items-center justify-center bg-slate-50 rounded">
              {getFileIcon(file)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{file.name}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeFile(index)}
            disabled={disabled}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )
    }

    if (currentVariant === 'inline' || currentVariant === 'sidebar') {
      return (
        <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
          {showPreview && isImg ? (
            <img
              src={createPreviewUrl(file)}
              alt={file.name}
              className="h-12 w-12 object-cover rounded"
            />
          ) : (
            <div className="h-12 w-12 flex items-center justify-center bg-slate-50 rounded border border-slate-200">
              {getFileIcon(file)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeFile(index)}
            disabled={disabled}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )
    }

    // Gallery variant (default)
    return (
      <div key={`${file.name}-${index}`} className="relative group">
        <div className="aspect-square rounded-lg border-2 border-slate-200 overflow-hidden bg-white hover:border-primary/50 hover:shadow-md transition-all">
          {showPreview && isImg ? (
            <img
              src={createPreviewUrl(file)}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-50">
              {getFileIcon(file)}
              <p className="text-xs font-medium mt-2 text-center line-clamp-2">{file.name}</p>
            </div>
          )}
        </div>
        {showPreview && isImg && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-xs text-white font-medium truncate">{file.name}</p>
          </div>
        )}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => removeFile(index)}
          disabled={disabled}
          className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </Button>
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
          {formatFileSize(file.size)}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={className}>
      <Stack spacing="sm">
        {/* Header with Label */}
        {(label || description) && (
          <div className="mb-2">
            {label && (
              <Label htmlFor={uploadId}>
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        )}

        {/* Upload Area */}
        <div
          className={cn(
            'relative border-2 border-dashed rounded-xl transition-all duration-200',
            isDragging && 'border-primary bg-primary/5 scale-[1.02]',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'cursor-pointer hover:border-primary/50 hover:bg-slate-50/50',
            borderClasses[validationState],
            value.length > 0 ? 'p-4' : 'p-8'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            id={uploadId}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
            aria-invalid={!!error}
            aria-describedby={
              validationMessage ? `${uploadId}-message` : 
              helperText ? `${uploadId}-helper` : 
              undefined
            }
          />

          {value.length === 0 ? (
            // Empty state - varies by variant
            currentVariant === 'mobile' ? (
              <div className="text-center py-3">
                <Upload className="mx-auto h-6 w-6 text-primary mb-2" />
                <p className="text-xs font-medium">Tap to upload</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max {formatFileSize(maxSize)}
                </p>
              </div>
            ) : currentVariant === 'inline' ? (
              <div className="flex items-center gap-3 py-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">Click or drop files</p>
                  <p className="text-xs text-muted-foreground">
                    {accept !== '*' && `${accept} • `}Max {formatFileSize(maxSize)}
                  </p>
                </div>
              </div>
            ) : currentVariant === 'sidebar' ? (
              <div className="space-y-3 py-4">
                <div className="w-12 h-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">Drop files or click</p>
                  <p className="text-xs text-muted-foreground">
                    {accept !== '*' && `${accept.replace(/,/g, ', ')}`}
                    {accept !== '*' && <br />}
                    Max {formatFileSize(maxSize)}
                  </p>
                </div>
              </div>
            ) : (
              // Gallery variant (default)
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <p className="text-base font-semibold mb-1">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  {accept !== '*' && (
                    <span className="font-medium">{accept.replace(/,/g, ', ')}</span>
                  )}
                  {accept !== '*' && ' • '}
                  Max {formatFileSize(maxSize)}
                  {multiple && ` • Up to ${maxFiles} files`}
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-2">
              <Upload className="inline-block h-5 w-5 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">
                Click or drop to add more files ({value.length}/{maxFiles})
              </span>
            </div>
          )}
        </div>

        {/* File List */}
        {value.length > 0 && (
          <div className="mt-3">
            <div className={cn(
              currentVariant === 'gallery' && 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3',
              (currentVariant === 'inline' || currentVariant === 'sidebar') && 'space-y-2',
              currentVariant === 'mobile' && 'space-y-1.5'
            )}>
              {value.map((file, index) => renderFileItem(file, index))}
            </div>

            {/* Summary */}
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>{value.length} file{value.length !== 1 && 's'} • {formatFileSize(value.reduce((sum, f) => sum + f.size, 0))} total</span>
              {value.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange?.([])}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

        {/* Helper Text or Validation Message */}
        {(validationMessage || helperText) && (
          <div className="min-h-[20px]">
            {validationMessage && (
              <Flex align="center" gap="xs">
                {error && <AlertCircle className="h-3 w-3 text-red-600" />}
                <p id={`${uploadId}-message`} className={cn('text-xs', messageClasses[validationState])}>
                  {validationMessage}
                </p>
              </Flex>
            )}
            {!validationMessage && helperText && (
              <p id={`${uploadId}-helper`} className="text-xs text-muted-foreground">
                {helperText}
              </p>
            )}
          </div>
        )}
      </Stack>
    </div>
  )
}
