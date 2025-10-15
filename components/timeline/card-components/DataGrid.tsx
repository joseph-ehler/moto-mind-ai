/**
 * Data Display Component - ADAPTIVE SPECIFICATION
 * 
 * Handles both data-sparse and data-rich scenarios gracefully.
 * 
 * Layouts:
 * 1. Single column (list) - For 1 item, 5+ items, or long values
 * 2. Two-column grid - For 2-4 items with short values
 * 
 * Key features:
 * - Label on LEFT, value on RIGHT (ALWAYS - in every column)
 * - Visual dividers in single-column mode
 * - Grid layout for compact display when appropriate
 * - Scales from 1 item to 20+ items
 */

interface DataItem {
  label: string
  value: string | number
  /** Optional: highlight this row */
  highlight?: boolean
}

interface DataDisplayProps {
  items: DataItem[]
  /** Compact mode for shorter rows */
  compact?: boolean
  /** Force layout mode (auto-detects if not specified) */
  layout?: 'list' | 'grid' | 'auto'
}

export function DataDisplay({ items, compact = false, layout = 'auto' }: DataDisplayProps) {
  if (items.length === 0) return null
  
  // Auto-detect layout based on data
  const shouldUseGrid = layout === 'grid' || (
    layout === 'auto' &&
    items.length >= 2 && 
    items.length <= 4 &&
    items.every(item => String(item.value).length < 20) // Short values only
  )
  
  // TWO-COLUMN GRID LAYOUT (with dividers)
  if (shouldUseGrid) {
    // Calculate number of rows for divider logic
    const numRows = Math.ceil(items.length / 2)
    
    return (
      <dl className="grid grid-cols-2 gap-x-6">
        {items.map((item, idx) => {
          const rowIndex = Math.floor(idx / 2)
          const isLastRow = rowIndex === numRows - 1
          
          return (
            <div 
              key={idx}
              className={`flex justify-between items-center py-3 ${
                !isLastRow ? 'border-b border-gray-100' : ''
              } ${item.highlight ? 'bg-blue-50/50 -mx-2 px-2 rounded' : ''}`}
            >
              <dt className="text-xs text-gray-500 font-medium pr-3">
                {item.label}
              </dt>
              <dd className="text-sm font-semibold text-gray-900 text-right">
                {item.value}
              </dd>
            </div>
          )
        })}
      </dl>
    )
  }
  
  // SINGLE-COLUMN LIST LAYOUT (with dividers)
  return (
    <dl className="divide-y divide-gray-100">
      {items.map((item, idx) => (
        <div 
          key={idx} 
          className={`flex justify-between items-center ${
            compact ? 'py-2' : 'py-3'
          } ${item.highlight ? 'bg-blue-50/50 -mx-1 px-1 rounded' : ''}`}
        >
          <dt className="text-xs text-gray-500 font-medium pr-4">
            {item.label}
          </dt>
          <dd className="text-sm font-semibold text-gray-900 text-right">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

// Legacy export for backwards compatibility
export const DataGrid = DataDisplay
