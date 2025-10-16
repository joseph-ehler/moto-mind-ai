/**
 * Feature Flag Admin Dashboard
 * 
 * Allows admins to:
 * - Enable/disable features
 * - Adjust rollout percentages
 * - Manage beta users
 * - View feature dependencies
 * - Monitor feature usage
 */

'use client'

import { useState } from 'react'
import {
  Container,
  Grid,
  Stack,
  Section,
  Flex,
  Card,
  Button,
  Heading,
  Text
} from '@/components/design-system'
import { features, type FeatureFlag, type FeatureStatus } from '@/lib/config/features'

export function FeatureFlagDashboard() {
  const [selectedPhase, setSelectedPhase] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Get all features
  const allFeatures = Object.values(features)

  // Filter features
  const filteredFeatures = allFeatures.filter(feature => {
    const matchesPhase = selectedPhase === 'all' || feature.phase === selectedPhase
    const matchesSearch =
      searchQuery === '' ||
      feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesPhase && matchesSearch
  })

  // Group by status
  const featuresByStatus = filteredFeatures.reduce((acc, feature) => {
    if (!acc[feature.status]) {
      acc[feature.status] = []
    }
    acc[feature.status].push(feature)
    return acc
  }, {} as Record<FeatureStatus, FeatureFlag[]>)

  return (
    <Container size="lg" useCase="data_tables">
      <Section spacing="lg">
        <Stack spacing="xl">
          {/* Header */}
          <Stack spacing="md">
            <Heading level="hero">Feature Flags</Heading>
            <Text>
              Manage feature rollouts, A/B tests, and beta access across all phases
            </Text>
          </Stack>

          {/* Stats */}
          <Grid columns="auto" gap="md">
            <StatsCard
              label="Total Features"
              value={allFeatures.length}
              color="blue"
            />
            <StatsCard
              label="Enabled"
              value={allFeatures.filter(f => f.status === 'enabled').length}
              color="green"
            />
            <StatsCard
              label="In Rollout"
              value={allFeatures.filter(f => f.status === 'rollout').length}
              color="yellow"
            />
            <StatsCard
              label="Beta"
              value={allFeatures.filter(f => f.status === 'beta').length}
              color="purple"
            />
            <StatsCard
              label="Disabled"
              value={allFeatures.filter(f => f.status === 'disabled').length}
              color="gray"
            />
          </Grid>

          {/* Filters */}
          <Card>
            <Stack spacing="md">
              <Flex gap="md" align="center">
                <input
                  type="text"
                  placeholder="Search features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={selectedPhase}
                  onChange={(e) =>
                    setSelectedPhase(
                      e.target.value === 'all' ? 'all' : parseInt(e.target.value)
                    )
                  }
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Phases</option>
                  <option value={1}>Phase 1: Foundation</option>
                  <option value={2}>Phase 2: Intelligence</option>
                  <option value={3}>Phase 3: Analytics</option>
                  <option value={4}>Phase 4: Enterprise</option>
                  <option value={5}>Phase 5: Premium</option>
                  <option value={6}>Phase 6: Scale</option>
                </select>
              </Flex>
            </Stack>
          </Card>

          {/* Feature Lists by Status */}
          <Stack spacing="lg">
            {(['enabled', 'rollout', 'beta', 'disabled'] as FeatureStatus[]).map(
              (status) => {
                const statusFeatures = featuresByStatus[status] || []
                if (statusFeatures.length === 0) return null

                return (
                  <Stack key={status} spacing="md">
                    <Flex align="center" gap="sm">
                      <Heading level="section">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Heading>
                      <span className="px-2 py-1 text-sm font-medium bg-gray-100 rounded">
                        {statusFeatures.length}
                      </span>
                    </Flex>

                    <Grid columns="auto" gap="md">
                      {statusFeatures.map((feature) => (
                        <FeatureCard key={feature.id} feature={feature} />
                      ))}
                    </Grid>
                  </Stack>
                )
              }
            )}
          </Stack>
        </Stack>
      </Section>
    </Container>
  )
}

// ============================================================================
// COMPONENTS
// ============================================================================

