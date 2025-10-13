/**
 * Dashboard Warning Event Renderer - Elite Tier
 * 
 * Critical warning alerts with severity indicators and resolution tracking
 */

import { AlertTriangle, AlertCircle, XCircle, CheckCircle, Clock, Wrench } from 'lucide-react'
import { EventTypeRenderer, DataRow, getExtractedData } from './types'
import { TimelineItem } from '@/types/timeline'

export const WarningEvent: EventTypeRenderer = {
  getTitle: (item) => {
    const data = getExtractedData(item)
    const warningText = data.warning_text || data.warning_message || data.message || data.error_code
    
    if (warningText) {
      return warningText
    }
    
    return 'Dashboard Warning'
  },
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    const parts: string[] = []
    
    // Warning code
    const code = data.error_code || data.warning_code || data.code
    if (code) parts.push(`Code: ${code}`)
    
    // System affected
    const system = data.system_affected || data.component || data.system
    if (system) parts.push(system)
    
    // Severity
    const severity = data.severity || data.priority
    if (severity) parts.push(`${severity} priority`)
    
    return parts.length > 0 ? parts.join(' • ') : null
  },
  
  getDataRows: (item) => {
    const rows: DataRow[] = []
    const data = getExtractedData(item)
    
    // 🚨 Severity indicator
    const severity = data.severity || data.priority || data.warning_level
    if (severity) {
      let severityBadge
      const severityLower = severity.toLowerCase()
      
      if (severityLower.includes('critical') || severityLower.includes('urgent')) {
        severityBadge = (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border-2 border-red-300 shadow-sm">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-bold text-red-700 uppercase tracking-wide">
              Critical - Stop Driving
            </span>
          </span>
        )
      } else if (severityLower.includes('high') || severityLower.includes('serious')) {
        severityBadge = (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-300">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-bold text-orange-700">
              High - Service Soon
            </span>
          </span>
        )
      } else if (severityLower.includes('medium') || severityLower.includes('moderate')) {
        severityBadge = (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-bold text-yellow-700">
              Medium - Monitor
            </span>
          </span>
        )
      } else {
        severityBadge = (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">
              Low - Informational
            </span>
          </span>
        )
      }
      
      rows.push({ label: 'Severity', value: severityBadge })
    }
    
    // 📝 Description with formatting
    const description = data.description || data.warning_description || data.details
    if (description) {
      rows.push({
        label: 'Description',
        value: (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {description}
            </p>
          </div>
        )
      })
    }
    
    // 🔧 Recommended action
    const recommendedAction = data.recommended_action || data.action_required || data.suggestion
    if (recommendedAction) {
      rows.push({
        label: 'Recommended Action',
        value: (
          <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <Wrench className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium text-blue-900">
              {recommendedAction}
            </span>
          </div>
        )
      })
    }
    
    // ✅ Resolution status
    const resolved = data.resolved || data.status === 'resolved' || data.fixed
    const resolvedDate = data.resolved_date || data.fixed_date
    
    if (resolved !== undefined) {
      const statusDisplay = resolved ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-bold text-green-700">
            Resolved
            {resolvedDate && ` on ${new Date(resolvedDate).toLocaleDateString()}`}
          </span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
          <Clock className="w-4 h-4 text-red-600" />
          <span className="text-sm font-bold text-red-700">
            Unresolved
          </span>
        </span>
      )
      
      rows.push({ label: 'Status', value: statusDisplay })
    }
    
    // 🔢 Error/Warning code with copy functionality
    const errorCode = data.error_code || data.dtc_code || data.diagnostic_code
    if (errorCode) {
      rows.push({
        label: 'Diagnostic Code',
        value: (
          <div className="flex items-center gap-2">
            <code className="px-3 py-1.5 bg-gray-900 text-green-400 rounded font-mono text-sm font-semibold">
              {errorCode}
            </code>
            <button 
              onClick={() => navigator.clipboard.writeText(errorCode)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Copy
            </button>
          </div>
        )
      })
    }
    
    // ⏰ Time since warning appeared
    if (item.timestamp) {
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(item.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysSince >= 0 && !resolved) {
        const urgencyColor = daysSince > 30 ? 'text-red-700' : daysSince > 7 ? 'text-orange-700' : 'text-gray-700'
        
        rows.push({
          label: 'Active Duration',
          value: (
            <span className={`text-sm font-semibold ${urgencyColor} flex items-center gap-1.5`}>
              <Clock className="w-3.5 h-3.5" />
              {daysSince === 0 ? 'Today' : `${daysSince} days`}
              {daysSince > 7 && ' - Service recommended'}
            </span>
          )
        })
      }
    }
    
    return rows
  }
}
