import { render } from '@testing-library/react'
import { EventDetailBlocks } from '../components/timeline/EventDetailBlocks'

// Mock TimelineEvent interface for testing
interface MockTimelineEvent {
  id: string
  type: string
  total_amount?: number
  confidence?: number
  miles?: number
  gallons?: number
  created_at?: string
  payload?: {
    extracted_data?: any
    validation?: {
      rollup?: string
      reason?: string
    }
  }
}

describe('EventDetailBlocks Contract Tests', () => {
  
  // Property-based test for financial classification
  test('financial amounts always get blue styling', () => {
    const financialAmounts = [755.81, 1200.00, 45.99, 12000.50, 0.99]
    
    financialAmounts.forEach(amount => {
      const event: MockTimelineEvent = {
        id: 'test',
        type: 'service',
        total_amount: amount,
        payload: { extracted_data: {} }
      }
      
      const { container } = render(<EventDetailBlocks event={event} />)
      const amountElement = container.querySelector(`[class*="bg-blue-100"]`)
      expect(amountElement).toBeInTheDocument()
      expect(amountElement?.textContent).toContain(`$${amount}`)
    })
  })
  
  // Confidence warning thresholds
  test('confidence warnings appear at correct thresholds', () => {
    const testCases = [
      { confidence: 95, hasFinancial: true, shouldWarn: false },
      { confidence: 80, hasFinancial: true, shouldWarn: true },  // <85 with financial
      { confidence: 75, hasFinancial: false, shouldWarn: false }, // >70 without financial
      { confidence: 65, hasFinancial: false, shouldWarn: true },  // <70 without financial
    ]
    
    testCases.forEach(({ confidence, hasFinancial, shouldWarn }) => {
      const event: MockTimelineEvent = {
        id: 'test',
        type: 'service',
        confidence,
        total_amount: hasFinancial ? 755.81 : undefined,
        payload: { extracted_data: {} }
      }
      
      const { queryByText } = render(<EventDetailBlocks event={event} />)
      const warning = queryByText(/check amounts|verify|needs review/i)
      
      if (shouldWarn) {
        expect(warning).toBeInTheDocument()
      } else {
        expect(warning).not.toBeInTheDocument()
      }
    })
  })

  // Human summary generation
  test('makeHumanSummary generates expected format', () => {
    const testCases = [
      {
        event: {
          id: 'service-1',
          type: 'service',
          total_amount: 755.81,
          payload: {
            extracted_data: {
              services_performed: 'Oil change',
              shop_name: "Joe's Auto"
            }
          }
        },
        expectedPattern: /Oil change at.*for \$755\.81/
      },
      {
        event: {
          id: 'fuel-1',
          type: 'fuel',
          total_amount: 98.55,
          gallons: 33.182,
          payload: {
            extracted_data: {
              shop_name: 'Shell Station'
            }
          }
        },
        expectedPattern: /Fuel at.*33\.182 gal.*\$98\.55/
      },
      {
        event: {
          id: 'inspection-1',
          type: 'inspection',
          payload: {
            result: 'passed',
            extracted_data: {
              shop_name: 'State Inspection'
            }
          }
        },
        expectedPattern: /Safety inspection passed at/
      }
    ]
    
    testCases.forEach(({ event, expectedPattern }) => {
      const { container } = render(<EventDetailBlocks event={event} />)
      // The human summary would be used in the header - check for pattern in rendered content
      expect(container.textContent).toMatch(expectedPattern)
    })
  })

  // Universal metadata presence
  test('universal metadata appears in all event types', () => {
    const eventTypes = ['service', 'repair', 'inspection', 'insurance', 'accident', 'fuel', 'odometer']
    
    eventTypes.forEach(type => {
      const event: MockTimelineEvent = {
        id: `test-${type}`,
        type,
        confidence: 85,
        payload: { extracted_data: {} }
      }
      
      const { getByText } = render(<EventDetailBlocks event={event} />)
      expect(getByText('Data Quality')).toBeInTheDocument()
      expect(getByText('85%')).toBeInTheDocument()
    })
  })

  // Date resolution priority
  test('resolveEventDate prefers document dates over system dates', () => {
    const event: MockTimelineEvent = {
      id: 'test',
      type: 'service',
      created_at: '2024-01-01T00:00:00Z',
      payload: {
        extracted_data: {
          date: '2024-01-15T00:00:00Z'
        }
      }
    }
    
    const { getByText } = render(<EventDetailBlocks event={event} />)
    // Should show Jan 15 (document date) not Jan 1 (system date)
    expect(getByText(/Jan 15/)).toBeInTheDocument()
  })

  // Vendor resolution fallback chain
  test('resolveVendor follows proper fallback hierarchy', () => {
    const testCases = [
      {
        payload: {
          document_details: { business_name: 'Primary Business' },
          extracted_data: { shop_name: 'Secondary Shop' }
        },
        expected: 'Primary Business'
      },
      {
        payload: {
          extracted_data: { 
            shop_name: 'Not Visible',
            header: 'CHEVROLET SERVICE CENTER'
          }
        },
        expected: 'Chevrolet Service'
      },
      {
        payload: {
          extracted_data: { shop_name: 'Valid Shop Name' }
        },
        expected: 'Valid Shop Name'
      }
    ]
    
    testCases.forEach(({ payload, expected }) => {
      const event: MockTimelineEvent = {
        id: 'test',
        type: 'service',
        payload
      }
      
      const { container } = render(<EventDetailBlocks event={event} />)
      expect(container.textContent).toContain(expected)
    })
  })

  // Color consistency across event types
  test('color system is consistent across all event types', () => {
    const eventTypes = ['service', 'repair', 'inspection', 'insurance', 'accident', 'fuel', 'odometer']
    
    eventTypes.forEach(type => {
      const event: MockTimelineEvent = {
        id: `test-${type}`,
        type,
        total_amount: 100.00,
        payload: { extracted_data: {} }
      }
      
      const { container } = render(<EventDetailBlocks event={event} />)
      
      // Financial amounts should always be blue
      const financialElements = container.querySelectorAll('[class*="bg-blue-100"]')
      expect(financialElements.length).toBeGreaterThan(0)
      
      // Should contain the amount
      const amountText = container.textContent
      expect(amountText).toContain('$100')
    })
  })
})

// Test fixtures for comprehensive testing
export const eventFixtures = {
  service: {
    id: 'service-fixture',
    type: 'service',
    total_amount: 755.81,
    confidence: 92,
    payload: {
      extracted_data: {
        shop_name: "Joe's Auto Repair",
        services_performed: "Oil change and tire rotation",
        labor_amount: 120.00,
        parts_used: [
          { part_name: 'Oil Filter', price: 15.99 },
          { part_name: 'Motor Oil', price: 45.00 }
        ]
      }
    }
  },
  fuel: {
    id: 'fuel-fixture',
    type: 'fuel',
    total_amount: 98.55,
    gallons: 33.182,
    confidence: 95,
    payload: {
      extracted_data: {
        shop_name: 'Shell Station',
        price_per_gallon: 2.97
      }
    }
  },
  inspection: {
    id: 'inspection-fixture',
    type: 'inspection',
    confidence: 88,
    payload: {
      result: 'passed',
      certificate_number: 'SI-2025-789456',
      extracted_data: {
        shop_name: 'State Inspection Station',
        fee_amount: 45.00
      }
    }
  }
}
