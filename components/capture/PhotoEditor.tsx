/**
 * Photo Editor Component
 * 
 * Advanced photo editing with:
 * - Crop (with aspect ratio options)
 * - Rotate (90° increments + fine-tune)
 * - Brightness adjustment
 * - Blur tool (for license plates, addresses, etc.)
 */

'use client'

import React, { useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import { Stack, Flex, Text, Button, Heading } from '@/components/design-system'
import { 
  RotateCw, 
  Sun, 
  Droplet, 
  X, 
  Check, 
  Crop as CropIcon,
  Square,
  Maximize,
  Eraser
} from 'lucide-react'

interface PhotoEditorProps {
  imageUrl: string
  onSave: (editedBlob: Blob, editedUrl: string) => void
  onCancel: () => void
}

interface Point {
  x: number
  y: number
}

interface BlurRegion {
  x: number
  y: number
  width: number
  height: number
}

export function PhotoEditor({ imageUrl, onSave, onCancel }: PhotoEditorProps) {
  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  // Adjustment state
  const [brightness, setBrightness] = useState(100)
  
  // Blur tool state
  const [isBlurMode, setIsBlurMode] = useState(false)
  const [blurRegions, setBlurRegions] = useState<BlurRegion[]>([])
  const [currentBlurStart, setCurrentBlurStart] = useState<Point | null>(null)
  const [currentBlurEnd, setCurrentBlurEnd] = useState<Point | null>(null)
  
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blurContainerRef = useRef<HTMLDivElement>(null)

  // Active tool
  const [activeTool, setActiveTool] = useState<'crop' | 'rotate' | 'brightness' | 'blur'>('crop')

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  // Blur tool handlers
  const handleBlurMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isBlurMode || !blurContainerRef.current) return
    
    const rect = blurContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setCurrentBlurStart({ x, y })
    setCurrentBlurEnd({ x, y })
  }

  const handleBlurMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isBlurMode || !currentBlurStart || !blurContainerRef.current) return
    
    const rect = blurContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setCurrentBlurEnd({ x, y })
  }

  const handleBlurMouseUp = () => {
    if (!isBlurMode || !currentBlurStart || !currentBlurEnd) return
    
    // Add blur region
    const region: BlurRegion = {
      x: Math.min(currentBlurStart.x, currentBlurEnd.x),
      y: Math.min(currentBlurStart.y, currentBlurEnd.y),
      width: Math.abs(currentBlurEnd.x - currentBlurStart.x),
      height: Math.abs(currentBlurEnd.y - currentBlurStart.y)
    }
    
    if (region.width > 5 && region.height > 5) {
      setBlurRegions(prev => [...prev, region])
    }
    
    setCurrentBlurStart(null)
    setCurrentBlurEnd(null)
  }

  const handleClearBlurs = () => {
    setBlurRegions([])
  }

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      alert('Please adjust the crop area')
      return
    }

    try {
      // Load image
      const image = new Image()
      image.src = imageUrl
      await new Promise((resolve) => {
        image.onload = resolve
      })

      // Create canvas for final edited image
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Calculate dimensions
      const { width, height, x, y } = croppedAreaPixels
      canvas.width = width
      canvas.height = height

      // Apply rotation
      ctx.save()
      ctx.translate(width / 2, height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-width / 2, -height / 2)

      // Draw cropped image
      ctx.drawImage(
        image,
        x,
        y,
        width,
        height,
        0,
        0,
        width,
        height
      )

      ctx.restore()

      // Apply brightness filter
      if (brightness !== 100) {
        ctx.filter = `brightness(${brightness}%)`
        ctx.drawImage(canvas, 0, 0)
        ctx.filter = 'none'
      }

      // Apply blur regions
      if (blurRegions.length > 0) {
        blurRegions.forEach(region => {
          // Extract region
          const imageData = ctx.getImageData(region.x, region.y, region.width, region.height)
          
          // Apply heavy blur (pixelate effect)
          const blockSize = 15
          for (let y = 0; y < imageData.height; y += blockSize) {
            for (let x = 0; x < imageData.width; x += blockSize) {
              // Get average color of block
              let r = 0, g = 0, b = 0, count = 0
              
              for (let by = 0; by < blockSize && y + by < imageData.height; by++) {
                for (let bx = 0; bx < blockSize && x + bx < imageData.width; bx++) {
                  const i = ((y + by) * imageData.width + (x + bx)) * 4
                  r += imageData.data[i]
                  g += imageData.data[i + 1]
                  b += imageData.data[i + 2]
                  count++
                }
              }
              
              r = Math.floor(r / count)
              g = Math.floor(g / count)
              b = Math.floor(b / count)
              
              // Fill block with average color
              for (let by = 0; by < blockSize && y + by < imageData.height; by++) {
                for (let bx = 0; bx < blockSize && x + bx < imageData.width; bx++) {
                  const i = ((y + by) * imageData.width + (x + bx)) * 4
                  imageData.data[i] = r
                  imageData.data[i + 1] = g
                  imageData.data[i + 2] = b
                }
              }
            }
          }
          
          ctx.putImageData(imageData, region.x, region.y)
        })
      }

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create blob'))
          },
          'image/jpeg',
          0.92
        )
      })

      const editedUrl = URL.createObjectURL(blob)
      onSave(blob, editedUrl)
    } catch (error) {
      console.error('Error saving edited photo:', error)
      alert('Failed to save edits. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 border-b border-gray-700">
        <Flex align="center" justify="between">
          <Heading level="subtitle" className="text-white">
            Edit Photo
          </Heading>
          <Flex gap="sm">
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
          </Flex>
        </Flex>
      </div>

      {/* Tool Selector */}
      <div className="bg-gray-800 p-3 border-b border-gray-700">
        <Flex gap="sm" justify="center">
          <button
            onClick={() => {
              setActiveTool('crop')
              setIsBlurMode(false)
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTool === 'crop'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Flex align="center" gap="xs">
              <CropIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Crop</span>
            </Flex>
          </button>

          <button
            onClick={() => {
              setActiveTool('rotate')
              setIsBlurMode(false)
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTool === 'rotate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Flex align="center" gap="xs">
              <RotateCw className="w-4 h-4" />
              <span className="text-sm font-medium">Rotate</span>
            </Flex>
          </button>

          <button
            onClick={() => {
              setActiveTool('brightness')
              setIsBlurMode(false)
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTool === 'brightness'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Flex align="center" gap="xs">
              <Sun className="w-4 h-4" />
              <span className="text-sm font-medium">Brightness</span>
            </Flex>
          </button>

          <button
            onClick={() => {
              setActiveTool('blur')
              setIsBlurMode(true)
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTool === 'blur'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Flex align="center" gap="xs">
              <Droplet className="w-4 h-4" />
              <span className="text-sm font-medium">Blur</span>
            </Flex>
          </button>
        </Flex>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative overflow-hidden">
        {activeTool !== 'blur' ? (
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: {
                background: '#000'
              }
            }}
          />
        ) : (
          <div
            ref={blurContainerRef}
            className="relative w-full h-full flex items-center justify-center bg-black cursor-crosshair"
            onMouseDown={handleBlurMouseDown}
            onMouseMove={handleBlurMouseMove}
            onMouseUp={handleBlurMouseUp}
          >
            <img
              src={imageUrl}
              alt="Edit"
              className="max-w-full max-h-full object-contain"
              style={{ filter: `brightness(${brightness}%)` }}
            />
            
            {/* Blur regions overlay */}
            {blurRegions.map((region, index) => (
              <div
                key={index}
                className="absolute border-2 border-red-500 bg-red-500/20"
                style={{
                  left: region.x,
                  top: region.y,
                  width: region.width,
                  height: region.height
                }}
              />
            ))}
            
            {/* Current selection */}
            {currentBlurStart && currentBlurEnd && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/20"
                style={{
                  left: Math.min(currentBlurStart.x, currentBlurEnd.x),
                  top: Math.min(currentBlurStart.y, currentBlurEnd.y),
                  width: Math.abs(currentBlurEnd.x - currentBlurStart.x),
                  height: Math.abs(currentBlurEnd.y - currentBlurStart.y)
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 border-t border-gray-700">
        {activeTool === 'crop' && (
          <Stack spacing="sm">
            <Text className="text-gray-300 text-sm font-medium">Zoom</Text>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
            <Text className="text-gray-400 text-xs">
              Pinch or scroll to zoom. Drag to reposition.
            </Text>
          </Stack>
        )}

        {activeTool === 'rotate' && (
          <Stack spacing="sm">
            <Flex justify="center" gap="md">
              <Button
                onClick={handleRotate}
                className="bg-gray-700 hover:bg-gray-600 text-white"
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Rotate 90°
              </Button>
            </Flex>
            <Text className="text-gray-400 text-xs text-center">
              Current rotation: {rotation}°
            </Text>
          </Stack>
        )}

        {activeTool === 'brightness' && (
          <Stack spacing="sm">
            <Text className="text-gray-300 text-sm font-medium">
              Brightness: {brightness}%
            </Text>
            <input
              type="range"
              min={50}
              max={150}
              step={5}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full"
            />
            <Flex justify="between">
              <Text className="text-gray-400 text-xs">Darker</Text>
              <Text className="text-gray-400 text-xs">Brighter</Text>
            </Flex>
          </Stack>
        )}

        {activeTool === 'blur' && (
          <Stack spacing="sm">
            <Text className="text-gray-300 text-sm font-medium">
              Blur Tool {blurRegions.length > 0 && `(${blurRegions.length} regions)`}
            </Text>
            <Text className="text-gray-400 text-xs">
              Click and drag to select areas to blur (e.g., license plates, addresses)
            </Text>
            {blurRegions.length > 0 && (
              <Button
                onClick={handleClearBlurs}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
              >
                <Eraser className="w-4 h-4 mr-2" />
                Clear All Blurs
              </Button>
            )}
          </Stack>
        )}
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
