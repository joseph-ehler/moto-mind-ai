/**
 * Icons System Showcase
 * 
 * Built using the mandatory MotoMind Design System foundation
 * Documents Lucide React icon library usage and guidelines
 */

import React from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  Grid,
  Heading,
  Text,
  Card
} from '@/components/design-system'
import { 
  Palette,
  Home, 
  Search, 
  Settings, 
  User, 
  Bell, 
  Mail,
  Plus,
  Check,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  Eye,
  EyeOff,
  Download,
  Upload,
  Edit,
  Trash2,
  Save,
  Copy
} from 'lucide-react'

export default function IconsSystemPage() {
  const iconSizes = [
    { name: 'xs', size: 16, class: 'w-4 h-4', use: 'Inline with text, tight spaces' },
    { name: 'sm', size: 20, class: 'w-5 h-5', use: 'Small buttons, list items' },
    { name: 'md', size: 24, class: 'w-6 h-6', use: 'Default size, most use cases' },
    { name: 'lg', size: 32, class: 'w-8 h-8', use: 'Large buttons, feature icons' },
    { name: 'xl', size: 48, class: 'w-12 h-12', use: 'Hero sections, empty states' },
  ]

  const semanticIcons = [
    { name: 'Success', icon: CheckCircle2, color: 'text-green-600', use: 'Success messages, confirmations' },
    { name: 'Error', icon: XCircle, color: 'text-red-600', use: 'Error messages, failures' },
    { name: 'Warning', icon: AlertCircle, color: 'text-yellow-600', use: 'Warnings, cautions' },
    { name: 'Info', icon: Info, color: 'text-blue-600', use: 'Information, tips' },
  ]

  const commonActions = [
    { name: 'Add', icon: Plus, use: 'Create, add new' },
    { name: 'Edit', icon: Edit, use: 'Edit, modify' },
    { name: 'Delete', icon: Trash2, use: 'Delete, remove' },
    { name: 'Save', icon: Save, use: 'Save, confirm' },
    { name: 'Copy', icon: Copy, use: 'Copy, duplicate' },
    { name: 'Download', icon: Download, use: 'Download, export' },
    { name: 'Upload', icon: Upload, use: 'Upload, import' },
  ]

  return (
    <>
      <Head>
        <title>Icons System - MotoMind Design System</title>
        <meta name="description" content="Icon library, sizes, and usage guidelines with Lucide React" />
      </Head>

      <div className="min-h-screen bg-white">
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="xl">
              
              {/* Hero Section */}
              <div className="text-center">
                <Palette className="w-16 h-16 mx-auto mb-6 text-blue-600" />
                <Heading level="hero">Icons System</Heading>
                <Text size="xl" className="mt-6 text-gray-600 max-w-3xl mx-auto">
                  We use Lucide React for consistent, accessible icons.
                  Clear guidelines ensure proper usage across the application.
                </Text>
              </div>

              {/* Key Features */}
              <Grid columns="auto" gap="md">
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Palette className="w-8 h-8 mx-auto text-blue-600" />
                    <Heading level="subtitle">Lucide React</Heading>
                    <Text size="sm">
                      1000+ icons, tree-shakeable, optimized for React
                    </Text>
                  </Stack>
                </Card>
                
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Eye className="w-8 h-8 mx-auto text-green-600" />
                    <Heading level="subtitle">Accessible</Heading>
                    <Text size="sm">
                      Semantic meaning with aria-labels and proper contrast
                    </Text>
                  </Stack>
                </Card>
                
                <Card className="p-6 text-center">
                  <Stack spacing="md">
                    <Settings className="w-8 h-8 mx-auto text-purple-600" />
                    <Heading level="subtitle">Consistent</Heading>
                    <Text size="sm">
                      Standardized sizes and colors for visual harmony
                    </Text>
                  </Stack>
                </Card>
              </Grid>

              {/* Icon Sizes */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Icon Sizes</Heading>
                  <Text>
                    Five standard sizes cover all use cases.
                    Use Tailwind classes (w-4 h-4, w-6 h-6, etc.) for consistency.
                  </Text>
                  
                  <Stack spacing="md">
                    {iconSizes.map((size) => (
                      <div key={size.name} className="flex items-center gap-6 p-4 rounded-lg border hover:bg-gray-50">
                        <div className="w-16 flex items-center justify-center">
                          <Home className={size.class} />
                        </div>
                        <div className="flex-1">
                          <Text className="font-semibold">{size.name} ({size.size}px)</Text>
                          <Text size="sm" className="text-gray-600">{size.use}</Text>
                        </div>
                        <code className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                          {size.class}
                        </code>
                      </div>
                    ))}
                  </Stack>
                </Stack>
              </Card>

              {/* Semantic Icons */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Semantic Icons</Heading>
                  <Text>
                    Use these icons with their corresponding colors for status messages and feedback.
                    Always pair with text for accessibility.
                  </Text>
                  
                  <Grid columns={2} gap="lg">
                    {semanticIcons.map((item) => {
                      const IconComponent = item.icon
                      return (
                        <div key={item.name} className="p-6 border rounded-lg">
                          <Stack spacing="sm">
                            <div className="flex items-center gap-3">
                              <IconComponent className={`w-8 h-8 ${item.color}`} />
                              <Heading level="subtitle">{item.name}</Heading>
                            </div>
                            <Text size="sm" className="text-gray-600">{item.use}</Text>
                            <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              {item.color}
                            </code>
                          </Stack>
                        </div>
                      )
                    })}
                  </Grid>
                </Stack>
              </Card>

              {/* Common Actions */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Common Action Icons</Heading>
                  <Text>
                    Standardized icons for common actions ensure users recognize functionality immediately.
                  </Text>
                  
                  <Grid columns={3} gap="md">
                    {commonActions.map((item) => {
                      const IconComponent = item.icon
                      return (
                        <div key={item.name} className="p-4 border rounded-lg text-center hover:bg-gray-50">
                          <Stack spacing="sm">
                            <IconComponent className="w-6 h-6 mx-auto text-gray-700" />
                            <Text className="font-semibold">{item.name}</Text>
                            <Text size="sm" className="text-gray-600">{item.use}</Text>
                          </Stack>
                        </div>
                      )
                    })}
                  </Grid>
                </Stack>
              </Card>

              {/* Installation */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Installation & Usage</Heading>
                  <Text>
                    Lucide React is already installed. Import icons as needed.
                  </Text>
                  
                  <div className="bg-gray-900 p-6 rounded-lg overflow-x-auto">
                    <pre className="text-sm text-gray-100 font-mono">
<code>{`// Import specific icons
import { Home, Search, Settings } from 'lucide-react'

// Use with Tailwind sizing
<Home className="w-6 h-6 text-gray-700" />

// With accessibility
<button aria-label="Go to home">
  <Home className="w-5 h-5" />
</button>

// With text
<div className="flex items-center gap-2">
  <CheckCircle2 className="w-5 h-5 text-green-600" />
  <Text>Success</Text>
</div>`}</code>
                    </pre>
                  </div>
                </Stack>
              </Card>

              {/* Accessibility Rules */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Accessibility Rules</Heading>
                  <Text>
                    Icons must be accessible to all users, including those using screen readers.
                  </Text>
                  
                  <Grid columns={2} gap="lg">
                    {/* Do */}
                    <div className="border-2 border-green-700 bg-green-50 p-6 rounded-lg">
                      <Stack spacing="sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                          <Text className="font-bold text-gray-900">Do</Text>
                        </div>
                        <Text size="sm" className="text-gray-900">✓ Add aria-label to icon-only buttons</Text>
                        <Text size="sm" className="text-gray-900">✓ Pair icons with text when possible</Text>
                        <Text size="sm" className="text-gray-900">✓ Use semantic colors for status icons</Text>
                        <Text size="sm" className="text-gray-900">✓ Ensure 4.5:1 contrast ratio</Text>
                        <Text size="sm" className="text-gray-900">✓ Use aria-hidden for decorative icons</Text>
                      </Stack>
                    </div>

                    {/* Don't */}
                    <div className="border-2 border-red-700 bg-red-50 p-6 rounded-lg">
                      <Stack spacing="sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-white font-bold">
                            ✕
                          </div>
                          <Text className="font-bold text-gray-900">Don't</Text>
                        </div>
                        <Text size="sm" className="text-gray-900">✕ Use icons without labels or context</Text>
                        <Text size="sm" className="text-gray-900">✕ Use color alone to convey meaning</Text>
                        <Text size="sm" className="text-gray-900">✕ Mix icon libraries (stick to Lucide)</Text>
                        <Text size="sm" className="text-gray-900">✕ Use custom sizes (use the scale)</Text>
                        <Text size="sm" className="text-gray-900">✕ Forget hover/focus states on buttons</Text>
                      </Stack>
                    </div>
                  </Grid>
                </Stack>
              </Card>

              {/* Real Examples */}
              <Card className="p-8">
                <Stack spacing="lg">
                  <Heading level="title">Real-World Examples</Heading>
                  <Text>
                    See icons in action with proper accessibility.
                  </Text>
                  
                  <Stack spacing="lg">
                    {/* Buttons with icons */}
                    <div>
                      <Text className="font-semibold mb-3">Buttons with Icons</Text>
                      <div className="flex flex-wrap gap-3">
                        <button 
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          aria-label="Save changes"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </button>
                        
                        <button 
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          aria-label="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                        
                        <button 
                          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                          aria-label="Download file"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>

                    {/* Icon-only buttons */}
                    <div>
                      <Text className="font-semibold mb-3">Icon-Only Buttons (with aria-label)</Text>
                      <div className="flex gap-2">
                        <button 
                          className="p-2 hover:bg-gray-100 rounded"
                          aria-label="Search"
                        >
                          <Search className="w-5 h-5" />
                        </button>
                        <button 
                          className="p-2 hover:bg-gray-100 rounded"
                          aria-label="Settings"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                        <button 
                          className="p-2 hover:bg-gray-100 rounded"
                          aria-label="Notifications"
                        >
                          <Bell className="w-5 h-5" />
                        </button>
                        <button 
                          className="p-2 hover:bg-gray-100 rounded"
                          aria-label="User profile"
                        >
                          <User className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Status messages */}
                    <div>
                      <Text className="font-semibold mb-3">Status Messages</Text>
                      <Stack spacing="sm">
                        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <Text size="sm" className="text-green-900">Your changes have been saved successfully.</Text>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <Text size="sm" className="text-red-900">Unable to save changes. Please try again.</Text>
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <Text size="sm" className="text-yellow-900">This action cannot be undone.</Text>
                        </div>
                      </Stack>
                    </div>
                  </Stack>
                </Stack>
              </Card>

            </Stack>
          </Section>
        </Container>
      </div>
    </>
  )
}
