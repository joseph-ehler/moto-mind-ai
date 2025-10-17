'use client'

/**
 * Data Display Design System
 * 
 * Comprehensive components for displaying data in tables, lists, and timelines
 */

import * as React from 'react'
import { Flex, Stack } from '../primitives/Layout'

// ============================================================================
// DATA TABLE - Advanced sortable, filterable table
// ============================================================================

export interface Column<T = any> {
  key: string
  header: string
  accessor: (row: T) => any
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: T) => React.ReactNode
}

export interface DataTableProps<T = any> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  sortable?: boolean
  filterable?: boolean
  selectable?: boolean
  onRowClick?: (row: T) => void
  onSelectionChange?: (selected: T[]) => void
  pagination?: {
    pageSize: number
    currentPage: number
    onPageChange: (page: number) => void
  }
  emptyState?: React.ReactNode
  loading?: boolean
  striped?: boolean
  hoverable?: boolean
  compact?: boolean
  // New features
  exportable?: boolean
  exportFileName?: string
  bulkActions?: Array<{
    label: string
    onClick: (selected: T[]) => void
    variant?: 'default' | 'danger'
    icon?: React.ReactNode
  }>
  mobileView?: 'table' | 'cards' | 'auto'
  columnToggle?: boolean
}

export function DataTable<T = any>({
  columns,
  data,
  keyExtractor,
  sortable = true,
  filterable = false,
  selectable = false,
  onRowClick,
  onSelectionChange,
  pagination,
  emptyState,
  loading = false,
  striped = true,
  hoverable = true,
  compact = false,
  exportable = false,
  exportFileName = 'export.csv',
  bulkActions,
  mobileView = 'auto',
  columnToggle = false
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [filters, setFilters] = React.useState<Record<string, string>>({})
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())
  const [visibleColumns, setVisibleColumns] = React.useState<Set<string>>(
    new Set(columns.map(col => col.key))
  )
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>(
    mobileView === 'cards' ? 'cards' : 'table'
  )
  const [showColumnMenu, setShowColumnMenu] = React.useState(false)

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.key)
      if (!column) return 0

      const aValue = column.accessor(a)
      const bValue = column.accessor(b)

      if (aValue === bValue) return 0

      const comparison = aValue > bValue ? 1 : -1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [data, sortConfig, columns])

  // Filter data
  const filteredData = React.useMemo(() => {
    if (Object.keys(filters).length === 0) return sortedData

    return sortedData.filter(row => {
      return Object.entries(filters).every(([key, filterValue]) => {
        if (!filterValue) return true
        const column = columns.find(col => col.key === key)
        if (!column) return true

        const value = String(column.accessor(row)).toLowerCase()
        return value.includes(filterValue.toLowerCase())
      })
    })
  }, [sortedData, filters, columns])

  // Paginate data
  const paginatedData = React.useMemo(() => {
    if (!pagination) return filteredData

    const start = (pagination.currentPage - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredData.slice(start, end)
  }, [filteredData, pagination])

  const totalPages = pagination ? Math.ceil(filteredData.length / pagination.pageSize) : 1

  const handleSort = (columnKey: string) => {
    if (!sortable) return

    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    setSortConfig(current => {
      if (!current || current.key !== columnKey) {
        return { key: columnKey, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { key: columnKey, direction: 'desc' }
      }
      return null
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(paginatedData.map(keyExtractor))
      setSelectedRows(allKeys)
      onSelectionChange?.(paginatedData)
    } else {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    }
  }

  const handleSelectRow = (row: T, checked: boolean) => {
    const key = keyExtractor(row)
    const newSelected = new Set(selectedRows)

    if (checked) {
      newSelected.add(key)
    } else {
      newSelected.delete(key)
    }

    setSelectedRows(newSelected)
    onSelectionChange?.(data.filter(r => newSelected.has(keyExtractor(r))))
  }

  const allSelected = paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(keyExtractor(row)))
  const someSelected = paginatedData.some(row => selectedRows.has(keyExtractor(row))) && !allSelected

  // Mobile view detection
  React.useEffect(() => {
    if (mobileView !== 'auto') return
    
    const checkViewMode = () => {
      setViewMode(window.innerWidth < 768 ? 'cards' : 'table')
    }
    checkViewMode()
    window.addEventListener('resize', checkViewMode)
    return () => window.removeEventListener('resize', checkViewMode)
  }, [mobileView])

  // CSV Export
  const handleExport = React.useCallback(() => {
    const visibleCols = columns.filter(col => visibleColumns.has(col.key))
    const csvContent = [
      // Header
      visibleCols.map(col => `"${col.header}"`).join(','),
      // Rows
      ...filteredData.map(row =>
        visibleCols.map(col => {
          const value = col.accessor(row)
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      )
    ].join('
')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', exportFileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [columns, filteredData, visibleColumns, exportFileName])

  // Toggle column visibility
  const toggleColumn = React.useCallback((columnKey: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev)
      if (next.has(columnKey)) {
        next.delete(columnKey)
      } else {
        next.add(columnKey)
      }
      return next
    })
  }, [])

  // Filter visible columns
  const visibleColumnsArray = React.useMemo(() => {
    return columns.filter(col => visibleColumns.has(col.key))
  }, [columns, visibleColumns])

  if (loading) {
    return (
      <div className="w-full border border-black/10 rounded-lg overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-100" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white border-t border-black/5" />
          ))}
        </div>
      </div>
    )
  }

  if (paginatedData.length === 0 && !loading) {
    return (
      <div className="w-full border border-black/10 rounded-lg overflow-hidden">
        <div className="py-12 text-center">
          {emptyState || (
            <div>
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm text-black/40">No data to display</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      {(exportable || columnToggle || bulkActions) && (
        <Flex align="center" justify="between" className="flex-wrap gap-2">
          <Flex align="center" gap="sm" className="flex-wrap">
            {/* Bulk Actions */}
            {bulkActions && selectedRows.size > 0 && (
              <>
                {bulkActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => action.onClick(data.filter(r => selectedRows.has(keyExtractor(r))))}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                      flex items-center gap-2
                      ${action.variant === 'danger' 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                        : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'}
                    `}
                  >
                    {action.icon}
                    {action.label} ({selectedRows.size})
                  </button>
                ))}
              </>
            )}
          </Flex>

          <Flex align="center" gap="sm">
            {/* Export Button */}
            {exportable && (
              <button
                onClick={handleExport}
                className="px-3 py-1.5 text-sm border border-black/10 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            )}

            {/* Column Toggle */}
            {columnToggle && (
              <div className="relative">
                <button
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  className="px-3 py-1.5 text-sm border border-black/10 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  Columns
                </button>
                
                {showColumnMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-black/10 rounded-lg shadow-lg z-10 py-2">
                    {columns.map(col => (
                      <label
                        key={col.key}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(col.key)}
                          onChange={() => toggleColumn(col.key)}
                          className="rounded border-black/20 text-primary focus:ring-primary"
                        />
                        <span className="text-sm">{col.header}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Flex>
        </Flex>
      )}

      {/* Filters */}
      {filterable && (
        <div className="flex gap-2 flex-wrap">
          {columns.filter(col => col.filterable).map(column => (
            <input
              key={column.key}
              type="text"
              placeholder={`Filter ${column.header}...`}
              value={filters[column.key] || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
              className="px-3 py-1.5 text-sm border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          ))}
        </div>
      )}

      {/* Mobile Card View */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {paginatedData.map((row, idx) => {
            const key = keyExtractor(row)
            const isSelected = selectedRows.has(key)

            return (
              <div
                key={key}
                onClick={() => onRowClick?.(row)}
                className={`
                  bg-white border border-black/10 rounded-lg p-4
                  ${hoverable ? 'hover:bg-slate-50' : ''}
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${isSelected ? 'border-primary bg-primary/5' : ''}
                  transition-colors
                `}
              >
                <Flex align="start" justify="between" gap="md" className="mb-3">
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleSelectRow(row, e.target.checked)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5 rounded border-black/20 text-primary focus:ring-primary"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    {visibleColumnsArray.map(column => {
                      const value = column.accessor(row)
                      const displayValue = column.render ? column.render(value, row) : value

                      return (
                        <div key={column.key}>
                          <span className="text-xs text-black/50 font-medium">{column.header}:</span>{' '}
                          <span className="text-sm text-black/80">{displayValue}</span>
                        </div>
                      )
                    })}
                  </div>
                </Flex>
              </div>
            )
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="w-full border border-black/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-black/10">
                <tr>
                  {selectable && (
                    <th className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} text-left`}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={input => {
                          if (input) input.indeterminate = someSelected
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-black/20 text-primary focus:ring-primary"
                      />
                    </th>
                  )}
                  {visibleColumnsArray.map(column => (
                  <th
                    key={column.key}
                    className={`
                      ${compact ? 'px-3 py-2' : 'px-4 py-3'}
                      text-${column.align || 'left'}
                      text-xs font-semibold text-black/70 uppercase tracking-wider
                      ${column.sortable && sortable ? 'cursor-pointer select-none hover:bg-slate-100' : ''}
                    `}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <Flex align="center" gap="xs" justify={column.align === 'center' ? 'center' : column.align === 'right' ? 'end' : 'start'}>
                      <span>{column.header}</span>
                      {column.sortable && sortable && (
                        <span className="text-black/30">
                          {sortConfig?.key === column.key ? (
                            sortConfig.direction === 'asc' ? '↑' : '↓'
                          ) : '↕'}
                        </span>
                      )}
                    </Flex>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => {
                const key = keyExtractor(row)
                const isSelected = selectedRows.has(key)

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={`
                      border-t border-black/5
                      ${striped && idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}
                      ${hoverable ? 'hover:bg-slate-50' : ''}
                      ${onRowClick ? 'cursor-pointer' : ''}
                      ${isSelected ? 'bg-blue-50' : ''}
                      transition-colors
                    `}
                  >
                    {selectable && (
                      <td className={`${compact ? 'px-3 py-2' : 'px-4 py-3'}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleSelectRow(row, e.target.checked)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-black/20 text-primary focus:ring-primary"
                        />
                      </td>
                    )}
                    {visibleColumnsArray.map(column => {
                      const value = column.accessor(row)
                      const displayValue = column.render ? column.render(value, row) : value

                      return (
                        <td
                          key={column.key}
                          className={`
                            ${compact ? 'px-3 py-2' : 'px-4 py-3'}
                            text-sm text-black/80
                            text-${column.align || 'left'}
                          `}
                        >
                          {displayValue}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <Flex align="center" justify="between" className="px-2">
          <p className="text-sm text-black/60">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, filteredData.length)} of {filteredData.length}
          </p>
          <Flex align="center" gap="sm">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-1.5 text-sm border border-black/10 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-black/60">
              Page {pagination.currentPage} of {totalPages}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-black/10 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </Flex>
        </Flex>
      )}

      {/* Selection info */}
      {selectable && selectedRows.size > 0 && (
        <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <Flex align="center" justify="between">
            <p className="text-sm text-blue-900">
              {selectedRows.size} row{selectedRows.size > 1 ? 's' : ''} selected
            </p>
            <button
              onClick={() => {
                setSelectedRows(new Set())
                onSelectionChange?.([])
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear selection
            </button>
          </Flex>
        </div>
      )}
    </div>
  )
}
// ============================================================================
// SIMPLE LIST - Clean list component
// ============================================================================

export interface SimpleListItem {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
  badge?: string | number
  trailing?: React.ReactNode
  onClick?: () => void
  avatar?: string
  meta?: React.ReactNode
  actions?: React.ReactNode
}

export interface SimpleListProps {
  items: SimpleListItem[]
  onItemClick?: (item: SimpleListItem) => void
  hoverable?: boolean
  divided?: boolean
  compact?: boolean
  emptyState?: React.ReactNode
}

export function SimpleList({
  items,
  onItemClick,
  hoverable = true,
  divided = true,
  compact = false,
  emptyState
}: SimpleListProps) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        {emptyState || (
          <div>
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <p className="text-sm text-black/40">No items to display</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-black/10 rounded-lg overflow-hidden">
      {items.map((item, idx) => (
        <div
          key={item.id}
          onClick={() => onItemClick?.(item)}
          className={`
            w-full
            ${compact ? 'px-4 py-3' : 'px-6 py-4'}
            ${idx > 0 && divided ? 'border-t border-black/5' : ''}
            ${hoverable ? 'hover:bg-slate-50' : ''}
            ${onItemClick ? 'cursor-pointer' : ''}
            transition-colors
          `}
        >
          <Flex align="start" gap="md">
            {/* Icon or Avatar */}
            {(item.icon || item.avatar) && (
              <div className="flex-shrink-0">
                {item.avatar ? (
                  <img src={item.avatar} alt="" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-black/60 [&>svg]:w-5 [&>svg]:h-5">
                    {item.icon}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <Flex align="center" gap="sm" className="mb-1">
                <h4 className="font-medium text-sm text-black line-clamp-1">
                  {item.title}
                </h4>
                {item.badge && (
                  <span className="px-2 py-0.5 bg-slate-100 text-xs font-medium text-black/70 rounded">
                    {item.badge}
                  </span>
                )}
              </Flex>
              {item.description && (
                <p className="text-sm text-black/60 line-clamp-2">
                  {item.description}
                </p>
              )}
              {item.meta && (
                <div className="mt-2">
                  {item.meta}
                </div>
              )}
            </div>

            {/* Actions */}
            {item.actions && (
              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {item.actions}
              </div>
            )}
          </Flex>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// TIMELINE - Event/history timeline
// ============================================================================

export interface TimelineItem {
  id: string
  title: string
  description?: string
  timestamp: Date
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
  actions?: React.ReactNode
  expandable?: boolean
  expanded?: boolean
  details?: React.ReactNode
  ocrData?: {
    source: 'receipt' | 'invoice' | 'document' | 'manual'
    confidence?: number // 0-1
    documentUrl?: string
    canEdit?: boolean
    needsReview?: boolean
  }
  metadata?: Array<{ label: string; value: string }>
  badge?: string
  primaryMetric?: string // Most important value shown inline (e.g., "$45.00", "12,450 mi")
}

export interface TimelineProps {
  items: TimelineItem[]
  showTime?: boolean
  density?: 'compact' | 'comfortable' | 'spacious'
  onItemClick?: (item: TimelineItem) => void
  onItemExpand?: (item: TimelineItem, expanded: boolean) => void
}

export function Timeline({
  items,
  showTime = true,
  density = 'comfortable',
  onItemClick,
  onItemExpand
}: TimelineProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set(items.filter(i => i.expanded).map(i => i.id))
  )

  const variantColors = {
    default: 'bg-slate-500 border-slate-200',
    success: 'bg-green-500 border-green-200',
    warning: 'bg-yellow-500 border-yellow-200',
    error: 'bg-red-500 border-red-200'
  }

  const densityConfig = {
    compact: {
      iconSize: 'w-8 h-8',
      iconInner: 'w-4 h-4',
      spacing: 'space-y-3',
      padding: 'pt-0.5',
      connectorLeft: 'left-4',
      connectorTop: 'top-10'
    },
    comfortable: {
      iconSize: 'w-10 h-10',
      iconInner: 'w-5 h-5',
      spacing: 'space-y-5',
      padding: 'pt-1',
      connectorLeft: 'left-5',
      connectorTop: 'top-12'
    },
    spacious: {
      iconSize: 'w-12 h-12',
      iconInner: 'w-6 h-6',
      spacing: 'space-y-6',
      padding: 'pt-1.5',
      connectorLeft: 'left-6',
      connectorTop: 'top-14'
    }
  }

  const config = densityConfig[density]

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getStatusDot = (item: TimelineItem) => {
    // Determine status from OCR data and variant
    if (item.ocrData?.needsReview) {
      return <div className="w-2 h-2 rounded-full bg-yellow-500" title="Needs review" />
    }
    
    if (item.ocrData?.confidence && item.ocrData.confidence > 0.95) {
      return <div className="w-2 h-2 rounded-full bg-green-500" title="Verified" />
    }

    if (item.variant === 'success') {
      return <div className="w-2 h-2 rounded-full bg-green-500" title="Success" />
    }

    if (item.variant === 'warning') {
      return <div className="w-2 h-2 rounded-full bg-yellow-500" title="Warning" />
    }

    if (item.variant === 'error') {
      return <div className="w-2 h-2 rounded-full bg-red-500" title="Error" />
    }

    return <div className="w-2 h-2 rounded-full bg-slate-400" title="Info" />
  }

  const getOCRBadge = (ocrData?: TimelineItem['ocrData']) => {
    if (!ocrData) return null

    if (ocrData.needsReview) {
      return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">Review needed</span>
    }

    if (ocrData.confidence && ocrData.confidence > 0.95) {
      return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">✓ Verified</span>
    }

    if (ocrData.source !== 'manual') {
      return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">From {ocrData.source}</span>
    }

    return null
  }

  const toggleExpand = (item: TimelineItem) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(item.id)) {
      newExpanded.delete(item.id)
    } else {
      newExpanded.add(item.id)
    }
    setExpandedItems(newExpanded)
    onItemExpand?.(item, newExpanded.has(item.id))
  }

  return (
    <div className={config.spacing}>
      {items.map((item, idx) => {
        const isExpanded = expandedItems.has(item.id)
        const isClickable = !!onItemClick || item.expandable

        return (
          <div key={item.id} className="relative">
            {/* Connector Line */}
            {idx < items.length - 1 && (
              <div className={`absolute ${config.connectorLeft} ${config.connectorTop} w-0.5 h-full -bottom-${density === 'compact' ? '3' : density === 'comfortable' ? '5' : '6'} bg-black/10`} />
            )}

            <Flex align="start" gap={density === 'compact' ? 'sm' : 'md'}>
              {/* Icon */}
              <div className={`
                flex-shrink-0 relative z-10
                ${config.iconSize}
                rounded-full border-4 border-white
                flex items-center justify-center
                ${variantColors[item.variant || 'default']}
                text-white shadow-sm
              `}>
                <div className={config.iconInner}>
                  {item.icon || (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Content */}
              <div 
                className={`
                  flex-1 min-w-0 ${config.padding}
                  ${(isClickable || item.expandable) ? 'cursor-pointer' : ''}
                  ${(isClickable || item.expandable) ? 'hover:bg-slate-50/50 -mx-2 px-2 rounded-lg transition-colors' : ''}
                `}
                onClick={() => {
                  if (item.expandable) {
                    toggleExpand(item)
                  }
                  onItemClick?.(item)
                }}
              >
                {/* Collapsed View - Clean single line */}
                <Flex align="center" justify="between" gap="md">
                  <div className="flex-1 min-w-0">
                    <Flex align="center" gap="sm">
                      <h4 className={`font-semibold text-black truncate ${density === 'compact' ? 'text-sm' : 'text-base'}`}>
                        {item.title}
                      </h4>
                      {item.primaryMetric && (
                        <span className={`text-black/60 font-medium flex-shrink-0 ${density === 'compact' ? 'text-xs' : 'text-sm'}`}>
                          {item.primaryMetric}
                        </span>
                      )}
                    </Flex>
                  </div>

                  <Flex align="center" gap="sm" className="flex-shrink-0">
                    {showTime && (
                      <span className={`text-black/40 ${density === 'compact' ? 'text-xs' : 'text-sm'}`}>
                        {formatTime(item.timestamp)}
                      </span>
                    )}
                    {getStatusDot(item)}
                    {item.expandable && (
                      <svg 
                        className={`w-4 h-4 text-black/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Flex>
                </Flex>

                {/* Expanded View - All details */}
                {isExpanded && (
                  <div className={`mt-3 space-y-3 ${density === 'compact' ? 'text-xs' : 'text-sm'}`}>
                    {/* Description */}
                    {item.description && (
                      <p className="text-black/60 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* OCR Badge (shown when expanded) */}
                    {item.ocrData && getOCRBadge(item.ocrData)}

                    {/* Metadata Grid */}
                    {item.metadata && item.metadata.length > 0 && (
                      <div className={`grid grid-cols-2 gap-x-4 gap-y-2 bg-slate-50 rounded-lg p-3`}>
                        {item.metadata.map((meta, idx) => (
                          <div key={idx}>
                            <span className="text-black/40">{meta.label}:</span>{' '}
                            <span className="text-black/80 font-medium">{meta.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* OCR Actions */}
                    {item.ocrData && (
                      <Flex align="center" gap="sm" className="flex-wrap">
                        {item.ocrData.documentUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(item.ocrData!.documentUrl, '_blank')
                            }}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            View original
                          </button>
                        )}
                        {item.ocrData.canEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              alert('Edit details')
                            }}
                            className="text-xs text-black/50 hover:text-black flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                        )}
                        {item.ocrData.confidence && (
                          <span className="text-xs text-black/40 ml-auto">
                            {Math.round(item.ocrData.confidence * 100)}% confidence
                          </span>
                        )}
                      </Flex>
                    )}

                    {/* Custom Details */}
                    {item.details && (
                      <div className="pt-2 border-t border-black/10">
                        {item.details}
                      </div>
                    )}

                    {/* Actions */}
                    {item.actions && (
                      <div className="pt-2">
                        {item.actions}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Flex>
          </div>
        )
      })}
    </div>
  )
}
