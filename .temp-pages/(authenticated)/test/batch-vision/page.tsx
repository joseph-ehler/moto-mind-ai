'use client'

/**
 * Batch Vision Scanner Test Page
 * 
 * Demonstrates FileUpload feeding the Vision system:
 * - Upload multiple VIN images from gallery
 * - Sequential camera capture
 * - Real-time progress tracking
 * - Enriched results display
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Section, Stack, Card, Heading, Text, Button } from '@/components/design-system'
import { BatchVisionScanner } from '@/components/design-system/utilities/vision'
import { vinValidation, confidenceScoring, vinDecoding } from '@/components/design-system/utilities/vision/plugins/examples'
import type { CaptureResult } from '@/components/design-system/utilities/vision/types'
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'

interface ScanSummary {
  totalScans: number
  successfulScans: number
  failedScans: number
  averageConfidence: number
  vins: string[]
  vehicles: Array<{ make?: string; model?: string; year?: number }>
}

export default function BatchVisionTestPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<ScanSummary | null>(null)
  const [results, setResults] = useState<CaptureResult[]>([])
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set())
  
  const toggleExpanded = (index: number) => {
    setExpandedResults(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }
  
  const handleComplete = (batchResults: CaptureResult[]) => {
    console.log('Batch processing complete:', batchResults)
    setResults(batchResults)
    
    // Calculate summary
    const successful = batchResults.filter(r => r.success)
    const failed = batchResults.filter(r => !r.success)
    const totalConfidence = successful.reduce((sum, r) => sum + (r.confidence || 0), 0)
    
    setSummary({
      totalScans: batchResults.length,
      successfulScans: successful.length,
      failedScans: failed.length,
      averageConfidence: successful.length > 0 ? totalConfidence / successful.length : 0,
      vins: successful.map(r => r.data?.vin || 'N/A'),
      vehicles: successful.map(r => ({
        make: r.data?.make,
        model: r.data?.model,
        year: r.data?.year
      }))
    })
  }
  
  const handleReset = () => {
    setSummary(null)
    setResults([])
  }
  
  return (
    <Container 
      size="xl"
      useCase="admin_dashboards"
      override={{
        reason: "Test page requires extra width for batch results display",
        approvedBy: "Development Team"
      }}
    >
      <Section spacing="lg">
        <Stack spacing="xl">
          {/* Header */}
          <Stack spacing="sm">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/test')}
              className="w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tests
            </Button>
            
            <Heading level="hero">Batch Vision Scanner Test</Heading>
            <Text>
              Test FileUpload → Vision System integration. Upload multiple VIN images
              and watch them process through the plugin pipeline with enrichment.
            </Text>
          </Stack>
          
          {/* Batch Scanner */}
          <Card>
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">Batch VIN Scanner</Heading>
                <Text>
                  Upload up to 10 VIN images from your gallery or capture them sequentially.
                  Each image will be validated, decoded, and enriched with vehicle data.
                </Text>
              </Stack>
              
              {!summary ? (
                <BatchVisionScanner
                  captureType="vin"
                  maxScans={10}
                  apiEndpoint="/api/vision/process-json"
                  plugins={[
                    vinValidation({
                      validateCheckDigit: true,
                      strictMode: false
                    }),
                    confidenceScoring({
                      minConfidence: 0.90,
                      maxRetries: 3
                    }),
                    vinDecoding({
                      apiProvider: 'nhtsa',  // ✅ Real NHTSA API
                      cacheResults: true,
                      timeout: 10000
                    })
                  ]}
                  onComplete={handleComplete}
                  title="Upload VIN Images"
                  description="Select images from your gallery or use camera"
                  showCamera={true}
                  cameraOverlay="vin"
                  processingMode="sequential"
                />
              ) : (
                <Stack spacing="md">
                  <Heading level="subtitle">Scan Complete! 🎉</Heading>
                  <Button onClick={handleReset}>Start New Batch</Button>
                </Stack>
              )}
            </Stack>
          </Card>
          
          {/* Summary Card */}
          {summary && (
            <Card>
              <Stack spacing="md">
                <Heading level="subtitle">Batch Summary</Heading>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Text size="sm" className="text-gray-600">Total Scans</Text>
                    <Text className="text-2xl font-bold">{summary.totalScans}</Text>
                  </div>
                  
                  <div>
                    <Text size="sm" className="text-gray-600">Successful</Text>
                    <Text className="text-2xl font-bold text-green-600">
                      {summary.successfulScans}
                    </Text>
                  </div>
                  
                  <div>
                    <Text size="sm" className="text-gray-600">Failed</Text>
                    <Text className="text-2xl font-bold text-red-600">
                      {summary.failedScans}
                    </Text>
                  </div>
                  
                  <div>
                    <Text size="sm" className="text-gray-600">Avg Confidence</Text>
                    <Text className="text-2xl font-bold">
                      {(summary.averageConfidence * 100).toFixed(0)}%
                    </Text>
                  </div>
                </div>
              </Stack>
            </Card>
          )}
          
          {/* Results Details */}
          {results.length > 0 && (
            <Card>
              <Stack spacing="md">
                <Heading level="subtitle">Detailed Results</Heading>
                
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-500">
                              Image {index + 1}
                            </span>
                            {result.success ? (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                Success
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                                Failed
                              </span>
                            )}
                          </div>
                          
                          {result.success && result.data && (
                            <div className="space-y-3">
                              {/* VIN */}
                              <div>
                                <Text size="sm" className="text-gray-500">VIN</Text>
                                <Text className="font-mono font-semibold">
                                  {result.data.vin || 'N/A'}
                                </Text>
                              </div>
                              
                              {/* Vehicle Identity */}
                              {(result.data.year || result.data.make || result.data.model) && (
                                <div>
                                  <Text size="sm" className="text-gray-500">Vehicle</Text>
                                  <Text className="font-semibold">
                                    {result.data.year} {result.data.make} {result.data.model}
                                    {result.data.trim && ` ${result.data.trim}`}
                                  </Text>
                                  {result.data.series && (
                                    <Text size="sm" className="text-gray-600">
                                      Series: {result.data.series}
                                    </Text>
                                  )}
                                </div>
                              )}
                              
                              {/* Specifications Grid */}
                              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                                {result.data.bodyType && (
                                  <div>
                                    <Text size="sm" className="text-gray-500">Body Type</Text>
                                    <Text size="sm" className="font-medium">{result.data.bodyType}</Text>
                                  </div>
                                )}
                                {result.data.engineType && (
                                  <div>
                                    <Text size="sm" className="text-gray-500">Engine</Text>
                                    <Text size="sm" className="font-medium">{result.data.engineType}</Text>
                                  </div>
                                )}
                                {result.data.transmission && (
                                  <div>
                                    <Text size="sm" className="text-gray-500">Transmission</Text>
                                    <Text size="sm" className="font-medium">{result.data.transmission}</Text>
                                  </div>
                                )}
                                {result.data.driveType && (
                                  <div>
                                    <Text size="sm" className="text-gray-500">Drive Type</Text>
                                    <Text size="sm" className="font-medium">{result.data.driveType}</Text>
                                  </div>
                                )}
                                {result.data.fuelType && (
                                  <div>
                                    <Text size="sm" className="text-gray-500">Fuel Type</Text>
                                    <Text size="sm" className="font-medium">{result.data.fuelType}</Text>
                                  </div>
                                )}
                                {result.data.doors && (
                                  <div>
                                    <Text size="sm" className="text-gray-500">Doors</Text>
                                    <Text size="sm" className="font-medium">{result.data.doors}</Text>
                                  </div>
                                )}
                              </div>
                              
                              {/* Manufacturing Info */}
                              {(result.data.manufacturer || result.data.plantCountry) && (
                                <div className="pt-2 border-t">
                                  <Text size="sm" className="text-gray-500">Manufacturing</Text>
                                  {result.data.manufacturer && (
                                    <Text size="sm">{result.data.manufacturer}</Text>
                                  )}
                                  {result.data.plantCountry && (
                                    <Text size="sm" className="text-gray-600">
                                      Made in {result.data.plantCountry}
                                      {result.data.plantCity && `, ${result.data.plantCity}`}
                                    </Text>
                                  )}
                                </div>
                              )}
                              
                              {/* Show All Data Toggle */}
                              <div className="pt-2 border-t">
                                <button
                                  onClick={() => toggleExpanded(index)}
                                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                >
                                  {expandedResults.has(index) ? (
                                    <>
                                      <ChevronUp className="w-4 h-4" />
                                      Hide All Data
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-4 h-4" />
                                      Show All Data ({Object.keys(result.data || {}).length} fields)
                                    </>
                                  )}
                                </button>
                                
                                {/* Raw Data View */}
                                {expandedResults.has(index) && result.data && (
                                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border overflow-auto max-h-96">
                                    <Text size="sm" className="font-mono text-xs whitespace-pre">
                                      {JSON.stringify(result.data, null, 2)}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {result.confidence != null && (
                          <div className="text-right">
                            <Text size="sm" className="text-gray-500">Confidence</Text>
                            <Text className="font-bold">
                              {(result.confidence * 100).toFixed(0)}%
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Stack>
            </Card>
          )}
          
          {/* Architecture Explanation */}
          <Card>
            <Stack spacing="md">
              <Heading level="subtitle">How It Works</Heading>
              
              <div className="space-y-4">
                <div>
                  <Text className="font-medium mb-2">1. File Acquisition (FileUpload)</Text>
                  <Text size="sm" className="text-gray-600">
                    FileUpload component provides drag & drop, gallery selection, and camera capture.
                    Handles UI, validation, and file management.
                  </Text>
                </div>
                
                <div>
                  <Text className="font-medium mb-2">2. Vision Processing (Service)</Text>
                  <Text size="sm" className="text-gray-600">
                    VisionProcessingService converts files to base64, calls the vision API,
                    and runs the plugin pipeline for each image.
                  </Text>
                </div>
                
                <div>
                  <Text className="font-medium mb-2">3. Plugin Enrichment (Pipeline)</Text>
                  <Text size="sm" className="text-gray-600">
                    Each result goes through VIN Validation → Confidence Scoring → VIN Decoding,
                    adding vehicle make, model, year, and full NHTSA data.
                  </Text>
                </div>
                
                <div>
                  <Text className="font-medium mb-2">4. Results Aggregation</Text>
                  <Text size="sm" className="text-gray-600">
                    BatchVisionScanner collects all results, calculates statistics,
                    and provides enriched data with full vehicle information.
                  </Text>
                </div>
              </div>
            </Stack>
          </Card>
        </Stack>
      </Section>
    </Container>
  )
}
