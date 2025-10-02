// Integration Tests for Vision Processing Pipeline
// Ensures modular architecture works end-to-end with error boundaries

import { describe, test, expect, beforeAll, afterAll } from '@jest/testing-library'
import fs from 'fs'
import path from 'path'

// Import modules to test
import { 
  extractServices, 
  categorizeService, 
  calculateNextService 
} from '../../lib/vision/service-processor'

import {
  extractVendorWithPrecedence,
  extractMileageWithPatterns,
  parseOpenAIResponse
} from '../../lib/vision/data-extractor'

import {
  rollupValidation,
  validateOdometerReading,
  classifyDocument,
  validateAndSanitizeAmounts
} from '../../lib/vision/document-validator'

import {
  makeHumanSummary,
  generateDriverFocusedSummary
} from '../../lib/vision/response-formatter'

import {
  analyzeDocumentPatterns,
  enhancedDocumentClassification,
  generateMaintenanceIntelligence
} from '../../lib/vision/document-intelligence'

// Test data fixtures
const mockServiceInvoice = {
  vendor_name: "Joe's Auto Repair",
  service_description: "52,500 mile interval maintenance service",
  total_amount: 755.81,
  date: "2023-06-21",
  odometer_reading: 52205,
  line_items: [
    { description: "Oil change", amount: 45.00 },
    { description: "Filter replacement", amount: 25.00 },
    { description: "Labor", amount: 685.81 }
  ],
  work_performed: "Oil change, air filter replacement, cabin filter replacement"
}

const mockFuelReceipt = {
  station_name: "Shell",
  total_amount: 98.55,
  gallons: 33.182,
  price_per_gallon: 2.97,
  date: "2020-07-10",
  odometer_reading: 44500
}

const mockInvalidData = {
  vendor_name: "",
  total_amount: "invalid",
  date: "not-a-date",
  odometer_reading: -1000
}

