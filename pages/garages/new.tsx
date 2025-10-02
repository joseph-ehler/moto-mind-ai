import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { GarageForm } from '@/components/garage/GarageForm'
import { AppNavigation } from '@/components/layout/AppNavigation'
import { ArrowLeft } from 'lucide-react'

interface Garage {
  id?: string
  name: string
  address: string
  lat?: number
  lng?: number
  timezone?: string
  is_default?: boolean
}

export default function NewGaragePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSave = async (garageData: Garage) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/garages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: garageData.name,
          address: garageData.address,
          lat: garageData.lat,
          lng: garageData.lng,
          timezone: garageData.timezone,
          isDefault: garageData.is_default
        }),
      })

      if (response.ok) {
        router.push('/garages')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating garage:', error)
      alert('Failed to create garage')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/garages')
  }

  return (
    <div className="min-h-screen bg-white">
      <AppNavigation />
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/garages')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Garages</span>
          </button>
          
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Add New Garage</h1>
            <p className="text-gray-600 mt-1">
              Create a new location for organizing your vehicles
            </p>
          </div>
        </div>

        {/* Form */}
        <GarageForm
          onSave={handleSave}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  )
}
