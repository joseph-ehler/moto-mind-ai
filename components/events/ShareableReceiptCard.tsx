/**
 * Shareable Receipt Card Component
 * 
 * Beautiful branded card for social media sharing
 */

'use client'

import type { EventData } from '@/types/event'
import { formatDateWithoutTimezone } from '@/utils/eventUtils'

interface ShareableReceiptCardProps {
  event: EventData
  currentMPG?: number | null
}

export function ShareableReceiptCard({ event, currentMPG }: ShareableReceiptCardProps) {
  const pricePerGallon = event.total_amount && event.gallons
    ? (event.total_amount / event.gallons).toFixed(2)
    : '0.00'

  return (
    <div 
      id="shareable-receipt-card"
      className="w-[600px] h-[800px] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 flex flex-col"
      style={{ position: 'absolute', left: '-9999px', top: 0 }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-white mb-2">
          MotoMind AI
        </h1>
        <p className="text-white/80 text-lg">
          Smart Fuel Tracking
        </p>
      </div>

      {/* Main Receipt Card */}
      <div className="flex-1 bg-white rounded-3xl p-8 shadow-2xl flex flex-col">
        {/* Station Name */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {event.display_vendor || event.vendor}
          </h2>
          <p className="text-gray-500 text-lg">
            {formatDateWithoutTimezone(event.date)}
          </p>
        </div>

        {/* Divider */}
        <div className="border-b-2 border-dashed border-gray-300 mb-6"></div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Total Cost */}
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
            <p className="text-sm font-medium text-gray-600 mb-1">Total Cost</p>
            <p className="text-4xl font-black text-green-600">
              ${event.total_amount?.toFixed(2)}
            </p>
          </div>

          {/* Gallons */}
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200">
            <p className="text-sm font-medium text-gray-600 mb-1">Gallons</p>
            <p className="text-4xl font-black text-blue-600">
              {event.gallons?.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-medium text-gray-500">Price/Gallon</p>
            <p className="text-2xl font-bold text-gray-900">${pricePerGallon}</p>
          </div>

          {currentMPG && (
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-medium text-gray-500">Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">{currentMPG.toFixed(1)} MPG</p>
            </div>
          )}

          {!currentMPG && event.miles && (
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-medium text-gray-500">Odometer</p>
              <p className="text-2xl font-bold text-gray-900">{event.miles.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Weather (if available) */}
        {event.weather_temperature_f && (
          <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 mb-6">
            <p className="text-sm text-gray-600">
              Weather: {event.weather_temperature_f}°F • {event.weather_condition}
            </p>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400 mb-2">
            ✨ Powered by AI
          </p>
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-bold">
            Track smarter with MotoMind
          </div>
        </div>
      </div>

      {/* Bottom Branding */}
      <div className="text-center mt-6">
        <p className="text-white/60 text-sm">
          motomind.ai
        </p>
      </div>
    </div>
  )
}
