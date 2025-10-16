// Vision Metrics Dashboard - Real-time Production Monitoring
// Displays vision processing performance and accuracy metrics

import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Target, 
  TrendingUp,
  BarChart3,
  Zap
} from 'lucide-react'

interface MetricsData {
  total_requests: number
  success_rate: number
  overall_accuracy: number
  avg_processing_time_ms: number
  p95_processing_time_ms: number
  confidence_calibration_error: number
  field_accuracies: {
    [key: string]: { correct: number; total: number }
  }
  error_counts: Record<string, number>
  document_type_stats: {
    [key: string]: {
      requests: number
      success_rate: number
      avg_confidence: number
    }
  }
}

export function VisionMetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/vision-metrics')
      if (response.ok) {
        const responseData = await response.json()
        console.log('📊 Fetched metrics:', responseData)
        // Extract the actual metrics from the API response
        setMetrics(responseData.data || responseData)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch vision metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">Failed to load vision metrics</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vision Processing Metrics</h2>
          <p className="text-sm text-gray-500">
            Real-time production performance monitoring
            {lastUpdated && (
              <span className="ml-2">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Activity className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Success Rate"
          value={`${((metrics.success_rate || 0) * 100).toFixed(1)}%`}
          icon={<CheckCircle className="h-5 w-5" />}
          color={(metrics.success_rate || 0) >= 0.95 ? 'green' : (metrics.success_rate || 0) >= 0.90 ? 'yellow' : 'red'}
          subtitle={`${metrics.total_requests || 0} total requests`}
        />
        
        <MetricCard
          title="Overall Accuracy"
          value={`${((metrics.overall_accuracy || 0) * 100).toFixed(1)}%`}
          icon={<Target className="h-5 w-5" />}
          color={(metrics.overall_accuracy || 0) >= 0.90 ? 'green' : (metrics.overall_accuracy || 0) >= 0.80 ? 'yellow' : 'red'}
          subtitle="Based on validated samples"
        />
        
        <MetricCard
          title="Avg Processing Time"
          value={`${(metrics.avg_processing_time_ms || 0).toFixed(0)}ms`}
          icon={<Clock className="h-5 w-5" />}
          color={(metrics.avg_processing_time_ms || 0) <= 5000 ? 'green' : (metrics.avg_processing_time_ms || 0) <= 10000 ? 'yellow' : 'red'}
          subtitle={`P95: ${(metrics.p95_processing_time_ms || 0).toFixed(0)}ms`}
        />
        
        <MetricCard
          title="Confidence Calibration"
          value={(metrics.confidence_calibration_error || 0).toFixed(3)}
          icon={<TrendingUp className="h-5 w-5" />}
          color={(metrics.confidence_calibration_error || 0) <= 0.1 ? 'green' : (metrics.confidence_calibration_error || 0) <= 0.2 ? 'yellow' : 'red'}
          subtitle="Lower is better"
        />
      </div>

      {/* Field Accuracy Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Field Accuracy Breakdown</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.field_accuracies && Object.keys(metrics.field_accuracies).length > 0 ? (
            Object.entries(metrics.field_accuracies).map(([field, stats]) => {
              const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
              return (
                <div key={field} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {field.replace('_', ' ')}
                    </span>
                    <span className={`text-sm font-bold ${
                      accuracy >= 90 ? 'text-green-600' : 
                      accuracy >= 80 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        accuracy >= 90 ? 'bg-green-500' : 
                        accuracy >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(accuracy, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.correct}/{stats.total} samples
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No accuracy data available yet</p>
              <p className="text-sm">Field accuracy will appear as vision processing requests are validated</p>
            </div>
          )}
        </div>
      </div>

      {/* Document Type Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Document Type Performance</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Confidence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.document_type_stats && Object.keys(metrics.document_type_stats).length > 0 ? (
                Object.entries(metrics.document_type_stats).map(([type, stats]) => (
                  <tr key={type}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stats.requests || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (stats.success_rate || 0) >= 0.95 ? 'bg-green-100 text-green-800' :
                        (stats.success_rate || 0) >= 0.90 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {((stats.success_rate || 0) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {((stats.avg_confidence || 0) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No document type data available yet</p>
                    <p className="text-sm">Performance data will appear as different document types are processed</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Breakdown */}
      {metrics.error_counts && Object.keys(metrics.error_counts).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Error Breakdown</h3>
          </div>
          
          <div className="space-y-2">
            {Object.entries(metrics.error_counts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([errorCode, count]) => (
                <div key={errorCode} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded">
                  <span className="text-sm font-medium text-red-800">{errorCode}</span>
                  <span className="text-sm text-red-600">{count} occurrences</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: 'green' | 'yellow' | 'red' | 'blue'
  subtitle?: string
}

function MetricCard({ title, value, icon, color, subtitle }: MetricCardProps) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
    red: 'bg-red-100 text-red-600 border-red-200',
    blue: 'bg-blue-100 text-blue-600 border-blue-200'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
