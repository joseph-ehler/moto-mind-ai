'use client'

import { useState } from 'react'
import { X, ZoomIn, Download, Maximize2 } from 'lucide-react'
import { Card } from '@/components/design-system'
import { FilePreview, type PreviewFile } from '@/components/design-system/utilities/FilePreview'
import Image from 'next/image'

interface ReceiptImageViewerProps {
  imageUrl: string
  stationName?: string
}

export function ReceiptImageViewer({ imageUrl, stationName }: ReceiptImageViewerProps) {
  const [showPreview, setShowPreview] = useState(false)

  const handleDownload = async (file: PreviewFile) => {
    try {
      const response = await fetch(file.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `receipt-${stationName || 'unknown'}-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  return (
    <>
      {/* Preview Card */}
      <Card className="overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">📷 Receipt Photo</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="View full size"
              >
                <Maximize2 className="w-4 h-4" />
                <span>View Full Size</span>
              </button>
            </div>
          </div>

          {/* Receipt Image Preview */}
          <button
            onClick={() => setShowPreview(true)}
            className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden cursor-pointer group transition-all duration-200 hover:shadow-lg"
          >
            <Image
              src={imageUrl}
              alt="Receipt"
              fill
              className="object-contain transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 600px"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 px-4 py-2.5 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-gray-700" />
                  <p className="text-sm font-semibold text-gray-900">Click to expand</p>
                </div>
              </div>
            </div>
          </button>
        </div>
      </Card>

      {/* FilePreview Modal */}
      {showPreview && (
        <FilePreview
          files={[
            {
              id: 'receipt-preview',
              name: `Receipt${stationName ? ` - ${stationName}` : ''}`,
              type: 'image',
              url: imageUrl,
              uploadedAt: new Date(),
            }
          ]}
          modal={true}
          onClose={() => setShowPreview(false)}
          onDownload={handleDownload}
        />
      )}
    </>
  )
}
