/**
 * Timeline Item Compact - Ro.co Design
 * 
 * Spacious, information-rich timeline cards
 * Following Ro.co principles: generous whitespace, bold typography, soft shadows
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Fuel, 
  Wrench, 
  AlertTriangle,
  FileText,
  Gauge,
  TrendingUp,
  Camera,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  Circle,
  CheckCircle,
  AlertCircle,
  Bell,
  Edit2,
  Copy
} from 'lucide-react'
import { Flex } from '@/components/design-system'
import { TimelineItem as TimelineItemType } from '@/types/timeline'
import { getEventIcon, getEventColor } from '@/lib/utils/event-icons'
import { formatTime } from '@/lib/utils/date-grouping'

interface Props {
  item: TimelineItemType
  onEdit?: (item: TimelineItemType) => void
  onDelete?: (item: TimelineItemType) => void
  onExpand?: (id: string) => void
  selectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
  timelineMode?: boolean
}

export function TimelineItemCompact({
  item,
  onEdit,
  onDelete,
  onExpand,
  selectionMode,
  isSelected,
  onToggleSelect,
  timelineMode = false
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Get title based on event type
  const getTitle = (): string => {
    const data = item.extracted_data as any
    
    switch (item.type) {
      case 'fuel':
        return 'Fuel Fill-Up'
      case 'service':
      case 'maintenance':
        return data?.service_type || 'Service'
      case 'odometer':
        return 'Odometer Reading'
      case 'dashboard_warning':
        return 'Dashboard Warning'
      case 'dashboard_snapshot':
        return 'Dashboard Check'
      case 'tire_tread':
        return 'Tire Tread Check'
      case 'tire_pressure':
        return 'Tire Pressure Check'
      case 'damage':
        return 'Damage Report'
      case 'parking':
        return 'Parked Location'
      case 'document':
        // Ensure title case, not all caps (e.g., "Insurance Policy" not "INSURANCE POLICY")
        const docType = data?.document_type || 'Document'
        return docType.split(' ').map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')
      case 'inspection':
        const inspType = data?.inspection_type || 'both'
        if (inspType === 'safety') return 'Safety Inspection'
        if (inspType === 'emissions') return 'Emissions Test'
        return 'Vehicle Inspection'
      case 'recall':
        return 'Recall Notice'
      case 'manual':
        return data?.title || 'Manual Note'
    }
    return 'Event'
  }
  
  // Get extracted cost if available
  const cost = (item.extracted_data as any)?.cost || 0
  
  // Cost indicator helpers
  const getCostColor = () => {
    if (cost === 0) return null
    if (cost < 50) return 'bg-green-500'
    if (cost < 200) return 'bg-yellow-500'
    return 'bg-red-500'
  }
  
  const getCostLabel = () => {
    if (cost === 0) return null
    if (cost < 50) return 'Low cost'
    if (cost < 200) return 'Medium cost'
    return 'High cost'
  }
  
  // Get data rows for the card (label-value pairs)
  const getDataRows = (): Array<{ label: string; value: string | React.ReactNode }> => {
    const rows: Array<{ label: string; value: string | React.ReactNode }> = []
    const data = item.extracted_data as any
    
    switch (item.type) {
      case 'fuel':
        const gallons = data?.gallons
        const pricePerGal = cost && gallons ? cost / gallons : null
        if (cost > 0) {
          const costDisplay = (
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold text-gray-900 leading-none">${Number(cost).toFixed(2)}</span>
              {gallons && (
                <span className="text-sm text-gray-600">
                  {gallons.toFixed(1)} gal • ${pricePerGal?.toFixed(2)}/gal
                </span>
              )}
            </div>
          )
          rows.push({ label: 'Total Cost', value: costDisplay })
        }
        const mpg = data?.mpg_calculated
        if (mpg) {
          const badge = mpg >= 25 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50/85 backdrop-blur-sm rounded-lg border border-green-100/60">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-700">
                {mpg.toFixed(1)} MPG • Excellent
              </span>
            </span>
          ) : `${mpg.toFixed(1)} MPG`
          rows.push({ label: 'Efficiency:', value: badge })
        }
        break
        
      case 'service':
      case 'maintenance':
        const serviceCost = data?.cost || data?.total_cost
        const serviceType = data?.service_type || 'Oil + filter'
        if (serviceCost) {
          const costDisplay = (
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold text-gray-900 leading-none">${Number(serviceCost).toFixed(2)}</span>
              <span className="text-sm text-gray-600">{serviceType}</span>
            </div>
          )
          rows.push({ label: 'Cost:', value: costDisplay })
        }
        if (item.mileage) {
          const nextDue = Math.ceil(item.mileage / 5000) * 5000
          const milesUntil = nextDue - item.mileage
          const dueDisplay = (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/85 backdrop-blur-sm rounded-lg border border-blue-100/60">
              <Bell className="w-4 h-4 text-blue-700" />
              <span className="text-sm font-bold text-blue-700">Due in {milesUntil.toLocaleString()} mi</span>
            </span>
          )
          rows.push({ label: '', value: dueDisplay })
        }
        break
        
      case 'odometer':
        const reading = data?.reading || item.mileage
        const change = data?.change_since_last || 1842
        if (reading) {
          const readingDisplay = (
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900 leading-none">{Number(reading).toLocaleString()}</span>
                <span className="text-base font-semibold text-gray-600"> mi</span>
              </div>
              <span className="text-sm text-gray-600">+{change.toLocaleString()} mi since last</span>
            </div>
          )
          rows.push({ label: 'Reading:', value: readingDisplay })
        }
        const avgPerDay = Math.round(change / 7)
        rows.push({
          label: 'Average:',
          value: (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-gray-900">~{avgPerDay} mi/day</span>
              <span className="text-sm text-gray-600">• Over last week</span>
            </div>
          )
        })
        break
        
      case 'dashboard_warning':
        const warnings = data?.warning_type || []
        rows.push({
          label: 'Status:',
          value: (
            <span className="text-base font-semibold text-gray-900">
              {warnings.length} warnings active <span className="text-gray-600">• Since Oct 8</span>
            </span>
          )
        })
        rows.push({
          label: 'Action:',
          value: (
            <span className="text-base font-semibold text-gray-900">
              Diagnostic scan required <span className="text-sm text-gray-600">• Est. $150-500</span>
            </span>
          )
        })
        break
        
      case 'dashboard_snapshot':
        const systemsStatus = (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50/85 backdrop-blur-sm rounded-lg border border-green-100/60">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-bold text-green-700">All 4 normal</span>
          </span>
        )
        rows.push({ label: 'Systems:', value: systemsStatus })
        const fuelPct = data?.fuel_level || 75
        const range = Math.round(fuelPct * 2.4)
        rows.push({
          label: 'Fuel:',
          value: (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-gray-900">{fuelPct}%</span>
              <span className="text-sm text-gray-600">• Est. {range} mi range</span>
            </div>
          )
        })
        rows.push({
          label: 'Temp:',
          value: (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-gray-900">195°F</span>
              <span className="text-sm text-gray-600">• Normal</span>
            </div>
          )
        })
        break
        
      case 'tire_tread':
        const depth = data?.depth_32nds || 8
        const condition = depth >= 6 ? 'Good condition' : depth >= 4 ? 'Fair' : 'Replace soon'
        // PRIMARY FOCUS: Depth measurement
        rows.push({
          label: 'Depth:',
          value: (
            <div>
              <div className="text-3xl font-bold text-gray-900 leading-none mb-1">{depth}/32"</div>
              {depth >= 6 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50/85 backdrop-blur-sm rounded-lg border border-green-100/60">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">{condition}</span>
                </span>
              )}
            </div>
          )
        })
        const estLife = (depth - 2) * 2000
        rows.push({
          label: 'Est. life:',
          value: (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-gray-900">~{estLife.toLocaleString()} mi</span>
              <span className="text-sm text-gray-600">• Minimum: 2/32" (legal)</span>
            </div>
          )
        })
        break
        
      case 'tire_pressure':
        const pressures = data?.pressures || { front_left: 32, front_right: 32, rear_left: 32, rear_right: 32 }
        const targetPSI = 32
        const allNormal = Object.values(pressures).every((p: any) => Math.abs(p - targetPSI) < 3)
        
        if (allNormal) {
          // Collapsed view when all normal - NO redundant badge
          const statusDisplay = (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-gray-900">All tires: {targetPSI} PSI</span>
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            </div>
          )
          rows.push({ label: 'Pressure:', value: statusDisplay })
          rows.push({
            label: 'Temp:',
            value: <span className="text-base font-semibold text-gray-900">72°F</span>
          })
        } else {
          // Expanded grid when there's an issue
          rows.push({
            label: 'Target:',
            value: <span className="text-base font-semibold text-gray-900">{targetPSI} PSI</span>
          })
          rows.push({
            label: 'Actual:',
            value: (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-base font-semibold text-gray-900">
                <div>FL {pressures.front_left}</div>
                <div>FR {pressures.front_right}</div>
                <div>RL {pressures.rear_left}</div>
                <div>RR {pressures.rear_right}</div>
              </div>
            )
          })
        }
        break
        
      case 'damage':
        const severity = data?.severity || 'Moderate'
        const damageType = data?.damage_type || 'Paint + dent'
        const capitalizedSeverity = severity.charAt(0).toUpperCase() + severity.slice(1)
        rows.push({
          label: 'Severity:',
          value: <span className="text-base font-semibold text-gray-900">{capitalizedSeverity} damage</span>
        })
        rows.push({
          label: 'Type:',
          value: <span className="text-base font-semibold text-gray-900">{damageType}</span>
        })
        const estimate = data?.estimated_cost || 850
        rows.push({
          label: 'Estimate:',
          value: (
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-bold text-gray-900 leading-none">${estimate}</span>
              <span className="text-sm text-gray-600">Pending approval</span>
            </div>
          )
        })
        rows.push({
          label: 'Status:',
          value: <span className="text-base font-semibold text-gray-900">Pending submission</span>
        })
        break
        
      case 'parking':
        // Parking is special - handled separately
        break
        
      case 'document':
        const policy = data?.policy_number || 'AUTO-123-456-789'
        rows.push({
          label: 'Policy Number:',
          value: <span className="text-base font-semibold text-gray-900">{policy}</span>
        })
        rows.push({
          label: 'Coverage:',
          value: (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold text-gray-900">Full</span>
              <span className="text-sm text-gray-600">• Comprehensive + Collision</span>
            </div>
          )
        })
        // PRIMARY FOCUS: Expiration date with urgency
        const expirationDate = new Date('2025-12-31')
        const today = new Date()
        const daysUntilExpiry = Math.floor((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const monthsUntilExpiry = Math.floor(daysUntilExpiry / 30)
        
        let expiryColor = 'text-gray-600'
        let expiryText = `${monthsUntilExpiry} months remaining`
        
        let expiryIcon = null
        
        if (daysUntilExpiry < 30) {
          expiryColor = 'text-red-600 font-bold'
          expiryText = `Expires in ${daysUntilExpiry} days`
          expiryIcon = <AlertTriangle className="w-4 h-4 text-red-600" />
        } else if (monthsUntilExpiry < 3) {
          expiryColor = 'text-orange-600 font-semibold'
          expiryText = `Expires in ${monthsUntilExpiry} months`
          expiryIcon = <AlertTriangle className="w-4 h-4 text-orange-600" />
        }
        
        rows.push({
          label: 'Expires:',
          value: (
            <div>
              <div className="text-3xl font-bold text-gray-900 leading-none mb-2">Dec 31, 2025</div>
              {expiryIcon ? (
                <div className="inline-flex items-center gap-1.5">
                  {expiryIcon}
                  <span className={`text-sm font-bold ${expiryColor}`}>{expiryText}</span>
                </div>
              ) : (
                <span className={`text-sm ${expiryColor}`}>{expiryText}</span>
              )}
            </div>
          )
        })
        rows.push({
          label: 'Premium:',
          value: <span className="text-base font-semibold text-gray-900">$145/mo</span>
        })
        break
        
      case 'inspection':
        const inspectionType = data?.inspection_type || 'both'
        const result = data?.result || 'pass'
        const expirationDateInsp = data?.expiration_date ? new Date(data.expiration_date) : new Date('2026-01-15')
        const stationInsp = data?.station_name || 'State Inspection Station'
        
        rows.push({
          label: 'Type:',
          value: <span className="text-base font-semibold text-gray-900">
            {inspectionType === 'both' ? 'Safety + Emissions' : 
             inspectionType === 'safety' ? 'Safety Only' : 'Emissions Only'}
          </span>
        })
        
        // PRIMARY FOCUS: Result badge
        const resultBadge = result === 'pass' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50/85 backdrop-blur-sm rounded-lg border border-green-100/60">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm font-bold text-green-700">Passed</span>
          </span>
        ) : result === 'fail' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50/85 backdrop-blur-sm rounded-lg border border-red-100/60">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-sm font-bold text-red-700">Failed</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50/85 backdrop-blur-sm rounded-lg border border-yellow-100/60">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <span className="text-sm font-bold text-yellow-700">Conditional</span>
          </span>
        )
        rows.push({ label: 'Result:', value: resultBadge })
        
        // Expiration date with urgency
        const todayInsp = new Date()
        const daysUntilExpiryInsp = Math.floor((expirationDateInsp.getTime() - todayInsp.getTime()) / (1000 * 60 * 60 * 24))
        const monthsUntilExpiryInsp = Math.floor(daysUntilExpiryInsp / 30)
        
        let expiryColorInsp = 'text-gray-600'
        let expiryTextInsp = `${monthsUntilExpiryInsp} months remaining`
        let expiryIconInsp = null
        
        if (daysUntilExpiryInsp < 30) {
          expiryColorInsp = 'text-red-600 font-bold'
          expiryTextInsp = `Expires in ${daysUntilExpiryInsp} days`
          expiryIconInsp = <AlertTriangle className="w-4 h-4 text-red-600" />
        } else if (monthsUntilExpiryInsp < 3) {
          expiryColorInsp = 'text-orange-600 font-semibold'
          expiryTextInsp = `Expires in ${monthsUntilExpiryInsp} months`
          expiryIconInsp = <AlertTriangle className="w-4 h-4 text-orange-600" />
        }
        
        rows.push({
          label: 'Expires:',
          value: (
            <div>
              <div className="text-3xl font-bold text-gray-900 leading-none mb-2">
                {expirationDateInsp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              {expiryIconInsp ? (
                <div className="inline-flex items-center gap-1.5">
                  {expiryIconInsp}
                  <span className={`text-sm font-bold ${expiryColorInsp}`}>{expiryTextInsp}</span>
                </div>
              ) : (
                <span className={`text-sm ${expiryColorInsp}`}>{expiryTextInsp}</span>
              )}
            </div>
          )
        })
        
        if (data?.certificate_number) {
          rows.push({
            label: 'Certificate:',
            value: <span className="text-base font-semibold text-gray-900">{data.certificate_number}</span>
          })
        }
        break
        
      case 'recall':
        const recallId = data?.recall_id || 'NHTSA-2024-001'
        const severityRecall = data?.severity || 'safety'
        const component = data?.affected_component || 'Airbag system'
        const statusRecall = data?.status || 'open'
        const manufacturerRecall = data?.manufacturer || 'Manufacturer'
        
        rows.push({
          label: 'Recall ID:',
          value: <span className="text-base font-semibold text-gray-900">{recallId}</span>
        })
        
        // Severity badge
        const severityBadgeRecall = severityRecall === 'safety' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50/85 backdrop-blur-sm rounded-lg border border-red-100/60">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-sm font-bold text-red-700">Safety Critical</span>
          </span>
        ) : severityRecall === 'compliance' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50/85 backdrop-blur-sm rounded-lg border border-orange-100/60">
            <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span className="text-sm font-bold text-orange-700">Compliance</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/85 backdrop-blur-sm rounded-lg border border-blue-100/60">
            <span className="text-sm font-bold text-blue-700">Informational</span>
          </span>
        )
        rows.push({ label: 'Severity:', value: severityBadgeRecall })
        
        rows.push({
          label: 'Component:',
          value: <span className="text-base font-semibold text-gray-900">{component}</span>
        })
        
        // Status badge
        const statusBadgeRecall = statusRecall === 'resolved' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50/85 backdrop-blur-sm rounded-lg border border-green-100/60">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-sm font-bold text-green-700">Resolved</span>
          </span>
        ) : statusRecall === 'scheduled' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50/85 backdrop-blur-sm rounded-lg border border-yellow-100/60">
            <span className="text-sm font-bold text-yellow-700">Scheduled</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50/85 backdrop-blur-sm rounded-lg border border-red-100/60">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-sm font-bold text-red-700">Open - Action Required</span>
          </span>
        )
        rows.push({ label: 'Status:', value: statusBadgeRecall })
        
        if (manufacturerRecall) {
          rows.push({
            label: 'Issued by:',
            value: <span className="text-base font-semibold text-gray-900">{manufacturerRecall}</span>
          })
        }
        break
        
      case 'manual':
        const priority = data?.priority || 'Medium'
        const notes = data?.notes || item.notes || 'Slight pulling to right when braking. Alignment check needed at next service.'
        const truncatedNote = notes.length > 120 ? notes.substring(0, 120) + '...' : notes
        
        // Note card uses special layout - no data rows
        break
    }
    
    return rows
  }

  // Get subtitle/metadata
  const getSubtitle = (): string | null => {
    const data = item.extracted_data as any
    
    switch (item.type) {
      case 'fuel':
        return data?.station_name || null
      case 'service':
      case 'maintenance':
        return data?.vendor_name || null
      case 'damage':
        return data?.location || null
      case 'parking':
        return data?.lot_name || null
      case 'document':
        return data?.provider || data?.insurance_company || null
      case 'manual':
        const notes = data?.notes || item.notes
        return notes ? notes.substring(0, 60) + (notes.length > 60 ? '...' : '') : null
      default:
        return null
    }
  }

  // Get subtitle (one line of context)
  const getSubtitleText = (): string | null => {
    const data = item.extracted_data as any
    
    switch (item.type) {
      case 'fuel':
        const station = data?.station_name || 'Gas station'
        const distance = item.mileage ? `${item.mileage.toLocaleString()} mi` : null
        return distance ? `${station} • ${distance}` : station
      case 'service':
      case 'maintenance':
        const vendor = data?.vendor_name || 'Service center'
        const miles = item.mileage ? `${item.mileage.toLocaleString()} mi` : null
        return miles ? `${vendor} • ${miles}` : vendor
      case 'odometer':
        // Show change since last reading
        const change = data?.change_since_last
        if (change) {
          return `+${change.toLocaleString()} mi since last check`
        }
        return 'Manual entry'
      case 'dashboard_warning':
        // Show WHICH warnings (first 3-4)
        const warnings = data?.warning_type
        if (warnings && warnings.length > 0) {
          const warningList = warnings.slice(0, 4).join(', ')
          return warnings.length > 4 ? `${warningList}, +${warnings.length - 4} more` : warningList
        }
        return 'Warning detected'
      case 'dashboard_snapshot':
        // Show fuel level and mileage context
        const fuelLevel = data?.fuel_level
        const snapMileage = item.mileage
        const parts = []
        parts.push('System check')
        if (fuelLevel) parts.push(`Fuel ${fuelLevel}%`)
        if (snapMileage) parts.push(`${snapMileage.toLocaleString()} mi`)
        return parts.join(' • ')
      case 'tire_tread':
        // Show position
        if (data?.position) {
          return data.position.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
        }
        return 'Tire inspection'
      case 'tire_pressure':
        return 'All tires'
      case 'damage':
        return data?.location || 'Vehicle damage'
      case 'parking':
        // Fix: Remove duplicate "Level" and simplify
        const lot = data?.lot_name || 'Parking location'
        const level = data?.level ? `Level ${data.level}` : null
        return level ? `${lot} • ${level}` : lot
      case 'document':
        // Fix: Use title case, not all caps
        const provider = data?.provider || data?.insurance_company
        return provider || 'Document'
      case 'inspection':
        const stationName = data?.station_name || 'Inspection station'
        const inspResult = data?.result || 'pass'
        return `${stationName} • ${inspResult === 'pass' ? 'Passed' : inspResult === 'fail' ? 'Failed' : 'Conditional'}`
      case 'recall':
        const recallComponent = data?.affected_component || 'Component'
        const recallStatus = data?.status || 'open'
        return `${recallComponent} • ${recallStatus === 'resolved' ? 'Resolved' : recallStatus === 'scheduled' ? 'Scheduled' : 'Action required'}`
      case 'manual':
        // Show full note text (will be styled larger)
        const notes = data?.notes || item.notes
        if (notes) {
          // Show up to 150 chars for better preview
          return notes.length > 150 ? notes.substring(0, 150) + '...' : notes
        }
        return 'Manual entry'
      default:
        return null
    }
  }

  // Get status badge (semantic colors only)
  const getStatusBadge = (): { type: 'urgent' | 'attention' | 'positive' | 'info' | 'neutral'; message: string } | null => {
    const data = item.extracted_data as any
    
    switch (item.type) {
      case 'fuel':
        const mpg = data?.mpg_calculated
        if (mpg) {
          if (mpg >= 30) return { type: 'positive', message: `Excellent • ${mpg.toFixed(1)} MPG` }
          if (mpg < 20) return { type: 'attention', message: `Poor • ${mpg.toFixed(1)} MPG` }
          return { type: 'neutral', message: `${mpg.toFixed(1)} MPG` }
        }
        return null
      
      case 'dashboard_warning':
        // 🔴 Red - Urgent action needed
        return { type: 'urgent', message: 'Action Required' }
      
      case 'dashboard_snapshot':
        // 🟢 Green - Positive status
        return { type: 'positive', message: 'All systems normal' }
      case 'service':
      case 'maintenance':
        // 🔵 Blue - Informational
        if (item.mileage) {
          const nextDue = Math.ceil(item.mileage / 5000) * 5000
          const milesUntil = nextDue - item.mileage
          return { type: 'info', message: `Due in ~${milesUntil.toLocaleString()} mi` }
        }
        return null
      
      case 'tire_tread':
        const depth = data?.depth_32nds
        if (depth) {
          if (depth >= 6) return { type: 'positive', message: `Good • ${depth}/32" above min` }
          if (depth >= 4) return { type: 'attention', message: `Fair • ${depth}/32" replace soon` }
          if (depth < 4) return { type: 'urgent', message: `Low • ${depth}/32" replace now` }
        }
        const condition = data?.condition?.toLowerCase()
        if (condition === 'good' || condition === 'excellent') {
          return { type: 'positive', message: 'Good condition' }
        } else if (condition === 'fair') {
          return { type: 'attention', message: 'Replace soon' }
        } else if (condition === 'poor' || condition === 'replace') {
          return { type: 'urgent', message: 'Replace now' }
        }
        return null
      
      case 'tire_pressure':
        // Check if any tire is significantly low
        const pressures = data?.pressures
        if (pressures) {
          const allPressures = [
            pressures.front_left,
            pressures.front_right,
            pressures.rear_left,
            pressures.rear_right
          ]
          const lowPressure = allPressures.some((p: number) => p < 28)
          const criticalPressure = allPressures.some((p: number) => p < 24)
          
          if (criticalPressure) return { type: 'urgent', message: 'Critical • Inflate now' }
          if (lowPressure) return { type: 'attention', message: 'Low • Check pressure' }
          return { type: 'positive', message: 'All pressures normal' }
        }
        return { type: 'positive', message: 'All pressures normal' }
      
      case 'damage':
        const severity = data?.severity?.toLowerCase()
        const status = data?.repair_status || 'Pending'
        
        if (severity === 'major' || severity === 'severe') {
          // 🔴 Red - Major damage is urgent
          return { type: 'urgent', message: `Major • ${status}` }
        } else if (severity === 'moderate') {
          // 🟡 Yellow - Moderate needs attention
          return { type: 'attention', message: `Moderate • ${status}` }
        } else if (severity === 'minor') {
          // 🔵 Blue - Minor is just informational
          return { type: 'info', message: `Minor • ${status}` }
        }
        return { type: 'info', message: status }
      
      case 'parking':
        // 🔵 Blue - Informational (actionable)
        return { type: 'info', message: 'View map' }
      
      case 'document':
        // 🔵 Blue - Informational
        if (data?.expiration_date) {
          const expDate = new Date(data.expiration_date)
          const monthYear = expDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          return { type: 'info', message: `Valid through ${monthYear}` }
        }
        return null
      
      case 'odometer':
        // No badge needed - neutral event
        return null
      
      case 'manual':
        // No badge needed - just a note
        return null
      
      default:
        return null
    }
  }

  const title = getTitle()
  const subtitle = getSubtitle()
  const subtitleText = getSubtitleText()
  const dataRows = getDataRows()
  
  // Format timestamp - just show TIME (date is in sticky header)
  const formatContextualTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
    
    // Just show the time - date context is in sticky header
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }
  
  const time = formatContextualTime(item.timestamp || new Date())
  
  // Special handling for manual notes - extract category badge
  const getCategoryBadge = () => {
    if (item.type !== 'manual') return null
    const data = item.extracted_data as any
    const category = data?.category || 'Brake Issue'
    const priority = data?.priority || 'Medium'
    return (
      <div className="flex items-center gap-2 mt-0.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100/85 backdrop-blur-sm border border-yellow-300/60 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-yellow-700" />
          <span className="text-sm font-bold text-yellow-800">
            {category}
          </span>
        </span>
        <span className="text-sm text-gray-600">• {priority} priority</span>
      </div>
    )
  }
  
  // Determine urgency level for visual indicators
  // SIMPLIFIED: Only dashboard_warning and open recalls get orange left border
  const getUrgencyLevel = (): 'urgent' | 'normal' => {
    const data = item.extracted_data as any
    
    // Dashboard warnings with high/critical severity
    if (item.type === 'dashboard_warning') {
      const severity = data?.severity
      if (severity === 'high' || severity === 'critical') {
        return 'urgent'
      }
    }
    
    // Open recalls (not resolved or scheduled)
    if (item.type === 'recall') {
      const status = data?.status
      if (status === 'open') {
        return 'urgent'
      }
    }
    
    // Everything else is normal (white background)
    return 'normal'
  }
  
  const urgencyLevel = getUrgencyLevel()
  
  // Get icon circle background color by event type
  const getIconBgColor = () => {
    switch (item.type) {
      case 'fuel':
      case 'service':
      case 'maintenance':
      case 'odometer':
      case 'tire_tread':
      case 'tire_pressure':
        return 'bg-blue-50/80' // Routine maintenance
      
      case 'dashboard_warning':
        return 'bg-yellow-50/80' // Warnings
      
      case 'damage':
        return 'bg-red-50/80' // Damage/incidents
      
      case 'document':
      case 'inspection':
        return 'bg-green-50/80' // Documents/insurance/inspections
      
      case 'recall':
        return 'bg-red-50/80' // Safety-critical recalls
      
      case 'manual':
      case 'parking':
      case 'dashboard_snapshot':
      default:
        return 'bg-gray-100/80' // Notes/misc
    }
  }

  // Timeline dot colors (simple, solid colors)
  const getTimelineDotColor = () => {
    switch (item.type) {
      case 'fuel':
      case 'service':
      case 'maintenance':
        return 'bg-blue-500' // Routine maintenance - blue
      
      case 'dashboard_warning':
        return 'bg-yellow-500' // Warnings - yellow
      
      case 'damage':
        return 'bg-red-500' // Damage - red
      
      case 'document':
        return 'bg-green-500' // Documents - green
      
      case 'odometer':
      case 'tire_tread':
      case 'tire_pressure':
      case 'dashboard_snapshot':
      case 'parking':
      case 'manual':
      default:
        return 'bg-gray-500' // Misc - gray
    }
  }

  return (
    <motion.div 
      className="relative group"
      initial={false}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
    >
      {/* Simple timeline dot + connector when in timeline mode */}
      {timelineMode && (
        <>
          {/* SIMPLE COLORED DOT on timeline - no icon */}
          <motion.div 
            initial={false}
            className={`
              absolute -left-14 left-8 -translate-x-1/2 top-7
              w-3 h-3 rounded-full shadow-sm
              ${getTimelineDotColor()}
              border-2 border-white
              z-10
            `}
            whileHover={{ scale: 1.5 }}
            transition={{ duration: 0.2 }}
          />
          
          {/* SUBTLE horizontal connector */}
          <motion.div
            initial={false}
            className="absolute -left-6 left-9 top-8 w-4 h-px bg-gray-200 z-10"
            whileHover={{ width: '1.25rem' }}
            transition={{ duration: 0.2 }}
          />
        </>
      )}
      
      <div className="relative z-10">
      <div
        className={`
          relative overflow-hidden
          bg-white rounded-xl md:rounded-2xl
          p-4 md:p-6
          shadow-sm
          hover:shadow-xl
          transition-shadow duration-300 ease-out
          cursor-pointer
          border border-gray-200
          ${urgencyLevel === 'urgent' ? 'border-l-4 border-l-orange-500' : ''}
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
        `}
        onClick={() => !selectionMode && onExpand?.(item.id)}
      >
        
        {/* Card content */}
        <div className="relative z-10">
          {/* Header: Icon + Title + Time */}
          <div className="flex items-start gap-4 pb-6 mb-6 border-b border-gray-100">
        {/* Selection Checkbox */}
        {selectionMode && (
          <div 
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect?.()
            }}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer mt-0.5 ${
              isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 hover:border-gray-400'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
        )}

        {/* Icon circle - ALWAYS in card (restored to original position) */}
        <div className="relative">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl ${getIconBgColor()} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <div className="scale-90 md:scale-100">
              {getEventIcon(item.type)}
            </div>
          </div>
          
          {/* Cost Indicator Dot */}
          {getCostColor() && (
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getCostColor()} border-2 border-white shadow-sm`} 
                 title={getCostLabel() || undefined}
            />
          )}
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          {/* Title Row with Time and Menu */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-gray-900">
              {title}
            </h3>
            <Flex gap="xs" align="center" className="flex-shrink-0">
              <time className="text-sm text-gray-900 font-bold whitespace-nowrap">
                {formatTime(item.timestamp || new Date())}
              </time>
              
              {/* Cost Badge */}
              {cost > 0 && (
                <span className={`
                  px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap
                  ${cost < 50 ? 'bg-green-100 text-green-700' : ''}
                  ${cost >= 50 && cost < 200 ? 'bg-yellow-100 text-yellow-700' : ''}
                  ${cost >= 200 ? 'bg-red-100 text-red-700' : ''}
                `}>
                  ${cost.toFixed(0)}
                </span>
              )}
              
              {/* Overflow Menu */}
              {!selectionMode && (onEdit || onDelete) && (
              <div className="relative flex-shrink-0" ref={menuRef}>
                <button
                  onClick={(e) => {
                  
                    setMenuOpen(!menuOpen)
                  }}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
                
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpen(false)
                        onEdit(item)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      navigator.clipboard.writeText(item.id)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy ID</span>
                  </button>
                  {onDelete && (
                    <>
                      <div className="border-t border-gray-200 my-1" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpen(false)
                          onDelete(item)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
                )}
              </div>
              )}
            </Flex>
          </div>

          {/* Subtitle (one line of context) - Truncate on mobile */}
          {subtitleText && (
            <div className="text-sm text-gray-500 mt-1 leading-relaxed truncate md:whitespace-normal">
              {subtitleText}
            </div>
          )}
          
          {/* Category badge for manual notes */}
          {item.type === 'manual' && getCategoryBadge()}
        </div>
      </div>

      {/* Data rows - label value pairs */}
      {item.type === 'parking' ? (
        // Special layout for parking - PRIMARY FOCUS: Spot number
        <div className="space-y-4 mt-6">
          <div>
            <div className="text-sm text-gray-500 mb-1">Parking spot</div>
            <div className="text-6xl font-bold text-gray-900 leading-none mb-4">
              {(item.extracted_data as any)?.spot_number || 'B-47'}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm text-gray-500">Duration</div>
              <div className="text-base font-semibold text-gray-900">2 hours</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Rate</div>
              <div className="text-base font-semibold text-gray-900">$24/day</div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors text-base">
                View Map
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-bold hover:bg-gray-200 transition-colors text-base">
                Directions
              </button>
            </div>
          </div>
        </div>
      ) : item.type === 'manual' ? (
        // Manual Note - STRUCTURED DATA ONLY (no wall of text)
        <div className="space-y-4 mt-6">
          {/* Issue - PRIMARY FOCUS */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Issue</div>
            <div className="text-3xl font-bold text-gray-900 leading-none mb-4">Brake pulling right</div>
          </div>
          
          {/* Priority & Category */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100/85 backdrop-blur-sm border border-yellow-300/60 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-700" />
              <span className="text-sm font-bold text-yellow-800">Medium Priority</span>
            </span>
            <span className="text-sm text-gray-600">Brake System</span>
          </div>
          
          {/* Action Required */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Action required</div>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors text-base">
              Schedule brake inspection
            </button>
          </div>
        </div>
      ) : dataRows.length > 0 ? (
        <div className="space-y-4 mt-6">
          {dataRows.map((row: { label: string; value: string | React.ReactNode }, idx: number) => (
            <div key={idx} className="flex">
              <span className="text-sm text-gray-500 w-28 flex-shrink-0">{row.label}</span>
              <div className="flex-1">{row.value}</div>
            </div>
          ))}
          
          {/* Special: View photos button for damage */}
          {item.type === 'damage' && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <button className="inline-flex items-center gap-2 px-5 py-3 bg-blue-50 text-blue-700 rounded-lg text-base font-semibold hover:bg-blue-100 transition-colors shadow-sm">
                <Camera className="w-4 h-4" />
                View photos (3)
              </button>
            </div>
          )}
        </div>
      ) : null}
        
        </div>
      </div>
      </div>
    </motion.div>
  )
}
