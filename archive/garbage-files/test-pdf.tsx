import React, { useState } from 'react'
import { PDFExportButton } from '../components/ui/PDFExportButton'
import { ExplanationResult } from '../components/explain/ExplanationResult'

export default function TestPDFPage() {
  const [testResult, setTestResult] = useState({
    type: 'ai_explanation' as 'ai_explanation' | 'insufficient_data',
    explanation: `Based on your recent fuel and odometer data, your vehicle's fuel efficiency appears to be within normal range.

**Root Cause:** Recent driving patterns and fuel consumption align with expected performance for your vehicle type.

**Evidence:**
• Odometer reading of 123,456 miles shows consistent usage
• Fuel purchase of 15.2 gallons at $4.89/gallon indicates normal consumption
• Calculated MPG of 28.5 is close to your baseline of 30 MPG

**Next Steps:**
1. Continue monitoring fuel efficiency trends over the next month
2. Consider adding maintenance records for more complete analysis`,
    rootCause: 'Recent driving patterns and fuel consumption align with expected performance for your vehicle type.',
    evidence: [
      'Odometer reading of 123,456 miles shows consistent usage',
      'Fuel purchase of 15.2 gallons at $4.89/gallon indicates normal consumption',
      'Calculated MPG of 28.5 is close to your baseline of 30 MPG'
    ],
    nextSteps: [
      'Continue monitoring fuel efficiency trends over the next month',
      'Consider adding maintenance records for more complete analysis'
    ],
    dataQuality: {
      completeness: 75,
      missingItems: ['maintenance record']
    },
    confidence: 'Medium'
  })

  const demoVehicleId = '550e8400-e29b-41d4-a716-446655440002'
  const demoQuestion = 'Why is my fuel efficiency lower than expected?'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">PDF Export Test</h1>
          
          {/* Test PDF Export Button */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-medium mb-4">Test PDF Generation</h2>
            <div className="flex space-x-4">
              <PDFExportButton 
                vehicleId={demoVehicleId}
                question={demoQuestion}
              />
              <button
                onClick={() => setTestResult({
                  ...testResult,
                  type: testResult.type === 'ai_explanation' ? 'insufficient_data' : 'ai_explanation'
                })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Toggle Result Type
              </button>
            </div>
          </div>

          {/* Test Explanation Result */}
          <ExplanationResult
            vehicleId={demoVehicleId}
            question={demoQuestion}
            result={testResult}
            onAddData={(type) => console.log('Add data:', type)}
          />

          {/* Test Data */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Test Data Preview</h3>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify({ vehicleId: demoVehicleId, question: demoQuestion, result: testResult }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
