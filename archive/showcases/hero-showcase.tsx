import React from 'react'
import {
  Container,
  Section,
  Stack,
  Grid,
  Card,
  Heading,
  Text,
  EntityHero,
  MarketingHero,
  PageHero,
  DashboardHero,
  FeatureHero,
  EmptyStateHero
} from '@/components/design-system'
import {
  Car,
  Building2,
  Copy,
  Check,
  MoreHorizontal,
  User,
  Settings,
  Shield,
  Home,
  TrendingUp,
  Calendar,
  Mail,
  FileText,
  Clock,
  Share2,
  Download,
  Edit
} from 'lucide-react'

export default function HeroShowcase() {
  const [loading, setLoading] = React.useState(false)
  const [pageLoading, setPageLoading] = React.useState(false)
  const [dashboardLoading, setDashboardLoading] = React.useState(false)
  
  return (
    <Container size="lg">
      <Section spacing="xl">
        <Stack spacing="2xl">
          {/* Header */}
          <Stack spacing="md">
            <Heading level="hero">Hero Components - Production Ready</Heading>
            <Text className="text-slate-600 text-lg">
              Mobile-first, accessible, edge-case tested hero system ✨
            </Text>
            <Stack spacing="sm">
              <Text className="text-sm text-slate-500">
                ✅ Mobile-responsive • ✅ RTL support • ✅ High contrast mode • ✅ Touch-optimized • ✅ Overflow handling
              </Text>
            </Stack>
          </Stack>

          {/* Interactive Controls */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <Stack spacing="md">
              <Heading level="subtitle">Interactive Demo Controls</Heading>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => {
                    setLoading(true)
                    setTimeout(() => setLoading(false), 2000)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Test Loading State
                </button>
                <button
                  onClick={() => {
                    setPageLoading(true)
                    setTimeout(() => setPageLoading(false), 2000)
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Test Page Loading
                </button>
                <button
                  onClick={() => {
                    setDashboardLoading(true)
                    setTimeout(() => setDashboardLoading(false), 2000)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Test Dashboard Loading
                </button>
              </div>
            </Stack>
          </Card>

          {/* Phase 2: Edge Cases Demo */}
          <Card className="p-6 bg-amber-50 border-amber-200">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">🛡️ Phase 2: Edge Cases Handled</Heading>
                <Text className="text-slate-600">
                  All heroes now handle extreme scenarios gracefully
                </Text>
              </Stack>

              <Stack spacing="md">
                {/* Long Text Example */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Long Text & Overflow Handling</Text>
                  <EntityHero
                    title="This is an Extremely Long Vehicle Title That Would Normally Break the Layout But Now Wraps Beautifully"
                    subtitle="With an Even Longer Subtitle That Also Needs Proper Text Wrapping Support"
                    nickname="This is a very long nickname that gets truncated on mobile to prevent layout issues and maintain readability"
                    chips={[
                      { label: 'Very Long Chip Label That Gets Truncated Automatically', icon: <Car className="h-4 w-4" /> },
                      { label: 'Chip 1', icon: <FileText className="h-4 w-4" /> },
                      { label: 'Chip 2', icon: <Clock className="h-4 w-4" /> },
                      { label: 'Chip 3', icon: <Mail className="h-4 w-4" /> },
                      { label: 'Chip 4', icon: <Shield className="h-4 w-4" /> },
                      { label: 'Chip 5', icon: <User className="h-4 w-4" /> },
                      { label: 'Chip 6', icon: <Building2 className="h-4 w-4" /> },
                      { label: 'Chip 7', icon: <Calendar className="h-4 w-4" /> },
                      { label: 'Chip 8 - Horizontal Scroll!', icon: <Car className="h-4 w-4" /> }
                    ]}
                    color="orange"
                    size="compact"
                  />
                </Stack>

                {/* Chip Badges & Tooltips */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Enhanced Chips with Badges</Text>
                  <EntityHero
                    title="Notification Center"
                    chips={[
                      { 
                        label: 'Messages', 
                        icon: <Mail className="h-4 w-4" />, 
                        badge: 99,
                        tooltip: "99 unread messages"
                      },
                      { 
                        label: 'Alerts', 
                        icon: <Shield className="h-4 w-4" />, 
                        badge: "5+",
                        tooltip: "Multiple active alerts"
                      },
                      { 
                        label: 'Tasks', 
                        icon: <FileText className="h-4 w-4" />, 
                        badge: 12,
                        tooltip: "12 pending tasks"
                      }
                    ]}
                    color="pink"
                  />
                </Stack>
              </Stack>
            </Stack>
          </Card>

          {/* Entity Hero - NEW! */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">EntityHero - Detail Pages</Heading>
                <Text className="text-slate-600">
                  For vehicle details, garage pages, profiles, and any entity detail view
                </Text>
              </Stack>

              <Stack spacing="md">
                {/* Vehicle Example */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Vehicle Detail</Text>
                  <EntityHero
                    title="2023 Honda Civic"
                    subtitle="Sport Touring"
                    nickname="Daily Driver"
                    chips={[
                      { label: '54,234 mi', icon: <Car className="h-4 w-4" /> },
                      { label: 'Home Garage', icon: <Building2 className="h-4 w-4" /> },
                      { label: 'ABC-1234', icon: <Copy className="h-4 w-4" />, copyable: true }
                    ]}
                    actionsMenu={
                      <button className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition-all">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    }
                    color="blue"
                  />
                </Stack>

                {/* Garage Example */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Garage Detail</Text>
                  <EntityHero
                    title="Home Garage"
                    subtitle="123 Main St, Austin, TX"
                    chips={[
                      { label: '3 Vehicles', icon: <Car className="h-4 w-4" /> },
                      { label: '12 Records', icon: <Calendar className="h-4 w-4" /> },
                      { label: 'Primary', variant: 'default' }
                    ]}
                    actionsMenu={
                      <button className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition-all">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    }
                    color="purple"
                  />
                </Stack>

                {/* Profile Example */}
                <Stack spacing="sm">
                  <Text className="font-semibold">User Profile</Text>
                  <EntityHero
                    title="John Doe"
                    subtitle="john@example.com"
                    nickname="Fleet Manager"
                    chips={[
                      { label: 'Premium Plan', icon: <Shield className="h-4 w-4" /> },
                      { label: 'Member since 2023', icon: <User className="h-4 w-4" /> }
                    ]}
                    color="green"
                  />
                </Stack>
              </Stack>
            </Stack>
          </Card>

          {/* Phase 1: Size Variants & Loading */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">Phase 1: Size Variants & Loading</Heading>
                <Text className="text-slate-600">
                  Compact, default, and large sizes with skeleton loading states
                </Text>
              </Stack>

              <Stack spacing="md">
                {/* Compact Size */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Compact Size</Text>
                  <EntityHero
                    size="compact"
                    title="2023 Honda Civic"
                    subtitle="EX"
                    chips={[
                      { label: '45,234 mi', icon: <Car className="h-4 w-4" /> }
                    ]}
                    color="blue"
                  />
                </Stack>

                {/* Default Size */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Default Size</Text>
                  <EntityHero
                    size="default"
                    title="2023 Honda Civic"
                    subtitle="Sport Touring"
                    nickname="Daily Driver"
                    chips={[
                      { label: '54,234 mi', icon: <Car className="h-4 w-4" /> }
                    ]}
                    color="purple"
                  />
                </Stack>

                {/* Large Size */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Large Size</Text>
                  <EntityHero
                    size="large"
                    title="2023 Honda Civic"
                    subtitle="Sport Touring"
                    nickname="Daily Driver"
                    chips={[
                      { label: '54,234 mi', icon: <Car className="h-4 w-4" /> },
                      { label: 'Premium', icon: <Shield className="h-4 w-4" /> }
                    ]}
                    color="green"
                  />
                </Stack>

                {/* Loading State */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Loading State (Click "Test Loading State" button)</Text>
                  <EntityHero
                    loading={loading}
                    title="2023 Honda Civic"
                    subtitle="Sport Touring"
                    color="red"
                  />
                </Stack>
              </Stack>
            </Stack>
          </Card>

          {/* Phase 1: Status, Actions & Metrics */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">Phase 1: Status Badges, Quick Actions & Metrics</Heading>
                <Text className="text-slate-600">
                  Status verification, inline actions, and metrics display
                </Text>
              </Stack>

              <Stack spacing="md">
                {/* With Status Badge & Quick Actions */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Status Badge & Quick Actions</Text>
                  <EntityHero
                    title="Premium Account"
                    subtitle="john@example.com"
                    statusBadge={{
                      label: "Verified",
                      variant: "success",
                      icon: <Check className="h-4 w-4" />
                    }}
                    quickActions={[
                      { label: "Edit", icon: <Edit className="h-4 w-4" />, onClick: () => alert('Edit clicked!') },
                      { label: "Share", icon: <Share2 className="h-4 w-4" />, onClick: () => alert('Share clicked!') }
                    ]}
                    color="indigo"
                  />
                </Stack>

                {/* With Metrics Bar */}
                <Stack spacing="sm">
                  <Text className="font-semibold">With Metrics Bar</Text>
                  <EntityHero
                    title="Home Garage"
                    subtitle="123 Main St, Austin, TX"
                    chips={[
                      { label: '3 Vehicles', icon: <Car className="h-4 w-4" /> }
                    ]}
                    metrics={[
                      { label: "Total Records", value: "124", icon: <FileText className="h-4 w-4" /> },
                      { label: "Last Updated", value: "2h ago", icon: <Clock className="h-4 w-4" /> }
                    ]}
                    color="teal"
                  />
                </Stack>
              </Stack>
            </Stack>
          </Card>

          {/* Phase 2: Advanced Features */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">Phase 2: Advanced Features</Heading>
                <Text className="text-slate-600">
                  Breadcrumbs, enhanced chips with badges/tooltips, auto share/export
                </Text>
              </Stack>

              <Stack spacing="md">
                {/* With Breadcrumbs */}
                <Stack spacing="sm">
                  <Text className="font-semibold">With Breadcrumbs Navigation</Text>
                  <EntityHero
                    title="2023 Honda Civic"
                    subtitle="Sport Touring"
                    breadcrumbs={[
                      { label: "Fleet", onClick: () => alert('Fleet') },
                      { label: "Honda", onClick: () => alert('Honda') },
                      { label: "Civic" }
                    ]}
                    chips={[
                      { label: '54,234 mi', icon: <Car className="h-4 w-4" /> }
                    ]}
                    color="cyan"
                  />
                </Stack>

                {/* With Enhanced Chips (badges & tooltips) */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Enhanced Chips with Badges & Tooltips</Text>
                  <EntityHero
                    title="Fleet Manager Dashboard"
                    chips={[
                      { 
                        label: 'Messages', 
                        icon: <Mail className="h-4 w-4" />, 
                        badge: 12,
                        tooltip: "12 unread messages",
                        onClick: () => alert('Messages')
                      },
                      { 
                        label: 'Alerts', 
                        icon: <Shield className="h-4 w-4" />, 
                        badge: 3,
                        tooltip: "3 active alerts"
                      }
                    ]}
                    color="orange"
                  />
                </Stack>

                {/* With Auto Share/Export */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Auto Share & Export Buttons</Text>
                  <EntityHero
                    title="Maintenance Report"
                    subtitle="Q4 2023"
                    onShare={() => alert('Share functionality!')}
                    onExport={() => alert('Export functionality!')}
                    chips={[
                      { label: '45 Records', icon: <FileText className="h-4 w-4" /> }
                    ]}
                    color="pink"
                  />
                </Stack>
              </Stack>
            </Stack>
          </Card>

          {/* Marketing Hero */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">MarketingHero</Heading>
                <Text className="text-slate-600">Landing pages and marketing site</Text>
              </Stack>

              <MarketingHero
                headline="Track Your Vehicle Like Never Before"
                subheadline="MotoMind helps you stay on top of maintenance, track costs, and maximize your vehicle's lifespan with AI-powered insights."
                badge="New Feature"
                layout="centered"
                primaryCTA={{
                  label: 'Get Started Free',
                  onClick: () => console.log('Get Started')
                }}
                secondaryCTA={{
                  label: 'Learn More',
                  onClick: () => console.log('Learn More')
                }}
              />
            </Stack>
          </Card>

          {/* Page Hero - Phase 3 Enhanced! */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">PageHero - Phase 3 Enhanced!</Heading>
                <Text className="text-slate-600">Internal app pages with loading states and last updated timestamp</Text>
              </Stack>

              <Stack spacing="md">
                {/* Normal State */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Normal State with Last Updated</Text>
                  <PageHero
                    title="Settings"
                    description="Manage your account preferences and application settings"
                    icon={<Settings className="h-6 w-6" />}
                    lastUpdated="2 hours ago"
                    breadcrumbs={[
                      { label: 'Home', href: '/' },
                      { label: 'Settings' }
                    ]}
                    actions={
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Save Changes
                      </button>
                    }
                  />
                </Stack>

                {/* Loading State */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Loading State (Click "Test Page Loading" button)</Text>
                  <PageHero
                    loading={pageLoading}
                    title="Dashboard"
                    description="View your analytics and metrics"
                    icon={<TrendingUp className="h-6 w-6" />}
                  />
                </Stack>
              </Stack>
            </Stack>
          </Card>

          {/* Dashboard Hero - Enhanced with Loading */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">DashboardHero - Enhanced!</Heading>
                <Text className="text-slate-600">Dashboard pages with metrics and loading state</Text>
              </Stack>

              <Stack spacing="md">
                {/* Normal State */}
                <Stack spacing="sm">
                  <Text className="font-semibold">With Metrics & Mobile-Responsive</Text>
                  <DashboardHero
                    title="Fleet Overview"
                    description="Track your vehicles and maintenance schedules"
                    metrics={[
                      { label: 'Total Vehicles', value: '3', change: '+1', trend: 'up' },
                      { label: 'Maintenance Due', value: '2', change: '+1', trend: 'up' },
                      { label: 'Total Cost', value: '$1,234', change: '-5%', trend: 'down' }
                    ]}
                    actions={
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Add Vehicle
                      </button>
                    }
                  />
                </Stack>

                {/* Loading State */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Loading State (Click "Test Dashboard Loading" button)</Text>
                  <DashboardHero
                    loading={dashboardLoading}
                    title="Analytics Dashboard"
                    description="Loading your metrics..."
                    metrics={[
                      { label: 'Revenue', value: '0' },
                      { label: 'Users', value: '0' },
                      { label: 'Growth', value: '0' }
                    ]}
                  />
                </Stack>
              </Stack>
            </Stack>
          </Card>

          {/* Feature Hero */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">FeatureHero</Heading>
                <Text className="text-slate-600">Feature announcements</Text>
              </Stack>

              <FeatureHero
                feature="AI Vision"
                headline="Scan Documents in Seconds"
                description="Automatically extract data from receipts, invoices, and maintenance records using advanced AI vision."
                badge="New"
                cta={{
                  label: 'Try It Now',
                  onClick: () => console.log('Try It Now')
                }}
              />
            </Stack>
          </Card>

          {/* Empty State Hero */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">EmptyStateHero</Heading>
                <Text className="text-slate-600">No data pages</Text>
              </Stack>

              <EmptyStateHero
                icon={<Car className="h-12 w-12" />}
                title="No Vehicles Yet"
                description="Get started by adding your first vehicle to track maintenance and costs."
                action={{
                  label: 'Add Vehicle',
                  onClick: () => console.log('Add Vehicle')
                }}
                secondaryAction={{
                  label: 'Learn More',
                  onClick: () => console.log('Learn More')
                }}
              />
            </Stack>
          </Card>

          {/* Usage Code */}
          <Card className="bg-slate-900 text-white p-6">
            <Stack spacing="md">
              <Heading level="title" className="text-white">Usage Examples</Heading>
              <pre className="text-xs bg-slate-800 p-4 rounded overflow-x-auto">
{`import { EntityHero } from '@/components/design-system'

// ✨ NEW: EntityHero - Perfect for detail pages
<EntityHero
  title="2023 Honda Civic"
  subtitle="Sport Touring"
  nickname="Daily Driver"
  chips={[
    { label: '54,234 mi', icon: <Car /> },
    { label: 'Home Garage', icon: <Building2 /> },
    { label: 'ABC-1234', copyable: true } // Auto copy!
  ]}
  actionsMenu={<OverflowMenu />}
  color="blue" // 10 color options!
  onBack={() => router.back()}
  backLabel="Fleet"
/>

// 10 Built-in Color Gradients
<EntityHero color="blue" />     // Blue gradient
<EntityHero color="purple" />   // Purple gradient
<EntityHero color="green" />    // Green gradient
<EntityHero color="red" />      // Red gradient
<EntityHero color="orange" />   // Orange gradient
<EntityHero color="pink" />     // Pink gradient
<EntityHero color="indigo" />   // Indigo gradient
<EntityHero color="teal" />     // Teal gradient
<EntityHero color="cyan" />     // Cyan gradient
<EntityHero color="slate" />    // Slate gradient

// With hero image background
<EntityHero
  title="Luxury SUV"
  heroImage="/images/vehicle-hero.jpg"
  chips={[...]}
/>

// Marketing Hero
<MarketingHero
  headline="Your headline"
  subheadline="Your subheadline"
  badge="New"
  primaryCTA={{ label: 'Get Started', onClick }}
  secondaryCTA={{ label: 'Learn More', onClick }}
/>

// Page Hero
<PageHero
  title="Settings"
  description="Manage your preferences"
  icon={<Settings />}
  breadcrumbs={[...]}
  actions={<Button>Save</Button>}
/>

// Dashboard Hero with metrics
<DashboardHero
  title="Dashboard"
  metrics={[
    { label: 'Total', value: '123', change: '+5%', trend: 'up' }
  ]}
/>`}
              </pre>
            </Stack>
          </Card>
        </Stack>
      </Section>
    </Container>
  )
}
