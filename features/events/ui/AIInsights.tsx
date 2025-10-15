/**
 * AI Insights Component
 * 
 * Displays intelligent insights about fuel efficiency, costs, and predictions
 */

'use client'

import { TrendingUp, TrendingDown, Zap, AlertTriangle, Brain, DollarSign } from 'lucide-react'
import { Card, Stack, Flex, Text, Heading } from '@/components/design-system'

interface AIInsightsProps {
  // Current event data
  currentMPG: number | null
  currentPricePerGallon: number
  currentTotalCost: number
  currentGallons: number
  
  // Historical comparison data
  averageMPG?: number | null
  averagePricePerGallon?: number | null
  previousMPG?: number | null
  
  // Context
  vehicleName?: string
}

export function AIInsights({
  currentMPG,
  currentPricePerGallon,
  currentTotalCost,
  currentGallons,
  averageMPG,
  averagePricePerGallon,
  previousMPG,
  vehicleName
}: AIInsightsProps) {
  
  // Calculate insights
  const mpgTrend = currentMPG && averageMPG 
    ? ((currentMPG - averageMPG) / averageMPG * 100).toFixed(1)
    : null
    
  const priceTrend = averagePricePerGallon
    ? ((currentPricePerGallon - averagePricePerGallon) / averagePricePerGallon * 100).toFixed(1)
    : null
    
  const isPriceAnomaly = priceTrend && Math.abs(parseFloat(priceTrend)) > 15
  const isMPGAnomaly = mpgTrend && Math.abs(parseFloat(mpgTrend)) > 20
  
  // Check if we have enough data
  const hasInsights = mpgTrend || priceTrend
  
  // Empty state when no historical data
  if (!hasInsights) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border border-purple-100 hover:border-purple-200 transition-all duration-300">
        <Stack spacing="md" className="p-6">
          {/* Empty state content */}
          <div className="text-center py-4">
            <div className="mx-auto p-3 bg-purple-100/50 rounded-full w-fit mb-3">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <Heading level="subtitle" className="text-base font-semibold text-gray-900 mb-2">
              Unlock AI-Powered Insights
            </Heading>
            <Text className="text-sm text-gray-600 mb-4">
              Get personalized fuel efficiency trends, price analysis, and smart predictions
            </Text>
            
            {/* What's needed */}
            <div className="bg-white rounded-lg p-4 border border-purple-100 text-left">
              <Text className="text-xs font-semibold text-purple-900 mb-3">
                To unlock insights, you need:
              </Text>
              <Stack spacing="sm">
                <Flex align="start" gap="xs">
                  <div className="mt-0.5">
                    {currentMPG ? (
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-purple-300" />
                    )}
                  </div>
                  <Text className="text-xs text-gray-700 flex-1">
                    <span className="font-medium">Odometer reading</span> on this event
                  </Text>
                </Flex>
                <Flex align="start" gap="xs">
                  <div className="mt-0.5">
                    {averageMPG ? (
                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-purple-300" />
                    )}
                  </div>
                  <Text className="text-xs text-gray-700 flex-1">
                    <span className="font-medium">2+ previous fill-ups</span> with odometer readings
                  </Text>
                </Flex>
              </Stack>
            </div>
          </div>
          
          {/* Footer */}
          <div className="pt-3 border-t border-purple-100">
            <Text className="text-xs text-purple-600 font-medium text-center">
              ✨ Powered by AI analysis
            </Text>
          </div>
        </Stack>
      </Card>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border border-purple-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 overflow-hidden relative group">
      {/* Subtle decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-100/20 via-transparent to-blue-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <Stack spacing="md" className="p-6 relative">

        <Stack spacing="sm">
          {/* Fuel Efficiency Insight */}
          {mpgTrend && currentMPG && (
            <Flex align="start" gap="sm" className="p-3 bg-white hover:bg-purple-50/50 rounded-lg border border-purple-100 hover:border-purple-200 hover:shadow-sm transition-all duration-200">
              <div className="mt-1">
                {parseFloat(mpgTrend) > 0 ? (
                  <TrendingUp className={`w-4 h-4 ${isMPGAnomaly ? 'text-green-600' : 'text-green-500'}`} />
                ) : (
                  <TrendingDown className={`w-4 h-4 ${isMPGAnomaly ? 'text-amber-600' : 'text-amber-500'}`} />
                )}
              </div>
              <Stack spacing="xs" className="flex-1">
                <Text className="font-semibold text-gray-900 text-sm">
                  {parseFloat(mpgTrend) > 0 ? 'Excellent Efficiency!' : 'Lower Efficiency'}
                </Text>
                <Text className="text-xs text-gray-600">
                  {currentMPG.toFixed(1)} MPG — {parseFloat(mpgTrend) > 0 ? 'up' : 'down'} {Math.abs(parseFloat(mpgTrend))}% from your {averageMPG?.toFixed(1)} MPG average
                  {isMPGAnomaly && parseFloat(mpgTrend) < 0 && (
                    <span className="text-amber-600 font-medium"> (Check tire pressure & driving habits)</span>
                  )}
                </Text>
              </Stack>
            </Flex>
          )}

          {/* Price Analysis Insight */}
          {priceTrend && (
            <Flex align="start" gap="sm" className="p-3 bg-white hover:bg-purple-50/50 rounded-lg border border-purple-100 hover:border-purple-200 hover:shadow-sm transition-all duration-200">
              <div className="mt-1">
                {isPriceAnomaly ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <DollarSign className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <Stack spacing="xs" className="flex-1">
                <Text className="font-semibold text-gray-900 text-sm">
                  {isPriceAnomaly 
                    ? (parseFloat(priceTrend) > 0 ? 'Higher Price Detected' : 'Great Deal!') 
                    : 'Price Check'}
                </Text>
                <Text className="text-xs text-gray-600">
                  ${currentPricePerGallon.toFixed(2)}/gal — {parseFloat(priceTrend) > 0 ? 'up' : 'down'} {Math.abs(parseFloat(priceTrend))}% from your ${averagePricePerGallon?.toFixed(2)} average
                  {isPriceAnomaly && parseFloat(priceTrend) > 0 && (
                    <span className="text-amber-600 font-medium"> (Consider shopping around)</span>
                  )}
                  {isPriceAnomaly && parseFloat(priceTrend) < 0 && (
                    <span className="text-green-600 font-medium"> (Excellent find!)</span>
                  )}
                </Text>
              </Stack>
            </Flex>
          )}

          {/* Prediction Insight */}
          {currentMPG && averageMPG && (
            <Flex align="start" gap="sm" className="p-3 bg-white hover:bg-purple-50/50 rounded-lg border border-purple-100 hover:border-purple-200 hover:shadow-sm transition-all duration-200">
              <div className="mt-1">
                <Zap className="w-4 h-4 text-purple-500" />
              </div>
              <Stack spacing="xs" className="flex-1">
                <Text className="font-semibold text-gray-900 text-sm">
                  Next Fill-Up Prediction
                </Text>
                <Text className="text-xs text-gray-600">
                  At {currentMPG.toFixed(1)} MPG, you'll need {currentGallons.toFixed(1)} gallons in ~{(currentMPG * currentGallons).toFixed(0)} miles
                  {averagePricePerGallon && (
                    <span> (estimated ${(currentGallons * averagePricePerGallon).toFixed(2)})</span>
                  )}
                </Text>
              </Stack>
            </Flex>
          )}
        </Stack>

        {/* AI Attribution */}
        <div className="pt-3 mt-1 border-t border-purple-100">
          <Text className="text-xs text-purple-600 font-medium text-center">
            ✨ Powered by AI analysis of your fuel history
          </Text>
        </div>
      </Stack>
    </Card>
  )
}
