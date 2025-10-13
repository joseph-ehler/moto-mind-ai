/**
 * Fuel Event Renderer - REDESIGNED
 * 
 * Clean, hierarchical card design with clear visual priority
 */

import { TrendingUp, Fuel } from 'lucide-react'
import { EventTypeRenderer, getExtractedData, getCost } from './types'
import { TimelineItem } from '@/types/timeline'

export const FuelEvent: EventTypeRenderer = {
  getTitle: (item) => {
    return 'Fuel Fill-Up'
  },
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    // Just location/station for subtitle
    return data.location || data.station_name || data.gas_station || null
  },
  
  getDataRows: (item) => {
    const rows: DataRow[] = []
    const data = getExtractedData(item)
    const cost = getCost(item)
    const gallons = data.gallons || data.volume || data.liters
    const pricePerGal = cost && gallons ? cost / gallons : null
    
    // Build Primary Metric for cost
    if (cost > 0) {
      rows.push({
        label: 'PRIMARY_METRIC',
        value: (
          <PrimaryMetric
            value={`$${Number(cost).toFixed(2)}`}
            subtext={pricePerGal ? `${gallons?.toFixed(1)} gal @ $${pricePerGal.toFixed(3)}/gal` : undefined}
          />
        )
      })
    }
    
    // Volume
    if (gallons && gallons > 0) {
      rows.push({
        label: 'Volume',
        value: (
          <Flex align="center" gap="xs">
            <Droplet className="w-4 h-4 text-blue-500" />
            <Text size="sm" className="font-semibold text-gray-900">
              {gallons.toFixed(1)} gallons
            </Text>
          </Flex>
        )
      })
    }
    
    // Price per gallon
    if (pricePerGal) {
      rows.push({
        label: 'Price/Gallon',
        value: `$${pricePerGal.toFixed(3)}`
      })
    }
    
    // Distance traveled
    const distance = data.trip_distance || data.miles_since_last_fill
    if (distance && distance > 0) {
      rows.push({ 
        label: 'Distance', 
        value: `${distance.toLocaleString()} mi`
      })
      
      // Cost per mile
      if (cost > 0) {
        const costPerMile = cost / distance
        rows.push({
          label: 'Cost/Mile',
          value: `$${costPerMile.toFixed(3)}`
        })
      }
    }
    
    // Fuel Economy Badge
    const mpg = data.mpg_calculated || data.fuel_economy || data.miles_per_gallon
    if (mpg && mpg > 0) {
      const badges: StatusBadge[] = []
      
      if (mpg >= 30) {
        badges.push({
          label: `${mpg.toFixed(1)} MPG • Exceptional`,
          variant: 'success',
          icon: <TrendingUp className="w-4 h-4" />
        })
      } else if (mpg >= 25) {
        badges.push({
          label: `${mpg.toFixed(1)} MPG • Excellent`,
          variant: 'success',
          icon: <CheckCircle className="w-4 h-4" />
        })
      } else if (mpg >= 20) {
        badges.push({
          label: `${mpg.toFixed(1)} MPG • Good`,
          variant: 'info',
          icon: <CheckCircle className="w-4 h-4" />
        })
      } else if (mpg >= 15) {
        badges.push({
          label: `${mpg.toFixed(1)} MPG • Fair`,
          variant: 'warning',
          icon: <AlertCircle className="w-4 h-4" />
        })
      } else {
        badges.push({
          label: `${mpg.toFixed(1)} MPG • Below Average`,
          variant: 'danger',
          icon: <TrendingDown className="w-4 h-4" />
        })
      }
      
      rows.push({
        label: 'BADGES',
        value: <StatusBadges badges={badges} />
      })
    }
    
    return rows
  }
}
