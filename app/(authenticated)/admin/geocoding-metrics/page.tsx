'use client'

/**
 * Geocoding Metrics Dashboard
 * Admin-only page to monitor geocoding health
 */

import { useState, useEffect } from 'react'
import { Container, Section, Stack, Grid, Card, Heading, Text, Flex } from '@/components/design-system'
import { RefreshCcw, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Database, Cloud, MapPin } from 'lucide-react'

interface GeocodingMetrics {
  cache: {
    available: boolean
    type: 'redis' | 'memory'
    size: number
    hit_rate: number
  }
  geocoding: {
    total_requests: number
    nominatim: {
      success: number
      error: number
      success_rate: number
    }
    google: {
      success: number
      error: number
      success_rate: number
    }
    failures: {
      total: number
      invalid_address: number
    }
  }
  corrections: {
    total: number
    recent_7_days: number
    by_method: Array<{
      extraction_method: string
      extraction_confidence: string
      count: number
      avg_distance_km: number
    }>
  }
  health: {
    status: 'healthy' | 'degraded'
    issues: string[]
  }
}

export default function GeocodingMetricsPage() {
  const [metrics, setMetrics] = useState<GeocodingMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchMetrics = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/metrics/geocoding')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`)
      }
      
      const data = await response.json()
      setMetrics(data)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !metrics) {
    return (
      <Container size="lg" useCase="data_tables">
        <Section spacing="lg">
          <Stack spacing="lg" align="center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <Text color="secondary">Loading metrics...</Text>
          </Stack>
        </Section>
      </Container>
    )
  }

  if (error) {
    return (
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Card variant="error">
            <Stack spacing="md">
              <Flex align="center" gap="sm">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <Heading level="h3">Error Loading Metrics</Heading>
              </Flex>
              <Text color="secondary">{error}</Text>
              <button
                onClick={fetchMetrics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </Stack>
          </Card>
        </Section>
      </Container>
    )
  }

  if (!metrics) return null

  const cacheHitRate = metrics.cache.hit_rate
  const nominatimSuccessRate = metrics.geocoding.nominatim.success_rate
  const googleSuccessRate = metrics.geocoding.google.success_rate || 0
  const correctionRate = metrics.geocoding.total_requests > 0
    ? (metrics.corrections.total / metrics.geocoding.total_requests) * 100
    : 0

  return (
    <Container 
      size="lg" 
      useCase="data_tables"
      override={{
        reason: "Wide dashboard requires horizontal space for metrics grid",
        approvedBy: "UX Team"
      }}
    >
      <Section spacing="lg">
        <Stack spacing="xl">
          {/* Header */}
          <Flex justify="between" align="center">
            <div>
              <Heading level="hero">Geocoding Metrics</Heading>
              <Text color="secondary">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </Text>
            </div>
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </Flex>

          {/* Health Status */}
          <Card variant={metrics.health.status === 'healthy' ? 'success' : 'warning'}>
            <Flex align="center" gap="md">
              {metrics.health.status === 'healthy' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
              <div>
                <Heading level="h3">
                  System Status: {metrics.health.status === 'healthy' ? 'Healthy' : 'Degraded'}
                </Heading>
                {metrics.health.issues.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {metrics.health.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-gray-700">• {issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            </Flex>
          </Card>

          {/* Key Metrics */}
          <Grid columns="auto" gap="md">
            {/* Cache Performance */}
            <Card>
              <Stack spacing="md">
                <Flex align="center" gap="sm">
                  <Database className="w-5 h-5 text-blue-600" />
                  <Heading level="h3">Cache Performance</Heading>
                </Flex>
                
                <div className="space-y-3">
                  <div>
                    <Flex justify="between" align="center">
                      <Text color="secondary" size="sm">Hit Rate</Text>
                      <Flex align="center" gap="xs">
                        {cacheHitRate >= 50 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <Text weight="bold" size="lg">{cacheHitRate.toFixed(1)}%</Text>
                      </Flex>
                    </Flex>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${cacheHitRate >= 50 ? 'bg-green-600' : 'bg-red-600'}`}
                        style={{ width: `${cacheHitRate}%` }}
                      />
                    </div>
                  </div>

                  <Flex justify="between">
                    <Text color="secondary" size="sm">Type</Text>
                    <Text weight="medium">{metrics.cache.type}</Text>
                  </Flex>

                  <Flex justify="between">
                    <Text color="secondary" size="sm">Size</Text>
                    <Text weight="medium">{metrics.cache.size.toLocaleString()} entries</Text>
                  </Flex>

                  <Flex justify="between">
                    <Text color="secondary" size="sm">Status</Text>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      metrics.cache.available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {metrics.cache.available ? 'Connected' : 'Fallback Mode'}
                    </span>
                  </Flex>
                </div>
              </Stack>
            </Card>

            {/* Nominatim Performance */}
            <Card>
              <Stack spacing="md">
                <Flex align="center" gap="sm">
                  <Cloud className="w-5 h-5 text-purple-600" />
                  <Heading level="h3">Nominatim (Free)</Heading>
                </Flex>
                
                <div className="space-y-3">
                  <div>
                    <Flex justify="between" align="center">
                      <Text color="secondary" size="sm">Success Rate</Text>
                      <Flex align="center" gap="xs">
                        {nominatimSuccessRate >= 90 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <Text weight="bold" size="lg">{nominatimSuccessRate.toFixed(1)}%</Text>
                      </Flex>
                    </Flex>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${nominatimSuccessRate >= 90 ? 'bg-green-600' : 'bg-red-600'}`}
                        style={{ width: `${nominatimSuccessRate}%` }}
                      />
                    </div>
                  </div>

                  <Flex justify="between">
                    <Text color="secondary" size="sm">Success</Text>
                    <Text weight="medium" color="success">{metrics.geocoding.nominatim.success}</Text>
                  </Flex>

                  <Flex justify="between">
                    <Text color="secondary" size="sm">Errors</Text>
                    <Text weight="medium" color="error">{metrics.geocoding.nominatim.error}</Text>
                  </Flex>
                </div>
              </Stack>
            </Card>

            {/* Google Maps Performance */}
            <Card>
              <Stack spacing="md">
                <Flex align="center" gap="sm">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <Heading level="h3">Google Maps (Fallback)</Heading>
                </Flex>
                
                <div className="space-y-3">
                  <div>
                    <Flex justify="between" align="center">
                      <Text color="secondary" size="sm">Success Rate</Text>
                      <Text weight="bold" size="lg">
                        {googleSuccessRate > 0 ? `${googleSuccessRate.toFixed(1)}%` : 'N/A'}
                      </Text>
                    </Flex>
                    {googleSuccessRate > 0 && (
                      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600"
                          style={{ width: `${googleSuccessRate}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <Flex justify="between">
                    <Text color="secondary" size="sm">Success</Text>
                    <Text weight="medium" color="success">{metrics.geocoding.google.success}</Text>
                  </Flex>

                  <Flex justify="between">
                    <Text color="secondary" size="sm">Errors</Text>
                    <Text weight="medium" color="error">{metrics.geocoding.google.error}</Text>
                  </Flex>

                  {metrics.geocoding.google.success === 0 && metrics.geocoding.google.error === 0 && (
                    <Text color="secondary" size="sm">
                      💡 Not configured (set GOOGLE_MAPS_API_KEY)
                    </Text>
                  )}
                </div>
              </Stack>
            </Card>

            {/* User Corrections */}
            <Card>
              <Stack spacing="md">
                <Flex align="center" gap="sm">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <Heading level="h3">User Corrections</Heading>
                </Flex>
                
                <div className="space-y-3">
                  <div>
                    <Flex justify="between" align="center">
                      <Text color="secondary" size="sm">Correction Rate</Text>
                      <Flex align="center" gap="xs">
                        {correctionRate < 20 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <Text weight="bold" size="lg">{correctionRate.toFixed(1)}%</Text>
                      </Flex>
                    </Flex>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${correctionRate < 20 ? 'bg-green-600' : 'bg-red-600'}`}
                        style={{ width: `${Math.min(correctionRate, 100)}%` }}
                      />
                    </div>
                  </div>

                  <Flex justify="between">
                    <Text color="secondary" size="sm">Total</Text>
                    <Text weight="medium">{metrics.corrections.total}</Text>
                  </Flex>

                  <Flex justify="between">
                    <Text color="secondary" size="sm">Last 7 days</Text>
                    <Text weight="medium">{metrics.corrections.recent_7_days}</Text>
                  </Flex>

                  <Flex justify="between">
                    <Text color="secondary" size="sm">Total Requests</Text>
                    <Text weight="medium">{metrics.geocoding.total_requests}</Text>
                  </Flex>
                </div>
              </Stack>
            </Card>
          </Grid>

          {/* Correction Patterns */}
          {metrics.corrections.by_method.length > 0 && (
            <Card>
              <Stack spacing="md">
                <Heading level="h3">Correction Patterns</Heading>
                <Text color="secondary" size="sm">
                  Analyzing which extraction methods need improvement
                </Text>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Method</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Confidence</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">Corrections</th>
                        <th className="px-4 py-2 text-right font-medium text-gray-700">Avg Distance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {metrics.corrections.by_method.map((stat, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {stat.extraction_method}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              stat.extraction_confidence === 'high' 
                                ? 'bg-green-100 text-green-800'
                                : stat.extraction_confidence === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {stat.extraction_confidence}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {stat.count}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {stat.avg_distance_km.toFixed(1)} km
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Stack>
            </Card>
          )}

          {/* Recommendations */}
          <Card variant="info">
            <Stack spacing="md">
              <Heading level="h3">💡 Recommendations</Heading>
              <ul className="space-y-2 text-sm">
                {cacheHitRate < 50 && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <Text>
                      <strong>Low cache hit rate:</strong> Consider increasing cache TTL or investigating why addresses aren't being reused
                    </Text>
                  </li>
                )}
                {nominatimSuccessRate < 90 && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <Text>
                      <strong>High Nominatim failure rate:</strong> Enable Google Maps fallback (set GOOGLE_MAPS_API_KEY)
                    </Text>
                  </li>
                )}
                {correctionRate > 20 && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <Text>
                      <strong>High correction rate:</strong> Review extraction methods in correction patterns table
                    </Text>
                  </li>
                )}
                {!metrics.cache.available && (
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <Text>
                      <strong>Using in-memory cache:</strong> Set up Redis for persistent caching (set REDIS_URL)
                    </Text>
                  </li>
                )}
              </ul>
            </Stack>
          </Card>
        </Stack>
      </Section>
    </Container>
  )
}
