/**
 * Vehicle Confirmation Card - Simplified Onboarding
 * 
 * Shows MINIMAL info during onboarding:
 * - Vehicle basics
 * - 4 key specs
 * - 2-3 safety highlights
 * - Progressive disclosure for full details
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Car, 
  Camera, 
  Gauge, 
  Eye, 
  ChevronDown,
  Shield,
  Zap,
  AlertTriangle
} from 'lucide-react'
import type { NormalizedVehicleData } from '@/lib/vin/normalized-types'

interface VehicleConfirmCardProps {
  vehicle: NormalizedVehicleData
  recalls?: Array<{
    nhtsaId: string
    subject: string
    summary: string
  }>
}

export function VehicleConfirmCard({ vehicle, recalls = [] }: VehicleConfirmCardProps) {
  const [showFullSpecs, setShowFullSpecs] = useState(false)
  
  // Key safety highlights (show max 3-4)
  const safetyHighlights = []
  
  if (vehicle.safety.backupCamera === 'standard') {
    safetyHighlights.push({
      icon: Camera,
      label: 'Backup Camera',
      type: 'standard'
    })
  }
  
  if (vehicle.safety.adaptiveCruiseControl !== 'not_available') {
    safetyHighlights.push({
      icon: Gauge,
      label: 'Adaptive Cruise',
      type: vehicle.safety.adaptiveCruiseControl
    })
  }
  
  if (vehicle.safety.blindSpotMonitoring !== 'not_available') {
    safetyHighlights.push({
      icon: Eye,
      label: 'Blind Spot Monitor',
      type: vehicle.safety.blindSpotMonitoring
    })
  }
  
  if (vehicle.safety.abs === 'standard') {
    safetyHighlights.push({
      icon: Shield,
      label: 'ABS',
      type: 'standard'
    })
  }
  
  return (
    <div className="space-y-4">
      {/* Recalls Alert */}
      {recalls.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {recalls.length} Open Recall{recalls.length > 1 ? 's' : ''}
          </AlertTitle>
          <AlertDescription>
            {recalls[0].subject}
            <Button variant="link" size="sm" className="ml-2 p-0 h-auto">
              View Details
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Hero Card - Minimal & Focused */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-6">
            {/* Vehicle Icon */}
            <div className="w-48 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center">
              <Car className="w-16 h-16 text-gray-400" />
              <p className="text-xs text-gray-500 mt-2">Photo coming soon</p>
            </div>
            
            {/* Key Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              {vehicle.trim && (
                <p className="text-gray-600 mt-1">
                  {vehicle.trim}
                </p>
              )}
              
              {/* Quick Stats - 4 ONLY */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Body Type</p>
                  <p className="font-medium">{vehicle.bodyClass || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Drive Type</p>
                  <p className="font-medium uppercase">
                    {vehicle.performance.drivetrain.type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Engine</p>
                  <p className="font-medium">
                    {vehicle.performance.engine.displacement.liters}L V{vehicle.performance.engine.cylinders}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Fuel</p>
                  <p className="font-medium capitalize">
                    {vehicle.performance.fuel.primaryType || 'Gasoline'}
                  </p>
                </div>
              </div>
              
              {/* Safety Highlights - 3-4 MAX */}
              {safetyHighlights.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Key Features</p>
                  <div className="flex gap-2 flex-wrap">
                    {safetyHighlights.slice(0, 4).map((feature, i) => (
                      <Badge 
                        key={i} 
                        variant={feature.type === 'standard' ? 'default' : 'secondary'}
                      >
                        <feature.icon className="w-3 h-3 mr-1" />
                        {feature.label}
                        {feature.type === 'optional' && (
                          <span className="ml-1 text-xs opacity-70">(opt)</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Collapsible Full Specs */}
      <Collapsible open={showFullSpecs} onOpenChange={setShowFullSpecs}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full">
            <ChevronDown className={`mr-2 h-4 w-4 transition-transform ${showFullSpecs ? 'rotate-180' : ''}`} />
            {showFullSpecs ? 'Hide' : 'View'} Full Specifications
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Specifications</CardTitle>
              <CardDescription>
                All available data from NHTSA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Performance */}
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-3">
                  Performance
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Engine Model</p>
                    <p className="font-medium">{vehicle.performance.engine.model || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Configuration</p>
                    <p className="font-medium">{vehicle.performance.engine.configuration || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Displacement</p>
                    <p className="font-medium">
                      {vehicle.performance.engine.displacement.liters}L ({vehicle.performance.engine.displacement.cc} cc)
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Horsepower</p>
                    <p className="font-medium">
                      {vehicle.performance.engine.horsepower ? `${vehicle.performance.engine.horsepower} HP` : 'Unknown'}
                    </p>
                  </div>
                  {vehicle.performance.engine.turbo === 'yes' && (
                    <div>
                      <p className="text-gray-500">Turbo</p>
                      <Badge variant="default">
                        <Zap className="w-3 h-3 mr-1" />
                        Turbocharged
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Safety Features - ACCURATE! */}
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-3">
                  Safety Features
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <SafetyFeatureItem 
                    label="ABS" 
                    status={vehicle.safety.abs}
                  />
                  <SafetyFeatureItem 
                    label="Electronic Stability Control" 
                    status={vehicle.safety.electronicStabilityControl}
                  />
                  <SafetyFeatureItem 
                    label="Traction Control" 
                    status={vehicle.safety.tractionControl}
                  />
                  <SafetyFeatureItem 
                    label="Backup Camera" 
                    status={vehicle.safety.backupCamera}
                  />
                  <SafetyFeatureItem 
                    label="Adaptive Cruise Control" 
                    status={vehicle.safety.adaptiveCruiseControl}
                  />
                  <SafetyFeatureItem 
                    label="Blind Spot Monitoring" 
                    status={vehicle.safety.blindSpotMonitoring}
                  />
                  <SafetyFeatureItem 
                    label="Forward Collision Warning" 
                    status={vehicle.safety.forwardCollisionWarning}
                  />
                  <SafetyFeatureItem 
                    label="Lane Departure Warning" 
                    status={vehicle.safety.laneDepartureWarning}
                  />
                  <SafetyFeatureItem 
                    label="Parking Assist" 
                    status={vehicle.safety.parkingAssist}
                  />
                  <SafetyFeatureItem 
                    label="TPMS" 
                    status={vehicle.safety.tpms === 'direct' ? 'standard' : vehicle.safety.tpms === 'indirect' ? 'optional' : 'not_available'}
                  />
                </div>
                
                {/* Air Bags */}
                <div className="mt-4">
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Air Bags</p>
                  <div className="flex gap-2 flex-wrap">
                    {vehicle.safety.airBags.front === 'yes' && (
                      <Badge variant="secondary">Front</Badge>
                    )}
                    {vehicle.safety.airBags.side === 'yes' && (
                      <Badge variant="secondary">Side</Badge>
                    )}
                    {vehicle.safety.airBags.curtain === 'yes' && (
                      <Badge variant="secondary">Curtain</Badge>
                    )}
                    {vehicle.safety.airBags.knee === 'yes' && (
                      <Badge variant="secondary">Knee</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Manufacturing */}
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-3">
                  Manufacturing
                </h3>
                <p className="text-sm">
                  Built by <span className="font-medium">{vehicle.manufacturing.manufacturer}</span> in{' '}
                  <span className="font-medium">{vehicle.manufacturing.plant.location || 'Unknown'}</span>
                </p>
              </div>
              
              {/* Truck Features (if applicable) */}
              {vehicle.truck.isTruck && (
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-3">
                    Truck Features
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {vehicle.truck.cab.type && (
                      <div>
                        <p className="text-gray-500">Cab Type</p>
                        <p className="font-medium">{vehicle.truck.cab.type}</p>
                      </div>
                    )}
                    {vehicle.truck.bed.type && (
                      <div>
                        <p className="text-gray-500">Bed Type</p>
                        <p className="font-medium">{vehicle.truck.bed.type}</p>
                      </div>
                    )}
                    {vehicle.truck.bed.lengthInches && (
                      <div>
                        <p className="text-gray-500">Bed Length</p>
                        <p className="font-medium">{vehicle.truck.bed.lengthInches}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Data Quality */}
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Data Quality: {vehicle.normalization.dataQuality.completeness}% complete
                  ({vehicle.normalization.fieldsNormalized} fields from NHTSA)
                </p>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function SafetyFeatureItem({ 
  label, 
  status 
}: { 
  label: string
  status: 'standard' | 'optional' | 'not_available' | 'unknown' | string
}) {
  let badge = null
  
  if (status === 'standard') {
    badge = <Badge variant="default" className="ml-auto">Standard</Badge>
  } else if (status === 'optional') {
    badge = <Badge variant="secondary" className="ml-auto">Optional</Badge>
  } else if (status === 'not_available' || status === 'unknown') {
    badge = <span className="ml-auto text-gray-400 text-xs">Not available</span>
  }
  
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-gray-700">{label}</span>
      {badge}
    </div>
  )
}
