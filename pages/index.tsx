import { useState } from 'react'
import Head from 'next/head'
import { FleetChat } from '../components/fleet/FleetChat'
import { VehicleList } from '../components/fleet/VehicleList'

export default function Home() {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  
  // Mock data for development
  const mockVehicles = [
    {
      id: 'truck-47',
      label: 'Truck 47',
      make: 'Ford',
      model: 'F-150',
      status: 'flagged',
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      dataQuality: 85,
      issues: ['Brake wear 87%', 'Route inefficiency']
    },
    {
      id: 'truck-23',
      label: 'Truck 23',
      make: 'Chevrolet',
      model: 'Silverado',
      status: 'healthy',
      lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      dataQuality: 92,
      issues: []
    },
    {
      id: 'van-12',
      label: 'Van 12',
      make: 'Ford',
      model: 'Transit',
      status: 'warning',
      lastSeen: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      dataQuality: 67,
      issues: ['Fuel efficiency down 12%']
    }
  ]

  return (
    <>
      <Head>
        <title>MotoMindAI - Fleet Intelligence You Can Explain</title>
        <meta name="description" content="Fleet intelligence you can explain, audit, and trust" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold text-gray-900">
                    MotoMindAI
                  </h1>
                </div>
                <div className="ml-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    Fleet Intelligence
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Demo Mode - Week 2 Development
                </span>
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Vehicle List */}
            <div className="lg:col-span-1">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Fleet Overview
                </h2>
                <VehicleList 
                  vehicles={mockVehicles}
                  selectedVehicle={selectedVehicle}
                  onSelectVehicle={setSelectedVehicle}
                />
              </div>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Fleet Intelligence Chat
                  </h2>
                  {selectedVehicle && (
                    <span className="text-sm text-gray-500">
                      Analyzing: {mockVehicles.find(v => v.id === selectedVehicle)?.label}
                    </span>
                  )}
                </div>
                
                <FleetChat 
                  selectedVehicle={selectedVehicle}
                  vehicles={mockVehicles}
                />
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Conversational Interface
              </h3>
              <p className="text-gray-600">
                Ask "Why was Truck 47 flagged?" and get instant, explainable answers
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Audit-Ready Trails
              </h3>
              <p className="text-gray-600">
                Every decision traceable with full reasoning chain for DOT compliance
              </p>
            </div>

            <div className="card p-6 text-center">
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Production-Grade
              </h3>
              <p className="text-gray-600">
                Circuit breakers, usage tracking, and tenant isolation built-in
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-500">
              <p className="text-sm">
                MotoMindAI - Fleet intelligence you can explain, audit, and trust
              </p>
              <p className="text-xs mt-2">
                Week 2 Development Build - Production safety rails active
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
