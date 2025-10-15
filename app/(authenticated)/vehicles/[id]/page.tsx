'use client'

/**
 * Vehicle Details Page - Vision-First Timeline Approach
 * 
 * STRATEGIC PIVOT: Visual vehicle journal, not maintenance tracker
 * 
 * Layout:
 * - Hero (vehicle photo + stats)
 * - Attention Needed (urgent items)
 * - TIMELINE (primary content - all captures chronologically)
 * - Ask AI (contextual to timeline)
 * - Collapsible summaries (Health, Cost, Documents)
 */

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Section, Stack, Card, Heading, Text, Flex, Grid, Button, ButtonGroup, Modal, Input, MomentumStack } from '@/components/design-system'
import { DestructiveBox, MutedBox, AccentBox } from '@/components/design-system'
import { AreaChartCard, RadialProgress, Badge } from '@/components/design-system'
import { Timeline } from '@/features/timeline/ui/Timeline'
import { VehicleFAB } from '@/components/ui/VehicleFAB.v2'
import { QuickActionsModal } from '@/components/ui/QuickActionsModal'
import { CaptureEntryModal } from '@/features/capture/ui/CaptureEntryModal'
import { VehicleDetailsSkeleton } from '@/features/vehicles/ui/VehicleDetailsSkeleton'
import { VehicleSpecifications } from '@/features/vehicles/ui/VehicleSpecifications'
import { DocumentsView } from '@/features/vehicles/ui/DocumentsView'
import { VehicleAIChatModal } from '@/features/vehicles/ui/dialogs/VehicleAIChatModal'
import { 
  Car, 
  ArrowLeft,
  Calendar,
  Gauge,
  Wrench,
  FileText,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Clock,
  MessageSquare,
  Camera,
  Edit3,
  Send,
  Plus,
  Download,
  Upload,
  Share2,
  Trash2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Activity,
  CheckCircle2,
  Image,
  Sparkles,
  Droplet,
  Battery,
  Wind,
  Zap,
  Info,
  Settings,
  MoreHorizontal,
  StickyNote,
  Lock,
  Database,
  Lightbulb
} from 'lucide-react'
import { AppNavigation } from '@/components/app/AppNavigation'
import { VehicleHeader } from '@/features/vehicles/ui/VehicleHeader'
import { DataSectionV2 } from '@/components/events/DataSection.v2'
import { FieldHelp } from '@/components/ui/FieldHelp'
import { AIBadgeWithPopover } from '@/components/ui/AIBadgeWithPopover'
import { 
  AttentionNeededCard, 
  VehicleHealthCard, 
  CostOverviewCard,
  MaintenanceScheduleCard,
  RecentActivityCard 
} from '@/features/vehicles/ui/sections'
import { Skeleton } from '@/components/ui/skeleton'

// Filter Button Component
function FilterButton({ 
  active, 
  onClick, 
  count, 
  children 
}: { 
  active: boolean
  onClick: () => void
  count: number
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
        active
          ? 'bg-black text-white'
          : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children} <span className="text-xs opacity-70">({count})</span>
    </button>
  )
}

