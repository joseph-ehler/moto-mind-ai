import React from 'react'
import { PDFExportButton, ShareablePDFLink } from '../ui/PDFExportButton'

interface ExplanationResultProps {
  vehicleId: string
  question: string
  result: {
    type: 'ai_explanation' | 'insufficient_data'
    explanation: string
    rootCause?: string
    evidence?: string[]
    nextSteps?: string[]
    dataQuality: {
      completeness: number
      missingItems: string[]
    }
    confidence?: string
    nextActions?: string[]
  }
  onAddData?: (type: string) => void
}

export function ExplanationResult({ vehicleId, question, result, onAddData }: ExplanationResultProps) {
  const isInsufficientData = result.type === 'insufficient_data'

  return (
    <div className="space-y-6">
      {/* Header with Export Options */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Analysis Result</h3>
          <p className="text-sm text-gray-600 mt-1">
            Data Quality: {result.dataQuality.completeness}% • 
            {result.confidence && ` Confidence: ${result.confidence}`}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <PDFExportButton 
            vehicleId={vehicleId}
            question={question}
            className="text-xs"
          />
          <ShareablePDFLink 
            vehicleId={vehicleId}
            question={question}
            className="text-xs"
          />
        </div>
      </div>

      {/* Main Explanation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {isInsufficientData ? (
          <InsufficientDataResult result={result} onAddData={onAddData} />
        ) : (
          <AIExplanationResult result={result} />
        )}
      </div>

      {/* Next Actions */}
      {(result.nextActions || result.nextSteps) && (
        <NextActionsSection 
          actions={result.nextActions || result.nextSteps || []}
          onAddData={onAddData}
          isInsufficientData={isInsufficientData}
        />
      )}
    </div>
  )
}

function InsufficientDataResult({ result, onAddData }: { 
  result: ExplanationResultProps['result']
  onAddData?: (type: string) => void 
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">📊</span>
        </div>
        <div className="ml-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Need More Data for Analysis
          </h4>
          <div className="prose prose-sm text-gray-700">
            {result.explanation.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-2">{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Missing Items Chips */}
      {result.dataQuality.missingItems.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-600">Add next:</span>
          {result.dataQuality.missingItems.map((item, index) => (
            <button
              key={index}
              onClick={() => onAddData?.(item)}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
            >
              <span className="mr-1">+</span>
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AIExplanationResult({ result }: { result: ExplanationResultProps['result'] }) {
  return (
    <div className="space-y-4">
      {/* Root Cause */}
      {result.rootCause && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <span className="mr-2">🎯</span>
            Root Cause
          </h4>
          <p className="text-gray-700">{result.rootCause}</p>
        </div>
      )}

      {/* Evidence */}
      {result.evidence && result.evidence.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <span className="mr-2">📋</span>
            Supporting Evidence
          </h4>
          <ul className="space-y-1">
            {result.evidence.map((item, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start">
                <span className="mr-2 text-gray-400">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full Explanation */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
          <span className="mr-2">💡</span>
          Detailed Analysis
        </h4>
        <div className="prose prose-sm text-gray-700">
          {result.explanation.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-2">{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

function NextActionsSection({ 
  actions, 
  onAddData, 
  isInsufficientData 
}: { 
  actions: string[]
  onAddData?: (type: string) => void
  isInsufficientData: boolean
}) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
        <span className="mr-2">⚡</span>
        {isInsufficientData ? 'Quick Actions' : 'Recommended Next Steps'}
      </h4>
      
      <div className="space-y-2">
        {actions.map((action, index) => (
          <div key={index} className="flex items-start">
            <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium flex items-center justify-center mt-0.5 mr-3">
              {index + 1}
            </span>
            <span className="text-sm text-blue-800">{action}</span>
          </div>
        ))}
      </div>

      {isInsufficientData && (
        <div className="mt-4 pt-3 border-t border-blue-200">
          <p className="text-xs text-blue-700">
            💡 <strong>Tip:</strong> Adding more data improves analysis accuracy and unlocks advanced insights.
          </p>
        </div>
      )}
    </div>
  )
}
