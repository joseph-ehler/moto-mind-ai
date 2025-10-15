import React from 'react'

export type VehicleBodyType = 
  | 'sedan'
  | 'suv'
  | 'truck'
  | 'hatchback'
  | 'coupe'
  | 'wagon'
  | 'van'
  | 'convertible'

interface VehiclePlaceholderProps {
  bodyType: VehicleBodyType
  year: string
  make: string
  model: string
  trim?: string
  className?: string
}

// SVG vehicle silhouettes - clean, professional, 45-degree angle
const VehicleSilhouettes = {
  sedan: (
    <svg viewBox="0 0 400 240" className="w-full h-full">
      {/* Soft floor shadow */}
      <ellipse cx="200" cy="220" rx="180" ry="15" fill="rgba(0,0,0,0.08)" />
      
      {/* Sedan silhouette */}
      <path
        d="M60 180 L80 160 L120 140 L160 135 L240 135 L280 140 L320 160 L340 180 L340 190 L320 200 L80 200 L60 190 Z"
        fill="#E5E7EB"
        stroke="#D1D5DB"
        strokeWidth="1"
      />
      
      {/* Windows */}
      <path
        d="M90 160 L110 145 L150 142 L220 142 L260 145 L280 160 L280 170 L90 170 Z"
        fill="#F3F4F6"
        stroke="#D1D5DB"
        strokeWidth="1"
      />
      
      {/* Wheels */}
      <circle cx="120" cy="190" r="18" fill="#6B7280" />
      <circle cx="280" cy="190" r="18" fill="#6B7280" />
      <circle cx="120" cy="190" r="12" fill="#374151" />
      <circle cx="280" cy="190" r="12" fill="#374151" />
      
      {/* Year sticker - yellow oval in windshield */}
      <ellipse cx="200" cy="155" rx="20" ry="8" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1" />
    </svg>
  ),

  suv: (
    <svg viewBox="0 0 400 240" className="w-full h-full">
      {/* Soft floor shadow */}
      <ellipse cx="200" cy="220" rx="180" ry="15" fill="rgba(0,0,0,0.08)" />
      
      {/* SUV silhouette - taller, more upright */}
      <path
        d="M60 180 L80 140 L120 120 L160 115 L240 115 L280 120 L320 140 L340 180 L340 190 L320 200 L80 200 L60 190 Z"
        fill="#E5E7EB"
        stroke="#D1D5DB"
        strokeWidth="1"
      />
      
      {/* Windows - larger, more upright */}
      <path
        d="M90 140 L110 125 L150 122 L220 122 L260 125 L280 140 L280 160 L90 160 Z"
        fill="#F3F4F6"
        stroke="#D1D5DB"
        strokeWidth="1"
      />
      
      {/* Wheels - larger for SUV */}
      <circle cx="120" cy="190" r="22" fill="#6B7280" />
      <circle cx="280" cy="190" r="22" fill="#6B7280" />
      <circle cx="120" cy="190" r="15" fill="#374151" />
      <circle cx="280" cy="190" r="15" fill="#374151" />
      
      {/* Year sticker */}
      <ellipse cx="200" cy="135" rx="20" ry="8" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1" />
    </svg>
  ),

  truck: (
    <svg viewBox="0 0 400 240" className="w-full h-full">
      {/* Soft floor shadow */}
      <ellipse cx="200" cy="220" rx="180" ry="15" fill="rgba(0,0,0,0.08)" />
      
      {/* Truck cab */}
      <path
        d="M60 180 L80 140 L120 120 L180 115 L180 180 L60 180"
        fill="#E5E7EB"
        stroke="#D1D5DB"
        strokeWidth="1"
      />
      
      {/* Truck bed */}
      <path
        d="M180 180 L180 130 L320 130 L340 140 L340 180 L320 200 L200 200 L180 180"
        fill="#E5E7EB"
        stroke="#D1D5DB"
        strokeWidth="1"
      />
      
      {/* Cab windows */}
      <path
        d="M90 140 L110 125 L160 122 L160 160 L90 160 Z"
        fill="#F3F4F6"
        stroke="#D1D5DB"
        strokeWidth="1"
      />
      
      {/* Wheels */}
      <circle cx="120" cy="190" r="22" fill="#6B7280" />
      <circle cx="300" cy="190" r="22" fill="#6B7280" />
      <circle cx="120" cy="190" r="15" fill="#374151" />
      <circle cx="300" cy="190" r="15" fill="#374151" />
      
      {/* Year sticker */}
      <ellipse cx="125" cy="135" rx="18" ry="7" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1" />
    </svg>
  ),

  hatchback: (
    <svg viewBox="0 0 400 240" className="w-full h-full">
      {/* Soft floor shadow */}
      <ellipse cx="200" cy="220" rx="170" ry="15" fill="rgba(0,0,0,0.08)" />
      
      {/* Hatchback silhouette - shorter, sloped rear */}
      <path
        d="M70 180 L90 160 L130 140 L170 135 L230 135 L270 140 L300 160 L320 180 L320 190 L300 200 L90 200 L70 190 Z"
        fill="#E5E7EB"
        stroke="#D1D5DB"
        strokeWidth="1"
      />
      
      {/* Windows */}
      <path
        d="M100 160 L120 145 L160 142 L210 142 L250 145 L270 160 L270 170 L100 170 Z"
        fill="#F3F4F6"
        stroke="#D1D5DB"
        strokeWidth="1"
      />
      
      {/* Wheels */}
      <circle cx="130" cy="190" r="16" fill="#6B7280" />
      <circle cx="270" cy="190" r="16" fill="#6B7280" />
      <circle cx="130" cy="190" r="10" fill="#374151" />
      <circle cx="270" cy="190" r="10" fill="#374151" />
      
      {/* Year sticker */}
      <ellipse cx="190" cy="155" rx="18" ry="7" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1" />
    </svg>
  )
}

export const VehiclePlaceholder: React.FC<VehiclePlaceholderProps> = ({
  bodyType,
  year,
  make,
  model,
  trim,
  className = ''
}) => {
  const silhouette = VehicleSilhouettes[bodyType] || VehicleSilhouettes.sedan

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* SVG Vehicle Silhouette */}
      <div className="w-full max-w-md aspect-[5/3] bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {silhouette}
      </div>
      
      {/* Vehicle Info */}
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {year}
          </span>
          <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {bodyType}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {make} {model}
        </h3>
        {trim && (
          <p className="text-sm text-gray-500 mt-1">{trim}</p>
        )}
      </div>
    </div>
  )
}

export default VehiclePlaceholder
