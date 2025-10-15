import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, Stack, Text, Flex } from '@/components/design-system'

interface FuelEfficiencyContextProps {
  currentMPG: number
  averageMPG: number | null
  previousMPG: number | null
}

export function FuelEfficiencyContext({ currentMPG, averageMPG, previousMPG }: FuelEfficiencyContextProps) {
  // Calculate difference from average
  const avgDiff = averageMPG ? currentMPG - averageMPG : null
  const avgDiffPercent = averageMPG ? ((avgDiff! / averageMPG) * 100).toFixed(1) : null

  // Calculate trend from previous
  const prevDiff = previousMPG ? currentMPG - previousMPG : null
  
  // Determine color and icon based on performance
  const getPerformanceColor = (diff: number | null) => {
    if (!diff) return 'text-gray-600'
    if (diff > 0) return 'text-green-600'
    if (diff < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getPerformanceIcon = (diff: number | null) => {
    if (!diff || Math.abs(diff) < 0.5) return <Minus className="w-4 h-4" />
    if (diff > 0) return <TrendingUp className="w-4 h-4" />
    return <TrendingDown className="w-4 h-4" />
  }

  const getPerformanceText = (diff: number | null) => {
    if (!diff) return 'No comparison available'
    if (Math.abs(diff) < 0.5) return 'About the same'
    if (diff > 0) return `${Math.abs(diff).toFixed(1)} MPG better`
    return `${Math.abs(diff).toFixed(1)} MPG worse`
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="p-4">
        <Stack spacing="md">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">⛽ Fuel Efficiency</h3>
            <span className="text-2xl font-bold text-blue-900">{currentMPG.toFixed(1)} MPG</span>
          </div>

          {/* Average Comparison */}
          {averageMPG && (
            <div className="p-3 bg-white/60 rounded-lg">
              <Flex className="items-center justify-between">
                <Text className="text-xs text-gray-600">vs. Your Average ({averageMPG.toFixed(1)} MPG)</Text>
                <Flex className={`items-center gap-1 ${getPerformanceColor(avgDiff)}`}>
                  {getPerformanceIcon(avgDiff)}
                  <span className="text-sm font-semibold">{getPerformanceText(avgDiff)}</span>
                </Flex>
              </Flex>
              {avgDiff && Math.abs(avgDiff) > 0.5 && (
                <Text className="text-xs text-gray-500 mt-1">
                  {avgDiff > 0 
                    ? `${avgDiffPercent}% better than usual 🎉` 
                    : `${Math.abs(parseFloat(avgDiffPercent!))}% below average`}
                </Text>
              )}
            </div>
          )}

          {/* Previous Comparison */}
          {previousMPG && (
            <div className="p-3 bg-white/60 rounded-lg">
              <Flex className="items-center justify-between">
                <Text className="text-xs text-gray-600">vs. Previous Fill-Up ({previousMPG.toFixed(1)} MPG)</Text>
                <Flex className={`items-center gap-1 ${getPerformanceColor(prevDiff)}`}>
                  {getPerformanceIcon(prevDiff)}
                  <span className="text-sm font-semibold">{getPerformanceText(prevDiff)}</span>
                </Flex>
              </Flex>
            </div>
          )}

          {/* Insights */}
          {avgDiff && avgDiff < -2 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Text className="text-xs text-amber-900">
                💡 <strong>Lower than usual?</strong> Check tire pressure, driving habits, or A/C usage.
              </Text>
            </div>
          )}
          
          {avgDiff && avgDiff > 2 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <Text className="text-xs text-green-900">
                ✨ <strong>Great efficiency!</strong> Highway driving or favorable conditions?
              </Text>
            </div>
          )}
        </Stack>
      </div>
    </Card>
  )
}
