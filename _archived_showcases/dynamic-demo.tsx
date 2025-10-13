// Dynamic Garage Demo - Next-Level Adaptive Experience
// This demonstrates the key concepts for context-aware, intelligent vehicle cards

import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VehicleRow } from '@/components/vehicle/VehicleRow'
import { EditVehicleModal } from '@/components/vehicle/EditVehicleModal'
import { DeleteVehicleDialog } from '@/components/vehicle/DeleteVehicleDialog'
import { useVehicles } from '@/hooks/useVehicles'
import { PageHeader } from '@/components/ui/PageHeader'
import { 
  Car, 
  Plus,
  Filter,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  ArrowUpDown
} from 'lucide-react'

interface DynamicVehicle {
  id: string
  year: number
  make: string
  model: string
  nickname?: string
  heroImageUrl?: string
  // Dynamic context data
  lastUpdated: Date
  mileage: number
  fuelLevel: number
  healthScore: number // 0-100
  upcomingMaintenance?: {
    type: string
    dueDate: Date
    priority: 'low' | 'medium' | 'high' | 'overdue'
  }[]
  usagePattern: 'daily' | 'weekend' | 'project' | 'seasonal'
  isActive: boolean
}

// Context-aware intelligence
function getCurrentTimeContext() {
  const hour = new Date().getHours()
  const day = new Date().getDay()
  
  if (day === 0 || day === 6) return 'weekend'
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}

function calculateProminence(vehicle: DynamicVehicle, allVehicles: DynamicVehicle[], timeContext: string) {
  let score = 0
  
  // Recent activity boost
  const daysSinceUpdate = (Date.now() - vehicle.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceUpdate < 1) score += 30
  else if (daysSinceUpdate < 7) score += 15
  
  // Usage pattern context
  if (timeContext === 'morning' && vehicle.usagePattern === 'daily') score += 25
  if (timeContext === 'weekend' && vehicle.usagePattern === 'weekend') score += 25
  
  // Health and maintenance urgency
  if (vehicle.upcomingMaintenance?.some(m => m.priority === 'overdue')) score += 40
  else if (vehicle.upcomingMaintenance?.some(m => m.priority === 'high')) score += 20
  
  // Health score impact
  if (vehicle.healthScore < 60) score += 15
  else if (vehicle.healthScore > 90) score += 10
  
  // Primary vehicle (most used)
  const sortedByActivity = allVehicles.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
  if (sortedByActivity[0]?.id === vehicle.id) score += 20
  
  if (score >= 50) return 'hero'
  if (score >= 30) return 'featured'
  if (score >= 15) return 'standard'
  return 'compact'
}

function calculateStatus(vehicle: DynamicVehicle) {
  if (!vehicle.isActive) return 'inactive'
  
  const hasOverdue = vehicle.upcomingMaintenance?.some(m => m.priority === 'overdue')
  if (hasOverdue || vehicle.healthScore < 60) return 'urgent'
  
  const hasHighPriority = vehicle.upcomingMaintenance?.some(m => m.priority === 'high')
  if (hasHighPriority || vehicle.healthScore < 80) return 'attention'
  
  return 'healthy'
}