export default function VehicleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = (params?.id as string) || '123'
  const [showActionsModal, setShowActionsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showOverflowMenu, setShowOverflowMenu] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('maintenance')
  const [activeViewTab, setActiveViewTab] = useState<'overview' | 'service' | 'specs' | 'documents'>('overview')
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'service' | 'fuel' | 'odometer' | 'dashboard_warning'>('all')
  const [showFABMenu, setShowFABMenu] = useState(false)
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({})
  const [showAIModal, setShowAIModal] = useState(false)
  const [showQuickActionsModal, setShowQuickActionsModal] = useState(false)
  const [showCaptureModal, setShowCaptureModal] = useState(false)
  
  // Vehicle data state
  const [vehicle, setVehicle] = useState<any>(null)
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(true)
  const [vehicleError, setVehicleError] = useState<string | null>(null)
  
  // Timeline events state
  const [timelineEvents, setTimelineEvents] = useState<any[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  
  // Fetch vehicle data (extracted for parallel loading)
  const fetchVehicleData = async () => {
    const response = await fetch(`/api/vehicles/${vehicleId}`)
    if (!response.ok) throw new Error('Failed to load vehicle')
    const data = await response.json()
    return data.vehicle
  }

  // Fetch events data (extracted for parallel loading)
  const fetchEventsData = async () => {
    const response = await fetch(`/api/vehicles/${vehicleId}/events`)
    if (!response.ok) throw new Error('Failed to load events')
    const data = await response.json()
    return data.events || []
  }

  // Load vehicle data AND events in PARALLEL (much faster!)
  useEffect(() => {
    const loadAllData = async () => {
      if (!vehicleId) return

      try {
        setIsLoadingVehicle(true)
        setIsLoadingEvents(true)

        // ✅ Parallel fetching - both requests happen at the same time!
        const [vehicleData, eventsData] = await Promise.all([
          fetchVehicleData(),
          fetchEventsData()
        ])

        // Set vehicle data
        setVehicle(vehicleData)
        setVehicleError(null)

        // Map events to timeline format
        const mappedEvents = mapEventsToTimeline(eventsData)
        setTimelineEvents(mappedEvents)

      } catch (error) {
        console.error('Error loading data:', error)
        setVehicleError('Failed to load vehicle data')
        setTimelineEvents([])
      } finally {
        setIsLoadingVehicle(false)
        setIsLoadingEvents(false)
      }
    }

    loadAllData()
  }, [vehicleId])

  // Helper function to map events to timeline format
  const mapEventsToTimeline = (events: any[]) => {
    return events.map((event: any) => ({
      id: event.id,
      type: event.type,
      date: event.date,
      timestamp: event.date,
      title: event.display_summary || `${event.type} event`,
      description: event.notes || '',
      mileage: event.miles,
      cost: event.total_amount,
      imageUrl: event.image?.thumbnail_url || event.image?.url || event.payload?.receipt_image_url,
      photo_url: event.image?.url || event.payload?.receipt_image_url,
      thumbnail_url: event.image?.thumbnail_url || event.payload?.receipt_image_url,
      metadata: event.payload,
      vehicle_id: vehicleId,
      display_vendor: event.display_vendor,
      display_summary: event.display_summary,
      display_amount: event.display_amount,
      extracted_data: {
        reading: event.miles || event.odometer_miles,
        cost: event.total_amount,
        vendor_name: event.vendor_name,
        gallons: event.gallons,
        station_name: event.vendor || event.display_vendor,
        warning_type: event.payload?.warning_lamps ? Object.keys(event.payload.warning_lamps).filter(k => event.payload.warning_lamps[k]) : [],
        depth_32nds: event.payload?.depth_32nds,
        pressures: event.payload?.pressures,
        severity: event.payload?.severity,
        location: event.payload?.location,
        lot_name: event.payload?.lot_name,
        ...(event.payload || {})
      }
    }))
  }
  
  // Refresh timeline events (can be called from modals)
  const refreshEvents = async () => {
    try {
      setIsLoadingEvents(true)
      const eventsData = await fetchEventsData()
      const mappedEvents = mapEventsToTimeline(eventsData)
      setTimelineEvents(mappedEvents)
    } catch (error) {
      console.error('Error loading events:', error)
      setTimelineEvents([])
    } finally {
      setIsLoadingEvents(false)
    }
  }
  
  const toggleDetails = (key: string) => {
    setExpandedDetails(prev => ({ ...prev, [key]: !prev[key] }))
  }
  
  const copyToClipboard = (text: string, label: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      // In production, show a toast notification
      console.log(`Copied ${label}: ${text}`)
    }
  }

  // Mock alerts data - replace with real data from API
  const mockAlerts = [
    { id: '1', type: 'oil_change', severity: 'high' },
    { id: '2', type: 'tire_rotation', severity: 'medium' }
  ]

  // Show skeleton while loading initial data
  if (isLoadingVehicle && !vehicle) {
    return <VehicleDetailsSkeleton />
  }

  // Show error state only after loading is complete
  if (!isLoadingVehicle && (vehicleError || !vehicle)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNavigation />
        <Container size="md" useCase="general_content">
          <Section>
            <Stack spacing="lg" className="items-center justify-center min-h-[60vh]">
              <AlertTriangle className="w-12 h-12 text-red-500" />
              <Heading level="subtitle">Vehicle Not Found</Heading>
              <Text>{vehicleError || 'This vehicle does not exist'}</Text>
              <Button onClick={() => router.push('/vehicles')}>Go to My Vehicles</Button>
            </Stack>
          </Section>
        </Container>
      </div>
    )
  }

  const displayName = vehicle.display_name || `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`
  
  const handlePhotoUpload = () => {
    if (typeof window === 'undefined') return
    
    // Trigger file input click
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0]
      if (file) {
        // In production, upload to server/storage
        console.log('Selected file:', file)
        // TODO: Upload file and update vehicle.hero_image_url
      }
    }
    input.click()
  }

  const handleManagePhotos = () => {
    // In production, open photo gallery modal or navigate to photo management page
    console.log('Manage photos')
  }

  // Mock data
  const alerts = [
    { icon: <AlertTriangle className="w-5 h-5 text-orange-600" />, title: "Oil change due", description: "Due in 200 miles", time: "2 days ago" },
    { icon: <Clock className="w-5 h-5 text-blue-600" />, title: "Registration expiring", description: "Expires in 85 days", time: "1 week ago" }
  ]

  const serviceHistory = [
    { id: "1", date: "Sep 15, 2024", type: "Oil Change", cost: 45, mileage: 85034 },
    { id: "2", date: "Jul 10, 2024", type: "Brake Service", cost: 380, mileage: 82150 },
    { id: "3", date: "May 5, 2024", type: "Tire Rotation", cost: 25, mileage: 79800 }
  ]

  const recentChats = [
    { id: "1", title: "What's the recommended oil type?", time: "2 days ago" },
    { id: "2", title: "When should I replace brake pads?", time: "1 week ago" }
  ]

  const chatSuggestions = [
    "What maintenance is due soon?",
    "Show me service history",
    "Explain the check engine light",
    "What's my vehicle worth?"
  ]

  const allActions = [
    { icon: <Wrench className="w-5 h-5" />, label: "Log Service", action: () => console.log('Log service') },
    { icon: <Gauge className="w-5 h-5" />, label: "Update Mileage", action: () => console.log('Update mileage') },
    { icon: <FileText className="w-5 h-5" />, label: "View Documents", action: () => console.log('Documents') },
    { icon: <Upload className="w-5 h-5" />, label: "Upload Document", action: () => console.log('Upload') },
    { icon: <Calendar className="w-5 h-5" />, label: "Schedule Maintenance", action: () => console.log('Schedule') },
    { icon: <Info className="w-5 h-5" />, label: "View Specifications", action: () => router.push(`/vehicles/${vehicleId}/specs`) },
    { icon: <Camera className="w-5 h-5" />, label: "Add Photo", action: () => console.log('Add photo') },
    { icon: <Edit3 className="w-5 h-5" />, label: "Edit Vehicle Info", action: () => console.log('Edit') },
    { icon: <Download className="w-5 h-5" />, label: "Export Report", action: () => console.log('Export') },
    { icon: <Share2 className="w-5 h-5" />, label: "Share Vehicle", action: () => console.log('Share') },
    { icon: <Settings className="w-5 h-5" />, label: "Vehicle Settings", action: () => console.log('Settings') },
    { icon: <Trash2 className="w-5 h-5" />, label: "Remove Vehicle", action: () => console.log('Remove'), destructive: true }
  ]

  const quickActions = [
    { icon: <Wrench className="w-5 h-5" />, label: "Log service", action: () => console.log('Log service') },
    { icon: <Gauge className="w-5 h-5" />, label: "Update mileage", action: () => console.log('Update mileage') },
    { icon: <FileText className="w-5 h-5" />, label: "Add document", action: () => console.log('Add document') },
    { icon: <Calendar className="w-5 h-5" />, label: "Schedule maintenance", action: () => console.log('Schedule') }
  ]

  const hasAlerts = alerts.length > 0

  const handleExport = () => {
    console.log('Export vehicle report')
    // TODO: Implement export functionality
  }

  const handleSettings = () => {
    console.log('Open vehicle settings')
    setShowEditModal(true)
  }

  return (
    <>
      <AppNavigation />
      
      {/* New Animated Hero + Glassmorphic Sticky Header */}
      <VehicleHeader
        vehicle={{
          id: vehicle.id,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          nickname: vehicle.nickname,
          license_plate: vehicle.license_plate,
          vin: vehicle.vin,
          odometer_miles: vehicle.current_mileage,
          purchase_date: vehicle.purchase_date,
          image_url: vehicle.hero_image_url,
        }}
        onExport={handleExport}
        onSettings={handleSettings}
      />

      {/* =================================================================
          MAIN CONTENT - Long-form sections in Container
          ================================================================= */}
      <div className="bg-gray-50 min-h-screen py-8">
      <Container size="md" useCase="articles">
        <Section spacing="lg">

          <MomentumStack baseSpacing="lg">
            
            {/* Section: AI Insights */}
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="p-6 border-b border-blue-100/50">
                <Flex align="center" gap="sm">
                  <Sparkles className="w-5 h-5 text-purple-600" aria-hidden="true" />
                  <Heading level="subtitle" className="text-base font-semibold text-gray-900">AI Insights</Heading>
                  <FieldHelp
                    title="How AI Insights Work"
                    description="We analyze your vehicle data to provide personalized recommendations"
                    examples={[
                      "Your driving patterns (highway vs city)",
                      "Service history and maintenance records",
                      "2,847 similar 2013 Chevrolet Captivas",
                      "Manufacturer guidelines"
                    ]}
                    tips={[
                      "Insights are updated daily based on new data"
                    ]}
                  />
                </Flex>
              </div>
              
              <div className="p-6">
                <Stack spacing="md">
                  {/* Insight 1 - Predictive Maintenance */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-white/70 border border-white/50 hover:bg-white hover:shadow-sm transition-all duration-200" role="article" aria-label="Oil change recommendation">
                    <div className="p-2 bg-purple-50 rounded-lg flex-shrink-0">
                      <Wrench className="w-5 h-5 text-purple-600" />
                    </div>
                    <Stack spacing="xs" className="flex-1">
                      <Flex align="center" gap="xs">
                        <Text className="text-sm font-semibold text-gray-900">Oil Change Due Soon</Text>
                        <AIBadgeWithPopover
                          confidence={0.92}
                          aiType="calculated"
                          fieldName="Oil Change Prediction"
                          detectionDetails="AI analyzed your last 5,000 miles of driving, 12 oil change records from similar vehicles, and your typical driving conditions (65% highway). Current oil age: 3,200 miles."
                        />
                      </Flex>
                      <Text className="text-sm text-gray-600">Based on your driving patterns, schedule within 234 mi to maintain optimal engine health.</Text>
                    </Stack>
                  </div>

                  {/* Insight 2 - Cost Comparison */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-white/70 border border-white/50 hover:bg-white hover:shadow-sm transition-all duration-200" role="article" aria-label="Cost efficiency comparison">
                    <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                      <TrendingDown className="w-5 h-5 text-green-600" />
                    </div>
                    <Stack spacing="xs" className="flex-1">
                      <Flex align="center" gap="xs">
                        <Text className="text-sm font-semibold text-gray-900">Cost Efficiency: Better Than Average</Text>
                        <AIBadgeWithPopover
                          confidence={0.95}
                          aiType="calculated"
                          fieldName="Cost Comparison"
                          detectionDetails="Compared against 2,847 similar 2013 Chevrolet Captiva owners. You're spending 8% less than average."
                        />
                      </Flex>
                      <Text className="text-sm text-gray-600">You're spending 8% less than similar 2013 Chevy Captiva owners. Keep it up!</Text>
                    </Stack>
                  </div>

                  {/* Insight 3 - Performance Trend */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-white/70 border border-white/50 hover:bg-white hover:shadow-sm transition-all duration-200" role="article" aria-label="Fuel economy trend">
                    <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <Stack spacing="xs" className="flex-1">
                      <Flex align="center" gap="xs">
                        <Text className="text-sm font-semibold text-gray-900">Fuel Economy Improving</Text>
                        <AIBadgeWithPopover
                          confidence={0.93}
                          aiType="calculated"
                          fieldName="Fuel Economy Trend"
                          detectionDetails="Based on your last 30 days of driving data. Your MPG increased 12% this month from consistent highway driving patterns."
                        />
                      </Flex>
                      <Text className="text-sm text-gray-600">Your MPG increased 12% this month. Consistent highway driving is paying off.</Text>
                    </Stack>
                  </div>

                  {/* Insight 4 - Proactive Recommendation */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-white/70 border border-white/50 hover:bg-white hover:shadow-sm transition-all duration-200" role="article" aria-label="Tire rotation recommendation">
                    <div className="p-2 bg-orange-50 rounded-lg flex-shrink-0">
                      <Zap className="w-5 h-5 text-orange-600" />
                    </div>
                    <Stack spacing="xs" className="flex-1">
                      <Flex align="center" gap="xs">
                        <Text className="text-sm font-semibold text-gray-900">Consider Tire Rotation</Text>
                        <AIBadgeWithPopover
                          confidence={0.78}
                          aiType="calculated"
                          fieldName="Tire Rotation Recommendation"
                          detectionDetails="Based on current mileage (45,300 mi) and last rotation (5,000 mi ago). Rotating tires now can extend their life by 15-20%."
                        />
                      </Flex>
                      <Text className="text-sm text-gray-600">At 45,300 mi, rotating tires now can extend their life by 15-20%.</Text>
                    </Stack>
                  </div>
                </Stack>

                {/* AI Attribution Footer */}
                <div className="pt-3 mt-1 border-t border-purple-100">
                  <Flex align="center" justify="center" gap="xs">
                    <Sparkles className="w-3 h-3 text-purple-600" aria-hidden="true" />
                    <Text className="text-xs text-purple-600 font-medium">
                      Powered by AI analysis of your vehicle data
                    </Text>
                  </Flex>
                </div>
              </div>
              </Card>
            </div>

            {/* Section: Tab Navigation */}
            <div>
              {/* ===== TAB NAVIGATION ===== */}
              <nav className="flex gap-2 p-1.5 bg-gray-100 rounded-lg border border-gray-200 overflow-x-auto" aria-label="Vehicle sections">
                <button
                  onClick={() => setActiveViewTab('overview')}
                  className={`px-6 py-3 rounded-md font-semibold text-base transition-all whitespace-nowrap ${
                    activeViewTab === 'overview'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveViewTab('service')}
                  className={`px-6 py-3 rounded-md font-semibold text-base transition-all whitespace-nowrap ${
                    activeViewTab === 'service'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  Service & Costs
                </button>
                <button
                  onClick={() => setActiveViewTab('specs')}
                  className={`px-6 py-3 rounded-md font-semibold text-base transition-all whitespace-nowrap ${
                    activeViewTab === 'specs'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  Specifications
                </button>
                <button
                  onClick={() => setActiveViewTab('documents')}
                  className={`px-6 py-3 rounded-md font-semibold text-base transition-all whitespace-nowrap ${
                    activeViewTab === 'documents'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  Documents
                </button>
              </nav>
            </div>

            {/* OVERVIEW TAB */}
            {activeViewTab === 'overview' && (
              <MomentumStack baseSpacing="md">
                {/* TIER 1: ATTENTION NEEDED */}
                <AttentionNeededCard 
                  show={hasAlerts} 
                  isLoading={isLoadingVehicle}
                />

                {/* TIER 2: HEALTH & STATUS */}
                <VehicleHealthCard 
                  show={true} 
                  isLoading={isLoadingVehicle}
                />

                {/* TIER 3: COST SNAPSHOT */}
                <CostOverviewCard 
                  show={true} 
                  onViewBreakdown={() => setActiveViewTab('service')}
                  isLoading={isLoadingVehicle}
                />

                {/* TIER 4: MAINTENANCE SCHEDULE */}
                <MaintenanceScheduleCard
                  show={true}
                  onViewFullSchedule={() => setActiveViewTab('service')}
                  isLoading={isLoadingVehicle}
                />

                {/* TIER 5: RECENT ACTIVITY */}
                <RecentActivityCard
                  show={true}
                  isLoading={isLoadingEvents}
                  events={timelineEvents}
                  vehicleId={vehicleId as string}
                  onNavigate={(path) => router.push(path)}
                  onViewTimeline={() => setActiveViewTab('service')}
                />

                {/* TIER 6: QUICK REFERENCE (Collapsed) */}
                <Stack spacing="md">
                  <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Quick Reference</Text>
                  
                  {/* Vehicle Details */}
                  <DataSectionV2
                    title="Vehicle Details"
                    fields={[
                      { label: "Year", value: vehicle.year },
                      { label: "Make", value: vehicle.make },
                      { label: "Model", value: vehicle.model },
                      { label: "Trim", value: vehicle.trim || "Standard" },
                      { label: "VIN", value: vehicle.vin || "Not provided" },
                      { label: "License Plate", value: vehicle.license_plate || "Not set", editable: true },
                      { label: "Nickname", value: vehicle.nickname || "My Vehicle", editable: true },
                      { label: "Color", value: vehicle.color || "Not specified", editable: true },
                    ]}
                    defaultExpanded={false}
                  />

                  {/* Ownership & Registration */}
                  <DataSectionV2
                    title="Ownership & Registration"
                    fields={[
                      { label: "Owner", value: "John Doe", editable: true },
                      { label: "Purchase Date", value: vehicle.purchase_date ? new Date(vehicle.purchase_date).toLocaleDateString() : "Not recorded", editable: true },
                      { label: "Purchase Price", value: "$48,990", editable: true },
                      { label: "Current Value", value: "$42,350", aiGenerated: true, aiType: "calculated" },
                      { label: "Registration Exp", value: "Dec 31, 2025", editable: true },
                      { label: "Insurance Provider", value: "State Farm", editable: true },
                      { label: "Policy Number", value: "SF-123456", editable: true },
                    ]}
                    defaultExpanded={false}
                  />
                </Stack>
              </MomentumStack>
            )}

            {/* SERVICE & COSTS TAB */}
            {activeViewTab === 'service' && (
              <MomentumStack baseSpacing="lg">
                {/* Maintenance Schedule */}
                <DataSectionV2
                  title="Maintenance Schedule"
                  fields={[
                    { label: "Next Oil Change", value: "Jan 1, 2026 (~234 mi)", aiGenerated: true, aiType: "generated" },
                    { label: "Next Tire Rotation", value: "Feb 15, 2026", aiGenerated: true },
                    { label: "Next Inspection", value: "Mar 1, 2026", aiGenerated: true },
                    { label: "Last Oil Change", value: "Oct 1, 2025 at 45,000 mi" },
                    { label: "Last Tire Rotation", value: "Jul 15, 2025 at 42,500 mi" },
                    { label: "Last Inspection", value: "Mar 1, 2025" },
                  ]}
                  defaultExpanded={true}
                />

                {/* Cost Analysis */}
                <DataSectionV2
                  title="Cost Analysis"
                  fields={[
                    { label: "Total Spent (All Time)", value: "$3,245" },
                    { label: "Spent This Year", value: "$1,247" },
                    { label: "Avg Cost per Service", value: "$270" },
                    { label: "Fuel Costs YTD", value: "$845" },
                    { label: "Service Costs YTD", value: "$402" },
                    { label: "Total Services", value: "12 services" },
                  ]}
                  defaultExpanded={true}
                />

                {/* Full Service Timeline */}
                <div>
                  <Heading level="subtitle" className="text-lg font-semibold mb-4">Service History</Heading>
                  {!isLoadingEvents && timelineEvents.length > 0 ? (
                    <Timeline
                      items={timelineEvents}
                      vehicleId={vehicleId as string}
                      onCapture={() => router.push(`/vehicles/${vehicleId}/capture`)}
                      onExpand={(id) => console.log('Expand timeline item:', id)}
                      onRefresh={refreshEvents}
                      showHeader={true}
                      showFilters={true}
                    />
                  ) : isLoadingEvents ? (
                    <Card className="p-8">
                      <Stack spacing="md" className="items-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <Text>Loading service history...</Text>
                      </Stack>
                    </Card>
                  ) : (
                    <Card className="p-12 text-center">
                      <Stack spacing="lg" className="items-center">
                        <Flex align="center" justify="center" className="w-16 h-16 rounded-full bg-gray-100">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </Flex>
                        <Stack spacing="sm" className="items-center max-w-md">
                          <Heading level="subtitle" className="text-xl font-semibold text-gray-900">
                            No Service History
                          </Heading>
                          <Text className="text-gray-600 text-center">
                            Capture service receipts and maintenance records to build your history
                          </Text>
                        </Stack>
                        <Button
                          onClick={() => router.push(`/vehicles/${vehicleId}/capture`)}
                          className="bg-black text-white hover:bg-gray-800 h-12 px-6 rounded-lg"
                        >
                          <Camera className="w-5 h-5 mr-2" />
                          Add Service Record
                        </Button>
                      </Stack>
                    </Card>
                  )}
                </div>
              </MomentumStack>
            )}

            {/* SPECIFICATIONS TAB */}
            {activeViewTab === 'specs' && (
              <MomentumStack baseSpacing="lg">
                {/* Technical Specifications */}
                <DataSectionV2
                  title="Technical Specifications"
                  fields={[
                    { label: "Engine", value: "2.4L I-4 DOHC 16V" },
                    { label: "Horsepower", value: "182 hp @ 6,700 rpm" },
                    { label: "Torque", value: "172 lb-ft @ 4,900 rpm" },
                    { label: "Transmission", value: "6-Speed Automatic" },
                    { label: "Drive Type", value: "Front-Wheel Drive (FWD)" },
                    { label: "Fuel Type", value: "Regular Unleaded" },
                    { label: "MPG City/Hwy", value: "21 / 32 MPG" },
                    { label: "Fuel Capacity", value: "15.6 gallons" },
                  ]}
                  defaultExpanded={true}
                />
              </MomentumStack>
            )}

            {/* DOCUMENTS TAB */}
            {activeViewTab === 'documents' && (
              <MomentumStack baseSpacing="lg">
                {/* Documents & Records */}
                <DataSectionV2
                  title="Documents & Records"
                  fields={[
                    { label: "Owner's Manual", value: "View PDF" },
                    { label: "Service Records", value: "12 documents" },
                    { label: "Insurance Card", value: "View" },
                    { label: "Registration", value: "Valid until Dec 31, 2025" },
                    { label: "Warranty", value: "Expired" },
                  ]}
                  defaultExpanded={true}
                />
              </MomentumStack>
            )}

          </MomentumStack>
        </Section>
        
      </Container>
      </div>

      {/* Footer - EXACT copy from EventFooter */}
      <div className="pt-12 pb-16">
        <Container size="md" useCase="articles">
          <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 hover:border-blue-200 overflow-hidden relative group transition-all duration-300 hover:shadow-lg">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 -z-0" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-100 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 -z-0" />
            
            <div className="relative z-10 p-6 sm:p-8">
              <Stack spacing="lg" className="items-center text-center">
                {/* Header */}
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <Database className="w-6 h-6 text-blue-600" />
                  </div>
                  <Text className="text-xl font-bold text-gray-900">
                    Your Data Unlocks
                  </Text>
                </div>

                {/* Value props - Icon grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                  <div className="flex flex-col items-center gap-2 p-5 bg-white/70 hover:bg-white hover:shadow-md rounded-xl border border-white/50 hover:border-blue-200 transition-all duration-200 group/card">
                    <div className="p-2 bg-blue-50 rounded-lg group-hover/card:bg-blue-100 transition-colors duration-200">
                      <TrendingUp className="w-6 h-6 text-blue-600 group-hover/card:scale-110 transition-transform duration-200" />
                    </div>
                    <Text className="text-base font-semibold text-gray-900">Track Your Progress</Text>
                    <Text className="text-sm text-gray-600">MPG trends & fuel efficiency patterns over time</Text>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-5 bg-white/70 hover:bg-white hover:shadow-md rounded-xl border border-white/50 hover:border-purple-200 transition-all duration-200 group/card">
                    <div className="p-2 bg-purple-50 rounded-lg group-hover/card:bg-purple-100 transition-colors duration-200">
                      <Sparkles className="w-6 h-6 text-purple-600 group-hover/card:text-purple-700 transition-colors duration-200" />
                    </div>
                    <Text className="text-base font-semibold text-gray-900">AI-Powered Insights</Text>
                    <Text className="text-sm text-gray-600">Predictive analysis & cost optimization</Text>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-5 bg-white/70 hover:bg-white hover:shadow-md rounded-xl border border-white/50 hover:border-green-200 transition-all duration-200 group/card">
                    <div className="p-2 bg-green-50 rounded-lg group-hover/card:bg-green-100 transition-colors duration-200">
                      <Calendar className="w-6 h-6 text-green-600 group-hover/card:text-green-700 transition-colors duration-200" />
                    </div>
                    <Text className="text-base font-semibold text-gray-900">Smart Reminders</Text>
                    <Text className="text-sm text-gray-600">Never miss maintenance or fill-ups</Text>
                  </div>
                </div>

                {/* Bottom Disclaimers */}
                <div className="border-t border-gray-200 pt-6 mt-6 w-full max-w-2xl">
                  <Stack spacing="sm">
                    <Flex align="center" justify="center" gap="xs">
                      <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" aria-hidden="true" />
                      <Text className="text-sm text-gray-600 text-center">Enhanced by AI • Always verify important details</Text>
                    </Flex>
                    <Flex align="center" justify="center" gap="xs">
                      <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                      <Text className="text-sm text-gray-500 text-center">Your data is private, secure, and powers smarter insights</Text>
                    </Flex>
                  </Stack>
                </div>
              </Stack>
            </div>
          </Card>
        </Container>
      </div>

      {/* Floating Action Button with Speed Dial */}
      <VehicleFAB
        onCapture={() => setShowCaptureModal(true)}
        onAskAI={() => setShowAIModal(true)}
        onShowMore={() => setShowQuickActionsModal(true)}
      />

      {/* S-Tier Capture Entry Modal */}
      <CaptureEntryModal
        isOpen={showCaptureModal}
        onClose={() => setShowCaptureModal(false)}
        onQuickCapture={() => {
          setShowCaptureModal(false)
          // Quick path: Open camera immediately, AI detects type
          router.push(`/vehicles/${vehicleId}/capture/quick`)
        }}
        onGuidedCapture={(eventType) => {
          setShowCaptureModal(false)
          // Guided path: Start progressive flow for specific event type
          router.push(`/vehicles/${vehicleId}/capture/${eventType}`)
        }}
        vehicleId={vehicleId as string}
      />

      {/* Quick Actions Modal */}
      <QuickActionsModal
        isOpen={showQuickActionsModal}
        onClose={() => setShowQuickActionsModal(false)}
        actions={{
          // Capture & Track
          onCapture: () => router.push(`/vehicles/${vehicleId}/capture`),
          onFuel: () => router.push(`/vehicles/${vehicleId}/capture?type=fuel`),
          onService: () => router.push(`/vehicles/${vehicleId}/capture?type=service`),
          
          // AI Assistant
          onAskAI: () => setShowAIModal(true),
          onInsights: () => {
            setActiveViewTab('overview')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          },
          onPredictCosts: () => {
            setActiveViewTab('service')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          },
          
          // Schedule & Plan
          onScheduleService: () => {
            setActiveViewTab('service')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          },
          onBookAppointment: () => {
            alert('Book appointment feature coming soon!')
          },
          onSetReminder: () => {
            alert('Set reminder feature coming soon!')
          },
          
          // Documents & Data
          onUploadFiles: () => {
            setActiveViewTab('documents')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          },
          onExportData: () => {
            alert('Export data feature coming soon!')
          },
          onShareVehicle: () => {
            alert('Share vehicle feature coming soon!')
          },
          
          // Vehicle Settings
          onEditDetails: () => setShowEditModal(true),
          onChangePhoto: () => {
            alert('Change photo feature coming soon!')
          },
          onDeleteVehicle: () => {
            if (confirm('Are you sure you want to delete this vehicle?')) {
              alert('Delete vehicle feature coming soon!')
            }
          }
        }}
      />

      {/* Modals (unchanged) */}
      <Modal
        isOpen={showActionsModal}
        onClose={() => setShowActionsModal(false)}
        title="More Actions"
        size="md"
      >
        <Text>Additional actions modal content here...</Text>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Vehicle"
        size="md"
      >
        <Text>Edit vehicle modal content here...</Text>
      </Modal>

      {/* AI Assistant Modal */}
      <VehicleAIChatModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        vehicleContext={{
          id: vehicleId,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          mileage: vehicle.current_mileage,
          vin: vehicle.vin // Add VIN for validation
        }}
      />
    </>
  )
}
