/**
 * Section Headers Showcase
 */

import React, { useState } from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  BaseCard,
  CardSectionHeader,
  PageSectionHeader,
  SectionHeaderWithAction,
  SectionHeaderWithBadge,
  SectionHeaderWithIcon,
  DividerSectionHeader,
  CompactSectionHeader,
  SectionHeaderWithTabs,
  SectionHeaderWithActions,
  SectionHeaderWithBack,
  SectionHeaderWithSearch
} from '@/components/design-system'
import { Rocket, Settings, Plus } from 'lucide-react'

export default function SectionHeaderShowcasePage() {
  const [activeTab, setActiveTab] = useState('all')
  const [searchValue, setSearchValue] = useState('')
  return (
    <>
      <Head>
        <title>Section Headers - MotoMind Design System</title>
        <meta name="description" content="Section header components" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="2xl">
              
              {/* Page Title */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-black mb-4">Section Headers</h1>
                <p className="text-lg text-black/60">11 complete variants</p>
              </div>

              {/* 1. Card Section Header */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">1. Card Section Header</h2>
                <p className="text-sm text-black/60">For card sections (specs page line 304)</p>
                
                <BaseCard padding="none">
                  <CardSectionHeader 
                    title="Engine Performance"
                    onEdit={() => alert('Edit clicked')}
                  />
                  <div className="px-8 py-6">
                    <p className="text-sm text-black/60">Card content goes here...</p>
                  </div>
                </BaseCard>

                <BaseCard padding="none">
                  <CardSectionHeader 
                    title="Maintenance Intervals"
                    subtitle="Multiple perspectives on service intervals"
                  />
                  <div className="px-8 py-6">
                    <p className="text-sm text-black/60">Card content goes here...</p>
                  </div>
                </BaseCard>
              </Stack>

              {/* 2. Page Section Header */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">2. Page Section Header</h2>
                <p className="text-sm text-black/60">For page sections (title + description)</p>
                
                <Stack spacing="lg">
                  <PageSectionHeader 
                    title="Recent Activity"
                    description="View your latest vehicle events and updates"
                  />
                  <div className="p-6 bg-white rounded-2xl border border-black/5">
                    <p className="text-sm text-black/60">Section content goes here...</p>
                  </div>
                </Stack>

                <Stack spacing="lg">
                  <PageSectionHeader 
                    title="Your Vehicles"
                  />
                  <div className="p-6 bg-white rounded-2xl border border-black/5">
                    <p className="text-sm text-black/60">Section content goes here...</p>
                  </div>
                </Stack>
              </Stack>

              {/* 3. Section Header With Action */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">3. Section Header With Action</h2>
                <p className="text-sm text-black/60">Title + action button</p>
                
                <Stack spacing="lg">
                  <SectionHeaderWithAction
                    title="Maintenance Schedule"
                    description="Upcoming service appointments"
                    actionLabel="Add Event"
                    onAction={() => alert('Add clicked')}
                  />
                  <div className="p-6 bg-white rounded-2xl border border-black/5">
                    <p className="text-sm text-black/60">Section content goes here...</p>
                  </div>
                </Stack>
              </Stack>

              {/* 4. Section Header With Badge */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">4. Section Header With Badge</h2>
                <p className="text-sm text-black/60">Title + badge pill</p>
                
                <Stack spacing="lg">
                  <SectionHeaderWithBadge
                    title="AI-Enhanced Features"
                    description="Powered by artificial intelligence"
                    badge="Beta"
                    badgeColor="blue"
                  />
                  <div className="p-6 bg-white rounded-2xl border border-black/5">
                    <p className="text-sm text-black/60">Section content goes here...</p>
                  </div>
                </Stack>
              </Stack>

              {/* 5. Section Header With Icon */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">5. Section Header With Icon</h2>
                <p className="text-sm text-black/60">Icon + title + description</p>
                
                <Stack spacing="lg">
                  <SectionHeaderWithIcon
                    title="Quick Start Guide"
                    description="Get up and running in minutes"
                    icon={<Rocket className="w-6 h-6" />}
                    iconColor="blue"
                  />
                  <div className="p-6 bg-white rounded-2xl border border-black/5">
                    <p className="text-sm text-black/60">Section content goes here...</p>
                  </div>
                </Stack>

                <Stack spacing="lg">
                  <SectionHeaderWithIcon
                    title="Settings"
                    description="Configure your preferences"
                    icon={<Settings className="w-6 h-6" />}
                    iconColor="green"
                  />
                  <div className="p-6 bg-white rounded-2xl border border-black/5">
                    <p className="text-sm text-black/60">Section content goes here...</p>
                  </div>
                </Stack>
              </Stack>

              {/* 6. Divider Section Header */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">6. Divider Section Header</h2>
                <p className="text-sm text-black/60">Centered with lines</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="lg">
                    <p className="text-sm text-black/60">Content before divider...</p>
                    <DividerSectionHeader title="Section Break" />
                    <p className="text-sm text-black/60">Content after divider...</p>
                  </Stack>
                </BaseCard>
              </Stack>

              {/* 7. Compact Section Header */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">7. Compact Section Header</h2>
                <p className="text-sm text-black/60">Small, with optional link</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="md">
                    <CompactSectionHeader
                      title="Recent Activity"
                      actionLabel="View all"
                      onAction={() => alert('View all')}
                    />
                    <p className="text-sm text-black/60">Activity items go here...</p>
                  </Stack>
                </BaseCard>
              </Stack>

              {/* 8. Section Header With Tabs */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">8. Section Header With Tabs</h2>
                <p className="text-sm text-black/60">Title + tab navigation</p>
                
                <Stack spacing="lg">
                  <SectionHeaderWithTabs
                    title="Vehicle History"
                    description="Track all events and maintenance"
                    tabs={[
                      { label: 'All', active: activeTab === 'all', onClick: () => setActiveTab('all') },
                      { label: 'Maintenance', active: activeTab === 'maintenance', onClick: () => setActiveTab('maintenance') },
                      { label: 'Fuel', active: activeTab === 'fuel', onClick: () => setActiveTab('fuel') },
                      { label: 'Repairs', active: activeTab === 'repairs', onClick: () => setActiveTab('repairs') }
                    ]}
                  />
                  <div className="p-6 bg-white rounded-2xl border border-black/5">
                    <p className="text-sm text-black/60">Showing: <strong>{activeTab}</strong></p>
                  </div>
                </Stack>
              </Stack>

              {/* 9. Section Header With Actions */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">9. Section Header With Actions</h2>
                <p className="text-sm text-black/60">Title + multiple action buttons</p>
                
                <Stack spacing="lg">
                  <SectionHeaderWithActions
                    title="Maintenance Schedule"
                    description="Upcoming service appointments"
                    actions={
                      <>
                        <button className="px-4 py-2 text-sm border border-black/5 rounded-lg text-black font-medium hover:bg-slate-50 transition-colors">
                          Filter
                        </button>
                        <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
                          <Plus className="w-4 h-4 inline mr-2" />
                          Add Event
                        </button>
                      </>
                    }
                  />
                  <div className="p-6 bg-white rounded-2xl border border-black/5">
                    <p className="text-sm text-black/60">Section content goes here...</p>
                  </div>
                </Stack>
              </Stack>

              {/* 10. Section Header With Back */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">10. Section Header With Back</h2>
                <p className="text-sm text-black/60">Back button + title</p>
                
                <Stack spacing="lg">
                  <SectionHeaderWithBack
                    title="Vehicle Details"
                    description="2023 Honda Civic"
                    onBack={() => alert('Back clicked')}
                  />
                  <div className="p-6 bg-white rounded-2xl border border-black/5">
                    <p className="text-sm text-black/60">Section content goes here...</p>
                  </div>
                </Stack>
              </Stack>

              {/* 11. Section Header With Search */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">11. Section Header With Search</h2>
                <p className="text-sm text-black/60">Title + search input</p>
                
                <Stack spacing="lg">
                  <SectionHeaderWithSearch
                    title="All Vehicles"
                    description="Search and filter your vehicles"
                    searchPlaceholder="Search vehicles..."
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                  />
                  <div className="p-6 bg-white rounded-2xl border border-black/5">
                    <p className="text-sm text-black/60">
                      {searchValue ? `Searching for: ${searchValue}` : 'No search query'}
                    </p>
                  </div>
                </Stack>
              </Stack>

            </Stack>
          </Section>
        </Container>
      </div>
    </>
  )
}
