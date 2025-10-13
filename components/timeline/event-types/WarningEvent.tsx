/**
 * Dashboard Warning Event Renderer - FLEXIBLE VERSION
 * 
 * Handles both data-sparse and data-rich scenarios:
 * - Warning accent: Orange left border + tinted header
 * - AlertBox: For primary warning (uses WARNING_BOX legacy support)
 * - Data: Additional diagnostic info when available
 * - Systems: Affected systems as chips (legacy support)
 * - Badge: Severity or resolution status
 */

import { AlertCircle, AlertTriangle } from 'lucide-react'
import { EventTypeRenderer, getExtractedData, type EventCardData } from './types'
import { TimelineItem } from '@/types/timeline'

export const WarningEvent: EventTypeRenderer = {
  getTitle: () => 'Dashboard Warning',
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    const warningCount = data.warning_count || data.warnings?.length || (data.warning_text ? 1 : 0)
    
    if (warningCount === 0) {
      return data.status || 'Warning detected'
    }
    
    return `${warningCount} warning${warningCount > 1 ? 's' : ''} active`
  },
  
  getCardData: (item): EventCardData => {
    const data = getExtractedData(item)
    const severity = data.severity || 'warning'
    
    const cardData: EventCardData = {
      data: [],
      accent: severity === 'critical' ? 'danger' : 'warning'
    }
    
    // Primary warning info - uses legacy WARNING_BOX for AlertBox rendering
    const primaryWarning = data.warnings?.[0] || {
      system: data.system_affected || data.warning_text || null,
      description: data.description || data.warning_message || null
    }
    
    if (primaryWarning.system) {
      cardData.data.push({
        label: 'WARNING_BOX',
        value: JSON.stringify({
          title: primaryWarning.system,
          description: primaryWarning.description || 'Warning detected'
        })
      })
    }
    
    // Diagnostic codes (if available)
    if (data.diagnostic_codes && data.diagnostic_codes.length > 0) {
      cardData.data.push({
        label: 'Diagnostic codes',
        value: data.diagnostic_codes.join(', ')
      })
    }
    
    // Odometer
    if (item.mileage && item.mileage > 0) {
      cardData.data.push({
        label: 'Odometer',
        value: `${item.mileage.toLocaleString()} mi`
      })
    }
    
    // Resolution status
    if (data.resolved_at) {
      cardData.data.push({
        label: 'Resolved',
        value: new Date(data.resolved_at).toLocaleDateString()
      })
    }
    
    // Affected systems - uses legacy SYSTEMS_LIST for chip rendering
    const systems = data.affected_systems || data.systems || []
    if (systems.length > 0) {
      cardData.data.push({
        label: 'SYSTEMS_LIST',
        value: JSON.stringify(systems)
      })
    }
    
    // AI SUMMARY - OpenAI Vision insights
    if (data.ai_summary) {
      cardData.aiSummary = {
        text: data.ai_summary,
        confidence: data.ai_confidence || 'medium'
      }
    }
    
    // BADGE - Severity or resolution status
    if (data.resolved) {
      cardData.badges = [{
        text: 'Resolved',
        variant: 'success',
        icon: <AlertCircle className="w-4 h-4 text-green-600" />
      }]
    } else if (severity === 'critical') {
      cardData.badges = [{
        text: 'Diagnostic scan recommended',
        variant: 'danger',
        icon: <AlertTriangle className="w-4 h-4 text-red-600" />
      }]
    } else {
      cardData.badges = [{
        text: 'Monitor closely',
        variant: 'warning',
        icon: <AlertCircle className="w-4 h-4 text-orange-600" />
      }]
    }
    
    return cardData
  }
}
