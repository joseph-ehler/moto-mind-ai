'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronRight,
  DollarSign
} from 'lucide-react'

interface CostData {
  period: string
  total: number
  categories: {
    fuel: number
    service: number
    other: number
  }
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
}

interface CostsCardProps {
  thirtyDayData: CostData
  onViewTrend: () => void
}

export function CostsCard({ thirtyDayData, onViewTrend }: CostsCardProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return TrendingUp
      case 'down':
        return TrendingDown
      default:
        return Minus
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-red-600'
      case 'down':
        return 'text-green-600'
      default:
        return 'text-slate-600'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const TrendIcon = getTrendIcon(thirtyDayData.trend)

  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">30-Day Costs</h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onViewTrend}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View Trend
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {/* Total with Trend */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(thirtyDayData.total)}
            </div>
            <div className="text-sm text-slate-600">Total spending</div>
          </div>
          
          {thirtyDayData.trend !== 'stable' && (
            <div className={`flex items-center gap-1 ${getTrendColor(thirtyDayData.trend)}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {thirtyDayData.trendPercentage}%
              </span>
            </div>
          )}
        </div>
        
        {/* Category Breakdown */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-700">Breakdown</div>
          
          <div className="space-y-2">
            {thirtyDayData.categories.fuel > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Fuel</span>
                <span className="text-sm font-medium text-slate-900">
                  {formatCurrency(thirtyDayData.categories.fuel)}
                </span>
              </div>
            )}
            
            {thirtyDayData.categories.service > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Service</span>
                <span className="text-sm font-medium text-slate-900">
                  {formatCurrency(thirtyDayData.categories.service)}
                </span>
              </div>
            )}
            
            {thirtyDayData.categories.other > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Other</span>
                <span className="text-sm font-medium text-slate-900">
                  {formatCurrency(thirtyDayData.categories.other)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Empty State */}
        {thirtyDayData.total === 0 && (
          <div className="text-center py-6">
            <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No expenses recorded</p>
            <p className="text-sm text-slate-400">Upload receipts to track costs</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
