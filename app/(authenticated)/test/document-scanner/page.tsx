'use client'

/**
 * Document Scanner Test Page
 * 
 * Demonstrates the new processor-based architecture
 * Single unified interface for all document types
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Container, Section, Stack, Card, Heading, Text, Button, Flex, Grid } from '@/components/design-system'
import { FileUpload } from '@/components/design-system/utilities/file-upload'
import { getDocumentProcessingService, registerAllProcessors, type ProcessorDocumentType as DocumentType, type DocumentProcessingResult } from '@/components/design-system/utilities/vision'
import { ArrowLeft, FileText, Check, X } from 'lucide-react'

export default function DocumentScannerTestPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<DocumentType>('vin')
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<DocumentProcessingResult[]>([])
  
  // Initialize processors on mount
  useEffect(() => {
    registerAllProcessors()
  }, [])
  
  const documentTypes: { type: DocumentType; label: string; icon: string }[] = [
    { type: 'vin', label: 'VIN', icon: '🚗' },
    { type: 'license-plate', label: 'License Plate', icon: '🔢' },
    { type: 'odometer', label: 'Odometer', icon: '⏱️' },
    { type: 'insurance', label: 'Insurance Card', icon: '📋' },
    { type: 'drivers-license', label: "Driver's License", icon: '🪪' },
  ]
  
  const handleFilesSelected = async (files: File[]) => {
    setProcessing(true)
    setResults([])
    
    try {
      const service = getDocumentProcessingService()
      
      // Process all files
      const newResults: DocumentProcessingResult[] = []
      for (const file of files) {
        try {
          const result = await service.processDocument(file, selectedType)
          newResults.push(result)
        } catch (error) {
          console.error('Processing error:', error)
          newResults.push({
            success: false,
            type: selectedType,
            data: {},
            validation: {
              valid: false,
              errors: [error instanceof Error ? error.message : 'Unknown error']
            },
            confidence: 0,
            processingTimeMs: 0,
            processedAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      setResults(newResults)
    } finally {
      setProcessing(false)
    }
  }
  
  const handleReset = () => {
    setResults([])
  }
  
  const stats = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    avgConfidence: results.length > 0 
      ? results.filter(r => r.success).reduce((sum, r) => sum + r.confidence, 0) / results.filter(r => r.success).length
      : 0
  }
  
  return (
    <Container 
      size="xl"
      useCase="admin_dashboards"
      override={{
        reason: "Test page requires extra width for document results",
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
            
            <Heading level="hero">Document Scanner (Processor Architecture)</Heading>
            <Text>
              Test the new unified document processing architecture. Select a document type, 
              upload images, and watch the processor pipeline in action.
            </Text>
          </Stack>
          
          {/* Document Type Selector */}
          <Card>
            <Stack spacing="md">
              <Heading level="subtitle">Select Document Type</Heading>
              
              <Grid columns="auto" gap="md">
                {documentTypes.map(({ type, label, icon }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      selectedType === type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{icon}</div>
                    <Text size="sm" className="font-medium">{label}</Text>
                  </button>
                ))}
              </Grid>
            </Stack>
          </Card>
          
          {/* Upload Area */}
          <Card>
            <Stack spacing="md">
              <Heading level="subtitle">Upload Documents</Heading>
              
              {results.length === 0 ? (
                <FileUpload
                  onChange={handleFilesSelected}
                  accept="image/*"
                  multiple={true}
                  maxFiles={10}
                  helperText={`Upload ${selectedType} images to process`}
                  disabled={processing}
                />
              ) : (
                <Button onClick={handleReset}>
                  Process More Documents
                </Button>
              )}
              
              {processing && (
                <Text className="text-center text-gray-600">
                  Processing documents...
                </Text>
              )}
            </Stack>
          </Card>
          
          {/* Results Summary */}
          {results.length > 0 && (
            <Card>
              <Stack spacing="md">
                <Heading level="subtitle">Results Summary</Heading>
                
                <Grid columns={4} gap="md">
                  <div>
                    <Text size="sm" className="text-gray-600">Total</Text>
                    <Text className="text-2xl font-bold">{stats.total}</Text>
                  </div>
                  <div>
                    <Text size="sm" className="text-gray-600">Successful</Text>
                    <Text className="text-2xl font-bold text-green-600">{stats.successful}</Text>
                  </div>
                  <div>
                    <Text size="sm" className="text-gray-600">Failed</Text>
                    <Text className="text-2xl font-bold text-red-600">{stats.failed}</Text>
                  </div>
                  <div>
                    <Text size="sm" className="text-gray-600">Avg Confidence</Text>
                    <Text className="text-2xl font-bold">
                      {(stats.avgConfidence * 100).toFixed(0)}%
                    </Text>
                  </div>
                </Grid>
              </Stack>
            </Card>
          )}
          
          {/* Detailed Results */}
          {results.length > 0 && (
            <Card>
              <Stack spacing="md">
                <Heading level="subtitle">Detailed Results</Heading>
                
                <Stack spacing="md">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg"
                    >
                      <Flex justify="between" align="start">
                        <Stack spacing="sm">
                          <Flex align="center" gap="sm">
                            <Text className="font-medium">Document {index + 1}</Text>
                            {result.success ? (
                              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                <Check className="w-3 h-3 mr-1" />
                                Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                <X className="w-3 h-3 mr-1" />
                                Failed
                              </span>
                            )}
                          </Flex>
                          
                          {result.success && (
                            <div className="pl-4 border-l-2 border-gray-200">
                              <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto max-h-48">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          {!result.success && result.error && (
                            <Text size="sm" className="text-red-600">
                              Error: {result.error}
                            </Text>
                          )}
                          
                          {result.validation.warnings && result.validation.warnings.length > 0 && (
                            <div className="mt-2">
                              <Text size="sm" className="text-orange-600 font-medium">Warnings:</Text>
                              {result.validation.warnings.map((warning, i) => (
                                <Text key={i} size="sm" className="text-orange-600">
                                  • {warning}
                                </Text>
                              ))}
                            </div>
                          )}
                        </Stack>
                        
                        <div className="text-right">
                          <Text size="sm" className="text-gray-500">Confidence</Text>
                          <Text className="font-bold">
                            {(result.confidence * 100).toFixed(0)}%
                          </Text>
                          <Text size="xs" className="text-gray-500 mt-1">
                            {result.processingTimeMs}ms
                          </Text>
                        </div>
                      </Flex>
                    </div>
                  ))}
                </Stack>
              </Stack>
            </Card>
          )}
          
          {/* Architecture Info */}
          <Card>
            <Stack spacing="md">
              <Heading level="subtitle">Architecture Benefits</Heading>
              
              <Grid columns={2} gap="md">
                <div>
                  <Text className="font-medium mb-2">✅ Unified Processing</Text>
                  <Text size="sm" className="text-gray-600">
                    Single service handles all document types with consistent pipeline
                  </Text>
                </div>
                <div>
                  <Text className="font-medium mb-2">🔌 Extensible</Text>
                  <Text size="sm" className="text-gray-600">
                    Add new document types by implementing DocumentProcessor interface
                  </Text>
                </div>
                <div>
                  <Text className="font-medium mb-2">🎯 Type-Safe</Text>
                  <Text size="sm" className="text-gray-600">
                    Full TypeScript support with generics for data structures
                  </Text>
                </div>
                <div>
                  <Text className="font-medium mb-2">🧩 Modular</Text>
                  <Text size="sm" className="text-gray-600">
                    Each processor encapsulates its own logic, prompts, and validation
                  </Text>
                </div>
              </Grid>
            </Stack>
          </Card>
        </Stack>
      </Section>
    </Container>
  )
}
