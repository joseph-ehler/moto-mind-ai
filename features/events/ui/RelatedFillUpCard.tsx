'use client'

import { ArrowRight, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, Stack, Flex, Text } from '@/components/design-system'
import Link from 'next/link'

interface RelatedFillUp {
  id: string
  date: string
  vendor: string
  total_amount: number
  gallons: number
  miles?: number | null
  display_summary?: string | null
}

interface RelatedFillUpCardProps {
  fillUp: RelatedFillUp
  currentFillUp: {
    total_amount: number
    gallons: number
    miles?: number | null
  }
  direction: 'previous' | 'next'
  milesDriven?: number
  calculatedMPG?: number
  daysBetween?: number
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const getDiffIndicator = (current: number, previous: number) => {
  const diff = current - previous
  const percentDiff = ((diff / previous) * 100).toFixed(1)
  
  if (Math.abs(diff) < 0.01) {
    return { icon: Minus, color: 'text-gray-500', text: 'Same', showPercent: false }
  }
  
  if (diff > 0) {
    return { 
      icon: TrendingUp, 
      color: 'text-red-500', 
      text: `+${formatCurrency(diff)}`,
      percent: `(+${percentDiff}%)`,
      showPercent: true
    }
  }
  
  return { 
    icon: TrendingDown, 
    color: 'text-green-500', 
    text: `${formatCurrency(diff)}`,
    percent: `(${percentDiff}%)`,
    showPercent: true
  }
}

export function RelatedFillUpCard({
  fillUp,
  currentFillUp,
  direction,
  milesDriven,
  calculatedMPG,
  daysBetween
}: RelatedFillUpCardProps) {
  const costDiff = getDiffIndicator(currentFillUp.total_amount, fillUp.total_amount)
  const gallonsDiff = currentFillUp.gallons - fillUp.gallons
  const CostIcon = costDiff.icon
  
  return (
    <Link href={`/events/${fillUp.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-gray-100 hover:border-blue-200">
        <Stack spacing="sm" className="p-4">
          {/* Header */}
          <Flex className="items-center justify-between">
            <div className="flex items-center gap-2">
              {direction === 'previous' ? (
                <ArrowLeft className="w-4 h-4 text-gray-400" />
              ) : (
                <ArrowRight className="w-4 h-4 text-gray-400" />
              )}
              <Text className="text-sm font-semibold text-gray-900">
                {direction === 'previous' ? 'Previous Fill-Up' : 'Next Fill-Up'}
              </Text>
            </div>
            <Text className="text-xs text-gray-500">
              {formatDate(fillUp.date)}
            </Text>
          </Flex>

          {/* Station */}
          <Text className="text-sm text-gray-700">
            {fillUp.vendor || 'Station not recorded'}
          </Text>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            {/* Cost Comparison */}
            <div>
              <Text className="text-xs text-gray-500 mb-1">Cost</Text>
              <div className="flex items-center gap-1">
                <Text className="text-sm font-semibold text-gray-900">
                  {formatCurrency(fillUp.total_amount)}
                </Text>
              </div>
              <div className={`flex items-center gap-1 text-xs ${costDiff.color}`}>
                <CostIcon className="w-3 h-3" />
                <span>{costDiff.text}</span>
                {costDiff.showPercent && <span className="text-gray-500">{costDiff.percent}</span>}
              </div>
            </div>

            {/* Gallons Comparison */}
            <div>
              <Text className="text-xs text-gray-500 mb-1">Gallons</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {fillUp.gallons.toFixed(2)}
              </Text>
              <Text className={`text-xs ${
                Math.abs(gallonsDiff) < 0.1 
                  ? 'text-gray-500' 
                  : gallonsDiff > 0 
                  ? 'text-red-500' 
                  : 'text-green-500'
              }`}>
                {gallonsDiff > 0.1 ? '+' : ''}{gallonsDiff.toFixed(2)} gal
              </Text>
            </div>
          </div>

          {/* Calculated Metrics (if available) */}
          {(milesDriven !== undefined || calculatedMPG !== undefined) && (
            <div className="pt-2 border-t border-gray-100">
              <Flex className="items-center justify-between">
                {milesDriven !== undefined && (
                  <div>
                    <Text className="text-xs text-gray-500">Miles Driven</Text>
                    <Text className="text-sm font-semibold text-blue-600">
                      {milesDriven.toLocaleString()} mi
                    </Text>
                  </div>
                )}
                
                {calculatedMPG !== undefined && (
                  <div>
                    <Text className="text-xs text-gray-500">Calculated MPG</Text>
                    <Text className="text-sm font-semibold text-green-600">
                      {calculatedMPG.toFixed(1)} MPG
                    </Text>
                  </div>
                )}
              </Flex>
            </div>
          )}

          {/* Days Between */}
          {daysBetween !== undefined && (
            <Text className="text-xs text-gray-500 text-center pt-1 border-t border-gray-100">
              {daysBetween} {daysBetween === 1 ? 'day' : 'days'} {direction === 'previous' ? 'later' : 'earlier'}
            </Text>
          )}
        </Stack>
      </Card>
    </Link>
  )
}
