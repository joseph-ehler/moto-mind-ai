'use client'

/**
 * Vision Plugin System Test Page
 * 
 * Comprehensive testing interface for Vision plugins
 * Tests all 3 example plugins individually and in combination
 */

import React, { useState } from 'react'
import { 
  Container, 
  Stack, 
  Heading, 
  Text, 
  Card, 
  Button, 
  Grid,
  Flex
} from '@/components/design-system'
import { VINScanner } from '@/components/design-system/utilities/vision'
import {
  vinValidation,
  confidenceScoring,
  vinDecoding,
  type VINValidationResult,
  type ConfidenceCheckResult,
  type DecodedVehicleInfo
} from '@/components/design-system/utilities/vision/plugins'

// Test configuration state
interface TestConfig {
  useVINValidation: boolean
  useConfidenceScoring: boolean
  useVINDecoding: boolean
  
  // VIN Validation options
  validateCheckDigit: boolean
  strictMode: boolean
  
  // Confidence Scoring options
  minConfidence: number
  maxRetries: number
  showBadge: boolean
  
  // VIN Decoding options
  apiProvider: 'nhtsa' | 'mock'
  cacheResults: boolean
}

// Test result state
interface TestResult {
  success: boolean
  vin?: string
  confidence?: number
  make?: string
  model?: string
  year?: number
  timestamp: number
  
  // Plugin metadata
  validated?: boolean
  validationWarnings?: string[]
  decoded?: boolean
  attempts?: number
  
  error?: string
}