function DynamicVehicleCard({ 
  vehicle, 
  prominence, 
  status, 
  allVehicles 
}: { 
  vehicle: DynamicVehicle
  prominence: string
  status: string
  allVehicles: DynamicVehicle[]
}) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  
  // Dynamic grid sizing based on prominence
  const getGridClasses = () => {
    if (prominence === 'hero') return 'col-span-2 row-span-2'
    if (prominence === 'featured') return 'col-span-2 row-span-1'
    return 'col-span-1 row-span-1'
  }
  
  // Status-driven color system
  const getStatusColors = () => {
    switch (status) {
      case 'urgent':
        return {
          border: 'border-red-200 hover:border-red-300',
          bg: 'bg-red-50 hover:bg-red-100',
          accent: 'text-red-600',
          glow: 'shadow-lg shadow-red-100',
          pulse: 'animate-pulse'
        }
      case 'attention':
        return {
          border: 'border-amber-200 hover:border-amber-300',
          bg: 'bg-amber-50 hover:bg-amber-100',
          accent: 'text-amber-600',
          glow: 'shadow-lg shadow-amber-100',
          pulse: ''
        }
      case 'inactive':
        return {
          border: 'border-slate-200',
          bg: 'bg-slate-50',
          accent: 'text-slate-400',
          glow: 'shadow-md shadow-slate-100',
          pulse: ''
        }
      default: // healthy
        return {
          border: 'border-slate-200 hover:border-slate-300',
          bg: 'bg-white hover:bg-slate-50',
          accent: 'text-emerald-600',
          glow: 'shadow-lg shadow-slate-100',
          pulse: ''
        }
    }
  }
  
  const colors = getStatusColors()
  
  // Progressive content based on prominence
  const getDisplayName = () => {
    if (prominence === 'hero' && vehicle.nickname) return vehicle.nickname
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  }
  
  const getImageAspect = () => {
    if (prominence === 'hero') return 'aspect-[16/9]'
    if (prominence === 'featured') return 'aspect-[16/9]'
    return 'aspect-[4/3]'
  }
  
  const getPadding = () => {
    if (prominence === 'hero') return 'p-6'
    if (prominence === 'featured') return 'p-5'
    return 'p-4'
  }
  
  return (
    <Card 
      className={`
        ${getGridClasses()}
        ${colors.border} ${colors.bg} ${colors.glow} ${colors.pulse}
        cursor-pointer transition-all duration-500 ease-out
        hover:scale-[1.02] hover:shadow-xl
        relative overflow-hidden
      `}
      onClick={() => router.push(`/vehicles/${vehicle.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Dynamic Image Section */}
        <div className={`${getImageAspect()} bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden`}>
          {vehicle.heroImageUrl ? (
            <img 
              src={vehicle.heroImageUrl} 
              alt={getDisplayName()}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Camera className={`${prominence === 'hero' ? 'h-12 w-12' : 'h-8 w-8'} text-slate-400 opacity-40`} />
            </div>
          )}
          
          {/* Status Indicator */}
          <div className="absolute top-3 right-3">
            {status === 'urgent' && (
              <Badge className="bg-red-500 text-white animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Urgent
              </Badge>
            )}
            {status === 'attention' && (
              <Badge className="bg-amber-500 text-white">
                <Clock className="h-3 w-3 mr-1" />
                Due Soon
              </Badge>
            )}
            {status === 'healthy' && prominence === 'hero' && (
              <Badge className="bg-emerald-500 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
            )}
          </div>
          
          {/* Micro-interaction overlay */}
          {isHovered && prominence !== 'compact' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300">
              <div className="text-white text-center space-y-2">
                <div className="flex items-center gap-4 justify-center">
                  {vehicle.mileage && (
                    <div className="flex items-center gap-1 text-sm">
                      <Gauge className="h-4 w-4" />
                      <span>{vehicle.mileage.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-sm">
                    <Fuel className="h-4 w-4" />
                    <span>{vehicle.fuelLevel}%</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Zap className="h-4 w-4" />
                    <span>{vehicle.healthScore}%</span>
                  </div>
                </div>
                {vehicle.upcomingMaintenance && vehicle.upcomingMaintenance.length > 0 && (
                  <div className="text-xs opacity-90">
                    {vehicle.upcomingMaintenance[0].type} due soon
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div className={`${getPadding()} flex-1 flex flex-col justify-between`}>
          <div>
            <h3 className={`
              font-semibold text-slate-900 leading-tight mb-1
              ${prominence === 'hero' ? 'text-xl' : prominence === 'featured' ? 'text-lg' : 'text-base'}
            `}>
              {getDisplayName()}
            </h3>
            
            {prominence === 'hero' && vehicle.nickname && (
              <p className="text-slate-600 text-sm mb-2">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
            )}
            
            {/* Usage pattern indicator */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${
                vehicle.usagePattern === 'daily' ? 'bg-blue-500' :
                vehicle.usagePattern === 'weekend' ? 'bg-purple-500' :
                vehicle.usagePattern === 'project' ? 'bg-orange-500' :
                'bg-slate-400'
              }`}></div>
              <span className="text-xs text-slate-500 capitalize">
                {vehicle.usagePattern} driver
              </span>
            </div>
          </div>
          
          {/* Quick stats for larger cards */}
          {prominence !== 'compact' && (
            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <span>Updated {Math.floor((Date.now() - vehicle.lastUpdated.getTime()) / (1000 * 60 * 60 * 24))}d ago</span>
              <div className={`w-2 h-2 rounded-full ${
                vehicle.healthScore > 80 ? 'bg-emerald-500' : 
                vehicle.healthScore > 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getSmartTitle(vehicles: DynamicVehicle[], timeContext: string) {
  const count = vehicles.length
  const activeVehicles = vehicles.filter(v => v.isActive)
  
  if (count === 0) return "Your Garage"
  if (count === 1) {
    const vehicle = vehicles[0]
    const nickname = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    return `Your ${nickname}`
  }
  
  // Smart contextual language
  if (timeContext === 'morning' && activeVehicles.some(v => v.usagePattern === 'daily')) {
    return "Ready to Roll"
  }
  if (timeContext === 'weekend' && activeVehicles.some(v => v.usagePattern === 'weekend')) {
    return "Weekend Warriors"
  }
  
  if (count <= 3) return "Your Collection"
  return `Your Garage — ${count} vehicles`
}

function getSmartSubtitle(vehicles: DynamicVehicle[], timeContext: string) {
  const urgentCount = vehicles.filter(v => calculateStatus(v) === 'urgent').length
  const attentionCount = vehicles.filter(v => calculateStatus(v) === 'attention').length
  
  if (urgentCount > 0) {
    return `${urgentCount} vehicle${urgentCount > 1 ? 's' : ''} need immediate attention`
  }
  
  if (attentionCount > 0) {
    return `${attentionCount} vehicle${attentionCount > 1 ? 's' : ''} due for maintenance soon`
  }
  
  if (timeContext === 'morning') {
    const dailyDrivers = vehicles.filter(v => v.usagePattern === 'daily')
    if (dailyDrivers.length > 0) {
      return `${dailyDrivers.length} daily driver${dailyDrivers.length > 1 ? 's' : ''} ready for the day`
    }
  }
  
  return `${vehicles.length} vehicles in your collection`
}

export default function DynamicGarageDemo() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<DynamicVehicle[]>([])
  const [timeContext, setTimeContext] = useState(getCurrentTimeContext())
  
  // Mock data with dynamic properties
  useEffect(() => {
    const mockVehicles: DynamicVehicle[] = [
      {
        id: '1',
        year: 2023,
        make: 'Tesla',
        model: 'Model 3',
        nickname: 'Lightning',
        heroImageUrl: undefined,
        lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        mileage: 15420,
        fuelLevel: 85,
        healthScore: 95,
        upcomingMaintenance: [],
        usagePattern: 'daily',
        isActive: true
      },
      {
        id: '2',
        year: 2019,
        make: 'BMW',
        model: 'M3',
        nickname: 'Beast',
        heroImageUrl: undefined,
        lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        mileage: 45230,
        fuelLevel: 30,
        healthScore: 75,
        upcomingMaintenance: [
          { type: 'Oil Change', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), priority: 'high' }
        ],
        usagePattern: 'weekend',
        isActive: true
      },
      {
        id: '3',
        year: 2020,
        make: 'Honda',
        model: 'Civic',
        heroImageUrl: undefined,
        lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        mileage: 32100,
        fuelLevel: 65,
        healthScore: 45,
        upcomingMaintenance: [
          { type: 'Brake Service', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), priority: 'overdue' }
        ],
        usagePattern: 'project',
        isActive: false
      },
      {
        id: '4',
        year: 2022,
        make: 'Ford',
        model: 'F-150',
        nickname: 'Workhorse',
        heroImageUrl: undefined,
        lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        mileage: 28500,
        fuelLevel: 90,
        healthScore: 88,
        upcomingMaintenance: [],
        usagePattern: 'daily',
        isActive: true
      }
    ]
    
    setVehicles(mockVehicles)
  }, [])
  
  const title = getSmartTitle(vehicles, timeContext)
  const subtitle = getSmartSubtitle(vehicles, timeContext)
  
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Smart Header */}
      <PageHeader 
        title={title}
        subtitle={subtitle}
        action={
          <Button onClick={() => router.push('/vehicles/onboard')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        }
      />
      <div className="flex items-center gap-4 mb-6 text-sm text-slate-500">
        <span>Current time: {timeContext}</span>
        <span>•</span>
        <span>Intelligent sorting active</span>
      </div>
      
      {/* Fluid Dynamic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
        {vehicles.map(vehicle => {
          const prominence = calculateProminence(vehicle, vehicles, timeContext)
          const status = calculateStatus(vehicle)
          
          return (
            <DynamicVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              prominence={prominence}
              status={status}
              allVehicles={vehicles}
            />
          )
        })}
      </div>
      
      {/* Demo Controls */}
      <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4">🚀 Dynamic Features Demo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <strong>✨ What You're Seeing:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Cards sized by prominence (Tesla = hero, BMW = featured)</li>
              <li>Color-coded status (Honda = urgent red, others = healthy)</li>
              <li>Hover reveals quick stats overlay</li>
              <li>Smart titles based on time context</li>
            </ul>
          </div>
          <div>
            <strong>🧠 Intelligence Active:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Recent activity boosts prominence</li>
              <li>Maintenance urgency affects colors</li>
              <li>Usage patterns influence sorting</li>
              <li>Time context changes messaging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
