'use client'

/**
 * Insurance Card Scanner Component
 * 
 * Specialized component for scanning vehicle insurance cards
 * Uses the new processor architecture with VIN cross-reference
 */

import React, { useState } from 'react'
import { Container, Section, Stack, Card, Heading, Text, Button, Flex, Grid } from '@/components/design-system'
import { FileUpload } from '../../file-upload'
import { getDocumentProcessingService } from '../services/DocumentProcessingService'
import type { DocumentProcessingResult } from '../types/document'
import type { EnrichedInsuranceData } from '../processors/insurance-processor'
import { Shield, CheckCircle, XCircle, AlertTriangle, Car } from 'lucide-react'

export interface InsuranceCardScannerProps {
  /** Callback when insurance card is successfully scanned */
  onComplete?: (insurance: EnrichedInsuranceData) => void
  
  /** Callback for errors */
  onError?: (error: string) => void
  
  /** Enable camera capture */
  showCamera?: boolean
  
  /** Custom title */
  title?: string
  
  /** Custom description */
  description?: string
  
  /** Require active policy */
  requireActive?: boolean
  
  /** Cross-reference VIN with expected VIN */
  expectedVIN?: string
}

export function InsuranceCardScanner({
  onComplete,
  onError,
  showCamera = true,
  title = 'Scan Insurance Card',
  description = 'Upload or capture a photo of the vehicle insurance card',
  requireActive = true,
  expectedVIN
}: InsuranceCardScannerProps) {
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<DocumentProcessingResult<EnrichedInsuranceData> | null>(null)
  
  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return
    
    setProcessing(true)
    setResult(null)
    
    try {
      const service = getDocumentProcessingService()
      const processedResult = await service.processDocument(files[0], 'insurance')
      
      setResult(processedResult as DocumentProcessingResult<EnrichedInsuranceData>)
      
      if (processedResult.success) {
        const data = processedResult.data as EnrichedInsuranceData
        
        // Validation
        if (requireActive && !data.isActive) {
          onError?.('Insurance policy is not currently active')
        } else if (expectedVIN && data.vin && data.vin !== expectedVIN) {
          onError?.(`VIN mismatch: Expected ${expectedVIN}, found ${data.vin}`)
        } else {
          onComplete?.(data)
        }
      } else {
        onError?.(processedResult.error || 'Failed to scan insurance card')
      }
    } catch (error) {
      console.error('[InsuranceCardScanner] Error:', error)
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
            <Flex align="center" gap="sm">
              <Shield className="w-6 h-6 text-blue-600" />
              <Heading level="title">{title}</Heading>
            </Flex>
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
                helperText="Front or back of insurance card"
              />
            </Card>
          )}
          
          {/* Processing */}
          {processing && (
            <Card>
              <Flex justify="center" align="center" className="p-6">
                <Stack spacing="sm" className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                  <Text>Processing insurance card...</Text>
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
                        <Heading level="subtitle">Insurance Verified</Heading>
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
                    {/* Policy Status */}
                    <div className={`p-3 rounded border ${
                      result.data.isActive 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <Flex align="center" gap="sm">
                        <Shield className={`w-5 h-5 ${
                          result.data.isActive ? 'text-green-600' : 'text-red-600'
                        }`} />
                        <Stack spacing="xs">
                          <Text className="font-semibold">
                            {result.data.isActive ? 'Policy Active' : 'Policy Inactive'}
                          </Text>
                          {result.data.daysUntilExpiration !== undefined && result.data.daysUntilExpiration > 0 && (
                            <Text size="sm">
                              Expires in {result.data.daysUntilExpiration} days
                            </Text>
                          )}
                        </Stack>
                      </Flex>
                    </div>
                    
                    {/* Insurance Details */}
                    <Grid columns={2} gap="md">
                      <div>
                        <Text size="sm" className="text-gray-600">Carrier</Text>
                        <Text className="font-semibold">{result.data.carrier}</Text>
                      </div>
                      <div>
                        <Text size="sm" className="text-gray-600">Policy Number</Text>
                        <Text className="font-mono">{result.data.policyNumber}</Text>
                      </div>
                    </Grid>
                    
                    <div>
                      <Text size="sm" className="text-gray-600">Policyholder</Text>
                      <Text>{result.data.policyholderName}</Text>
                    </div>
                    
                    <Grid columns={2} gap="md">
                      <div>
                        <Text size="sm" className="text-gray-600">Effective Date</Text>
                        <Text>{new Date(result.data.effectiveDate).toLocaleDateString()}</Text>
                      </div>
                      <div>
                        <Text size="sm" className="text-gray-600">Expiration Date</Text>
                        <Text>{new Date(result.data.expirationDate).toLocaleDateString()}</Text>
                      </div>
                    </Grid>
                    
                    {/* Vehicle Info */}
                    {result.data.vehicle && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <Flex align="start" gap="sm">
                          <Car className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <Stack spacing="xs">
                            <Text className="font-semibold">
                              {result.data.vehicle.year} {result.data.vehicle.make} {result.data.vehicle.model}
                            </Text>
                            <Text size="sm" className="font-mono text-gray-600">
                              VIN: {result.data.vehicle.vin}
                            </Text>
                          </Stack>
                        </Flex>
                      </div>
                    )}
                    
                    {/* Coverage Details */}
                    {(result.data.coverageType || result.data.liabilityLimits) && (
                      <div>
                        <Text size="sm" className="text-gray-600">Coverage</Text>
                        {result.data.coverageType && (
                          <Text>{result.data.coverageType}</Text>
                        )}
                        {result.data.liabilityLimits && (
                          <Text size="sm" className="text-gray-600">
                            Limits: {result.data.liabilityLimits}
                          </Text>
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
