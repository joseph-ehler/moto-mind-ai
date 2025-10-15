/**
 * Timeline Component
 * 
 * Visual feed showing chronological history of all vehicle captures
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckSquare, Square, RefreshCw, ChevronRight, Camera } from 'lucide-react'
import { Text, Button, Flex, Heading, Stack } from '@/components/design-system'
import { TimelineItemCompact } from './TimelineItemCompact'
import { TimelineLoadingSkeleton } from './TimelineLoadingSkeleton'
import { TimelineInsights } from './TimelineInsights'
import { MaintenancePredictor } from './MaintenancePredictor'
import { TimelineHeader } from './TimelineHeader'
import { Sparkline } from './Sparkline'
import { TimelineItem as TimelineItemType, TimelineFilter } from '@/types/timeline'
import { EditEventModal } from '@/features/vehicles/ui/dialogs/EditEventModal'
import { DeleteEventConfirmation } from '@/features/vehicles/ui/dialogs/DeleteEventConfirmation'
import { useTimelineFilters } from './hooks/useTimelineFilters'
import { useTimelineState } from './hooks/useTimelineState'
import { useTimelineData } from './hooks/useTimelineData'

interface TimelineProps {
  items: TimelineItemType[]
  vehicleId?: string
  onCapture?: () => void
  onExpand?: (id: string) => void
  onLoadMore?: () => void
  hasMore?: boolean
  loading?: boolean
  showHeader?: boolean
  showFilters?: boolean
  onRefresh?: () => void
}

const FILTER_OPTIONS: { value: TimelineFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'service', label: 'Service' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'odometer', label: 'Odometer' },
  { value: 'warnings', label: 'Warnings' },
  { value: 'tires', label: 'Tires' },
  { value: 'damage', label: 'Damage' },
  { value: 'documents', label: 'Documents' },
]

type DensityType = 'compact' | 'comfortable' | 'spacious'

export function Timeline({
  items,
  vehicleId,
  onCapture,
  onExpand,
  onLoadMore,
  hasMore = false,
  loading = false,
  showHeader = true,
  showFilters = true,
  onRefresh
}: TimelineProps) {
  // ✅ Use custom hooks for clean separation of concerns
  const { 
    searchQuery, 
    setSearchQuery, 
    activeFilter, 
    setActiveFilter, 
    filteredItems 
  } = useTimelineFilters(items)
  
  const { 
    selectedIds, 
    selectionMode, 
    setSelectionMode,
    toggleSelection, 
    selectAll: selectAllItems,
    clearSelection,
    expandedMonths, 
    toggleMonthExpanded,
    editingEvent, 
    setEditingEvent,
    deletingEvent, 
    setDeletingEvent,
    bulkDeleting, 
    setBulkDeleting
  } = useTimelineState()
  
  const { 
    monthGroups, 
    monthStats, 
    currentMileage,
    groupItemsByDate 
  } = useTimelineData(filteredItems)
  
  // Local UI state (not extracted to hooks)
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable')
  
  // Wrap selectAll to use filteredItems
  const selectAll = () => selectAllItems(filteredItems)

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (!vehicleId || selectedIds.size === 0) return

    if (!confirm(`Delete ${selectedIds.size} event${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`)) {
      return
    }

    setBulkDeleting(true)

    try {
      // Delete all selected events
      await Promise.all(
        Array.from(selectedIds).map(eventId =>
          fetch(`/api/vehicles/${vehicleId}/events/${eventId}`, {
            method: 'DELETE'
          })
        )
      )

      console.log(`✅ Bulk deleted ${selectedIds.size} events`)
      clearSelection()
      onRefresh?.()
    } catch (error) {
      console.error('❌ Bulk delete failed:', error)
      alert('Failed to delete some events. Please try again.')
    } finally {
      setBulkDeleting(false)
    }
  }

  // Empty state - No items at all
  if (items.length === 0 && !loading) {
    return (
      <div className="py-20 px-6 text-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-2xl">
        <Stack spacing="lg" className="max-w-lg mx-auto">
          <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg">
            <Camera className="w-10 h-10 text-blue-600" />
          </div>
          <Heading level="title" className="text-gray-900">
            Start Your Vehicle Timeline
          </Heading>
          <Text className="text-base text-gray-700">
            Capture receipts, dashboard photos, and documents to automatically track maintenance, fuel costs, and vehicle health.
          </Text>
          {onCapture && (
            <Button
              onClick={onCapture}
              className="bg-black text-white hover:bg-gray-800 h-12 text-base font-semibold shadow-lg mt-4"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capture Your First Photo
            </Button>
          )}
        </Stack>
      </div>
    )
  }

  return (
    <Stack spacing="md" className="pb-20 md:pb-0">
      {/* Bottom padding for mobile nav bar */}
      
      {/* ✅ Refactored: TimelineHeader component */}
      <TimelineHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        filterOptions={FILTER_OPTIONS.map(f => ({
          ...f,
          count: items.filter(item => {
            if (f.value === 'all') return true
            if (f.value === 'warnings') return item.type === 'dashboard_warning'
            if (f.value === 'tires') return item.type === 'tire_tread' || item.type === 'tire_pressure'
            if (f.value === 'documents') return item.type === 'document'
            return item.type === f.value
          }).length
        }))}
        onCapture={onCapture}
        showHeader={showHeader}
      />

      {/* Quick Stats Badges - Compact overview */}
      {filteredItems.length > 0 && !loading && (
        <motion.div 
          initial={false}
          className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {/* Total Events */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-gray-900">{filteredItems.length}</div>
              <div className="text-xs text-gray-500">events</div>
            </div>
          </div>

          {/* Total Spending */}
          {(() => {
            const totalSpent = filteredItems.reduce((sum, item) => {
              const cost = (item.extracted_data as any)?.cost || 0
              return sum + cost
            }, 0)
            
            if (totalSpent > 0) {
              return (
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-gray-900">${totalSpent.toFixed(0)}</div>
                    <div className="text-xs text-gray-500">spent</div>
                  </div>
                </div>
              )
            }
            return null
          })()}

          {/* Warnings Count */}
          {(() => {
            const warningCount = filteredItems.filter(item => item.type === 'dashboard_warning').length
            
            if (warningCount > 0) {
              return (
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 shadow-sm">
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-yellow-900">{warningCount}</div>
                    <div className="text-xs text-yellow-700">warnings</div>
                  </div>
                </div>
              )
            }
            return null
          })()}

          {/* Most Common Event */}
          {(() => {
            const typeCounts: Record<string, number> = {}
            filteredItems.forEach(item => {
              typeCounts[item.type] = (typeCounts[item.type] || 0) + 1
            })
            const mostCommon = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]
            const typeLabel = FILTER_OPTIONS.find(f => f.value === mostCommon[0])?.label || mostCommon[0]
            
            return (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-blue-900">{mostCommon[1]}</div>
                  <div className="text-xs text-blue-700">{typeLabel}</div>
                </div>
              </div>
            )
          })()}
        </motion.div>
      )}

      {/* Smart Insights - AI-powered recommendations */}
      {!loading && (
        <TimelineInsights 
          items={items} 
          onFilterClick={(filter) => setActiveFilter(filter)}
        />
      )}

      {/* Maintenance Predictions */}
      {!loading && (() => {
        // Get current mileage from most recent event
        const eventsWithMileage = items
          .filter(e => e.mileage && e.mileage > 0)
          .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
        const currentMileage = eventsWithMileage[0]?.mileage
        
        return (
          <MaintenancePredictor 
            items={items} 
            currentMileage={currentMileage}
          />
        )
      })()}

      {/* Timeline Insights Card - MOBILE-FIRST */}
      {filteredItems.length > 0 && !loading && false && (
        <div className="mb-6 p-4 md:p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
          <div className="mb-3 md:mb-4">
            <Heading level="subtitle" className="text-gray-900 mb-1 text-base md:text-lg">
              Timeline Stats
            </Heading>
            <Text className="text-xs md:text-sm text-gray-600">
              {filteredItems.length} event{filteredItems.length === 1 ? '' : 's'}
            </Text>
          </div>
          
          {/* MOBILE: Stack vertically with icons. DESKTOP: Grid */}
          <div className="flex flex-col gap-3 md:grid md:grid-cols-4 md:gap-4">
            {/* Total Events - Mobile with icon */}
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white">
              <div className="text-2xl md:block hidden font-bold text-gray-900">{filteredItems.length}</div>
              <div className="md:hidden flex items-center gap-2 flex-1">
                <span className="text-xl">📊</span>
                <span className="text-lg font-bold text-gray-900">{filteredItems.length}</span>
                <span className="text-sm text-gray-600">events</span>
              </div>
              <div className="hidden md:block text-xs text-gray-600 mt-1">Total Events</div>
            </div>
            
            {/* Total Cost */}
            {(() => {
              const totalCost = filteredItems.reduce((sum, item) => {
                const cost = (item.extracted_data as any)?.cost || 0
                return sum + cost
              }, 0)
              return totalCost > 0 ? (
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white">
                  <div className="text-2xl md:block hidden font-bold text-gray-900">${totalCost.toFixed(0)}</div>
                  <div className="md:hidden flex items-center gap-2 flex-1">
                    <span className="text-xl">💰</span>
                    <span className="text-lg font-bold text-gray-900">${totalCost.toLocaleString()}</span>
                    <span className="text-sm text-gray-600">spent</span>
                  </div>
                  <div className="hidden md:block text-xs text-gray-600 mt-1">Total Spent</div>
                </div>
              ) : null
            })()}
            
            {/* Date Range */}
            {(() => {
              const sorted = [...filteredItems].sort((a, b) => 
                new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
              )
              const newest = sorted[0]
              const oldest = sorted[sorted.length - 1]
              const daysDiff = Math.floor(
                (new Date(newest.timestamp || 0).getTime() - new Date(oldest.timestamp || 0).getTime()) / (1000 * 60 * 60 * 24)
              )
              return (
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white">
                  <div className="text-2xl md:block hidden font-bold text-gray-900">{daysDiff}</div>
                  <div className="md:hidden flex items-center gap-2 flex-1">
                    <span className="text-xl">📅</span>
                    <span className="text-lg font-bold text-gray-900">{daysDiff}</span>
                    <span className="text-sm text-gray-600">days tracked</span>
                  </div>
                  <div className="hidden md:block text-xs text-gray-600 mt-1">Days Tracked</div>
                </div>
              )
            })()}
            
            {/* Most Common Event */}
            {(() => {
              const typeCounts: Record<string, number> = {}
              filteredItems.forEach(item => {
                typeCounts[item.type] = (typeCounts[item.type] || 0) + 1
              })
              const mostCommon = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]
              const typeLabel = FILTER_OPTIONS.find(f => f.value === mostCommon[0])?.label || mostCommon[0]
              return (
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white">
                  <div className="text-2xl md:block hidden font-bold text-gray-900">{mostCommon[1]}</div>
                  <div className="md:hidden flex items-center gap-2 flex-1">
                    <span className="text-xl">🔥</span>
                    <span className="text-lg font-bold text-gray-900">{mostCommon[1]}</span>
                    <span className="text-sm text-gray-600">{typeLabel.toLowerCase()}</span>
                  </div>
                  <div className="hidden md:block text-xs text-gray-600 mt-1">{typeLabel} Events</div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Timeline Items */}
      {loading && items.length === 0 ? (
        <TimelineLoadingSkeleton />
      ) : (
        <div className="relative">
          {/* Month Navigator Sidebar - Desktop only */}
          {Object.keys(monthGroups).length > 1 && (
            <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 z-30">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 p-3">
                <div className="space-y-2">
                  {Object.keys(monthGroups).map((monthKey) => {
                    const monthShort = monthKey.split(' ')[0].substring(0, 3)
                    return (
                      <button
                        key={monthKey}
                        onClick={() => {
                          const element = document.getElementById(`month-${monthKey.replace(/\s/g, '-')}`)
                          element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }}
                        className="w-12 h-12 rounded-xl hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-xs font-bold text-gray-600 transition-all"
                        title={monthKey}
                      >
                        {monthShort}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* SIMPLE LIST - No timeline complexity */}
          <div className="space-y-12">
          
          {Object.entries(monthGroups).map(([monthKey, monthItems], monthIdx) => {
            // ✅ Get pre-calculated stats from hook
            const stats = monthStats[monthKey]
            const monthEventCount = stats.eventCount
            const monthTotalCost = stats.totalCost
            const dailySpending = stats.dailySpending
            
            // Group month items by date
            const dateGroups = groupItemsByDate(monthItems)
            
            const isExpanded = expandedMonths.has(monthKey)
            
            return (
              <div key={monthKey} id={`month-${monthKey.replace(/\s/g, '-')}`}>
                {/* MONTH HEADER - Clickable with expand/collapse */}
                <motion.div 
                  initial={false}
                  onClick={() => toggleMonthExpanded(monthKey)}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <Flex justify="between" align="start">
                    <Flex gap="md" align="start" className="flex-1">
                      <div className="flex-1">
                        <Heading level="subtitle" className="text-gray-900 uppercase tracking-wide">
                          {monthKey}
                        </Heading>
                        <Text className="text-sm text-gray-600 mt-1">
                          {monthEventCount} {monthEventCount === 1 ? 'event' : 'events'}
                          <span className="mx-2 text-gray-400">•</span>
                          <span className="text-blue-600 text-xs font-semibold">Click for details</span>
                        </Text>
                      </div>
                      
                      {/* Expand/Collapse Chevron */}
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-1 text-gray-600"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </motion.div>
                    </Flex>

                    {monthTotalCost > 0 && (
                      <div className="text-right space-y-2">
                        <div className="flex items-center justify-end gap-3">
                          <div className="text-3xl font-bold text-gray-900">${monthTotalCost.toFixed(0)}</div>
                          {dailySpending.some(v => v > 0) && (
                            <Sparkline 
                              data={dailySpending} 
                              width={60} 
                              height={24}
                              color="#3b82f6"
                              showTrend={true}
                            />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          Total spent {dailySpending.some(v => v > 0) && '• 7-day trend'}
                        </div>
                      </div>
                    )}
                  </Flex>

                  {/* Expanded Stats Section */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 pt-6 border-t border-blue-200"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Average cost per event */}
                        <div className="bg-white/50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Avg per event</div>
                          <div className="text-lg font-bold text-gray-900">
                            ${(monthTotalCost / monthEventCount).toFixed(0)}
                          </div>
                        </div>

                        {/* Event type breakdown */}
                        {(() => {
                          // ✅ Use pre-calculated breakdown from hook
                          const topTypes = Object.entries(stats.typeBreakdown)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 2)
                          
                          return topTypes.map(([type, count]) => {
                            const label = FILTER_OPTIONS.find(f => f.value === type)?.label || type
                            return (
                              <div key={type} className="bg-white/50 rounded-lg p-3">
                                <div className="text-xs text-gray-600 mb-1">{label}</div>
                                <div className="text-lg font-bold text-gray-900">{count}</div>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
                
                {/* Date groups within this month */}
                {Object.entries(dateGroups).map(([dateGroup, items], idx) => {
            // Calculate stats for this date group
            const eventCount = items.length
            const totalCost = items.reduce((sum, item) => {
              const cost = (item.extracted_data as any)?.cost || 0
              return sum + cost
            }, 0)
            
            // Check for time gap between this date and previous date
            const dateGroupEntries = Object.entries(dateGroups)
            let daysSinceLast = 0
            if (idx > 0) {
              const prevDate = new Date(dateGroupEntries[idx - 1][1][0].timestamp || new Date())
              const currentDate = new Date(items[0].timestamp || new Date())
              daysSinceLast = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
            }
            
            return (
              <div 
                key={dateGroup}
                className="relative mb-8"
              >
                {/* Time gap indicator */}
                {daysSinceLast > 7 && (
                  <div className="my-6 flex items-center justify-center">
                    <div className="px-4 py-2 bg-amber-50 rounded-full text-xs text-amber-700 font-semibold border border-amber-200">
                      ⏱ {daysSinceLast} day{daysSinceLast === 1 ? '' : 's'} gap
                    </div>
                  </div>
                )}
                
                {/* Date header - Simple and clean */}
                <div className="mb-4 px-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {dateGroup} · {eventCount} {eventCount === 1 ? 'event' : 'events'}
                    {totalCost > 0 && ` · $${totalCost.toFixed(0)}`}
                  </h3>
                </div>
                
                {/* Events for this date - Just cards, no timeline complexity */}
                <div className="space-y-4">
                  {items.map((item: TimelineItemType, itemIdx: number) => {
                    return (
                      <TimelineItemCompact
                        key={item.id}
                        item={item}
                        onExpand={onExpand}
                        onEdit={(item) => setEditingEvent(item)}
                        onDelete={(item) => setDeletingEvent(item)}
                        selectionMode={selectionMode}
                        isSelected={selectedIds.has(item.id)}
                        onToggleSelect={() => toggleSelection(item.id)}
                        timelineMode={false}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
              </div>
            )
          })}
          </div>
        </div>
      )}

      {/* Empty filtered state */}
      {filteredItems.length === 0 && items.length > 0 && !loading && (
        <div className="py-16 px-6 text-center bg-white border-2 border-dashed border-gray-300 rounded-2xl">
          <Stack spacing="md" className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Text className="text-3xl">{searchQuery ? '🔍' : '📭'}</Text>
            </div>
            <Heading level="subtitle" className="text-gray-900">
              {searchQuery ? `No results for "${searchQuery}"` : `No ${FILTER_OPTIONS.find(f => f.value === activeFilter)?.label.toLowerCase()} entries`}
            </Heading>
            <Text className="text-sm text-gray-600">
              {searchQuery ? (
                "Try adjusting your search or clearing filters to see more results."
              ) : (
                <>
                  {activeFilter === 'fuel' && "You haven't logged any fuel fill-ups yet. Capture a receipt to track fuel costs and MPG."}
                  {activeFilter === 'service' && "No service records found. Keep track of maintenance to stay on top of your vehicle's health."}
                  {activeFilter === 'odometer' && "No odometer readings logged. Capture dashboard photos to track mileage over time."}
                  {activeFilter === 'warnings' && "No dashboard warnings recorded. That's a good sign!"}
                  {!['fuel', 'service', 'odometer', 'warnings'].includes(activeFilter) && `No ${FILTER_OPTIONS.find(f => f.value === activeFilter)?.label.toLowerCase()} entries yet.`}
                </>
              )}
            </Text>
            <Flex gap="sm" justify="center" className="mt-4">
              {searchQuery ? (
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  className="h-10"
                >
                  Clear Search
                </Button>
              ) : (
                <Button
                  onClick={() => setActiveFilter('all')}
                  variant="outline"
                  className="h-10"
                >
                  View All Items
                </Button>
              )}
              {onCapture && (
                <Button
                  onClick={onCapture}
                  className="bg-black text-white hover:bg-gray-800 h-10"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Capture
                </Button>
              )}
            </Flex>
          </Stack>
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && (
        <Button
          onClick={onLoadMore}
          variant="secondary"
          fullWidth
          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 rounded-lg"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Load More
        </Button>
      )}

      {loading && items.length > 0 && (
        <Flex align="center" justify="center" className="py-4">
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        </Flex>
      )}

      {/* Edit Event Modal */}
      {vehicleId && editingEvent && (
        <EditEventModal
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          event={editingEvent}
          vehicleId={vehicleId}
          onSuccess={() => {
            setEditingEvent(null)
            onRefresh?.()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {vehicleId && deletingEvent && (
        <DeleteEventConfirmation
          isOpen={!!deletingEvent}
          onClose={() => setDeletingEvent(null)}
          event={deletingEvent}
          vehicleId={vehicleId}
          onSuccess={() => {
            setDeletingEvent(null)
            onRefresh?.()
          }}
        />
      )}
    </Stack>
  )
}
