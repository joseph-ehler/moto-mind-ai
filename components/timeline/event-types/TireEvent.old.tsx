/**
 * Tire Event Renderer - Elite Tier
 * 
 * Tire tread depth and pressure monitoring with safety indicators
 */

import { CheckCircle, AlertTriangle, AlertCircle, Gauge } from 'lucide-react'
import { EventTypeRenderer, DataRow, getExtractedData } from './types'
import { TimelineItem } from '@/types/timeline'

export const TireEvent: EventTypeRenderer = {
  getTitle: (item) => {
    if (item.type === 'tire_pressure') {
      return 'Tire Pressure Check'
    }
    return 'Tire Tread Check'
  },
  
  getSubtitle: (item) => {
    const data = getExtractedData(item)
    const parts: string[] = []
    
    // Location
    const location = data.location || data.shop_name
    if (location) parts.push(location)
    
    // Tire positions checked
    const positions = data.positions_checked || data.tires_checked
    if (positions && Array.isArray(positions)) {
      parts.push(`${positions.length} tires`)
    } else if (data.all_tires) {
      parts.push('All 4 tires')
    }
    
    return parts.length > 0 ? parts.join(' • ') : null
  },
  
  getDataRows: (item) => {
    const rows: DataRow[] = []
    const data = getExtractedData(item)
    
    if (item.type === 'tire_pressure') {
      // 🌡️ TIRE PRESSURE DATA
      
      const fl = data.front_left || data.fl_pressure
      const fr = data.front_right || data.fr_pressure
      const rl = data.rear_left || data.rl_pressure
      const rr = data.rear_right || data.rr_pressure
      
      if (fl || fr || rl || rr) {
        const getPressureColor = (psi: number) => {
          if (psi < 28) return 'bg-red-50 border-red-200 text-red-700'
          if (psi < 30) return 'bg-yellow-50 border-yellow-200 text-yellow-700'
          if (psi > 36) return 'bg-orange-50 border-orange-200 text-orange-700'
          return 'bg-green-50 border-green-200 text-green-700'
        }
        
        const getPressureIcon = (psi: number) => {
          if (psi < 28 || psi > 36) return <AlertTriangle className="w-4 h-4" />
          if (psi < 30) return <AlertCircle className="w-4 h-4" />
          return <CheckCircle className="w-4 h-4" />
        }
        
        const pressureDisplay = (
          <div className="grid grid-cols-2 gap-2">
            {/* Front Left */}
            {fl && (
              <div className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 border ${getPressureColor(fl)}`}>
                <div className="flex items-center gap-2">
                  {getPressureIcon(fl)}
                  <span className="text-xs font-medium">FL</span>
                </div>
                <span className="text-base font-bold">{fl} PSI</span>
              </div>
            )}
            
            {/* Front Right */}
            {fr && (
              <div className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 border ${getPressureColor(fr)}`}>
                <div className="flex items-center gap-2">
                  {getPressureIcon(fr)}
                  <span className="text-xs font-medium">FR</span>
                </div>
                <span className="text-base font-bold">{fr} PSI</span>
              </div>
            )}
            
            {/* Rear Left */}
            {rl && (
              <div className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 border ${getPressureColor(rl)}`}>
                <div className="flex items-center gap-2">
                  {getPressureIcon(rl)}
                  <span className="text-xs font-medium">RL</span>
                </div>
                <span className="text-base font-bold">{rl} PSI</span>
              </div>
            )}
            
            {/* Rear Right */}
            {rr && (
              <div className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 border ${getPressureColor(rr)}`}>
                <div className="flex items-center gap-2">
                  {getPressureIcon(rr)}
                  <span className="text-xs font-medium">RR</span>
                </div>
                <span className="text-base font-bold">{rr} PSI</span>
              </div>
            )}
          </div>
        )
        
        rows.push({ label: 'Tire Pressure', value: pressureDisplay })
      }
      
      // Recommended pressure
      const recommendedPSI = data.recommended_pressure || data.target_psi
      if (recommendedPSI) {
        rows.push({
          label: 'Recommended',
          value: (
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">
                {recommendedPSI} PSI (optimal)
              </span>
            </div>
          )
        })
      }
      
    } else {
      // 📏 TIRE TREAD DEPTH DATA
      
      const fl = data.front_left_tread || data.fl_tread
      const fr = data.front_right_tread || data.fr_tread
      const rl = data.rear_left_tread || data.rl_tread
      const rr = data.rear_right_tread || data.rr_tread
      
      if (fl || fr || rl || rr) {
        const getTreadColor = (depth: number) => {
          if (depth < 3) return 'bg-red-50 border-red-200 text-red-700'
          if (depth < 5) return 'bg-yellow-50 border-yellow-200 text-yellow-700'
          return 'bg-green-50 border-green-200 text-green-700'
        }
        
        const getTreadIcon = (depth: number) => {
          if (depth < 3) return <AlertTriangle className="w-4 h-4" />
          if (depth < 5) return <AlertCircle className="w-4 h-4" />
          return <CheckCircle className="w-4 h-4" />
        }
        
        const getTreadLabel = (depth: number) => {
          if (depth < 3) return 'Replace'
          if (depth < 5) return 'Monitor'
          return 'Good'
        }
        
        const treadDisplay = (
          <div className="grid grid-cols-2 gap-2">
            {fl && (
              <div className={`flex flex-col gap-1 rounded-lg px-3 py-2 border ${getTreadColor(fl)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getTreadIcon(fl)}
                    <span className="text-xs font-medium">FL</span>
                  </div>
                  <span className="text-xs font-bold">{getTreadLabel(fl)}</span>
                </div>
                <div className="text-base font-bold">{fl}/32"</div>
              </div>
            )}
            
            {fr && (
              <div className={`flex flex-col gap-1 rounded-lg px-3 py-2 border ${getTreadColor(fr)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getTreadIcon(fr)}
                    <span className="text-xs font-medium">FR</span>
                  </div>
                  <span className="text-xs font-bold">{getTreadLabel(fr)}</span>
                </div>
                <div className="text-base font-bold">{fr}/32"</div>
              </div>
            )}
            
            {rl && (
              <div className={`flex flex-col gap-1 rounded-lg px-3 py-2 border ${getTreadColor(rl)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getTreadIcon(rl)}
                    <span className="text-xs font-medium">RL</span>
                  </div>
                  <span className="text-xs font-bold">{getTreadLabel(rl)}</span>
                </div>
                <div className="text-base font-bold">{rl}/32"</div>
              </div>
            )}
            
            {rr && (
              <div className={`flex flex-col gap-1 rounded-lg px-3 py-2 border ${getTreadColor(rr)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getTreadIcon(rr)}
                    <span className="text-xs font-medium">RR</span>
                  </div>
                  <span className="text-xs font-bold">{getTreadLabel(rr)}</span>
                </div>
                <div className="text-base font-bold">{rr}/32"</div>
              </div>
            )}
          </div>
        )
        
        rows.push({ label: 'Tread Depth', value: treadDisplay })
      }
      
      // Overall tire condition
      const overallCondition = data.overall_condition || data.tire_condition
      if (overallCondition) {
        let conditionBadge
        const conditionLower = overallCondition.toLowerCase()
        
        if (conditionLower.includes('excellent') || conditionLower.includes('good')) {
          conditionBadge = (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-700">{overallCondition}</span>
            </span>
          )
        } else if (conditionLower.includes('fair') || conditionLower.includes('monitor')) {
          conditionBadge = (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-bold text-yellow-700">{overallCondition}</span>
            </span>
          )
        } else {
          conditionBadge = (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-red-700">{overallCondition}</span>
            </span>
          )
        }
        
        rows.push({ label: 'Condition', value: conditionBadge })
      }
    }
    
    // Rotation recommended
    const rotationDue = data.rotation_recommended || data.rotation_due
    if (rotationDue) {
      rows.push({
        label: 'Rotation',
        value: (
          <span className="text-sm text-orange-700 font-medium bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
            Recommended
          </span>
        )
      })
    }
    
    return rows
  }
}
