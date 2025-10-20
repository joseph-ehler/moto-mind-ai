/**
 * Vehicle Confirmation Step
 * 
 * Shows decoded vehicle with:
 * - Vehicle card (year • make • model • trim • engine)
 * - Micro-insight (safety + EPA from rollup)
 * - "Looks right" to continue
 * - "Edit VIN" to go back
 */

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, ShieldCheck, Leaf, Edit } from 'lucide-react'
import { useVehicleOnboarding } from '@/flows/vehicle/store'
import { useWizardAnalytics } from '@/hooks/useWizardAnalytics'
import { useValidation } from '@/wizard/validation-context'

export function VehicleConfirm() {
  const { vehicle, rollup } = useVehicleOnboarding()
  const analytics = useWizardAnalytics('vehicle')
  const { setValid } = useValidation()
  
  // Track step view
  useEffect(() => {
    analytics.trackStepView('vehicle_confirm', 2, 'vehicle-basics')
  }, [analytics])
  
  // Always valid (can continue)
  useEffect(() => {
    setValid(true)
  }, [setValid])
  
  const handleEditVin = () => {
    analytics.trackStepView('vehicle_confirm_edit_vin', 2, 'vehicle-basics')
    // This will be wired to wizard.jumpTo('vin') in parent
    window.history.back()
  }
  
  if (!vehicle) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-gray-600">No vehicle data found. Please go back and enter your VIN.</p>
        </div>
      </div>
    )
  }
  
  // Build display title
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const subtitle = vehicle.trim || vehicle.engine || null
  
  // Get micro-insight
  const safetyInfo = rollup?.safety
  const epaInfo = rollup?.epa
  
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Vehicle Card */}
      <Card className="border-2 border-blue-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Main info */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {title}
              </h2>
              {subtitle && (
                <p className="text-lg text-gray-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            
            {/* Secondary details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {vehicle.bodyClass && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Body</p>
                  <p className="text-sm font-medium text-gray-900">{vehicle.bodyClass}</p>
                </div>
              )}
              
              {vehicle.drivetrain && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Drivetrain</p>
                  <p className="text-sm font-medium text-gray-900">{vehicle.drivetrain}</p>
                </div>
              )}
              
              {vehicle.engine && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Engine</p>
                  <p className="text-sm font-medium text-gray-900">{vehicle.engine}</p>
                </div>
              )}
              
              {vehicle.fuelType && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Fuel</p>
                  <p className="text-sm font-medium text-gray-900">{vehicle.fuelType}</p>
                </div>
              )}
            </div>
            
            {/* VIN display */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide">VIN</p>
              <p className="text-sm font-mono text-gray-900 mt-1">{vehicle.vin}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Micro-insights */}
      {(safetyInfo || epaInfo) && (
        <div className="flex flex-wrap gap-3">
          {safetyInfo && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-gray-700">
                <strong className="font-medium">Safety:</strong>{' '}
                {safetyInfo.riskLevel === 'low' && 'Low risk'}
                {safetyInfo.riskLevel === 'medium' && 'Medium risk'}
                {safetyInfo.riskLevel === 'high' && 'High risk'}
                {safetyInfo.score !== undefined && ` (${safetyInfo.score} recalls)`}
              </span>
            </div>
          )}
          
          {epaInfo?.class && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
              <Leaf className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">
                <strong className="font-medium">EPA:</strong> {epaInfo.class}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={handleEditVin}
          className="flex items-center gap-2 sm:order-2"
        >
          <Edit className="w-4 h-4" />
          Edit VIN
        </Button>
        
        <Button
          onClick={() => analytics.trackStepComplete('vehicle_confirm_accept', 2, 'vehicle-basics')}
          className="flex-1 sm:order-1"
          size="lg"
        >
          Looks right
        </Button>
      </div>
      
      {/* Helper text */}
      <p className="text-xs text-center text-gray-500">
        Don't worry, you can update these details later if needed.
      </p>
    </div>
  )
}
