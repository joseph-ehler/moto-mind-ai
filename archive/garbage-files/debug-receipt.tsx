import React, { useState } from 'react'

export default function DebugReceiptPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsProcessing(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/debug-ocr', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setResult(data)

    } catch (error) {
      console.error('Upload error:', error)
      setResult({
        error: error instanceof Error ? error.message : 'Upload failed'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🔍 Debug Receipt OCR</h1>
          
          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Receipt Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Debug OCR'}
          </button>

          {/* Results */}
          {result && (
            <div className="mt-8 space-y-6">
              {result.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-900">Error</h3>
                  <p className="text-red-700 mt-1">{result.error}</p>
                </div>
              ) : (
                <>
                  {/* Tesseract Results */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">
                      📝 Tesseract OCR (Confidence: {result.tesseract?.confidence}%)
                    </h3>
                    <pre className="text-sm text-blue-800 whitespace-pre-wrap bg-white p-3 rounded border overflow-auto max-h-40">
                      {result.tesseract?.text || 'No text extracted'}
                    </pre>
                    <div className="mt-2 text-xs text-blue-700">
                      Length: {result.tesseract?.length} chars • 
                      Has "gallons": {result.comparison?.tesseract_has_gallons ? '✅' : '❌'} • 
                      Has "total": {result.comparison?.tesseract_has_total ? '✅' : '❌'}
                    </div>
                  </div>

                  {/* Vision Results */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-medium text-green-900 mb-2">
                      🤖 OpenAI Vision
                    </h3>
                    {result.vision?.error ? (
                      <div className="text-red-600 text-sm">
                        Error: {result.vision.error}
                      </div>
                    ) : (
                      <>
                        <pre className="text-sm text-green-800 whitespace-pre-wrap bg-white p-3 rounded border overflow-auto max-h-40">
                          {result.vision?.text || 'No text extracted'}
                        </pre>
                        <div className="mt-2 text-xs text-green-700">
                          Length: {result.vision?.length} chars • 
                          Has "gallons": {result.comparison?.vision_has_gallons ? '✅' : '❌'} • 
                          Has "total": {result.comparison?.vision_has_total ? '✅' : '❌'}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Raw JSON */}
                  <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <summary className="font-medium text-gray-900 cursor-pointer">
                      📄 Raw JSON Response
                    </summary>
                    <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
