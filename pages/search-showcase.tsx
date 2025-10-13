import React from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  Grid,
  Flex,
  Heading,
  Text,
  SearchBar,
  AdvancedSearch,
  SearchResults,
  GlobalSearch,
  useSearch,
  useIsMobile,
  useIsTablet,
  useIsTouch,
  Button,
  type SearchSuggestion,
  type SearchResult,
  type SearchFilter
} from '@/components/design-system'

export default function SearchShowcasePage() {
  const [globalSearchOpen, setGlobalSearchOpen] = React.useState(false)
  const [recentSearches, setRecentSearches] = React.useState([
    'Honda Civic oil change',
    'Upcoming maintenance',
    'Service history 2024'
  ])

  // Sample data
  const sampleSuggestions: SearchSuggestion[] = [
    {
      id: '1',
      label: 'Honda Civic 2022',
      category: 'Vehicle',
      metadata: 'VIN: 1HGBH41JXMN109186',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    {
      id: '2',
      label: 'Oil Change Service',
      category: 'Service',
      metadata: 'Last performed: 2 months ago',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: '3',
      label: 'Tire Rotation',
      category: 'Maintenance',
      metadata: 'Due in 500 miles',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    }
  ]

  const sampleResults: SearchResult[] = [
    {
      id: '1',
      title: 'Honda Civic 2022',
      description: 'Sedan • 12,450 miles • Last serviced: Jan 15, 2024',
      category: 'Vehicles',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      metadata: [
        { label: 'VIN', value: '1HGBH41JXMN109186' },
        { label: 'Status', value: 'Active' }
      ]
    },
    {
      id: '2',
      title: 'Toyota Camry 2021',
      description: 'Sedan • 28,900 miles • Last serviced: Dec 20, 2023',
      category: 'Vehicles',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      metadata: [
        { label: 'VIN', value: 'JTNBB456' },
        { label: 'Status', value: 'Maintenance Due' }
      ]
    },
    {
      id: '3',
      title: 'Oil Change - Honda Civic',
      description: 'Synthetic oil replacement at 12,450 miles',
      category: 'Services',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      ),
      metadata: [
        { label: 'Date', value: 'Jan 15, 2024' },
        { label: 'Cost', value: '$45.00' }
      ]
    },
    {
      id: '4',
      title: 'Brake Inspection - Toyota Camry',
      description: 'Annual brake system inspection completed',
      category: 'Maintenance',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      metadata: [
        { label: 'Date', value: 'Dec 20, 2023' },
        { label: 'Cost', value: '$80.00' }
      ]
    }
  ]

  const searchFilters: SearchFilter[] = [
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Vehicles', value: 'vehicles' },
        { label: 'Services', value: 'services' },
        { label: 'Maintenance', value: 'maintenance' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Due Soon', value: 'due_soon' },
        { label: 'Overdue', value: 'overdue' }
      ]
    },
    {
      id: 'year',
      label: 'Year',
      type: 'text'
    }
  ]

  // Mock search function for GlobalSearch
  const handleGlobalSearch = async (query: string): Promise<SearchResult[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Filter results based on query
    return sampleResults.filter(result =>
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.description?.toLowerCase().includes(query.toLowerCase())
    )
  }

  const handleClearRecent = () => {
    setRecentSearches([])
  }

  return (
    <>
      <Head>
        <title>Search System - MotoMind Design System</title>
        <meta name="description" content="Search components for vehicle and service lookup" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        <Container size="lg" useCase="data_tables" override={{
          reason: "Search showcase requires horizontal space for examples",
          approvedBy: "Design System"
        }}>
          <Section spacing="xl">
            <Stack spacing="2xl">
              
              {/* Page Title */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-black mb-4">Search System</h1>
                <Text className="text-lg text-black/60">
                  Mobile-first search with autocomplete, filters, and keyboard navigation
                </Text>
                <Text className="text-sm text-black/40 mt-2">
                  Touch-optimized • iOS compliant • WCAG AAA • World-class UX
                </Text>
              </div>

              {/* Quick Demo - Global Search */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-8">
                <Stack spacing="lg">
                  <div className="text-center">
                    <Heading level="title">Try Global Search</Heading>
                    <Text className="text-black/60 mt-2">
                      Command Palette style search for your entire application
                    </Text>
                  </div>
                  
                  <div className="max-w-2xl mx-auto w-full">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setGlobalSearchOpen(true)}
                      className="w-full justify-between bg-white"
                    >
                      <Flex align="center" gap="sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-black/40">Search vehicles, services, maintenance...</span>
                      </Flex>
                      <div className="flex items-center gap-1">
                        <kbd className="px-2 py-1 text-xs bg-slate-100 rounded">⌘</kbd>
                        <kbd className="px-2 py-1 text-xs bg-slate-100 rounded">K</kbd>
                      </div>
                    </Button>
                  </div>
                </Stack>
              </div>

              {/* 1. SearchBar */}
              <Stack spacing="lg">
                <div>
                  <Heading level="title">1. Search Bar with Autocomplete</Heading>
                  <Text className="text-black/60">Basic search input with suggestion dropdown</Text>
                </div>

                <div className="bg-white rounded-xl border border-black/10 p-6">
                  <Grid columns={2} gap="lg">
                    {/* Default */}
                    <Stack spacing="md">
                      <Text className="text-sm font-semibold text-black">Default</Text>
                      <SearchBar
                        placeholder="Search vehicles..."
                        suggestions={sampleSuggestions}
                      />
                    </Stack>

                    {/* Large */}
                    <Stack spacing="md">
                      <Text className="text-sm font-semibold text-black">Large Size</Text>
                      <SearchBar
                        placeholder="Search anything..."
                        size="lg"
                        suggestions={sampleSuggestions}
                      />
                    </Stack>

                    {/* Loading */}
                    <Stack spacing="md">
                      <Text className="text-sm font-semibold text-black">Loading State</Text>
                      <SearchBar
                        placeholder="Searching..."
                        loading
                      />
                    </Stack>

                    {/* Without Icon */}
                    <Stack spacing="md">
                      <Text className="text-sm font-semibold text-black">No Icon</Text>
                      <SearchBar
                        placeholder="Simple search"
                        showIcon={false}
                      />
                    </Stack>
                  </Grid>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <Text className="text-sm text-blue-900">
                    ✓ Features: Autocomplete dropdown, loading state, clear button, multiple sizes, keyboard navigation
                  </Text>
                </div>
              </Stack>

              {/* 2. Mobile-First Responsive Features */}
              <Stack spacing="lg">
                <div>
                  <Heading level="title">2. Mobile-First & Responsive 📱</Heading>
                  <Text className="text-black/60">Auto-responsive with touch-optimized targets</Text>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-6">
                  <Stack spacing="lg">
                    <div>
                      <Heading level="subtitle">Responsive Hooks Demo</Heading>
                      <Text className="text-sm text-black/60 mt-2">
                        Real-time detection of device type and capabilities
                      </Text>
                    </div>

                    <ResponsiveDemo />

                    <div className="bg-white rounded-lg border border-purple-200 p-5">
                      <Stack spacing="md">
                        <Text className="text-sm font-semibold text-purple-900">
                          🎯 Mobile-First Features
                        </Text>
                        <Grid columns={2} gap="md">
                          <Stack spacing="xs">
                            <Text className="text-sm font-medium text-black">Auto-Sizing</Text>
                            <Text className="text-xs text-black/60">
                              Inputs grow to 48px on mobile (Apple HIG compliant)
                            </Text>
                          </Stack>
                          <Stack spacing="xs">
                            <Text className="text-sm font-medium text-black">Touch Targets</Text>
                            <Text className="text-xs text-black/60">
                              Minimum 48x48px for easy tapping
                            </Text>
                          </Stack>
                          <Stack spacing="xs">
                            <Text className="text-sm font-medium text-black">iOS Zoom Fix</Text>
                            <Text className="text-xs text-black/60">
                              16px minimum prevents Safari zoom
                            </Text>
                          </Stack>
                          <Stack spacing="xs">
                            <Text className="text-sm font-medium text-black">Smart Dropdown</Text>
                            <Text className="text-xs text-black/60">
                              60vh height on mobile for more results
                            </Text>
                          </Stack>
                        </Grid>
                      </Stack>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <Text className="text-xs font-semibold text-black mb-3">📱 Mobile (under 768px)</Text>
                        <Stack spacing="sm">
                          <SearchBar placeholder="Larger on mobile..." size="md" />
                          <Text className="text-xs text-black/50">
                            Auto-upgraded to 48px height
                          </Text>
                        </Stack>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <Text className="text-xs font-semibold text-black mb-3">💻 Desktop (768px and up)</Text>
                        <Stack spacing="sm">
                          <SearchBar placeholder="Standard on desktop..." size="md" />
                          <Text className="text-xs text-black/50">
                            Standard 40px height
                          </Text>
                        </Stack>
                      </div>
                    </div>
                  </Stack>
                </div>

                <div className="bg-indigo-50 rounded-lg p-4">
                  <Text className="text-sm text-indigo-900">
                    ✓ Features: Responsive hooks (useIsMobile, useIsTablet, useIsTouch), auto-sizing, touch targets (48px+), iOS zoom prevention, mobile-optimized dropdowns
                  </Text>
                </div>
              </Stack>

              {/* 3. Advanced Search */}
              <Stack spacing="lg">
                <div>
                  <Heading level="title">3. Advanced Search with Filters</Heading>
                  <Text className="text-black/60">Search with expandable filter options</Text>
                </div>

                <div className="bg-white rounded-xl border border-black/10 p-6">
                  <AdvancedSearch
                    filters={searchFilters}
                    defaultExpanded={false}
                    onSubmit={() => console.log('Search submitted')}
                    onReset={() => console.log('Filters reset')}
                  />
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <Text className="text-sm text-green-900">
                    ✓ Features: Expandable filters, active filter count, form submission, reset functionality, responsive grid
                  </Text>
                </div>
              </Stack>

              {/* 4. Search Results */}
              <Stack spacing="lg">
                <div>
                  <Heading level="title">4. Search Results Display</Heading>
                  <Text className="text-black/60">Result cards with highlighting and categorization</Text>
                </div>

                <Grid columns={2} gap="lg">
                  {/* Ungrouped */}
                  <Stack spacing="md">
                    <Text className="text-sm font-semibold text-black">Ungrouped Results</Text>
                    <div className="bg-white rounded-xl border border-black/10 p-6">
                      <SearchResults
                        results={sampleResults}
                        query="honda"
                        onResultClick={(result) => console.log('Clicked:', result)}
                      />
                    </div>
                  </Stack>

                  {/* Grouped by Category */}
                  <Stack spacing="md">
                    <Text className="text-sm font-semibold text-black">Grouped by Category</Text>
                    <div className="bg-white rounded-xl border border-black/10 p-6">
                      <SearchResults
                        results={sampleResults}
                        query="service"
                        groupByCategory
                        onResultClick={(result) => console.log('Clicked:', result)}
                      />
                    </div>
                  </Stack>
                </Grid>

                <div className="bg-purple-50 rounded-lg p-4">
                  <Text className="text-sm text-purple-900">
                    ✓ Features: Query highlighting, category grouping, metadata display, icons, clickable results, empty states
                  </Text>
                </div>
              </Stack>

              {/* 5. useSearch Hook */}
              <Stack spacing="lg">
                <div>
                  <Heading level="title">5. useSearch Hook</Heading>
                  <Text className="text-black/60">React hook for managing search state with debouncing</Text>
                </div>

                <div className="bg-white rounded-xl border border-black/10 p-6">
                  <UseSearchDemo />
                </div>

                <div className="bg-amber-50 rounded-lg p-4">
                  <Text className="text-sm text-amber-900">
                    ✓ Features: Automatic debouncing, loading state, minimum query length, TypeScript support
                  </Text>
                </div>
              </Stack>

              {/* Usage Examples */}
              <Stack spacing="lg">
                <Heading level="title">Usage Examples</Heading>

                <Grid columns={1} gap="lg">
                  {/* Example 1: Vehicle Search */}
                  <div className="bg-slate-100 rounded-lg p-6">
                    <Stack spacing="sm">
                      <Text className="font-semibold text-black">Vehicle Search</Text>
                      <pre className="text-xs bg-black text-green-400 p-4 rounded overflow-x-auto">
{`import { SearchBar } from '@/components/design-system'

<SearchBar
  placeholder="Search by VIN, make, or model..."
  suggestions={vehicleSuggestions}
  onSuggestionSelect={(vehicle) => {
    router.push(\`/vehicles/\${vehicle.value}\`)
  }}
/>`}
                      </pre>
                    </Stack>
                  </div>

                  {/* Example 2: Global Search */}
                  <div className="bg-slate-100 rounded-lg p-6">
                    <Stack spacing="sm">
                      <Text className="font-semibold text-black">Global Search Modal</Text>
                      <pre className="text-xs bg-black text-green-400 p-4 rounded overflow-x-auto">
{`import { GlobalSearch } from '@/components/design-system'

<GlobalSearch
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSearch={async (query) => {
    const res = await fetch(\`/api/search?q=\${query}\`)
    return res.json()
  }}
  onResultClick={(result) => router.push(result.url)}
  showRecent
  recentSearches={recentSearches}
/>`}
                      </pre>
                    </Stack>
                  </div>
                </Grid>
              </Stack>

            </Stack>
          </Section>
        </Container>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        onSearch={handleGlobalSearch}
        showRecent
        recentSearches={recentSearches}
        onClearRecent={handleClearRecent}
      />
    </>
  )
}

