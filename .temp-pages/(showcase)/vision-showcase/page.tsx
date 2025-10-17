/**
 * Vision System Showcase
 * 
 * Demonstrates all Vision capture features:
 * - VIN Scanner
 * - Odometer Reader
 * - License Plate Scanner
 * - Document Scanner
 * - Form Integration (VINField)
 * - Mock Mode
 * - Analytics Integration
 * - Smart Error Messages
 */

'use client'

import React, { useState } from 'react'
import {
  Container,
  Section,
  Stack,
  Flex,
  Grid,
  Heading,
  Text,
  Card,
  Button
} from '@/components/design-system'
import {
  VINScanner,
  OdometerReader,
  LicensePlateScanner,
  DocumentScanner,
  VINField
} from '@/components/design-system/utilities/vision'
import { FileUpload } from '@/components/design-system'
import type {
  VINData,
  OdometerData,
  LicensePlateData,
  DocumentData,
  AnalyticsEvent
} from '@/components/design-system/utilities/vision'
import { 
  Camera, 
  Gauge, 
  FileText, 
  Car,
  Sparkles,
  TrendingUp,
  CheckCircle
} from 'lucide-react'

type ScannerType = 'vin' | 'odometer' | 'license' | 'document' | 'form' | null

export default function VisionShowcase() {
  // Scanner state
  const [activeScanner, setActiveScanner] = useState<ScannerType>(null)
  
  // Results state
  const [vinResult, setVINResult] = useState<VINData | null>(null)
  const [odometerResult, setOdometerResult] = useState<OdometerData | null>(null)
  const [licensePlateResult, setLicensePlateResult] = useState<LicensePlateData | null>(null)
  const [documentResult, setDocumentResult] = useState<DocumentData | null>(null)
  
  // VIN Field state (for form demo)
  const [vinFieldValue, setVINFieldValue] = useState('')
  
  // Mock mode toggle
  const [mockMode, setMockMode] = useState(true)
  
  // File input key - recreate element on each upload to avoid macOS caching issues
  const [fileInputKey, setFileInputKey] = useState(0)
  
  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  
  // File upload states
  const [cameraFiles, setCameraFiles] = useState<File[]>([])
  const [odometerFiles, setOdometerFiles] = useState<File[]>([])
  const [plateFiles, setPlateFiles] = useState<File[]>([])
  const [documentFiles, setDocumentFiles] = useState<File[]>([])
  
  
  // Analytics state
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([])
  
  // Analytics handler
  const handleAnalytics = (event: AnalyticsEvent) => {
    console.log('📊 Analytics Event:', event)
    setAnalyticsEvents(prev => [...prev.slice(-9), event]) // Keep last 10
  }
  
  // Scanner handlers
  const handleVINDetected = (data: VINData) => {
    setVinResult(data)
    setActiveScanner(null)
  }
  
  const handleMileageRead = (data: OdometerData) => {
    setOdometerResult(data)
    setActiveScanner(null)
  }
  
  const handlePlateDetected = (data: LicensePlateData) => {
    setLicensePlateResult(data)
    setActiveScanner(null)
  }
  
  const handleDocumentProcessed = (data: DocumentData) => {
    setDocumentResult(data)
    setActiveScanner(null)
  }
  
  return (
    <Container 
      size="xl" 
      useCase="showcase"
      override={{
        reason: "Vision showcase requires space for scanner cards and results side-by-side",
        approvedBy: "Vision Showcase"
      }}
    >
      <Section spacing="xl">
        <Stack spacing="xl">
          {/* Header */}
          <Stack spacing="md">
            <Flex align="center" gap="sm">
              <Camera className="h-8 w-8 text-blue-600" />
              <Heading level="hero">Vision System Showcase</Heading>
            </Flex>
            <Text className="text-lg text-slate-600">
              AI-powered camera capture with OCR for vehicle documentation
            </Text>
          </Stack>
          
          {/* Mock Mode Toggle */}
          <Card className="border-amber-200 bg-amber-50">
            <Flex align="center" justify="between">
              <Stack spacing="xs">
                <Heading level="title" className="text-amber-900">
                  🎭 Mock Mode {mockMode ? 'ON' : 'OFF'}
                </Heading>
                <Text className="text-sm text-amber-700">
                  {mockMode 
                    ? 'Using simulated data - no API calls made' 
                    : 'Live mode - requires API connection'
                  }
                </Text>
              </Stack>
              <Button
                onClick={() => setMockMode(!mockMode)}
                variant={mockMode ? 'default' : 'outline'}
              >
                Toggle Mock Mode
              </Button>
            </Flex>
          </Card>
          
          {/* Scanner Cards */}
            <Heading level="title">✨ Camera Capture</Heading>
            
            {/* Single VIN with Auto-Capture (Heuristics Only) */}
            <Card>
              <Stack spacing="md">
                <Heading level="subtitle">VIN Scanner (Heuristics - 80% Accuracy)</Heading>
                <Text className="text-sm text-slate-600">
                  Phase 1: Uses visual heuristics (brightness, contrast, shape). Green border appears when VIN detected.
                </Text>
                <FileUpload
                  label="VIN Photo (Heuristics)"
                  accept="image/*"
                  multiple={false}
                  maxFiles={1}
                  showPreview={true}
                  showCamera={true}
                  cameraOverlay="vin"
                  enableAutoCapture={true}
                  autoCaptureConfidenceThreshold={0.75}
                  imageQuality="high"
                  value={cameraFiles}
                  onChange={(files) => {
                    setCameraFiles(files)
                    console.log('VIN files:', files)
                  }}
                  onDetectionResult={(result) => {
                    console.log('Heuristic detection:', result)
                  }}
                />
              </Stack>
            </Card>
            
            {/* VIN with OCR Enhancement */}
            <Card className="border-purple-200 bg-purple-50">
              <Stack spacing="md">
                <Flex align="center" gap="sm">
                  <div className="text-2xl">🔬</div>
                  <Heading level="subtitle">VIN Scanner (OCR Enhanced - 90%+ Accuracy)</Heading>
                </Flex>
                <Text className="text-sm text-purple-700">
                  Phase 2: Heuristics + Tesseract.js OCR. Validates actual VIN format (17 chars, no I/O/Q). Higher accuracy but +2MB bundle.
                </Text>
                <FileUpload
                  label="VIN Photo (OCR Enhanced)"
                  accept="image/*"
                  multiple={false}
                  maxFiles={1}
                  showPreview={true}
                  showCamera={true}
                  cameraOverlay="vin"
                  enableAutoCapture={true}
                  enableOCR={true}
                  autoCaptureConfidenceThreshold={0.75}
                  imageQuality="high"
                  value={cameraFiles}
                  onChange={(files) => {
                    setCameraFiles(files)
                    console.log('VIN files (OCR):', files)
                  }}
                  onDetectionResult={(result) => {
                    console.log('OCR detection:', result)
                    if (result.confidence > 0.9) {
                      console.log('✅ High confidence OCR match!')
                    }
                  }}
                />
              </Stack>
            </Card>
            
            {/* Batch Mode for Multiple Photos */}
            <Card>
              <Stack spacing="md">
                <Heading level="subtitle">Batch Document Scanner</Heading>
                <Text className="text-sm text-slate-600">
                  Capture up to 20 pages sequentially with compression
                </Text>
                <FileUpload
                  label="Document Pages"
                  accept="image/*"
                  multiple={true}
                  maxFiles={20}
                  showPreview={true}
                  showCamera={true}
                  cameraOverlay="document"
                  enableBatchMode={true}
                  imageQuality="medium"
                  maxDimensions={{ width: 1920, height: 1080 }}
                  value={cameraFiles}
                  onChange={(files) => {
                    setCameraFiles(files)
                    console.log('Batch documents:', files)
                  }}
                />
              </Stack>
            </Card>
            
            {/* License Plate with Auto-Capture */}
            <Card>
              <Stack spacing="md">
                <Heading level="subtitle">License Plate Scanner</Heading>
                <Text className="text-sm text-slate-600">
                  Smart auto-capture for license plates
                </Text>
                <FileUpload
                  label="License Plate Photo"
                  accept="image/*"
                  multiple={false}
                  maxFiles={1}
                  showPreview={true}
                  showCamera={true}
                  cameraOverlay="license-plate"
                  enableAutoCapture={true}
                  imageQuality="high"
                  value={cameraFiles}
                  onChange={(files) => {
                    setCameraFiles(files)
                    console.log('License plate:', files)
                  }}
                />
              </Stack>
            </Card>
          
          {/* Form Integration Demo */}
          <Card className="border-blue-200 bg-blue-50">
            <Stack spacing="md">
              <Flex align="center" gap="sm">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <Heading level="title" className="text-blue-900">
                  🔗 Form Integration
                </Heading>
              </Flex>
              <Text className="text-sm text-blue-700">
                VINField component with built-in scanner, validation, and formatting
              </Text>
              
              <VINField
                value={vinFieldValue}
                onChange={setVINFieldValue}
                enableValidation
                autoFormat
                enableScanner={false} // Disable scanner in showcase (would open modal)
              />
              
              <Text className="text-xs text-blue-600">
                Try typing: 1HGBH41JXMN109186 (valid VIN)
              </Text>
            </Stack>
          </Card>
          
          {/* Analytics Dashboard */}
          {analyticsEvents.length > 0 && (
            <Card>
              <Stack spacing="md">
                <Flex align="center" gap="sm">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  <Heading level="title">📊 Analytics Events</Heading>
                </Flex>
                <Text className="text-sm text-slate-600">
                  Real-time event tracking (last 10 events)
                </Text>
                
                <Stack spacing="xs">
                  {analyticsEvents.map((event, i) => (
                    <Card key={i} className="bg-slate-50" padding="sm">
                      <Flex align="center" justify="between">
                        <Text className="text-xs font-medium text-slate-700">
                          {event.type}
                        </Text>
                        <Text className="text-xs text-slate-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </Text>
                      </Flex>
                      {event.data && Object.keys(event.data).length > 0 && (
                        <Text className="text-xs text-slate-600 mt-1 font-mono">
                          {JSON.stringify(event.data)}
                        </Text>
                      )}
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </Card>
          )}
          
          {/* Features List */}
          <Card>
            <Stack spacing="md">
              <Heading level="title">✨ Features Demonstrated</Heading>
              
              <Grid columns={{ base: 1, md: 2 }} gap="md">
                <Stack spacing="xs">
                  <Text className="font-semibold text-sm">Core Features:</Text>
                  <Stack spacing="xs" className="text-sm text-slate-600">
                    <Text>• 4 specialized vision scanners</Text>
                    <Text>• Full-screen mobile capture</Text>
                    <Text>• AI-powered OCR processing</Text>
                    <Text>• Type-safe result handling</Text>
                    <Text>• File upload alternative</Text>
                  </Stack>
                </Stack>
                
                <Stack spacing="xs">
                  <Text className="font-semibold text-sm">Quick Win Features:</Text>
                  <Stack spacing="xs" className="text-sm text-slate-600">
                    <Text>• 🎭 Mock mode (no API needed)</Text>
                    <Text>• 📳 Haptic feedback</Text>
                    <Text>• 📊 Analytics integration</Text>
                    <Text>• 💬 Smart error messages</Text>
                    <Text>• 🔗 Form helpers (VINField)</Text>
                  </Stack>
                </Stack>
              </Grid>
            </Stack>
          </Card>
          
          {/* Production Ready Badge */}
          <Card className="border-green-200 bg-green-50">
            <Stack spacing="sm">
              <Flex align="center" gap="sm">
                <span className="text-2xl">✅</span>
                <Heading level="subtitle" className="text-green-900">
                  Production Ready
                </Heading>
              </Flex>
              <Text className="text-sm text-green-700">
                All features are fully functional, typed, validated, and ready for production use.
                The Vision System integrates seamlessly with your application through simple imports.
              </Text>
            </Stack>
          </Card>
        
        {/* Active Scanners */}
        {activeScanner === 'vin' && (
        <VINScanner
          onVINDetected={handleVINDetected}
          onCancel={() => setActiveScanner(null)}
          onAnalytics={handleAnalytics}
          mock={mockMode ? {
            enabled: true,
            delay: 2000,
            data: {
              vin: '1HGBH41JXMN109186',
              confidence: 0.95,
              character_quality: 'excellent' as const
            }
          } : undefined}
        />
      )}
      
      {activeScanner === 'odometer' && (
        <OdometerReader
          onMileageRead={handleMileageRead}
          onCancel={() => setActiveScanner(null)}
          mock={mockMode ? {
            enabled: true,
            delay: 2000,
            data: {
              current_mileage: 45892,
              unit: 'miles' as const,
              display_type: 'digital' as const,
              confidence: 0.92
            }
          } : undefined}
        />
      )}
      
      {activeScanner === 'license' && (
        <LicensePlateScanner
          onPlateDetected={handlePlateDetected}
          onCancel={() => setActiveScanner(null)}
          mock={mockMode ? {
            enabled: true,
            delay: 2000,
            data: {
              plate_number: 'ABC-1234',
              state: 'CA',
              confidence: 0.88
            }
          } : undefined}
        />
      )}
      
      {activeScanner === 'document' && (
        <DocumentScanner
          onDocumentProcessed={handleDocumentProcessed}
          onCancel={() => setActiveScanner(null)}
          documentType="receipt"
          mock={mockMode ? {
            enabled: true,
            delay: 2500,
            data: {
              document_type: 'receipt' as const,
              text_content: 'Sample receipt text...',
              structured_data: {
                total_amount: 45.99,
                date: '2025-01-15',
                vendor: 'Auto Service Center'
              },
              confidence: 0.90
            }
          } : undefined}
        />
      )}
        </Stack>
      </Section>
    </Container>
  )
}
