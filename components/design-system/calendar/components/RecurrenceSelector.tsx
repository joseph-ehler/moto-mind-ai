/**
 * RecurrenceSelector Component
 * 
 * UI for configuring recurring maintenance events
 */

import * as React from 'react'
import { Stack, Flex } from '../../primitives/Layout'
import { NumberInput } from '../../forms/NumberInput'
import { Label } from '@/components/ui/label'
import { DatePicker } from '../../forms/DatePicker'
import { RecurrenceFrequency } from '../types'

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency
  interval: number
  endDate?: Date
}

interface RecurrenceSelectorProps {
  value: RecurrenceConfig | null
  onChange: (config: RecurrenceConfig | null) => void
  startDate: Date
  className?: string
}

export function RecurrenceSelector({
  value,
  onChange,
  startDate,
  className
}: RecurrenceSelectorProps) {
  const [enabled, setEnabled] = React.useState(!!value)
  
  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked)
    if (checked) {
      onChange({
        frequency: 'monthly',
        interval: 3,
        endDate: undefined
      })
    } else {
      onChange(null)
    }
  }
  
  const handleFrequencyChange = (frequency: RecurrenceFrequency) => {
    if (!value) return
    
    // Set sensible defaults for each frequency
    const defaultIntervals: Record<RecurrenceFrequency, number> = {
      daily: 1,
      weekly: 1,
      monthly: 3,
      yearly: 1,
      custom: 1
    }
    
    onChange({
      ...value,
      frequency,
      interval: defaultIntervals[frequency]
    })
  }
  
  const handleIntervalChange = (interval: number) => {
    if (!value) return
    onChange({ ...value, interval })
  }
  
  const handleEndDateChange = (date: Date | undefined) => {
    if (!value) return
    onChange({ ...value, endDate: date })
  }
  
  const getFrequencyLabel = (frequency: RecurrenceFrequency): string => {
    const labels: Record<RecurrenceFrequency, string> = {
      daily: 'Days',
      weekly: 'Weeks',
      monthly: 'Months',
      yearly: 'Years',
      custom: 'Custom'
    }
    return labels[frequency]
  }
  
  return (
    <div className={className}>
      <Stack spacing="md">
        {/* Enable Recurring */}
        <Flex align="center" gap="sm">
          <input
            type="checkbox"
            id="recurring"
            checked={enabled}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <Label htmlFor="recurring" className="text-sm font-medium cursor-pointer">
            Recurring maintenance
          </Label>
        </Flex>
        
        {enabled && value && (
          <div className="ml-6 border-l-2 border-blue-200 pl-4">
            <Stack spacing="sm">
              {/* Frequency Selector */}
              <div>
                <Label className="text-xs text-slate-600 mb-2 block">Repeat every</Label>
                <Flex gap="xs" align="center">
                  <NumberInput
                    min={1}
                    max={99}
                    step={1}
                    value={value.interval}
                    onChange={(val) => handleIntervalChange(val ? Math.floor(val) : 1)}
                    className="w-20"
                  />
                  <select
                    value={value.frequency}
                    onChange={(e) => handleFrequencyChange(e.target.value as RecurrenceFrequency)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="weekly">Weeks</option>
                    <option value="monthly">Months</option>
                    <option value="yearly">Years</option>
                  </select>
                </Flex>
                
                {/* Common intervals quick select */}
                {value.frequency === 'monthly' && (
                  <div className="mt-2">
                    <Label className="text-xs text-slate-500 mb-1 block">Common intervals:</Label>
                    <Flex gap="xs">
                      {[3, 6, 12].map(months => (
                        <button
                          key={months}
                          type="button"
                          onClick={() => handleIntervalChange(months)}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${
                            value.interval === months
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-slate-300 hover:border-blue-300'
                          }`}
                        >
                          {months} mo
                        </button>
                      ))}
                    </Flex>
                  </div>
                )}
              </div>
              
              {/* Example text */}
              <p className="text-xs text-slate-500 italic">
                {getRecurrenceDescription(value, startDate)}
              </p>
              
              {/* End Date (Optional) */}
              <div>
                <Label className="text-xs text-slate-600 mb-2 block">
                  End date (optional)
                </Label>
                <DatePicker
                  value={value.endDate}
                  onChange={handleEndDateChange}
                  placeholder="No end date"
                />
              </div>
            </Stack>
          </div>
        )}
      </Stack>
    </div>
  )
}

/**
 * Generate human-readable recurrence description
 */
function getRecurrenceDescription(config: RecurrenceConfig, startDate: Date): string {
  const { frequency, interval } = config
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  
  if (interval === 1) {
    switch (frequency) {
      case 'daily':
        return `Every day starting ${startMonth}`
      case 'weekly':
        return `Every week starting ${startMonth}`
      case 'monthly':
        return `Every month on the ${startDate.getDate()}${getOrdinalSuffix(startDate.getDate())}`
      case 'yearly':
        return `Every year on ${startMonth}`
    }
  }
  
  switch (frequency) {
    case 'daily':
      return `Every ${interval} days starting ${startMonth}`
    case 'weekly':
      return `Every ${interval} weeks starting ${startMonth}`
    case 'monthly':
      return `Every ${interval} months on the ${startDate.getDate()}${getOrdinalSuffix(startDate.getDate())}`
    case 'yearly':
      return `Every ${interval} years on ${startMonth}`
    default:
      return `Repeats every ${interval} ${frequency}`
  }
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return 'th'
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}
