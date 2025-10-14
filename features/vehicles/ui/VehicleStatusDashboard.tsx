import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OdometerUpdateModal } from './OdometerUpdateModal'
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  Wrench, 
  Fuel,
  FileText,
  MapPin,
  Clock,
  Gauge
} from 'lucide-react'

interface VehicleStatusProps {
  vehicle: {
    id: string
    year: number
    make: string
    model: string
    nickname?: string
  }
  mileage: {
    current: number
    lastUpdated: string
  }
  garage?: {
    name: string
    location: string
  }
}

export function VehicleStatusDashboard({ vehicle, mileage, garage }: VehicleStatusProps) {
  const [showOdometerModal, setShowOdometerModal] = React.useState(false)
  const [currentMileage, setCurrentMileage] = React.useState(mileage.current)

  const handleMileageUpdated = (newMileage: number) => {
    setCurrentMileage(newMileage)
    console.log(`✅ Mileage updated to ${newMileage} for ${vehicle.year} ${vehicle.make} ${vehicle.model}`)
  }
  // Mock data - replace with real data from your APIs
  const urgentItems = [
    {
      id: 'recall',
      type: 'safety',
      title: 'Airbag Recall - Action Required',
      description: 'Safety-critical recall requiring immediate attention',
      action: 'Contact Dealer',
      severity: 'critical'
    },
    {
      id: 'registration',
      type: 'legal',
      title: 'Registration Expired',
      description: 'Expired 12 days ago - renewal required immediately',
      action: 'Renew Online',
      severity: 'high'
    }
  ]

  const upcomingItems = [
    {
      id: 'oil',
      type: 'maintenance',
      title: 'Oil Change Due Soon',
      description: 'Due in ~380 miles or 2 weeks',
      dueDate: 'Oct 15, 2024',
      action: 'Schedule Service'
    },
    {
      id: 'inspection',
      type: 'legal',
      title: 'Annual Inspection',
      description: 'Due in Florida by March 2025',
      dueDate: 'Mar 2025',
      action: 'Find Station'
    }
  ]

  const currentStatus = {
    healthScore: 85,
    lastService: {
      type: 'Oil Change',
      date: 'Aug 15, 2024',
      mileage: 52600
    },
    nextService: {
      type: 'Oil Change',
      dueMiles: 55000,
      dueDate: 'Oct 15, 2024'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-900'
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-900'
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-900'
      default: return 'bg-gray-100 border-gray-300 text-gray-900'
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Vehicle Header - Compact */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <span className="font-medium">{currentMileage.toLocaleString()} mi</span>
              <span>•</span>
              <span>Updated {mileage.lastUpdated}</span>
              {garage && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{garage.name}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getHealthColor(currentStatus.healthScore)}`}>
              {currentStatus.healthScore}
            </div>
            <div className="text-xs text-gray-500">Health Score</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={() => setShowOdometerModal(true)}
              variant="outline"
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <Gauge className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Update Odometer</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <Fuel className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Log Fuel</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <Wrench className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">Log Service</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <FileText className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Add Document</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* URGENT - Only show if items exist */}
      {urgentItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="font-semibold text-red-900">Needs Immediate Attention</h2>
            </div>
            <div className="space-y-3">
              {urgentItems.map((item) => (
                <div key={item.id} className={`p-3 rounded-lg border-l-4 ${getSeverityColor(item.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm mt-1">{item.description}</p>
                    </div>
                    <Button size="sm" variant="outline" className="ml-4">
                      {item.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* UPCOMING - Only show if items exist */}
      {upcomingItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-orange-600" />
              <h2 className="font-semibold text-orange-900">Coming Up</h2>
            </div>
            <div className="space-y-3">
              {upcomingItems.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-orange-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>Due {item.dueDate}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="ml-4">
                      {item.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CURRENT STATUS */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h2 className="font-semibold text-green-900">Current Status</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <h3 className="font-medium text-gray-900 mb-2">Recent Service</h3>
              <div className="text-sm text-gray-600">
                <p>{currentStatus.lastService.type} on {currentStatus.lastService.date}</p>
                <p>at {currentStatus.lastService.mileage.toLocaleString()} miles</p>
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <h3 className="font-medium text-gray-900 mb-2">Next Service</h3>
              <div className="text-sm text-gray-600">
                <p>{currentStatus.nextService.type}</p>
                <p>Due at {currentStatus.nextService.dueMiles.toLocaleString()} mi</p>
                <p>or by {currentStatus.nextService.dueDate}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QUICK ACTIONS - Always visible */}
      <Card>
        <CardContent className="p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Log Service
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Update Miles
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              Add Fuel
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Odometer Update Modal */}
      <OdometerUpdateModal
        isOpen={showOdometerModal}
        onClose={() => setShowOdometerModal(false)}
        vehicleId={vehicle.id}
        vehicleName={vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        currentMileage={currentMileage}
        onMileageUpdated={handleMileageUpdated}
      />
    </div>
  )
}