// Demo component for responsive hooks
function ResponsiveDemo() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isTouch = useIsTouch()

  return (
    <div className="grid grid-cols-3 gap-4 p-5 bg-white rounded-lg border border-purple-200">
      <div className="text-center">
        <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${isMobile ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <Text className="text-xs font-semibold text-black">Mobile</Text>
        <Text className="text-xs text-black/50">{isMobile ? '✓ Active' : '○ Inactive'}</Text>
      </div>
      <div className="text-center">
        <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${isTablet ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <Text className="text-xs font-semibold text-black">Tablet</Text>
        <Text className="text-xs text-black/50">{isTablet ? '✓ Active' : '○ Inactive'}</Text>
      </div>
      <div className="text-center">
        <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${isTouch ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        </div>
        <Text className="text-xs font-semibold text-black">Touch</Text>
        <Text className="text-xs text-black/50">{isTouch ? '✓ Active' : '○ Inactive'}</Text>
      </div>
    </div>
  )
}

// Demo component for useSearch hook
function UseSearchDemo() {
  const { query, setQuery, debouncedQuery, isSearching } = useSearch({
    debounce: 500,
    minLength: 2
  })

  return (
    <Stack spacing="md">
      <SearchBar
        placeholder="Type to see debouncing in action..."
        value={query}
        onChange={setQuery}
        loading={isSearching}
      />
      
      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
        <div>
          <Text className="text-xs text-black/50 mb-1">Query</Text>
          <Text className="text-sm font-mono">{query || '(empty)'}</Text>
        </div>
        <div>
          <Text className="text-xs text-black/50 mb-1">Debounced</Text>
          <Text className="text-sm font-mono">{debouncedQuery || '(empty)'}</Text>
        </div>
        <div>
          <Text className="text-xs text-black/50 mb-1">Status</Text>
          <Text className="text-sm font-mono">{isSearching ? 'Searching...' : 'Idle'}</Text>
        </div>
      </div>
      
      <Text className="text-xs text-black/50">
        The debounced query updates 500ms after you stop typing. Try it!
      </Text>
    </Stack>
  )
}
