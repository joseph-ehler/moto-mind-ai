/**
 * Vision Feature - Test Fixtures
 * 
 * Reusable test data for vision feature tests.
 * Provides mock data for images, OCR results, documents, etc.
 */

export const mockImageData = {
  valid: {
    url: 'https://example.com/test-image.jpg',
    type: 'image/jpeg' as const,
    size: 2 * 1024 * 1024, // 2MB
    width: 1920,
    height: 1080,
    blob: null as Blob | null
  },
  large: {
    url: 'https://example.com/large-image.jpg',
    type: 'image/jpeg' as const,
    size: 12 * 1024 * 1024, // 12MB (over limit)
    width: 4096,
    height: 3072,
    blob: null as Blob | null
  },
  invalid: {
    url: 'https://example.com/invalid.gif',
    type: 'image/gif' as const, // Invalid format
    size: 1024,
    width: 100,
    height: 100,
    blob: null as Blob | null
  }
}

export const mockOCRResults = {
  success: {
    text: 'DRIVERS LICENSE\nJOHN DOE\nDL123456\nExp: 12/31/2025',
    confidence: 0.95,
    language: 'en',
    words: [
      { text: 'DRIVERS', confidence: 0.98, boundingBox: [10, 20, 100, 40] },
      { text: 'LICENSE', confidence: 0.97, boundingBox: [110, 20, 200, 40] },
      { text: 'JOHN', confidence: 0.96, boundingBox: [10, 50, 80, 70] },
      { text: 'DOE', confidence: 0.95, boundingBox: [90, 50, 140, 70] }
    ]
  },
  lowConfidence: {
    text: 'unclear text',
    confidence: 0.45,
    language: 'en',
    words: []
  },
  error: {
    error: 'OCR_FAILED',
    message: 'Unable to process image',
    confidence: 0
  }
}

export const mockLicensePlates = {
  valid: [
    'ABC1234',
    'XYZ 5678',
    '123ABC',
    'DEF-456'
  ],
  invalid: [
    '123',
    'TOOLONG123456',
    '!@#$%',
    ''
  ],
  detected: {
    plateNumber: 'ABC1234',
    confidence: 0.92,
    boundingBox: [100, 200, 300, 250],
    state: 'CA'
  }
}

export const mockDocuments = {
  driversLicense: {
    type: 'drivers_license' as const,
    imageUrl: 'https://example.com/dl.jpg',
    extractedData: {
      name: 'John Doe',
      licenseNumber: 'DL123456',
      dateOfBirth: '1990-01-15',
      expirationDate: '2025-12-31',
      state: 'CA',
      address: '123 Main St, Los Angeles, CA 90001'
    },
    confidence: 0.94
  },
  registration: {
    type: 'registration' as const,
    imageUrl: 'https://example.com/reg.jpg',
    extractedData: {
      vin: '1HGBH41JXMN109186',
      plateNumber: 'ABC1234',
      make: 'Honda',
      model: 'Accord',
      year: 2021,
      expirationDate: '2025-06-30'
    },
    confidence: 0.91
  },
  insuranceCard: {
    type: 'insurance_card' as const,
    imageUrl: 'https://example.com/insurance.jpg',
    extractedData: {
      provider: 'State Farm',
      policyNumber: 'POL123456789',
      effectiveDate: '2024-01-01',
      expirationDate: '2025-01-01',
      insuredName: 'John Doe'
    },
    confidence: 0.88
  }
}

export const mockCameraState = {
  idle: {
    active: false,
    track: null,
    facingMode: 'environment' as const,
    error: null
  },
  active: {
    active: true,
    track: { id: 'track-123', enabled: true } as any,
    facingMode: 'environment' as const,
    error: null
  },
  error: {
    active: false,
    track: null,
    facingMode: 'environment' as const,
    error: {
      name: 'NotAllowedError',
      message: 'Camera permission denied'
    }
  }
}

export const mockVisionProcessingResult = {
  success: {
    id: 'process-123',
    status: 'completed' as const,
    imageUrl: 'https://example.com/processed.jpg',
    originalImageUrl: 'https://example.com/original.jpg',
    processedAt: '2025-01-15T10:30:00Z',
    results: {
      documentType: 'drivers_license',
      ocrText: 'DRIVERS LICENSE\nJOHN DOE',
      extractedData: mockDocuments.driversLicense.extractedData,
      confidence: 0.94
    }
  },
  processing: {
    id: 'process-456',
    status: 'processing' as const,
    imageUrl: 'https://example.com/processing.jpg',
    originalImageUrl: 'https://example.com/original2.jpg',
    processedAt: null,
    results: null
  },
  failed: {
    id: 'process-789',
    status: 'failed' as const,
    imageUrl: 'https://example.com/failed.jpg',
    originalImageUrl: 'https://example.com/original3.jpg',
    processedAt: '2025-01-15T10:35:00Z',
    error: {
      code: 'PROCESSING_FAILED',
      message: 'Unable to extract text from image'
    }
  }
}

export const mockVisionConfig = {
  imageFormats: ['image/jpeg', 'image/png', 'image/webp'],
  maxImageSize: 10 * 1024 * 1024, // 10MB
  compressionThreshold: 5 * 1024 * 1024, // 5MB
  compressionQuality: 0.85,
  ocrLanguages: ['en', 'es', 'fr'],
  documentTypes: [
    'drivers_license',
    'registration',
    'insurance_card',
    'inspection_report'
  ],
  cameraConstraints: {
    video: {
      facingMode: 'environment',
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    }
  }
}

// Helper function to create mock image blobs
export function createMockImageBlob(sizeInBytes: number = 1024): Blob {
  const data = new Uint8Array(sizeInBytes)
  return new Blob([data], { type: 'image/jpeg' })
}

// Helper function to create mock file
export function createMockImageFile(
  name: string = 'test-image.jpg',
  sizeInBytes: number = 1024
): File {
  const blob = createMockImageBlob(sizeInBytes)
  return new File([blob], name, { type: 'image/jpeg' })
}
