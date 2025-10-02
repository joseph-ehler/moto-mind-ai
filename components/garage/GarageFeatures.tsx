import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Thermometer, 
  Wrench, 
  AlertTriangle, 
  Car,
  Clock,
  Navigation,
  Shield,
  FileText,
  Star
} from 'lucide-react'

interface Garage {
  id: string
  name: string
  address: string
  lat?: number
  lng?: number
  timezone?: string
  is_default?: boolean
  vehicleCount?: number
}

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  nickname?: string
  garage_id?: string
}

interface GarageFeaturesProps {
  garage: Garage
  vehicles: Vehicle[]
}

interface WeatherAlert {
  type: 'freeze' | 'heat' | 'storm' | 'hail'
  severity: 'low' | 'medium' | 'high'
  message: string
  recommendation: string
}

interface MaintenanceReminder {
  vehicleId: string
  vehicleName: string
  type: string
  dueDate: string
  priority: 'high' | 'medium' | 'low'
  description: string
}

interface ServiceProvider {
  name: string
  type: 'mechanic' | 'oil_change' | 'tire' | 'body_shop' | 'inspection'
  rating: number
  distance: string
  phone?: string
}

export function GarageFeatures({ garage, vehicles }: GarageFeaturesProps) {
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([])
  const [maintenanceReminders, setMaintenanceReminders] = useState<MaintenanceReminder[]>([])
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGarageFeatures()
  }, [garage.id])

  const loadGarageFeatures = async () => {
    try {
      // Simulate loading garage-specific features
      // In production, these would be real API calls
      
      // Mock weather alerts based on location
      const mockWeatherAlerts: WeatherAlert[] = []
      if (garage.address.includes('Florida')) {
        mockWeatherAlerts.push({
          type: 'heat',
          severity: 'medium',
          message: 'High temperatures expected this week (95°F+)',
          recommendation: 'Check tire pressure and coolant levels'
        })
      }
      
      // Mock maintenance reminders
      const mockReminders: MaintenanceReminder[] = vehicles.map(vehicle => ({
        vehicleId: vehicle.id,
        vehicleName: (vehicle as any).nickname || (vehicle as any).display_name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        type: 'Oil Change',
        dueDate: '2024-10-15',
        priority: 'high',
        description: 'Due in 2 weeks or 500 miles'
      }))

      // Mock service providers based on location
      const mockProviders: ServiceProvider[] = [
        {
          name: 'Quick Lube Express',
          type: 'oil_change',
          rating: 4.5,
          distance: '0.8 mi',
          phone: '(555) 123-4567'
        },
        {
          name: 'AutoCare Plus',
          type: 'mechanic',
          rating: 4.8,
          distance: '1.2 mi',
          phone: '(555) 987-6543'
        },
        {
          name: 'Tire World',
          type: 'tire',
          rating: 4.3,
          distance: '2.1 mi'
        }
      ]

      setWeatherAlerts(mockWeatherAlerts)
      setMaintenanceReminders(mockReminders)
      setServiceProviders(mockProviders)
    } catch (error) {
      console.error('Error loading garage features:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (type: WeatherAlert['type']) => {
    switch (type) {
      case 'freeze': return '❄️'
      case 'heat': return '🌡️'
      case 'storm': return '⛈️'
      case 'hail': return '🧊'
      default: return '🌤️'
    }
  }

  const getServiceIcon = (type: ServiceProvider['type']) => {
    switch (type) {
      case 'mechanic': return <Wrench className="h-4 w-4" />
      case 'oil_change': return <Car className="h-4 w-4" />
      case 'tire': return <Shield className="h-4 w-4" />
      case 'body_shop': return <Star className="h-4 w-4" />
      case 'inspection': return <FileText className="h-4 w-4" />
      default: return <Wrench className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Weather Alerts */}
      {weatherAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-orange-500" />
              Weather Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weatherAlerts.map((alert, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 ${
                alert.severity === 'high' ? 'border-red-500 bg-red-50' :
                alert.severity === 'medium' ? 'border-orange-500 bg-orange-50' :
                'border-yellow-500 bg-yellow-50'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getWeatherIcon(alert.type)}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-600 mt-1">{alert.recommendation}</p>
                  </div>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Maintenance Reminders */}
      {maintenanceReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Upcoming Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {maintenanceReminders.map((reminder, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Wrench className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{reminder.vehicleName}</p>
                    <p className="text-sm text-gray-600">{reminder.type} - {reminder.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={reminder.priority === 'high' ? 'destructive' : 'secondary'}>
                    {reminder.priority}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Due {reminder.dueDate}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Nearby Service Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-green-500" />
            Nearby Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {serviceProviders.map((provider, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                {getServiceIcon(provider.type)}
                <div>
                  <p className="font-medium text-gray-900">{provider.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{provider.distance}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{provider.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {provider.phone && (
                  <Button variant="outline" size="sm">
                    Call
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  Directions
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Garage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-500" />
            Location Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Car className="h-6 w-6 text-gray-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              <p className="text-sm text-gray-600">Vehicles</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Clock className="h-6 w-6 text-gray-500 mx-auto mb-1" />
              <p className="text-sm font-medium text-gray-900">{garage.timezone || 'UTC'}</p>
              <p className="text-sm text-gray-600">Timezone</p>
            </div>
          </div>
          
          {garage.is_default && (
            <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Star className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Default Garage</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
