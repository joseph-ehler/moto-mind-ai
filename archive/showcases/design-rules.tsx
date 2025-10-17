/**
 * Design System Rules & Guidelines
 * 
 * Comprehensive documentation of design system rules,
 * constraints, and proper usage patterns.
 */

import React from 'react'
import Head from 'next/head'
import {
  Container,
  Stack,
  Section,
  Grid,
  Card,
  Heading,
  Text,
  Button
} from '@/components/design-system'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Eye,
  Smartphone,
  Monitor,
  Users,
  BarChart3
} from 'lucide-react'

export default function DesignRulesPage() {
  return (
    <>
      <Head>
        <title>Design System Rules - MotoMind</title>
        <meta name="description" content="Design system rules and constraints for optimal UX" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <Section spacing="lg" background="white">
          <Container size="md" useCase="articles">
            <Stack spacing="xl">
              <div className="text-center">
                <Shield className="w-16 h-16 mx-auto mb-6 text-blue-600" />
                <Heading level="hero">Design System Rules</Heading>
                <Text className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                  Enforced guidelines to prevent UX violations and ensure optimal user experience.
                  These rules are baked into the design system components.
                </Text>
              </div>

              {/* Key Principle */}
              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  <strong>Golden Rule:</strong> Never exceed Medium (896px) container width for consumer-facing content. 
                  Wide content causes eye strain and poor reading experience.
                </AlertDescription>
              </Alert>
            </Stack>
          </Container>
        </Section>

        {/* Container Rules */}
        <Section spacing="xl" background="gray">
          <Container size="md" useCase="articles">
            <Stack spacing="xl">
              <div className="text-center">
                <Heading level="title">Container Width Rules</Heading>
                <Text className="mt-4 text-xl text-gray-600">
                  Enforced maximum widths to prevent eye strain and maintain readability
                </Text>
              </div>

              <Grid columns={1} gap="lg">
                {/* Allowed Containers */}
                <Card className="p-8">
                  <Stack spacing="lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <Heading level="subtitle">Allowed Containers</Heading>
                    </div>

                    <Grid columns={2} gap="md">
                      {/* Small Container */}
                      <div className="border-2 border-green-200 bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-green-100 text-green-800">Small (672px)</Badge>
                          <Smartphone className="w-5 h-5 text-green-600" />
                        </div>
                        <Text className="font-medium mb-2">Use Cases:</Text>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Forms & modals</li>
                          <li>• Mobile-focused content</li>
                          <li>• Narrow content blocks</li>
                        </ul>
                      </div>

                      {/* Medium Container - DEFAULT */}
                      <div className="border-2 border-blue-200 bg-blue-50 p-4 rounded-lg relative">
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-blue-600 text-white">DEFAULT</Badge>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-blue-100 text-blue-800">Medium (896px)</Badge>
                          <Monitor className="w-5 h-5 text-blue-600" />
                        </div>
                        <Text className="font-medium mb-2">Use Cases:</Text>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• <strong>All consumer content</strong></li>
                          <li>• Articles & blog posts</li>
                          <li>• Product pages</li>
                          <li>• User dashboards</li>
                          <li>• Marketing pages</li>
                        </ul>
                      </div>
                    </Grid>
                  </Stack>
                </Card>

                {/* Restricted Containers */}
                <Card className="p-8">
                  <Stack spacing="lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      <Heading level="subtitle">Restricted Containers</Heading>
                      <Badge className="bg-yellow-100 text-yellow-800">Requires Override</Badge>
                    </div>

                    <Grid columns={2} gap="md">
                      {/* Large Container */}
                      <div className="border-2 border-yellow-200 bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-yellow-100 text-yellow-800">Large (1152px)</Badge>
                          <BarChart3 className="w-5 h-5 text-yellow-600" />
                        </div>
                        <Text className="font-medium mb-2">Allowed Use Cases:</Text>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Data tables only</li>
                          <li>• Admin dashboards</li>
                          <li>• Analytics views</li>
                          <li>• Comparison tables</li>
                        </ul>
                        <Alert className="mt-3">
                          <AlertDescription className="text-xs">
                            Requires <code>override</code> prop with reason and approval
                          </AlertDescription>
                        </Alert>
                      </div>

                      {/* XL Container */}
                      <div className="border-2 border-red-200 bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-red-100 text-red-800">XL (1280px)</Badge>
                          <Users className="w-5 h-5 text-red-600" />
                        </div>
                        <Text className="font-medium mb-2">Restricted Use Cases:</Text>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Admin interfaces only</li>
                          <li>• Data visualization</li>
                          <li>• System monitoring</li>
                        </ul>
                        <Alert className="mt-3">
                          <AlertDescription className="text-xs">
                            <strong>Admin only.</strong> Never for consumer content.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </Grid>
                  </Stack>
                </Card>

                {/* Forbidden Containers */}
                <Card className="p-8">
                  <Stack spacing="lg">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-red-600" />
                      <Heading level="subtitle">Forbidden Containers</Heading>
                      <Badge className="bg-red-100 text-red-800">Emergency Only</Badge>
                    </div>

                    <div className="border-2 border-red-300 bg-red-50 p-6 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-red-200 text-red-900">Full Width</Badge>
                        <XCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <Text className="font-medium text-red-900 mb-2">
                        🚨 EMERGENCY OVERRIDE ONLY
                      </Text>
                      <Text className="text-red-800 text-sm">
                        Full-width containers cause severe eye strain and poor UX. 
                        Requires explicit approval from UX team and product leadership.
                      </Text>
                    </div>
                  </Stack>
                </Card>
              </Grid>
            </Stack>
          </Container>
        </Section>

        {/* Usage Examples */}
        <Section spacing="xl" background="white">
          <Container size="md" useCase="articles">
            <Stack spacing="xl">
              <div className="text-center">
                <Heading level="title">Usage Examples</Heading>
                <Text className="mt-4 text-xl text-gray-600">
                  Correct and incorrect usage patterns
                </Text>
              </div>

              <Grid columns={1} gap="lg">
                {/* Correct Usage */}
                <Card className="p-8 border-2 border-green-200">
                  <Stack spacing="lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <Heading level="subtitle" className="text-green-900">✅ Correct Usage</Heading>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <Text className="font-mono text-sm mb-4">
                        {`// ✅ Consumer article - uses medium container`}
                      </Text>
                      <div className="bg-white p-4 rounded border-2 border-dashed border-green-300">
                        <pre className="text-sm text-green-800">{`<Container size="md" useCase="articles">
  <Heading>Article Title</Heading>
  <Text>Article content with optimal reading width...</Text>
</Container>`}</pre>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <Text className="font-mono text-sm mb-4">
                        {`// ⚠️  Data table - large container with override`}
                      </Text>
                      <div className="bg-white p-4 rounded border-2 border-dashed border-yellow-300">
                        <pre className="text-sm text-yellow-800">{`<Container 
  size="lg" 
  useCase="data_tables"
  override={{
    reason: "Wide table requires horizontal space for data visibility",
    approvedBy: "UX Team"
  }}
>
  <DataTable />
</Container>`}</pre>
                      </div>
                    </div>
                  </Stack>
                </Card>

                {/* Incorrect Usage */}
                <Card className="p-8 border-2 border-red-200">
                  <Stack spacing="lg">
                    <div className="flex items-center gap-3">
                      <XCircle className="w-6 h-6 text-red-600" />
                      <Heading level="subtitle" className="text-red-900">❌ Violations</Heading>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <Text className="font-mono text-sm mb-4">
                        {`// ❌ Consumer content in large container - VIOLATION`}
                      </Text>
                      <div className="bg-white p-4 rounded border-2 border-dashed border-red-300">
                        <pre className="text-sm text-red-800">{`<Container size="lg" useCase="articles">
  <Heading>Article Title</Heading>
  <Text>This causes eye strain!</Text>
</Container>

// 🚨 Console Error:
// DESIGN SYSTEM VIOLATION: Use case 'articles' not allowed 
// for container 'lg'. Use 'md' for consumer content.`}</pre>
                      </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <Text className="font-mono text-sm mb-4">
                        {`// ❌ Large container without override - VIOLATION`}
                      </Text>
                      <div className="bg-white p-4 rounded border-2 border-dashed border-red-300">
                        <pre className="text-sm text-red-800">{`<Container size="lg" useCase="data_tables">
  <DataTable />
</Container>

// 🚨 Console Error:
// Container size 'lg' requires explicit override 
// for use case 'data_tables'`}</pre>
                      </div>
                    </div>
                  </Stack>
                </Card>
              </Grid>
            </Stack>
          </Container>
        </Section>

        {/* Typography Rules */}
        <Section spacing="xl" background="gray">
          <Container size="md" useCase="articles">
            <Stack spacing="xl">
              <div className="text-center">
                <Heading level="title">Typography Rules</Heading>
                <Text className="mt-4 text-xl text-gray-600">
                  Mobile-first typography standards for accessibility
                </Text>
              </div>

              <Grid columns={2} gap="lg">
                <Card className="p-6">
                  <Stack spacing="md">
                    <Heading level="subtitle">Minimum Font Sizes</Heading>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Text>Body Text</Text>
                        <Badge>16px minimum</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <Text>Buttons</Text>
                        <Badge>16px minimum</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <Text>Captions</Text>
                        <Badge>14px minimum</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <Text>Headings</Text>
                        <Badge>18px minimum</Badge>
                      </div>
                    </div>
                  </Stack>
                </Card>

                <Card className="p-6">
                  <Stack spacing="md">
                    <Heading level="subtitle">Touch Targets</Heading>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Text>Minimum Size</Text>
                        <Badge>44px (iOS/Android)</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <Text>Button Height</Text>
                        <Badge>48px (recommended)</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <Text>Large Buttons</Text>
                        <Badge>56px</Badge>
                      </div>
                    </div>
                  </Stack>
                </Card>
              </Grid>
            </Stack>
          </Container>
        </Section>

        {/* Enforcement */}
        <Section spacing="lg" background="white">
          <Container size="md" useCase="articles">
            <Stack spacing="lg">
              <div className="text-center">
                <Heading level="title">Rule Enforcement</Heading>
                <Text className="mt-4 text-xl text-gray-600">
                  How the design system enforces these rules
                </Text>
              </div>

              <Card className="p-8">
                <Stack spacing="lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <XCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <Text className="font-medium">Development Errors</Text>
                      <Text variant="caption" className="mt-1">
                        Console errors for rule violations in development
                      </Text>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      </div>
                      <Text className="font-medium">Warnings</Text>
                      <Text variant="caption" className="mt-1">
                        Console warnings for suboptimal usage
                      </Text>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-6 h-6 text-green-600" />
                      </div>
                      <Text className="font-medium">Override System</Text>
                      <Text variant="caption" className="mt-1">
                        Explicit overrides with reason and approval
                      </Text>
                    </div>
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Production Safety:</strong> Rule enforcement only runs in development. 
                      Production builds are not affected by validation errors.
                    </AlertDescription>
                  </Alert>
                </Stack>
              </Card>
            </Stack>
          </Container>
        </Section>
      </div>
    </>
  )
}
