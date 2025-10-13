// Vision Metrics Monitoring Page
// Real-time dashboard to validate 95% accuracy claim with production data

import React from 'react'
import { VisionMetricsDashboard } from '../../components/monitoring/VisionMetricsDashboard'

export default function VisionMetricsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vision Processing Metrics</h1>
          <p className="mt-2 text-lg text-gray-600">
            Real-time monitoring to validate our 95% accuracy claim with production data
          </p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Production Validation in Progress
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    We tested 95% accuracy on 3 corrected dashboard images. This dashboard tracks real-world performance 
                    to validate whether that accuracy holds with diverse user uploads and production conditions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <VisionMetricsDashboard />
      </div>
    </div>
  )
}
