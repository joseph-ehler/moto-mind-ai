/**
 * QualityScoreCard
 * Displays data quality score with breakdown and improvement suggestions
 */

'use client'

import { CheckCircle, XCircle } from 'lucide-react'
import type { QualityScoreResult } from '@/lib/quality-score'
import { getQualityImprovements } from '@/lib/quality-score'

interface QualityScoreCardProps {
  result: QualityScoreResult
}

export function QualityScoreCard({ result }: QualityScoreCardProps) {
  const { score, breakdown, color, label } = result
  const suggestions = getQualityImprovements(breakdown)

  const getScoreColorClass = () => {
    switch (color) {
      case 'green':
        return 'text-green-600'
      case 'yellow':
        return 'text-yellow-600'
      case 'red':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getBadgeColorClass = () => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'red':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Data Quality</h3>

        <div className="flex items-center gap-3">
          <span className={`text-3xl font-bold ${getScoreColorClass()}`}>
            {score}%
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold border ${getBadgeColorClass()}`}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Quality breakdown */}
      <div className="space-y-3 mb-6">
        <QualityMetric
          label="Photo attached"
          achieved={breakdown.hasPhoto}
          points={breakdown.photoScore}
          maxPoints={40}
        />
        <QualityMetric
          label={`Fields filled (${breakdown.fieldCount})`}
          achieved={breakdown.fieldsScore > 0}
          points={breakdown.fieldsScore}
          maxPoints={30}
        />
        <QualityMetric
          label="Odometer included"
          achieved={breakdown.odometerScore > 0}
          points={breakdown.odometerScore}
          maxPoints={15}
        />
        <QualityMetric
          label="AI confidence"
          achieved={breakdown.confidenceScore > 0}
          points={breakdown.confidenceScore}
          maxPoints={10}
        />
        <QualityMetric
          label="Notes added"
          achieved={breakdown.notesScore > 0}
          points={breakdown.notesScore}
          maxPoints={5}
        />
      </div>

      {/* Improvement suggestions */}
      {suggestions.length > 0 && (
        <div className="pt-4 border-t border-gray-300">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            💡 Improve quality by:
          </h4>
          <ul className="space-y-2">
            {suggestions.map((suggestion, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

interface QualityMetricProps {
  label: string
  achieved: boolean
  points: number
  maxPoints: number
}

function QualityMetric({ label, achieved, points, maxPoints }: QualityMetricProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {achieved ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-gray-400" />
        )}
        <span className={`text-sm ${achieved ? 'text-gray-900' : 'text-gray-500'}`}>
          {label}
        </span>
      </div>
      <span className="text-sm font-medium text-gray-600">
        <span className={achieved ? 'text-green-600' : 'text-gray-400'}>{points}</span>
        <span className="text-gray-400">/{maxPoints}</span>
      </span>
    </div>
  )
}