function StatsCard({
  label,
  value,
  color
}: {
  label: string
  value: number
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'gray'
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-800'
  }

  return (
    <Card>
      <Stack spacing="sm">
        <Text className="text-sm text-gray-600">{label}</Text>
        <Text className={`text-3xl font-bold ${colors[color]}`}>{value}</Text>
      </Stack>
    </Card>
  )
}

function FeatureCard({ feature }: { feature: FeatureFlag }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card>
      <Stack spacing="md">
        {/* Header */}
        <Flex justify="between" align="start">
          <Stack spacing="xs">
            <Flex align="center" gap="sm">
              <Heading level="subsection">{feature.name}</Heading>
              <TierBadge tier={feature.tier} />
              <StatusBadge status={feature.status} />
            </Flex>
            <Text className="text-sm text-gray-600">{feature.description}</Text>
          </Stack>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼' : '▶'}
          </Button>
        </Flex>

        {/* Rollout Percentage */}
        {feature.status === 'rollout' && feature.rolloutPercentage !== undefined && (
          <Stack spacing="xs">
            <Flex justify="between">
              <Text className="text-sm font-medium">Rollout</Text>
              <Text className="text-sm text-gray-600">
                {feature.rolloutPercentage}%
              </Text>
            </Flex>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${feature.rolloutPercentage}%` }}
              />
            </div>
          </Stack>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <Stack spacing="sm" className="pt-2 border-t">
            <DetailRow label="Feature ID" value={feature.id} />
            <DetailRow label="Phase" value={`Phase ${feature.phase}`} />
            {feature.addedIn && <DetailRow label="Added" value={feature.addedIn} />}

            {feature.requires && feature.requires.length > 0 && (
              <Stack spacing="xs">
                <Text className="text-sm font-medium">Dependencies:</Text>
                <Stack spacing="xs">
                  {feature.requires.map((depId) => (
                    <Text key={depId} className="text-sm text-gray-600 ml-4">
                      • {features[depId]?.name || depId}
                    </Text>
                  ))}
                </Stack>
              </Stack>
            )}

            {feature.betaUsers && feature.betaUsers.length > 0 && (
              <DetailRow
                label="Beta Users"
                value={`${feature.betaUsers.length} users`}
              />
            )}

            {feature.variants && (
              <Stack spacing="xs">
                <Text className="text-sm font-medium">A/B Test:</Text>
                <Text className="text-sm text-gray-600 ml-4">
                  • Control: {feature.variants.control}
                </Text>
                <Text className="text-sm text-gray-600 ml-4">
                  • Treatment: {feature.variants.treatment} ({feature.variants.split}
                  %)
                </Text>
              </Stack>
            )}

            {/* Actions */}
            <Flex gap="sm" className="pt-2">
              <Button variant="outline" size="sm">
                Edit
              </Button>
              <Button variant="outline" size="sm">
                View Usage
              </Button>
              {feature.status !== 'enabled' && (
                <Button variant="primary" size="sm">
                  Enable
                </Button>
              )}
              {feature.status === 'enabled' && (
                <Button variant="danger" size="sm">
                  Disable
                </Button>
              )}
            </Flex>
          </Stack>
        )}
      </Stack>
    </Card>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const colors = {
    free: 'bg-gray-100 text-gray-800',
    pro: 'bg-blue-100 text-blue-800',
    business: 'bg-purple-100 text-purple-800',
    enterprise: 'bg-orange-100 text-orange-800',
    premium: 'bg-pink-100 text-pink-800'
  }

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded ${colors[tier as keyof typeof colors] || colors.free}`}
    >
      {tier.toUpperCase()}
    </span>
  )
}

function StatusBadge({ status }: { status: FeatureStatus }) {
  const colors = {
    enabled: 'bg-green-100 text-green-800',
    rollout: 'bg-yellow-100 text-yellow-800',
    beta: 'bg-purple-100 text-purple-800',
    disabled: 'bg-gray-100 text-gray-800'
  }

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded ${colors[status]}`}
    >
      {status.toUpperCase()}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Flex justify="between">
      <Text className="text-sm font-medium">{label}:</Text>
      <Text className="text-sm text-gray-600">{value}</Text>
    </Flex>
  )
}
