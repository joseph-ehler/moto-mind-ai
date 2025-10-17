'use client'

/**
 * Driver's License Scanner Component
 * 
 * Specialized component for scanning driver's licenses and state IDs
 * Uses the new processor architecture with DocumentProcessingService
 */

import React, { useState } from 'react'
import { Container, Section, Stack, Card, Heading, Text, Button, Flex } from '@/components/design-system'
import { FileUpload } from '../../file-upload'
import { getDocumentProcessingService } from '../services/DocumentProcessingService'
import type { DocumentProcessingResult } from '../types/document'
import type { EnrichedDriversLicenseData } from '../processors/drivers-license-processor'
import { Camera, Upload, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export interface DriversLicenseScannerProps {
  /** Callback when license is successfully scanned */
  onComplete?: (license: EnrichedDriversLicenseData) => void
  
  /** Callback for errors */
  onError?: (error: string) => void
  
  /** Enable camera capture */
  showCamera?: boolean
  
  /** Custom title */
  title?: string
  
  /** Custom description */
  description?: string
  
  /** Validate expiration automatically */
  validateExpiration?: boolean
  
  /** Minimum age requirement */
  minAge?: number
}

export function DriversLicenseScanner({
  onComplete,
  onError,
  showCamera = true,
  title = "Scan Driver's License",
  description = "Upload or capture a photo of a driver's license or state ID",
  validateExpiration = true,
  minAge
}: DriversLicenseScannerProps) {
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<DocumentProcessingResult<EnrichedDriversLicenseData> | null>(null)
  
  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return
    
    setProcessing(true)
    setResult(null)
    
    try {
      const service = getDocumentProcessingService()
      const processedResult = await service.processDocument(files[0], 'drivers-license')
      
      setResult(processedResult as DocumentProcessingResult<EnrichedDriversLicenseData>)
      
      if (processedResult.success) {
        // Additional validation
        const data = processedResult.data as EnrichedDriversLicenseData
        
        if (validateExpiration && data.isExpired) {
          onError?.('License is expired')
        } else if (minAge && data.age && data.age < minAge) {
          onError?.(`License holder must be at least ${minAge} years old`)
        } else {
          onComplete?.(data)
        }
      } else {
        onError?.(processedResult.error || 'Failed to scan license')
      }
    } catch (error) {
      console.error('[DriversLicenseScanner] Error:', error)
      onError?.(error instanceof Error ? error.message : 'Scan failed')
    } finally {
      setProcessing(false)
    }
  }
  
  const handleReset = () => {
    setResult(null)
  }
  
  return (
    <Container size="md" useCase="forms">
      <Section spacing="md">
        <Stack spacing="lg">
          {/* Header */}
          <Stack spacing="sm">
            <Heading level="title">{title}</Heading>
            <Text size="sm" className="text-gray-600">
              {description}
            </Text>
          </Stack>
          
          {/* Upload/Camera */}
          {!result && (
            <Card>
              <FileUpload
                onChange={handleFileSelected}
                accept="image/*"
                multiple={false}
                maxFiles={1}
                disabled={processing}
                helperText="Clear, well-lit photo works best"
              />
            </Card>
          )}
          
          {/* Processing */}
          {processing && (
            <Card>
              <Flex justify="center" align="center" className="p-6">
                <Stack spacing="sm" className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                  <Text>Processing license...</Text>
                </Stack>
              </Flex>
            </Card>
          )}
          
          {/* Results */}
          {result && (
            <Card>
              <Stack spacing="md">
                <Flex justify="between" align="center">
                  <Flex align="center" gap="sm">
                    {result.success ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <Heading level="subtitle">License Scanned</Heading>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <Heading level="subtitle">Scan Failed</Heading>
                      </>
                    )}
                  </Flex>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    Scan Another
                  </Button>
                </Flex>
                
                {result.success && result.data && (
                  <Stack spacing="md">
                    {/* Personal Info */}
                    <div>
                      <Text size="sm" className="text-gray-600">Name</Text>
                      <Text className="font-semibold">
                        {result.data.firstName} {result.data.middleName && `${result.data.middleName} `}{result.data.lastName}
                      </Text>
                    </div>
                    
                    <Flex gap="md">
                      <div className="flex-1">
                        <Text size="sm" className="text-gray-600">License Number</Text>
                        <Text className="font-mono">{result.data.licenseNumber}</Text>
                      </div>
                      <div className="flex-1">
                        <Text size="sm" className="text-gray-600">State</Text>
                        <Text>{result.data.state}</Text>
                      </div>
                    </Flex>
                    
                    <Flex gap="md">
                      <div className="flex-1">
                        <Text size="sm" className="text-gray-600">Date of Birth</Text>
                        <Text>{new Date(result.data.dateOfBirth).toLocaleDateString()}</Text>
                        {result.data.age && (
                          <Text size="sm" className="text-gray-500">Age: {result.data.age}</Text>
                        )}
                      </div>
                      <div className="flex-1">
                        <Text size="sm" className="text-gray-600">Expiration</Text>
                        <Text>{new Date(result.data.expirationDate).toLocaleDateString()}</Text>
                        {result.data.isExpired && (
                          <Text size="sm" className="text-red-600">Expired</Text>
                        )}
                        {!result.data.isExpired && result.data.daysUntilExpiration && (
                          <Text size="sm" className="text-gray-500">
                            {result.data.daysUntilExpiration} days remaining
                          </Text>
                        )}
                      </div>
                    </Flex>
                    
                    {result.data.address && (
                      <div>
                        <Text size="sm" className="text-gray-600">Address</Text>
                        <Text>{result.data.address}</Text>
                        {result.data.city && result.data.zipCode && (
                          <Text>{result.data.city}, {result.data.state} {result.data.zipCode}</Text>
                        )}
                      </div>
                    )}
                    
                    {/* Warnings */}
                    {result.validation.warnings && result.validation.warnings.length > 0 && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                        <Flex align="start" gap="sm">
                          <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                          <Stack spacing="xs">
                            {result.validation.warnings.map((warning: string, i: number) => (
                              <Text key={i} size="sm" className="text-orange-800">
                                {warning}
                              </Text>
                            ))}
                          </Stack>
                        </Flex>
                      </div>
                    )}
                  </Stack>
                )}
                
                {!result.success && result.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <Text size="sm" className="text-red-800">{result.error}</Text>
                  </div>
                )}
              </Stack>
            </Card>
          )}
        </Stack>
      </Section>
    </Container>
  )
}
