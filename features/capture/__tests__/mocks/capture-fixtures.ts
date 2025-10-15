/**
 * Capture Test Fixtures
 * 
 * Mock data for capture tests
 */

export interface CaptureData {
  id: string
  type: 'receipt' | 'odometer' | 'dashboard' | 'damage' | 'document'
  imageUrl: string
  timestamp: Date
  confidence?: number
  extractedData?: any
}

export const mockReceiptCapture: CaptureData = {
  id: 'capture-1',
  type: 'receipt',
  imageUrl: 'https://example.com/receipt.jpg',
  timestamp: new Date('2025-01-15T10:00:00Z'),
  confidence: 0.95,
  extractedData: {
    vendor: 'Quick Lube',
    total: 49.99,
    date: '2025-01-15',
    items: ['Oil change', 'Oil filter']
  }
}

export const mockOdometerCapture: CaptureData = {
  id: 'capture-2',
  type: 'odometer',
  imageUrl: 'https://example.com/odometer.jpg',
  timestamp: new Date('2025-01-14T08:30:00Z'),
  confidence: 0.92,
  extractedData: {
    reading: 50000,
    unit: 'miles'
  }
}

export const mockDashboardCapture: CaptureData = {
  id: 'capture-3',
  type: 'dashboard',
  imageUrl: 'https://example.com/dashboard.jpg',
  timestamp: new Date('2025-01-13T16:45:00Z'),
  confidence: 0.88,
  extractedData: {
    warnings: ['check_engine'],
    speed: 0,
    fuel_level: 0.75
  }
}

export const mockLowConfidenceCapture: CaptureData = {
  id: 'capture-4',
  type: 'receipt',
  imageUrl: 'https://example.com/blurry-receipt.jpg',
  timestamp: new Date('2025-01-12T14:20:00Z'),
  confidence: 0.45,
  extractedData: {
    total: null, // Could not extract
    date: '2025-01-12'
  }
}

export const mockCaptureList: CaptureData[] = [
  mockReceiptCapture,
  mockOdometerCapture,
  mockDashboardCapture,
  mockLowConfidenceCapture
]

/**
 * Factory function to create custom capture
 */
export function createMockCapture(overrides: Partial<CaptureData> = {}): CaptureData {
  return {
    ...mockReceiptCapture,
    ...overrides,
    id: overrides.id || `capture-${Date.now()}`,
    timestamp: overrides.timestamp || new Date()
  }
}

/**
 * Create list of captures
 */
export function createMockCaptureList(count: number): CaptureData[] {
  return Array.from({ length: count }, (_, i) => createMockCapture({
    id: `capture-${i}`
  }))
}