export default function VisionPluginsTestPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null)
  
  // Plugin logs
  const [logs, setLogs] = useState<string[]>([])
  const addLog = React.useCallback((message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }, [])
  
  // Test configuration
  const [config, setConfig] = useState<TestConfig>({
    useVINValidation: true,
    useConfidenceScoring: true,
    useVINDecoding: true,
    
    validateCheckDigit: true,
    strictMode: false,
    
    minConfidence: 0.90,
    maxRetries: 3,
    showBadge: true,
    
    apiProvider: 'mock',
    cacheResults: true
  })
  
  // Build plugin array based on configuration (memoized to prevent re-registration)
  const plugins = React.useMemo(() => [
    config.useVINValidation && vinValidation({
      validateCheckDigit: config.validateCheckDigit,
      strictMode: config.strictMode,
      onValidation: (result: VINValidationResult) => {
        addLog(`VIN Validation: ${result.valid ? '✅ Valid' : '❌ Invalid'}`)
        if (result.warnings.length > 0) {
          addLog(`⚠️ Warnings: ${result.warnings.join(', ')}`)
        }
        if (result.errors.length > 0) {
          addLog(`❌ Errors: ${result.errors.join(', ')}`)
        }
      }
    }),
    
    config.useConfidenceScoring && confidenceScoring({
      minConfidence: config.minConfidence,
      maxRetries: config.maxRetries,
      showBadge: config.showBadge,
      onConfidenceCheck: (result: ConfidenceCheckResult) => {
        addLog(
          `Confidence: ${(result.confidence * 100).toFixed(1)}% ` +
          `(threshold: ${(result.threshold * 100).toFixed(1)}%) - ` +
          `${result.passed ? '✅ Pass' : '⚠️ Low'}`
        )
      },
      onLowConfidence: (confidence: number, threshold: number) => {
        addLog(
          `⚠️ Low confidence: ${(confidence * 100).toFixed(0)}% ` +
          `(need ${(threshold * 100).toFixed(0)}%)`
        )
      }
    }),
    
    config.useVINDecoding && vinDecoding({
      apiProvider: config.apiProvider,
      cacheResults: config.cacheResults,
      onDecode: (info: DecodedVehicleInfo) => {
        addLog(`✅ VIN Decoded: ${info.make} ${info.model} ${info.year}`)
      },
      onDecodeError: (error: string) => {
        addLog(`❌ Decode error: ${error}`)
      }
    })
  ].filter(Boolean), [
    config.useVINValidation,
    config.validateCheckDigit,
    config.strictMode,
    config.useConfidenceScoring,
    config.minConfidence,
    config.maxRetries,
    config.showBadge,
    config.useVINDecoding,
    config.apiProvider,
    config.cacheResults,
    addLog
  ])
  
  const handleCapture = (vinData: any) => {
    addLog(`🎉 Capture successful!`)
    
    console.log('Captured VIN data:', vinData)
    
    const testResult: TestResult = {
      success: true,
      vin: vinData.vin || 'N/A',
      confidence: vinData.confidence,
      make: vinData.make,
      model: vinData.model,
      year: vinData.year,
      timestamp: Date.now(),
      validated: vinData.validated,
      validationWarnings: vinData.validationWarnings,
      decoded: vinData.decoded,
      attempts: vinData.attempts
    }
    
    setCurrentResult(testResult)
    setResults(prev => [testResult, ...prev])
    setIsScanning(false)
  }
  
  const handleError = (error: Error) => {
    addLog(`❌ Error: ${error.message}`)
    
    const testResult: TestResult = {
      success: false,
      error: error.message,
      timestamp: Date.now()
    }
    
    setCurrentResult(testResult)
    setResults(prev => [testResult, ...prev])
  }
  
  const clearLogs = () => setLogs([])
  const clearResults = () => {
    setResults([])
    setCurrentResult(null)
  }

  return (
    <Container 
      size="xl"
      useCase="admin_dashboards"
      override={{
        reason: "Test page requires extra width for plugin configuration panels and results display",
        approvedBy: "Development Team"
      }}
    >
      <Stack spacing="xl" className="py-8">
        {/* Header */}
        <Stack spacing="md">
          <Heading level="page">Vision Plugin System Test</Heading>
          <Text variant="secondary">
            Test all 3 example plugins individually or in combination
          </Text>
        </Stack>
        
        {/* Configuration Panel */}
        <Card className="p-6">
          <Stack spacing="lg">
            <Heading level="section">Plugin Configuration</Heading>
            
            <Grid columns={3} gap="lg">
              {/* VIN Validation Config */}
              <Card className="p-4 border-2 border-blue-200 dark:border-blue-800">
                <Stack spacing="md">
                  <Flex align="center" justify="between">
                    <Text weight="semibold">VIN Validation</Text>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.useVINValidation}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          useVINValidation: e.target.checked 
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </Flex>
                  
                  {config.useVINValidation && (
                    <Stack spacing="sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.validateCheckDigit}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            validateCheckDigit: e.target.checked 
                          }))}
                          className="rounded"
                        />
                        <Text size="sm">Validate Check Digit</Text>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.strictMode}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            strictMode: e.target.checked 
                          }))}
                          className="rounded"
                        />
                        <Text size="sm">Strict Mode</Text>
                      </label>
                    </Stack>
                  )}
                </Stack>
              </Card>
              
              {/* Confidence Scoring Config */}
              <Card className="p-4 border-2 border-green-200 dark:border-green-800">
                <Stack spacing="md">
                  <Flex align="center" justify="between">
                    <Text weight="semibold">Confidence Scoring</Text>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.useConfidenceScoring}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          useConfidenceScoring: e.target.checked 
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </Flex>
                  
                  {config.useConfidenceScoring && (
                    <Stack spacing="sm">
                      <label className="flex flex-col gap-1">
                        <Text size="sm">Min Confidence: {(config.minConfidence * 100).toFixed(0)}%</Text>
                        <input
                          type="range"
                          min="50"
                          max="99"
                          value={config.minConfidence * 100}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            minConfidence: parseInt(e.target.value) / 100 
                          }))}
                          className="w-full"
                        />
                      </label>
                      
                      <label className="flex flex-col gap-1">
                        <Text size="sm">Max Retries: {config.maxRetries}</Text>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={config.maxRetries}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            maxRetries: parseInt(e.target.value) 
                          }))}
                          className="w-full"
                        />
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.showBadge}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            showBadge: e.target.checked 
                          }))}
                          className="rounded"
                        />
                        <Text size="sm">Show Badge</Text>
                      </label>
                    </Stack>
                  )}
                </Stack>
              </Card>
              
              {/* VIN Decoding Config */}
              <Card className="p-4 border-2 border-purple-200 dark:border-purple-800">
                <Stack spacing="md">
                  <Flex align="center" justify="between">
                    <Text weight="semibold">VIN Decoding</Text>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.useVINDecoding}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          useVINDecoding: e.target.checked 
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </Flex>
                  
                  {config.useVINDecoding && (
                    <Stack spacing="sm">
                      <label className="flex flex-col gap-1">
                        <Text size="sm">API Provider</Text>
                        <select
                          value={config.apiProvider}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            apiProvider: e.target.value as 'nhtsa' | 'mock'
                          }))}
                          className="rounded border border-gray-300 dark:border-gray-600 p-1 text-sm"
                        >
                          <option value="mock">Mock (Test)</option>
                          <option value="nhtsa">NHTSA (Real)</option>
                        </select>
                      </label>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.cacheResults}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            cacheResults: e.target.checked 
                          }))}
                          className="rounded"
                        />
                        <Text size="sm">Cache Results</Text>
                      </label>
                    </Stack>
                  )}
                </Stack>
              </Card>
            </Grid>
            
            {/* Active Plugins Summary */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
              <Flex align="center" gap="md">
                <Text weight="semibold">Active Plugins:</Text>
                <Flex gap="sm">
                  {config.useVINValidation && (
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
                      VIN Validation
                    </span>
                  )}
                  {config.useConfidenceScoring && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                      Confidence Scoring
                    </span>
                  )}
                  {config.useVINDecoding && (
                    <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded">
                      VIN Decoding
                    </span>
                  )}
                  {plugins.length === 0 && (
                    <Text size="sm" variant="secondary">None (vanilla scanner)</Text>
                  )}
                </Flex>
              </Flex>
            </Card>
          </Stack>
        </Card>
        
        {/* Scanner */}
        <Card className="p-6">
          <Stack spacing="lg">
            <Heading level="section">VIN Scanner</Heading>
            
            {!isScanning ? (
              <Button
                onClick={() => {
                  setIsScanning(true)
                  clearLogs()
                  addLog('🎬 Starting VIN scan...')
                }}
                size="lg"
                className="w-full"
              >
                Start VIN Scan
              </Button>
            ) : (
              <div className="relative w-full">
                <VINScanner
                  onVINDetected={handleCapture}
                  onCancel={() => {
                    setIsScanning(false)
                    addLog('🚫 Scan cancelled')
                  }}
                  plugins={plugins as any}
                  onPluginEvent={(event, data) => {
                    addLog(`🔌 Plugin event: ${event}`)
                  }}
                />
              </div>
            )}
          </Stack>
        </Card>
        
        {/* Current Result */}
        {currentResult && (
          <Card className={`p-6 border-2 ${
            currentResult.success 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
              : 'border-red-500 bg-red-50 dark:bg-red-900/20'
          }`}>
            <Stack spacing="md">
              <Flex align="center" justify="between">
                <Heading level="section">
                  {currentResult.success ? '✅ Latest Result' : '❌ Latest Error'}
                </Heading>
                <Text size="sm" variant="secondary">
                  {new Date(currentResult.timestamp).toLocaleTimeString()}
                </Text>
              </Flex>
              
              {currentResult.success ? (
                <Grid columns={2} gap="md">
                  <div>
                    <Text size="sm" variant="secondary">VIN</Text>
                    <Text weight="semibold" className="font-mono">{currentResult.vin}</Text>
                  </div>
                  <div>
                    <Text size="sm" variant="secondary">Confidence</Text>
                    <Text weight="semibold">
                      {((currentResult.confidence ?? 0) * 100).toFixed(1)}%
                    </Text>
                  </div>
                  {currentResult.make && (
                    <div>
                      <Text size="sm" variant="secondary">Make</Text>
                      <Text weight="semibold">{currentResult.make}</Text>
                    </div>
                  )}
                  {currentResult.model && (
                    <div>
                      <Text size="sm" variant="secondary">Model</Text>
                      <Text weight="semibold">{currentResult.model}</Text>
                    </div>
                  )}
                  {currentResult.year && !isNaN(currentResult.year) && (
                    <div>
                      <Text size="sm" variant="secondary">Year</Text>
                      <Text weight="semibold">{currentResult.year}</Text>
                    </div>
                  )}
                  {currentResult.attempts && (
                    <div>
                      <Text size="sm" variant="secondary">Attempts</Text>
                      <Text weight="semibold">{currentResult.attempts}</Text>
                    </div>
                  )}
                </Grid>
              ) : (
                <Text className="text-red-600 dark:text-red-400">
                  {currentResult.error}
                </Text>
              )}
            </Stack>
          </Card>
        )}
        
        {/* Logs */}
        <Card className="p-6">
          <Stack spacing="md">
            <Flex align="center" justify="between">
              <Heading level="section">Plugin Logs</Heading>
              <Button variant="ghost" size="sm" onClick={clearLogs}>
                Clear
              </Button>
            </Flex>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Start a scan to see plugin activity.</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))
              )}
            </div>
          </Stack>
        </Card>
        
        {/* Results History */}
        <Card className="p-6">
          <Stack spacing="md">
            <Flex align="center" justify="between">
              <Heading level="section">Results History ({results.length})</Heading>
              <Button variant="ghost" size="sm" onClick={clearResults}>
                Clear
              </Button>
            </Flex>
            
            {results.length === 0 ? (
              <Text variant="secondary">No results yet. Complete a scan to see history.</Text>
            ) : (
              <Stack spacing="sm">
                {results.slice(0, 10).map((result, i) => (
                  <Card 
                    key={i} 
                    className={`p-3 ${
                      result.success 
                        ? 'bg-green-50 dark:bg-green-900/10' 
                        : 'bg-red-50 dark:bg-red-900/10'
                    }`}
                  >
                    <Flex align="center" justify="between">
                      <Flex align="center" gap="md">
                        <Text size="sm">{result.success ? '✅' : '❌'}</Text>
                        {result.success ? (
                          <>
                            <Text size="sm" className="font-mono">{result.vin}</Text>
                            {result.make && (
                              <Text size="sm" variant="secondary">
                                {result.make} {result.model} {result.year}
                              </Text>
                            )}
                          </>
                        ) : (
                          <Text size="sm" className="text-red-600">{result.error}</Text>
                        )}
                      </Flex>
                      <Text size="sm" variant="secondary">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </Text>
                    </Flex>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
