import React, { useState } from 'react'

interface PDFExportButtonProps {
  vehicleId: string
  question?: string
  explanationId?: string
  className?: string
}

export function PDFExportButton({ vehicleId, question, explanationId, className = '' }: PDFExportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExportPDF = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-pdf-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          question,
          explanationId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate PDF')
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `vehicle-report-${vehicleId}-${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('✅ PDF report downloaded successfully')

    } catch (err) {
      console.error('PDF export error:', err)
      setError(err instanceof Error ? err.message : 'Failed to export PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={handleExportPDF}
        disabled={isGenerating}
        className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export PDF
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 text-xs text-red-600 max-w-xs">
          {error}
        </div>
      )}
    </div>
  )
}

// Shareable link component for easy sharing
export function ShareablePDFLink({ vehicleId, question, className = '' }: { vehicleId: string, question?: string, className?: string }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateShareableLink = async () => {
    setIsGenerating(true)

    try {
      // In a real implementation, this would create a temporary shareable URL
      // For now, we'll just generate a direct PDF download link
      const baseUrl = window.location.origin
      const params = new URLSearchParams({
        vehicleId,
        ...(question && { question })
      })
      
      const shareableUrl = `${baseUrl}/api/generate-pdf-report?${params.toString()}`
      setShareUrl(shareableUrl)

      // Copy to clipboard
      await navigator.clipboard.writeText(shareableUrl)
      
    } catch (error) {
      console.error('Failed to generate shareable link:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={generateShareableLink}
        disabled={isGenerating}
        className={`inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 ${className}`}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Link...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share Link
          </>
        )}
      </button>

      {shareUrl && (
        <div className="mt-2 text-xs text-green-600">
          ✅ Link copied to clipboard
        </div>
      )}
    </div>
  )
}
