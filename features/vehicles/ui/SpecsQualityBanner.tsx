import React from 'react'
import { CheckCircle, AlertCircle, Info, HelpCircle } from 'lucide-react'
import { SpecQuality, getQualityExplanation, getExpectedQuality } from '@/lib/utils/spec-quality'

interface SpecsQualityBannerProps {
  quality: SpecQuality
  completeness: number
  year: number
  make: string
  model: string
  foundFields: number
  totalFields: number
}

export function SpecsQualityBanner({ 
  quality, 
  completeness, 
  year, 
  make, 
  model,
  foundFields,
  totalFields 
}: SpecsQualityBannerProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  
  const percentage = Math.round(completeness * 100)
  
  if (quality === 'comprehensive') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="text-green-600 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-green-900">Complete specifications available</div>
            <p className="text-sm text-green-700 mt-1">
              We found comprehensive manufacturer data for your {year} {make} {model}. 
              All maintenance recommendations are vehicle-specific.
            </p>
            <div className="mt-2 text-xs text-green-600">
              {foundFields} of {totalFields} critical fields found ({percentage}%)
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (quality === 'partial') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-yellow-600 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium text-yellow-900">Mixed manufacturer & industry-standard data</div>
            <p className="text-sm text-yellow-700 mt-1">
              Some manufacturer-specific data is available for your {year} {make} {model}. 
              Where manufacturer data is missing, we're showing industry-standard recommendations 
              from independent mechanics.
            </p>
            <div className="mt-3 p-3 bg-yellow-100/50 rounded-lg text-xs text-yellow-800">
              <strong>✓ You'll see complete guidance below</strong> - manufacturer data where 
              available, conservative industry standards where not. You can customize any interval 
              to match your owner's manual.
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs">
              <span className="text-yellow-600">
                Manufacturer data: {foundFields} of {totalFields} fields ({percentage}%)
              </span>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-yellow-600 hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                Why?
              </button>
            </div>
            
            {showDetails && (
              <div className="mt-3 pt-3 border-t border-yellow-200 text-xs text-yellow-700 space-y-2">
                <p>Specification completeness depends on vehicle age and manufacturer documentation:</p>
                <ul className="list-disc ml-4 space-y-1">
                  <li><strong>2020+ vehicles:</strong> Usually 80-95% complete</li>
                  <li><strong>2010-2019 vehicles:</strong> Typically 60-80% complete</li>
                  <li><strong>Pre-2010 vehicles:</strong> Often 40-60% complete</li>
                </ul>
                <p className="pt-2">
                  Missing manufacturer data doesn't prevent maintenance tracking. 
                  We provide industry-standard recommendations and you can customize any interval.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  // generic
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <Info className="text-blue-600 w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="font-medium text-blue-900">Using industry-standard recommendations</div>
          <p className="text-sm text-blue-700 mt-1">
            Manufacturer-specific intervals unavailable for your {year} {make} {model}. 
            The maintenance intervals shown are conservative recommendations from independent 
            mechanics that work for most vehicles. Consult your owner's manual for exact 
            factory specifications.
          </p>
          <div className="mt-3 p-3 bg-blue-100/50 rounded-lg text-xs text-blue-800">
            <strong>✓ You'll see complete maintenance guidance below</strong> - we show 
            industry-standard intervals for all critical services (oil change, tire rotation, 
            brake fluid, etc.) even when manufacturer data isn't available.
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <span className="text-blue-600">
              Manufacturer data: {foundFields} of {totalFields} fields ({percentage}%)
            </span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              Learn more
            </button>
          </div>
          
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-blue-700 space-y-2">
              <p><strong>Why is manufacturer data limited?</strong></p>
              <p>
                Manufacturer maintenance schedules are often published in PDF owner's manuals 
                that aren't indexed by search engines. Older vehicles have even less publicly 
                available documentation.
              </p>
              <p className="pt-2">
                <strong>What we show instead:</strong> Industry-standard maintenance intervals 
                recommended by mechanics and automotive experts. These work for most vehicles 
                and err on the side of more frequent service for longevity.
              </p>
              <p className="pt-2">
                <strong>Your owner's manual:</strong> Always consult your printed owner's manual 
                for manufacturer-specific recommendations. You can customize any interval below 
                to match your manual.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
