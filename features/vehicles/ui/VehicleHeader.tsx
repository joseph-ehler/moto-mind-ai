'use client'

import React, { useState } from 'react'
import { ArrowLeft, MoreHorizontal } from 'lucide-react'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  trim?: string
  nickname?: string
  hero_image_url?: string
  vin?: string
  garage?: {
    name: string
  }
}

interface VehicleHeaderProps {
  vehicle: Vehicle
  lastOdometer: {
    miles: number
    date: string
  }
  onBack: () => void
  onEditVehicle: () => void
  onManualEntry: () => void
  onExportData: () => void
  onDeleteVehicle: () => void
}

export function VehicleHeader({
  vehicle,
  lastOdometer,
  onBack,
  onEditVehicle,
  onManualEntry,
  onExportData,
  onDeleteVehicle
}: VehicleHeaderProps) {
  const [vinCopied, setVinCopied] = useState(false)

  const displayName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  const copyVin = async () => {
    if (vehicle.vin) {
      await navigator.clipboard.writeText(vehicle.vin)
      setVinCopied(true)
      setTimeout(() => setVinCopied(false), 2000)
    }
  }

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-black/5 sticky top-0 z-10">
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center hover:bg-black/5 rounded-full transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5 text-black/70" />
          </button>
          <div>
            <h1 className="text-xl font-medium text-black tracking-tight">{displayName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-black/5 text-sm font-medium text-black/80">
                {lastOdometer.miles.toLocaleString()} mi
              </span>
              {vehicle.garage && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-500/10 text-sm font-medium text-blue-600">
                  {vehicle.garage.name}
                </span>
              )}
              {vehicle.vin && (
                <button
                  onClick={copyVin}
                  className="inline-flex items-center px-3 py-1.5 rounded-full bg-black/5 text-sm font-medium text-black/70 hover:bg-black/10 transition-all duration-200"
                  title="Click to copy VIN"
                >
                  {vinCopied ? 'Copied!' : `VIN: ${vehicle.vin.slice(-6)}`}
                </button>
              )}
            </div>
          </div>
        </div>
        
        <button className="w-9 h-9 flex items-center justify-center hover:bg-black/5 rounded-full transition-all duration-200">
          <MoreHorizontal className="h-5 w-5 text-black/70" />
        </button>
      </div>
    </header>
  )
}
