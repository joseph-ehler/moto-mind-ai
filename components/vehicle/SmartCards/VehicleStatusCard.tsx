'use client'

import React from 'react'
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react'

interface VehicleStatusCardProps {
  currentMileage: number
  nextServiceMiles?: number
  warningLights: string[]
  lastServiceDate?: string
}

export function VehicleStatusCard({
  currentMileage,
  nextServiceMiles,
  warningLights,
  lastServiceDate
}: VehicleStatusCardProps) {
  const getServiceStatus = () => {
    if (!nextServiceMiles) return null
    
    const milesUntilService = nextServiceMiles - currentMileage
    
    if (milesUntilService <= 0) {
      return {
        status: 'overdue',
        text: 'Service Overdue',
        icon: AlertTriangle
      }
    } else if (milesUntilService <= 1000) {
      return {
        status: 'due_soon',
        text: 'Service Due Soon',
        icon: Clock
      }
    } else {
      return {
        status: 'good',
        text: `${milesUntilService.toLocaleString()} mi until service`,
        icon: CheckCircle
      }
    }
  }

  const serviceStatus = getServiceStatus()

  return (
    <div className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-black">Vehicle Status</h2>
        {serviceStatus && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            serviceStatus.status === 'good' 
              ? 'bg-green-500/10 text-green-600' 
              : serviceStatus.status === 'due_soon'
              ? 'bg-amber-500/10 text-amber-600'
              : 'bg-red-500/10 text-red-600'
          }`}>
            <serviceStatus.icon className="w-4 h-4" />
            {serviceStatus.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <div className="text-sm text-black/60 mb-1">Current Mileage</div>
          <div className="text-2xl font-semibold text-black tracking-tight">
            {currentMileage.toLocaleString()} mi
          </div>
        </div>
        {nextServiceMiles && (
          <div>
            <div className="text-sm text-black/60 mb-1">Next Service</div>
            <div className="text-2xl font-semibold text-black tracking-tight">
              {nextServiceMiles.toLocaleString()} mi
            </div>
          </div>
        )}
      </div>

      {warningLights.length > 0 && (
        <div className="mb-6">
          <div className="text-sm text-black/60 mb-3">Active Warning Lights</div>
          <div className="flex flex-wrap gap-2">
            {warningLights.map((light, index) => (
              <div key={`warning-${light}-${index}`} className="px-3 py-1.5 bg-red-500/10 text-red-600 rounded-full text-sm font-medium">
                {light.replace('_', ' ').toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      )}

      {lastServiceDate && (
        <div className="pt-6 border-t border-black/5">
          <div className="text-sm text-black/60 mb-1">Last Service</div>
          <div className="font-medium text-black">{lastServiceDate}</div>
        </div>
      )}
    </div>
  )
}
