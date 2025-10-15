/**
 * Enhanced Data Confirmation Component (Phase 1B)
 * 
 * Features:
 * - Confidence-based UI (visual indicators)
 * - Color-coded fields by confidence
 * - Validation warnings
 * - Cross-validation results display
 */

import { useState } from 'react'
import { Stack, Flex, Card, Heading, Text, Button } from '@/components/design-system'
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'

interface DataConfirmationV2Props {
  kind: 'odometer_reading' | 'fuel_purchase' | 'maintenance' | 'issue_report'
  extractedData: any
  vehicleId: string
  uploadId?: string
  onConfirm: (eventData: any) => void
  onCancel: () => void
}

export function DataConfirmationV2({ 
  kind, 
  extractedData, 
  vehicleId, 
  uploadId,
  onConfirm, 
  onCancel 
}: DataConfirmationV2Props) {
  // Debug: Log extracted data to see what we're receiving
  console.log('📊 DataConfirmationV2 received extractedData:', extractedData)
  
  const [formData, setFormData] = useState(() => {
    // Initialize form with extracted data
    switch (kind) {
      case 'fuel_purchase':
        const initialData = {
          gallons: extractedData.gallons || '',
          price_total: extractedData.price_total || '',
          unit_price: extractedData.unit_price || '',
          date: extractedData.date || new Date().toISOString().split('T')[0],
          station: extractedData.station || '',
          miles: extractedData.miles || '',
          ocr_confidence: extractedData.ocr_confidence || 0,
          // Include all extended data
          fuel_level: extractedData.fuel_level,
          grade: extractedData.grade,
          products: extractedData.products,
          transaction_time: extractedData.transaction_time,
          station_address: extractedData.station_address,
          pump_number: extractedData.pump_number,
          payment_method: extractedData.payment_method,
          transaction_id: extractedData.transaction_id,
          auth_code: extractedData.auth_code,
          invoice_number: extractedData.invoice_number,
          receipt_metadata: extractedData.receipt_metadata,
          // Vision metadata
          confidence: extractedData.confidence,
          validations: extractedData.validations,
          warnings: extractedData.warnings
        }
        console.log('📝 Initialized formData:', initialData)
        return initialData
      default:
        return {}
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      onConfirm(formData)
    } catch (error) {
      console.error('Failed to confirm data:', error)
      alert('Failed to save data. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Get confidence for a field
  const getFieldConfidence = (field: string): number => {
    const confidence = extractedData?.confidence || {}
    
    // Map fields to their source
    const fieldToSource: Record<string, string> = {
      'gallons': 'receipt',
      'price_total': 'receipt',
      'unit_price': 'receipt',
      'station': 'receipt',
      'miles': 'odometer'
    }
    
    const source = fieldToSource[field]
    return source ? confidence[source] || 0 : 0
  }

  // Get confidence indicator
  const getConfidenceIndicator = (confidence: number) => {
    if (confidence >= 90) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'High confidence'
      }
    } else if (confidence >= 70) {
      return {
        icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        label: 'Medium confidence - please verify'
      }
    } else {
      return {
        icon: <AlertCircle className="w-4 h-4 text-red-600" />,
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Low confidence - double check'
      }
    }
  }

  const renderFieldWithConfidence = (
    label: string,
    field: string,
    type: string,
    value: any,
    placeholder: string,
    step?: string
  ) => {
    const confidence = getFieldConfidence(field)
    const indicator = getConfidenceIndicator(confidence)
    const hasValue = value !== '' && value !== null && value !== undefined

    return (
      <div key={field}>
        <Flex justify="between" align="center" className="mb-2">
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {hasValue && confidence > 0 && (
            <Flex align="center" gap="xs" className={indicator.color}>
              {indicator.icon}
              <Text size="xs" className={indicator.color}>
                {confidence}% {indicator.label}
              </Text>
            </Flex>
          )}
        </Flex>
        <input
          type={type}
          step={step}
          value={value}
          onChange={(e) => handleInputChange(field, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            hasValue && confidence < 70 ? `${indicator.bgColor} ${indicator.borderColor}` : 'border-gray-300'
          }`}
          placeholder={placeholder}
        />
      </div>
    )
  }

  const renderForm = () => {
    switch (kind) {
      case 'fuel_purchase':
        return (
          <Stack spacing="md">
            {/* CORE FUEL DATA */}
            <Text className="font-semibold text-gray-900 text-sm uppercase tracking-wide mt-2">Core Fuel Data</Text>
            
            {renderFieldWithConfidence(
              'Gallons',
              'gallons',
              'number',
              formData.gallons,
              'Enter gallons',
              '0.01'
            )}
            
            {renderFieldWithConfidence(
              'Total Price ($)',
              'price_total',
              'number',
              formData.price_total,
              'Enter total price',
              '0.01'
            )}
            
            {formData.unit_price && renderFieldWithConfidence(
              'Price per Gallon ($)',
              'unit_price',
              'number',
              formData.unit_price,
              'Price per gallon',
              '0.001'
            )}
            
            {formData.grade && renderFieldWithConfidence(
              'Fuel Grade',
              'grade',
              'text',
              formData.grade,
              'Fuel type/grade'
            )}
            
            {/* STATION & LOCATION */}
            {(formData.station || formData.station_address || formData.pump_number) && (
              <Text className="font-semibold text-gray-900 text-sm uppercase tracking-wide mt-4">Station & Location</Text>
            )}
            
            {renderFieldWithConfidence(
              'Gas Station',
              'station',
              'text',
              formData.station,
              'Enter station name'
            )}
            
            {formData.station_address && renderFieldWithConfidence(
              'Station Address',
              'station_address',
              'text',
              formData.station_address,
              'Station address'
            )}
            
            {formData.pump_number && renderFieldWithConfidence(
              'Pump Number',
              'pump_number',
              'text',
              formData.pump_number,
              'Pump #'
            )}
            
            {/* VEHICLE DATA */}
            {(formData.miles || formData.fuel_level) && (
              <Text className="font-semibold text-gray-900 text-sm uppercase tracking-wide mt-4">Vehicle Data</Text>
            )}
            
            {renderFieldWithConfidence(
              'Odometer Reading (miles)',
              'miles',
              'number',
              formData.miles,
              'Enter odometer reading'
            )}
            
            {formData.fuel_level && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Level After Fill-Up
                </label>
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{formData.fuel_level}%</div>
                  <Text size="sm" className="text-blue-600">
                    Fuel gauge reading from photo
                  </Text>
                </div>
              </div>
            )}
            
            {/* PAYMENT & TRANSACTION */}
            {(formData.payment_method || formData.transaction_id || formData.auth_code || formData.invoice_number) && (
              <Text className="font-semibold text-gray-900 text-sm uppercase tracking-wide mt-4">Payment & Transaction</Text>
            )}
            
            {formData.payment_method && renderFieldWithConfidence(
              'Payment Method',
              'payment_method',
              'text',
              formData.payment_method,
              'Payment method'
            )}
            
            {formData.transaction_id && renderFieldWithConfidence(
              'Transaction ID',
              'transaction_id',
              'text',
              formData.transaction_id,
              'Transaction ID (fraud detection)'
            )}
            
            {formData.auth_code && renderFieldWithConfidence(
              'Authorization Code',
              'auth_code',
              'text',
              formData.auth_code,
              'Auth code'
            )}
            
            {formData.invoice_number && renderFieldWithConfidence(
              'Invoice/Receipt Number',
              'invoice_number',
              'text',
              formData.invoice_number,
              'Invoice number'
            )}
            
            {/* DATE & TIME */}
            <Text className="font-semibold text-gray-900 text-sm uppercase tracking-wide mt-4">Date & Time</Text>
            
            {renderFieldWithConfidence(
              'Date',
              'date',
              'date',
              formData.date,
              ''
            )}
            
            {formData.transaction_time && renderFieldWithConfidence(
              'Transaction Time',
              'transaction_time',
              'time',
              formData.transaction_time,
              'Time of purchase'
            )}
            
            {/* ADDITIVES */}
            {formData.products && formData.products.length > 0 && (
              <>
                <Text className="font-semibold text-gray-900 text-sm uppercase tracking-wide mt-4">Fuel Additives</Text>
                <Card className="p-4 bg-green-50 border-green-200">
                  <Stack spacing="sm">
                    {formData.products.map((product: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-2 bg-white rounded border border-green-200">
                        <div className="flex-1">
                          <Text className="font-semibold text-gray-900">{product.brand} {product.product_name}</Text>
                          {product.size && <Text size="sm" className="text-gray-600">Size: {product.size}</Text>}
                          {product.type && <Text size="sm" className="text-gray-600">Type: {product.type}</Text>}
                          {product.purpose && <Text size="sm" className="text-gray-500 italic">{product.purpose}</Text>}
                        </div>
                      </div>
                    ))}
                  </Stack>
                </Card>
              </>
            )}
            
            {/* ADVANCED RECEIPT METADATA (Fraud Detection & Reconciliation) */}
            {formData.receipt_metadata && Object.values(formData.receipt_metadata).some(v => v) && (
              <>
                <Text className="font-semibold text-gray-900 text-sm uppercase tracking-wide mt-4">
                  Receipt Metadata <span className="text-xs text-gray-500 normal-case">(Fraud Detection)</span>
                </Text>
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <Stack spacing="xs">
                    {formData.receipt_metadata.site_id && (
                      <Flex justify="between">
                        <Text size="sm" className="text-gray-600">Site ID:</Text>
                        <Text size="sm" className="font-mono text-gray-900">{formData.receipt_metadata.site_id}</Text>
                      </Flex>
                    )}
                    {formData.receipt_metadata.trace_id && (
                      <Flex justify="between">
                        <Text size="sm" className="text-gray-600">Trace ID:</Text>
                        <Text size="sm" className="font-mono text-gray-900">{formData.receipt_metadata.trace_id}</Text>
                      </Flex>
                    )}
                    {formData.receipt_metadata.merchant_id && (
                      <Flex justify="between">
                        <Text size="sm" className="text-gray-600">Merchant ID:</Text>
                        <Text size="sm" className="font-mono text-gray-900">{formData.receipt_metadata.merchant_id}</Text>
                      </Flex>
                    )}
                    {formData.receipt_metadata.entry_method && (
                      <Flex justify="between">
                        <Text size="sm" className="text-gray-600">Entry Method:</Text>
                        <Text size="sm" className="text-gray-900">
                          {formData.receipt_metadata.entry_method === 'L' ? 'Chip (EMV)' : 
                           formData.receipt_metadata.entry_method === 'S' ? 'Swipe (Magnetic)' :
                           formData.receipt_metadata.entry_method === 'C' ? 'Contactless (NFC)' :
                           formData.receipt_metadata.entry_method}
                        </Text>
                      </Flex>
                    )}
                    {formData.receipt_metadata.card_last_four && (
                      <Flex justify="between">
                        <Text size="sm" className="text-gray-600">Card Last 4:</Text>
                        <Text size="sm" className="font-mono text-gray-900">****{formData.receipt_metadata.card_last_four}</Text>
                      </Flex>
                    )}
                    
                    {/* Credit Card Transaction Codes */}
                    {(formData.receipt_metadata.aid || formData.receipt_metadata.tvr || formData.receipt_metadata.iad || 
                      formData.receipt_metadata.tsi || formData.receipt_metadata.arc) && (
                      <>
                        <div className="border-t border-purple-300 my-2" />
                        <Text size="xs" className="text-purple-700 font-semibold">EMV Transaction Codes:</Text>
                        {formData.receipt_metadata.aid && (
                          <Flex justify="between">
                            <Text size="xs" className="text-gray-600">AID:</Text>
                            <Text size="xs" className="font-mono text-gray-900">{formData.receipt_metadata.aid}</Text>
                          </Flex>
                        )}
                        {formData.receipt_metadata.tvr && (
                          <Flex justify="between">
                            <Text size="xs" className="text-gray-600">TVR:</Text>
                            <Text size="xs" className="font-mono text-gray-900">{formData.receipt_metadata.tvr}</Text>
                          </Flex>
                        )}
                        {formData.receipt_metadata.iad && (
                          <Flex justify="between">
                            <Text size="xs" className="text-gray-600">IAD:</Text>
                            <Text size="xs" className="font-mono text-gray-900 truncate">{formData.receipt_metadata.iad}</Text>
                          </Flex>
                        )}
                        {formData.receipt_metadata.tsi && (
                          <Flex justify="between">
                            <Text size="xs" className="text-gray-600">TSI:</Text>
                            <Text size="xs" className="font-mono text-gray-900">{formData.receipt_metadata.tsi}</Text>
                          </Flex>
                        )}
                        {formData.receipt_metadata.arc && (
                          <Flex justify="between">
                            <Text size="xs" className="text-gray-600">ARC:</Text>
                            <Text size="xs" className="font-mono text-gray-900">{formData.receipt_metadata.arc}</Text>
                          </Flex>
                        )}
                      </>
                    )}
                  </Stack>
                </Card>
              </>
            )}
            
            {/* CONFIDENCE SUMMARY */}
            {formData.ocr_confidence > 0 && (
              <Card className="p-3 bg-blue-50 border-blue-200 mt-4">
                <Flex align="center" gap="sm">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <Text size="sm" className="text-blue-700">
                    Overall AI confidence: {formData.ocr_confidence}%
                  </Text>
                </Flex>
              </Card>
            )}
          </Stack>
        )

      default:
        return <Text>Unknown data type</Text>
    }
  }

  // Render validation results
  const renderValidations = () => {
    const validations = extractedData?.validations || []
    if (validations.length === 0) return null

    return (
      <Card className="p-4 bg-gray-50">
        <Text className="mb-3 font-semibold text-gray-900">Cross-Validation Results</Text>
        <Stack spacing="xs">
          {validations.map((v: any, i: number) => (
            <Flex key={i} align="start" gap="sm">
              {v.passed ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              )}
              <Text size="sm" className={v.passed ? 'text-gray-700' : 'text-yellow-700'}>
                {v.message}
              </Text>
            </Flex>
          ))}
        </Stack>
      </Card>
    )
  }

  // Render warnings
  const renderWarnings = () => {
    const warnings = extractedData?.warnings || []
    if (warnings.length === 0) return null

    return (
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <Flex align="start" gap="sm">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <Stack spacing="xs">
            <Text className="font-semibold text-yellow-900">Warnings</Text>
            {warnings.map((warning: string, i: number) => (
              <Text key={i} size="sm" className="text-yellow-700">
                • {warning}
              </Text>
            ))}
          </Stack>
        </Flex>
      </Card>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <Stack spacing="lg" className="p-6">
          {/* Header */}
          <div>
            <Heading level="subtitle">Confirm Fuel Purchase Data</Heading>
            <Text size="sm" className="text-gray-600 mt-2">
              AI has extracted data from your photos. Please review and verify the values below.
            </Text>
          </div>

          {/* Warnings */}
          {renderWarnings()}

          {/* Form */}
          {renderForm()}

          {/* Validations */}
          {renderValidations()}

          {/* Actions */}
          <Flex gap="sm">
            <Button
              onClick={onCancel}
              variant="secondary"
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Event'}
            </Button>
          </Flex>
        </Stack>
      </Card>
    </div>
  )
}