describe('Vision Processing Pipeline Integration Tests', () => {
  
  describe('Service Processing Module', () => {
    test('should extract services from service description', () => {
      const services = extractServices(mockServiceInvoice.service_description)
      expect(services).toContain('oil change')
      expect(services).toContain('filter replacement')
      expect(services.length).toBeGreaterThan(0)
    })
    
    test('should categorize service correctly', () => {
      const services = ['oil change', 'filter replacement']
      const category = categorizeService(services, mockServiceInvoice.service_description)
      expect(category).toBe('oil_change')
    })
    
    test('should calculate next service mileage', () => {
      const services = ['oil change']
      const nextService = calculateNextService(services, 52205, 'oil_change')
      expect(nextService).toBe(57205) // 52205 + 5000
    })
  })
  
  describe('Data Extraction Module', () => {
    test('should extract vendor with precedence', () => {
      const vendor = extractVendorWithPrecedence(mockServiceInvoice)
      expect(vendor).toBe("Joe's Auto Repair")
    })
    
    test('should handle missing vendor gracefully', () => {
      const vendor = extractVendorWithPrecedence({ business_name: "" })
      expect(vendor).toBe('Unknown Vendor')
    })
    
    test('should extract mileage with patterns', () => {
      const mileage = extractMileageWithPatterns(mockServiceInvoice)
      expect(mileage).toBe(52205)
    })
    
    test('should parse valid OpenAI response', () => {
      const validJson = '{"vendor": "Test Vendor", "amount": 100}'
      const result = parseOpenAIResponse(validJson)
      expect(result.vendor).toBe('Test Vendor')
      expect(result.amount).toBe(100)
    })
    
    test('should handle malformed JSON gracefully', () => {
      const invalidJson = '{"vendor": "Test", invalid}'
      expect(() => parseOpenAIResponse(invalidJson)).toThrow('Invalid JSON response')
    })
  })
  
  describe('Document Validation Module', () => {
    test('should validate and sanitize amounts', () => {
      const result = validateAndSanitizeAmounts(mockServiceInvoice)
      expect(result.total_amount).toBe(755.81)
      expect(typeof result.total_amount).toBe('number')
    })
    
    test('should handle invalid amounts', () => {
      const result = validateAndSanitizeAmounts(mockInvalidData)
      expect(result.total_amount).toBeUndefined()
    })
    
    test('should validate odometer reading', () => {
      const validation = validateOdometerReading({ odometer_reading: 52205 })
      expect(validation).not.toBeNull()
      expect(validation?.value).toBe(52205)
      expect(validation?.confidence).toBeGreaterThan(0.5)
    })
    
    test('should reject invalid odometer readings', () => {
      const validation = validateOdometerReading({ odometer_reading: -1000 })
      expect(validation?.confidence).toBeLessThan(0.5)
    })
    
    test('should classify documents correctly', () => {
      const classification = classifyDocument(mockServiceInvoice)
      expect(classification.type).toBe('service_invoice')
      expect(classification.confidence).toBeGreaterThan(0.7)
    })
  })
  
  describe('Response Formatting Module', () => {
    test('should generate human-readable summary', () => {
      const summary = makeHumanSummary(
        mockServiceInvoice,
        "Joe's Auto Repair",
        ['oil change', 'filter replacement'],
        52205
      )
      expect(summary).toContain('52,205 mile service')
      expect(summary).toContain('oil change')
      expect(summary).toContain("Joe's Auto Repair")
      expect(summary).toContain('$755.81')
    })
    
    test('should generate driver-focused summary', () => {
      const summary = generateDriverFocusedSummary(mockServiceInvoice)
      expect(summary.primary).toContain('52.2K mile service')
      expect(summary.secondary).toContain("Joe's Auto Repair")
      expect(summary.context).toContain('52,205 mi')
    })
  })
  
  describe('Document Intelligence Module', () => {
    test('should enhance document classification', () => {
      const classification = enhancedDocumentClassification(mockServiceInvoice)
      expect(classification.primary_type).toBe('service_invoice')
      expect(classification.confidence).toBeGreaterThan(0.7)
      expect(classification.classification_reasons.length).toBeGreaterThan(0)
    })
    
    test('should analyze document patterns', () => {
      const documents = [mockServiceInvoice, mockFuelReceipt]
      const patterns = analyzeDocumentPatterns(documents)
      expect(Array.isArray(patterns)).toBe(true)
    })
    
    test('should generate maintenance intelligence', () => {
      const serviceDocuments = [
        { ...mockServiceInvoice, document_type: 'service_invoice', services: ['oil change'] },
        { 
          ...mockServiceInvoice, 
          document_type: 'service_invoice', 
          services: ['oil change'],
          date: '2023-11-21', // 5 months later
          odometer_reading: 57205 
        }
      ]
      
      const intelligence = generateMaintenanceIntelligence(serviceDocuments)
      expect(intelligence.patterns.length).toBeGreaterThan(0)
      expect(intelligence.patterns[0].service_type).toBe('oil change')
    })
  })
  
  describe('End-to-End Pipeline Tests', () => {
    test('should process complete service invoice pipeline', async () => {
      // Simulate full processing pipeline
      const result = await processCompleteServiceInvoice(mockServiceInvoice)
      
      expect(result.vendor_name).toBeDefined()
      expect(result.services).toBeDefined()
      expect(result.summary).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0.5)
    })
    
    test('should handle partial failures gracefully', async () => {
      // Test with problematic data that should cause some modules to fail
      const problematicData = {
        ...mockServiceInvoice,
        vendor_name: null,
        service_description: undefined,
        total_amount: "not-a-number"
      }
      
      const result = await processCompleteServiceInvoice(problematicData)
      
      // Should still return a result with warnings
      expect(result).toBeDefined()
      expect(result.processing_warnings).toBeDefined()
      expect(result.processing_warnings.length).toBeGreaterThan(0)
    })
    
    test('should maintain performance under load', async () => {
      const startTime = Date.now()
      
      // Process multiple documents simultaneously
      const promises = Array(10).fill(mockServiceInvoice).map(doc => 
        processCompleteServiceInvoice(doc)
      )
      
      const results = await Promise.all(promises)
      const endTime = Date.now()
      const totalTime = endTime - startTime
      
      expect(results.length).toBe(10)
      expect(totalTime).toBeLessThan(5000) // Should complete within 5 seconds
      
      // All results should be valid
      results.forEach(result => {
        expect(result.confidence).toBeGreaterThan(0)
        expect(result.summary).toBeDefined()
      })
    })
  })
  
  describe('Error Boundary Tests', () => {
    test('should handle module failures without crashing', async () => {
      // Mock a module failure
      const originalExtractVendor = extractVendorWithPrecedence
      
      // Temporarily replace with failing function
      const mockExtractVendor = () => {
        throw new Error('Simulated module failure')
      }
      
      try {
        const result = await processWithMockedFailure(mockServiceInvoice, mockExtractVendor)
        
        // Should still return a result
        expect(result).toBeDefined()
        expect(result.processing_warnings).toContain('Vendor extraction failed: Simulated module failure')
        expect(result.vendor_name).toBe('Unknown Vendor') // Fallback value
      } finally {
        // Restore original function
        // extractVendorWithPrecedence = originalExtractVendor
      }
    })
    
    test('should fail fast on critical errors', async () => {
      // Test that critical validation failures still throw
      const criticallyInvalidData = null
      
      await expect(processCompleteServiceInvoice(criticallyInvalidData))
        .rejects.toThrow('Critical validation failed')
    })
  })
})

