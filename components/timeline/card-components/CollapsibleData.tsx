/**
 * Collapsible Data Component
 * 
 * Progressive disclosure for data-rich events.
 * Shows summary by default, expands to show all details.
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { DataDisplay } from './DataGrid'

interface DataItem {
  label: string
  value: string | number
  highlight?: boolean
}

interface CollapsibleDataProps {
  /** Always visible items (2-4 key fields) */
  summary: DataItem[]
  /** Expandable items (additional details) */
  details: DataItem[]
  /** Start expanded */
  defaultExpanded?: boolean
  /** Compact mode for all items */
  compact?: boolean
}

export function CollapsibleData({
  summary,
  details,
  defaultExpanded = false,
  compact = false
}: CollapsibleDataProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  
  if (details.length === 0) {
    // No collapsible section needed
    return <DataDisplay items={summary} compact={compact} />
  }
  
  return (
    <div className="space-y-3">
      {/* Always visible summary */}
      <DataDisplay items={summary} compact={compact} />
      
      {/* Expandable details */}
      {expanded && (
        <div className="pt-3 border-t border-gray-100">
          <DataDisplay items={details} compact={compact} />
        </div>
      )}
      
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Show {details.length} more {details.length === 1 ? 'detail' : 'details'}
          </>
        )}
      </button>
    </div>
  )
}
