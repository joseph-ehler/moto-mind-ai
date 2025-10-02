import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Wrench, 
  Gauge, 
  Fuel, 
  AlertTriangle, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Car
} from 'lucide-react'
import { 
  computeHealthScore, 
  getHealthColor, 
  getHealthEmoji,
  pickNextAction,
  getPriorityReason,
  generateMockAlerts,
  generateMockDueItems,
  type VehicleAlerts,
  type DueItem,
  type ResearchStatus
} from '@/lib/vehicle-health'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  trim?: string
  nickname?: string
  vin?: string
  hero_image_url?: string
  enrichment?: any
  garage_id?: string
  created_at: string
  updated_at: string
}

interface VehicleRowProps {
  vehicle: Vehicle
  density?: 'comfortable' | 'compact'
}

export function VehicleRow({ vehicle, density = 'comfortable' }: VehicleRowProps) {
  // Generate mock data for development
  const alerts = generateMockAlerts(vehicle)
  const dueItems = generateMockDueItems(alerts)
  const nextAction = pickNextAction(dueItems)
  const healthScore = computeHealthScore(alerts)
  const healthColor = getHealthColor(healthScore)
  const healthEmoji = getHealthEmoji(healthScore)
  const priorityReason = getPriorityReason(alerts, nextAction)
  
  // Mock data
  const estimatedMileage = Math.floor(Math.random() * 100000) + 20000
  const drivetrain = vehicle.enrichment?.drivetrain || 'FWD'
  const fuelType = vehicle.enrichment?.engine?.fuel_type || 'Gasoline'
  
  // Research status (mock)
  const researchStatus: ResearchStatus = vehicle.enrichment && Object.keys(vehicle.enrichment).length > 3 
    ? 'verified' 
    : 'partial'

  const isCompact = density === 'compact'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className={isCompact ? 'p-3' : 'p-4'}>
        <div className="flex items-start gap-4">
          {/* Vehicle Thumbnail */}
          <div className={`${isCompact ? 'h-12 w-16' : 'h-16 w-24'} bg-muted rounded-md overflow-hidden flex-shrink-0`}>
            {vehicle.hero_image_url ? (
              <img 
                src={vehicle.hero_image_url} 
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                <Car className={isCompact ? 'h-4 w-4' : 'h-6 w-6'} />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className={`font-semibold truncate ${isCompact ? 'text-sm' : 'text-base'}`}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                  {vehicle.trim && ` ${vehicle.trim}`}
                  {vehicle.nickname && (
                    <span className="text-muted-foreground font-normal"> — {vehicle.nickname}</span>
                  )}
                </h3>
                <div className={`text-muted-foreground ${isCompact ? 'text-xs' : 'text-sm'} mt-0.5`}>
                  {estimatedMileage.toLocaleString()} mi • {drivetrain} • {fuelType}
                </div>
              </div>
              
              {/* Health Score */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge 
                  variant={healthColor === 'green' ? 'default' : 'secondary'}
                  className={`${isCompact ? 'text-xs' : 'text-sm'} ${
                    healthColor === 'red' ? 'bg-red-100 text-red-800' :
                    healthColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}
                >
                  {healthEmoji} {healthScore}
                </Badge>
                <ResearchIndicator status={researchStatus} compact={isCompact} />
              </div>
            </div>

            {/* Priority/Next Action */}
            <div className={`${isCompact ? 'text-xs' : 'text-sm'} mt-2 flex items-center gap-2 flex-wrap`}>
              <span className="font-medium">
                {nextAction ? (
                  <>
                    <strong>Next:</strong> {nextAction.label}
                    {nextAction.severity === 'overdue' ? (
                      <span className="text-red-600 ml-1">overdue</span>
                    ) : nextAction.etaMiles != null ? (
                      <span className="text-muted-foreground ml-1">in {nextAction.etaMiles} mi</span>
                    ) : nextAction.etaDays != null ? (
                      <span className="text-muted-foreground ml-1">in {nextAction.etaDays} days</span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-muted-foreground">No actions pending</span>
                )}
              </span>
              
              {/* Critical Alert Chips */}
              {alerts.recallOpen && (
                <Badge variant="destructive" className={isCompact ? 'text-xs' : 'text-sm'}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Recall
                </Badge>
              )}
              {alerts.regExpired && (
                <Badge variant="destructive" className={isCompact ? 'text-xs' : 'text-sm'}>
                  Registration expired
                </Badge>
              )}
            </div>

            {/* Actions Row */}
            <div className={`${isCompact ? 'mt-2' : 'mt-3'} flex items-center justify-between gap-2`}>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  size={isCompact ? 'sm' : 'default'} 
                  className="gap-1"
                  onClick={() => alert('Maintenance logging coming soon!')}
                >
                  <Wrench className="h-4 w-4" />
                  {isCompact ? 'Log' : 'Log Maintenance'}
                </Button>
                
                <Button 
                  size={isCompact ? 'sm' : 'default'} 
                  variant="outline" 
                  className="gap-1"
                  onClick={() => alert('Odometer update coming soon!')}
                >
                  <Gauge className="h-4 w-4" />
                  {isCompact ? 'Miles' : 'Update Odometer'}
                </Button>
                
                <Button 
                  size={isCompact ? 'sm' : 'default'} 
                  variant="outline" 
                  className="gap-1"
                  onClick={() => alert('Fuel logging coming soon!')}
                >
                  <Fuel className="h-4 w-4" />
                  {isCompact ? 'Fuel' : 'Add Fuel'}
                </Button>
              </div>

              {/* Open Link */}
              <Link 
                href={`/vehicles/${vehicle.id}`}
                className={`${isCompact ? 'text-xs' : 'text-sm'} text-muted-foreground hover:text-foreground transition-colors`}
              >
                Open →
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ResearchIndicator({ status, compact }: { status: ResearchStatus; compact: boolean }) {
  const config = {
    verified: { 
      icon: ShieldCheck, 
      color: 'text-green-600', 
      bg: 'bg-green-100', 
      tooltip: 'Research complete - all data verified' 
    },
    partial: { 
      icon: Shield, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100', 
      tooltip: 'Research in progress - some data available' 
    },
    attention: { 
      icon: ShieldAlert, 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-100', 
      tooltip: 'Research needs attention - conflicts found' 
    },
    pending: { 
      icon: Shield, 
      color: 'text-gray-600', 
      bg: 'bg-gray-100', 
      tooltip: 'Research pending - starting soon' 
    },
  }

  const { icon: Icon, color, bg, tooltip } = config[status]

  return (
    <div 
      className={`${bg} ${color} p-1 rounded-full ${compact ? 'h-6 w-6' : 'h-7 w-7'} flex items-center justify-center`}
      title={tooltip}
    >
      <Icon className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
    </div>
  )
}
