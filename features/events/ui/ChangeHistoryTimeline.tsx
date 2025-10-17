import { useState } from 'react'
import { Clock, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Stack, Text, Flex, Button } from '@/components/design-system'

interface ChangeEntry {
  edited_at: string
  reason: string
  changes: Array<{
    field: string
    old_value: any
    new_value: any
  }>
}

interface ChangeHistoryTimelineProps {
  changes: ChangeEntry[]
  createdAt: string
}

const INITIAL_VISIBLE_COUNT = 3

export function ChangeHistoryTimeline({ changes, createdAt }: ChangeHistoryTimelineProps) {
  const [showAll, setShowAll] = useState(false)
  
  if (!changes || changes.length === 0) return null

  const reversedChanges = [...changes].reverse()
  const hasMore = reversedChanges.length > INITIAL_VISIBLE_COUNT
  const visibleChanges = showAll ? reversedChanges : reversedChanges.slice(0, INITIAL_VISIBLE_COUNT)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const formatFieldName = (field: string) => {
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatValue = (field: string, value: any) => {
    // Handle null, undefined, empty string, or 0
    if (value === null || value === undefined || value === '' || value === 0) {
      return 'Not set'
    }

    // Format based on field type
    switch (field) {
      case 'miles':
      case 'odometer':
        return `${parseInt(value).toLocaleString()} mi`
      
      case 'total_amount':
      case 'cost':
      case 'tax_amount':
        return `$${parseFloat(value).toFixed(2)}`
      
      case 'gallons':
        return `${parseFloat(value).toFixed(2)} gal`
      
      case 'price_per_gallon':
        return `$${parseFloat(value).toFixed(3)}/gal`
      
      default:
        // For strings and other types
        return String(value)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <Flex className="items-center gap-2">
          <Edit2 className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Change History</h3>
        </Flex>
      </div>

      <div className="p-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-200" />

          <Stack spacing="lg">
            {/* Most recent changes first */}
            {visibleChanges.map((change, index) => (
              <div key={index} className="relative pl-8">
                {/* Timeline dot */}
                <div className="absolute left-0 top-1 w-6 h-6 bg-blue-500 rounded-full border-4 border-white flex items-center justify-center">
                  <Edit2 className="w-3 h-3 text-white" />
                </div>

                <div className="space-y-2">
                  {/* Header */}
                  <div>
                    <Text className="text-sm font-semibold text-gray-900">
                      Edited
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {formatDate(change.edited_at)}
                    </Text>
                  </div>

                  {/* Reason */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Text className="text-xs text-gray-600 mb-1">Reason:</Text>
                    <Text className="text-sm text-blue-900 italic">"{change.reason}"</Text>
                  </div>

                  {/* Changes */}
                  <div className="space-y-2">
                    {change.changes.map((fieldChange, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200">
                        <Text className="text-xs font-medium text-gray-700 mb-1">
                          {formatFieldName(fieldChange.field)}
                        </Text>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500 line-through">
                            {formatValue(fieldChange.field, fieldChange.old_value)}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-700 font-semibold">
                            {formatValue(fieldChange.field, fieldChange.new_value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Show More/Less Button */}
            {hasMore && (
              <div className="relative pl-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="text-sm text-gray-600 hover:text-gray-900 -ml-2"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show {reversedChanges.length - INITIAL_VISIBLE_COUNT} More {reversedChanges.length - INITIAL_VISIBLE_COUNT === 1 ? 'Change' : 'Changes'}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Created event */}
            <div className="relative pl-8">
              {/* Timeline dot */}
              <div className="absolute left-0 top-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>

              <div>
                <Text className="text-sm font-semibold text-gray-900">
                  Created
                </Text>
                <Text className="text-xs text-gray-500">
                  {formatDate(createdAt)}
                </Text>
                <Text className="text-xs text-gray-600 mt-1">
                  Via photo capture
                </Text>
              </div>
            </div>
          </Stack>
        </div>
      </div>
    </Card>
  )
}