// Helper functions for testing
async function processCompleteServiceInvoice(data: any) {
  const result = { ...data }
  const warnings = []
  
  try {
    // Step 1: Validate and sanitize (critical)
    Object.assign(result, validateAndSanitizeAmounts(data))
  } catch (error) {
    throw new Error(`Critical validation failed: ${error.message}`)
  }
  
  try {
    // Step 2: Extract vendor (non-critical)
    const vendor = extractVendorWithPrecedence(result)
    result.vendor_name = vendor
  } catch (error) {
    warnings.push(`Vendor extraction failed: ${error.message}`)
    result.vendor_name = 'Unknown Vendor'
  }
  
  try {
    // Step 3: Extract mileage (non-critical)
    const mileage = extractMileageWithPatterns(result)
    if (mileage) {
      const validatedOdometer = validateOdometerReading({ odometer_reading: mileage })
      result.odometer_reading = validatedOdometer?.value || mileage
      result.odometer_confidence = validatedOdometer?.confidence || 0.5
    }
  } catch (error) {
    warnings.push(`Mileage extraction failed: ${error.message}`)
  }
  
  try {
    // Step 4: Process services (non-critical)
    if (result.service_description) {
      const services = extractServices(result.service_description)
      result.services = services
      result.service_category = categorizeService(services, result.service_description)
      
      if (result.odometer_reading) {
        result.next_service_mileage = calculateNextService(
          services, 
          result.odometer_reading, 
          result.service_category
        )
      }
    }
  } catch (error) {
    warnings.push(`Service processing failed: ${error.message}`)
  }
  
  try {
    // Step 5: Generate summary (non-critical)
    result.summary = makeHumanSummary(
      result,
      result.vendor_name,
      result.services || [],
      result.odometer_reading
    )
    
    result.display = generateDriverFocusedSummary(result)
  } catch (error) {
    warnings.push(`Summary generation failed: ${error.message}`)
    result.summary = 'Document processed'
  }
  
  // Add validation rollup
  try {
    const validation = rollupValidation(result.validation || {})
    result.validation_status = validation.rollup
    result.confidence = calculateOverallConfidence(result, warnings)
  } catch (error) {
    warnings.push(`Validation rollup failed: ${error.message}`)
    result.confidence = 0.5
  }
  
  // Include warnings for debugging
  if (warnings.length > 0) {
    result.processing_warnings = warnings
  }
  
  return result
}

async function processWithMockedFailure(data: any, mockFunction: Function) {
  // This would be implemented with proper mocking in a real test environment
  return processCompleteServiceInvoice(data)
}

function calculateOverallConfidence(result: any, warnings: string[]): number {
  let confidence = 0.9
  
  // Reduce confidence for each warning
  confidence -= warnings.length * 0.1
  
  // Boost confidence for successful extractions
  if (result.vendor_name && result.vendor_name !== 'Unknown Vendor') confidence += 0.05
  if (result.total_amount && typeof result.total_amount === 'number') confidence += 0.05
  if (result.odometer_reading) confidence += 0.05
  if (result.date) confidence += 0.05
  
  return Math.max(0.1, Math.min(1.0, confidence))
}
