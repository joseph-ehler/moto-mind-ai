'use client'

/**
 * Migration Metrics Dashboard
 * 
 * Investor-ready view of 3-AI system performance.
 * Shows ROI, time savings, and migration progress.
 */

import { useEffect, useState } from 'react'
import {
  Container,
  Grid,
  Stack,
  Section,
  Card,
  Heading,
  Text
} from '@/components/design-system'
import {
  formatDuration,
  formatCurrency,
  formatROI,
  formatPercent
} from '@/features/migrations/domain/roi-calculator'
import type { MigrationMetrics } from '@/features/migrations/data/migration-data'

export default function MigrationsPage() {
  const [visionMetrics, setVisionMetrics] = useState<MigrationMetrics | null>(null)
  const [aggregateMetrics, setAggregateMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/migrations')
      .then(res => res.json())
      .then(data => {
        setVisionMetrics(data.vision)
        setAggregateMetrics(data.aggregate)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load metrics:', err)
        setLoading(false)
      })
  }, [])
  
  if (!visionMetrics) {
    return (
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="lg">
            <Heading level="page">Migration Metrics Dashboard</Heading>
            <Text>No migration data available yet. Complete a migration to see metrics.</Text>
          </Stack>
        </Section>
      </Container>
    )
  }
  
  const remaining = 19 // Total features minus completed
  
  return (
    <Container 
      size="lg" 
      useCase="data_tables"
      override={{
        reason: "Dashboard requires horizontal space for metrics visualization",
        approvedBy: "Product Team"
      }}
    >
      <Section spacing="lg">
        <Stack spacing="xl">
          {/* Header */}
          <Stack spacing="md">
            <Heading level="page">Migration Metrics Dashboard</Heading>
            <Text variant="secondary">
              3-AI System Performance & ROI Tracking
            </Text>
          </Stack>
          
          {/* Summary Cards */}
          <Grid columns={4} gap="md">
            <Card>
              <Stack spacing="sm">
                <Text variant="secondary" size="sm">Total Migrations</Text>
                <Heading level="2">
                  {aggregateMetrics.totalMigrations}/{aggregateMetrics.totalMigrations + remaining}
                </Heading>
                <Text size="sm" variant="secondary">
                  {remaining} remaining
                </Text>
              </Stack>
            </Card>
            
            <Card>
              <Stack spacing="sm">
                <Text variant="secondary" size="sm">Time Saved</Text>
                <Heading level="2">
                  {formatDuration(aggregateMetrics.totalTimeSaved)}
                </Heading>
                <Text size="sm" className="text-emerald-600">
                  {formatPercent(
                    (aggregateMetrics.totalTimeSaved / 
                    (aggregateMetrics.totalTimeSaved + visionMetrics.duration.actual)) * 100
                  )} faster
                </Text>
              </Stack>
            </Card>
            
            <Card>
              <Stack spacing="sm">
                <Text variant="secondary" size="sm">Cost Saved</Text>
                <Heading level="2">
                  {formatCurrency(aggregateMetrics.totalCostSaved)}
                </Heading>
                <Text size="sm" className="text-emerald-600">
                  vs traditional approach
                </Text>
              </Stack>
            </Card>
            
            <Card>
              <Stack spacing="sm">
                <Text variant="secondary" size="sm">Average ROI</Text>
                <Heading level="2">
                  {formatROI(aggregateMetrics.averageROI)}
                </Heading>
                <Text size="sm" className="text-emerald-600">
                  Exceptional value
                </Text>
              </Stack>
            </Card>
          </Grid>
          
          {/* Vision Migration Details */}
          <Stack spacing="md">
            <Heading level="3">Vision Feature Migration</Heading>
            
            <Grid columns={3} gap="md">
              {/* Duration */}
              <Card>
                <Stack spacing="md">
                  <Text variant="secondary" size="sm">Duration</Text>
                  <Stack spacing="xs">
                    <Stack spacing="xs">
                      <Text size="sm">Estimated: {formatDuration(visionMetrics.duration.estimated)}</Text>
                      <Text size="sm" weight="bold">
                        Actual: {formatDuration(visionMetrics.duration.actual)}
                      </Text>
                    </Stack>
                    <Text size="sm" className="text-emerald-600">
                      ✓ Saved {formatDuration(visionMetrics.duration.savedTime)} ({formatPercent(visionMetrics.duration.savedTime / visionMetrics.duration.estimated * 100)})
                    </Text>
                  </Stack>
                </Stack>
              </Card>
              
              {/* Cost */}
              <Card>
                <Stack spacing="md">
                  <Text variant="secondary" size="sm">Cost Analysis</Text>
                  <Stack spacing="xs">
                    <Text size="sm">Traditional: {formatCurrency(visionMetrics.costs.traditional)}</Text>
                    <Text size="sm" weight="bold">
                      AI-Assisted: {formatCurrency(visionMetrics.costs.aiAssisted)}
                    </Text>
                    <Text size="sm" className="text-emerald-600">
                      ✓ Saved {formatCurrency(visionMetrics.costs.saved)}
                    </Text>
                  </Stack>
                </Stack>
              </Card>
              
              {/* ROI */}
              <Card>
                <Stack spacing="md">
                  <Text variant="secondary" size="sm">Return on Investment</Text>
                  <Stack spacing="xs">
                    <Text size="sm">
                      Time ROI: <span className="font-bold">{visionMetrics.roi.timeROI}:1</span>
                    </Text>
                    <Text size="sm">
                      Cost ROI: <span className="font-bold">{formatROI(visionMetrics.roi.costROI)}</span>
                    </Text>
                    <Text size="sm" className="text-emerald-600">
                      ✓ Exceptional performance
                    </Text>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          </Stack>
          
          {/* Quality Metrics */}
          <Stack spacing="md">
            <Heading level="3">Quality & AI Performance</Heading>
            
            <Grid columns={2} gap="md">
              <Card>
                <Stack spacing="md">
                  <Text variant="secondary" size="sm">Test Coverage</Text>
                  <Stack spacing="xs">
                    <Text>
                      {visionMetrics.quality.testsCreated} tests created
                    </Text>
                    <Text className="text-emerald-600">
                      ✓ {visionMetrics.quality.testsPassing}/{visionMetrics.quality.testsCreated} passing ({formatPercent(visionMetrics.quality.testSuccessRate * 100)})
                    </Text>
                    <Text>
                      {visionMetrics.quality.buildSuccess ? '✓' : '✗'} Build successful
                    </Text>
                  </Stack>
                </Stack>
              </Card>
              
              <Card>
                <Stack spacing="md">
                  <Text variant="secondary" size="sm">AI Analysis Performance</Text>
                  <Stack spacing="xs">
                    <Text>
                      {visionMetrics.aiPerformance.hiddenIssuesFound} hidden issues detected
                    </Text>
                    <Text className="text-emerald-600">
                      ✓ {visionMetrics.quality.issuesPrevented} issues prevented
                    </Text>
                    <Text>
                      {formatPercent(visionMetrics.aiPerformance.predictionsAccuracy * 100)} prediction accuracy
                    </Text>
                    <Text size="sm" variant="secondary">
                      Cost: {formatCurrency(visionMetrics.aiPerformance.cost)}
                    </Text>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          </Stack>
          
          {/* Projections */}
          <Card>
            <Stack spacing="md">
              <Heading level="3">Projected Savings (19 Remaining Features)</Heading>
              <Grid columns={3} gap="md">
                <Stack spacing="xs">
                  <Text variant="secondary" size="sm">Estimated Time Savings</Text>
                  <Heading level="3">
                    {formatDuration(visionMetrics.duration.savedTime * remaining)}
                  </Heading>
                  <Text size="sm" variant="secondary">
                    ≈ {Math.round((visionMetrics.duration.savedTime * remaining) / 60)} hours
                  </Text>
                </Stack>
                
                <Stack spacing="xs">
                  <Text variant="secondary" size="sm">Estimated Cost Savings</Text>
                  <Heading level="3">
                    {formatCurrency(visionMetrics.costs.saved * remaining)}
                  </Heading>
                  <Text size="sm" variant="secondary">
                    At current ROI
                  </Text>
                </Stack>
                
                <Stack spacing="xs">
                  <Text variant="secondary" size="sm">Total Investment</Text>
                  <Heading level="3">
                    {formatCurrency(visionMetrics.aiPerformance.cost * remaining)}
                  </Heading>
                  <Text size="sm" className="text-emerald-600">
                    {formatROI(visionMetrics.roi.costROI)} projected ROI
                  </Text>
                </Stack>
              </Grid>
            </Stack>
          </Card>
          
          {/* Investor Summary */}
          <Card>
            <Stack spacing="md">
              <Heading level="3">Investor Summary</Heading>
              <Stack spacing="sm">
                <Text>
                  <strong>Validated Results:</strong> The 3-AI system completed the vision feature migration in{' '}
                  {formatDuration(visionMetrics.duration.actual)} vs estimated{' '}
                  {formatDuration(visionMetrics.duration.estimated)}, delivering{' '}
                  <strong>{formatPercent(visionMetrics.duration.savedTime / visionMetrics.duration.estimated * 100)}</strong> time savings.
                </Text>
                <Text>
                  <strong>Cost Efficiency:</strong> Total cost of {formatCurrency(visionMetrics.costs.aiAssisted)} vs traditional{' '}
                  {formatCurrency(visionMetrics.costs.traditional)}, achieving an ROI of{' '}
                  <strong>{formatROI(visionMetrics.roi.costROI)}</strong>.
                </Text>
                <Text>
                  <strong>Quality:</strong> {visionMetrics.quality.issuesPrevented} predicted issues prevented proactively,{' '}
                  {visionMetrics.quality.testsCreated} tests created with {formatPercent(visionMetrics.quality.testSuccessRate * 100)} success rate.
                </Text>
                <Text>
                  <strong>Projection:</strong> Applying to 19 remaining features yields estimated savings of{' '}
                  <strong>{formatCurrency(visionMetrics.costs.saved * remaining)}</strong> and{' '}
                  <strong>{Math.round((visionMetrics.duration.savedTime * remaining) / 60)} developer hours</strong>.
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Section>
    </Container>
  )
}
