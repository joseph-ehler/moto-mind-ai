import React from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  BaseCard,
  DataTable,
  SimpleList,
  Timeline,
  type Column,
  type ListItem,
  type TimelineItem
} from '@/components/design-system'

// Sample vehicle data
interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
  status: 'active' | 'maintenance' | 'idle'
  mileage: number
  driver: string
  lastService: Date
}

const sampleVehicles: Vehicle[] = [
  { id: '1', make: 'Honda', model: 'Civic', year: 2022, vin: 'JH2PE1234', status: 'active', mileage: 12450, driver: 'John Smith', lastService: new Date('2024-01-15') },
  { id: '2', make: 'Toyota', model: 'Camry', year: 2021, vin: 'JTNBB456', status: 'maintenance', mileage: 28900, driver: 'Sarah Johnson', lastService: new Date('2023-12-20') },
  { id: '3', make: 'Ford', model: 'F-150', year: 2023, vin: 'F1FTEX789', status: 'active', mileage: 8200, driver: 'Mike Davis', lastService: new Date('2024-02-01') },
  { id: '4', make: 'Chevrolet', model: 'Silverado', year: 2020, vin: 'CK1500ABC', status: 'idle', mileage: 45600, driver: 'Unassigned', lastService: new Date('2023-11-10') },
  { id: '5', make: 'Tesla', model: 'Model 3', year: 2023, vin: 'TESLA3DEF', status: 'active', mileage: 5100, driver: 'Emma Wilson', lastService: new Date('2024-02-10') },
]

export default function DataDisplayShowcasePage() {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [selectedVehicles, setSelectedVehicles] = React.useState<Vehicle[]>([])

  // Define table columns
  const vehicleColumns: Column<Vehicle>[] = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      accessor: (row) => `${row.make} ${row.model}`,
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-black/50">{row.year}</div>
        </div>
      )
    },
    {
      key: 'vin',
      header: 'VIN',
      accessor: (row) => row.vin,
      sortable: true,
      filterable: true,
      width: '150px'
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => row.status,
      sortable: true,
      align: 'center',
      render: (value) => {
        const colors = {
          active: 'bg-green-100 text-green-700',
          maintenance: 'bg-yellow-100 text-yellow-700',
          idle: 'bg-slate-100 text-slate-700'
        }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[value as keyof typeof colors]}`}>
            {value}
          </span>
        )
      }
    },
    {
      key: 'mileage',
      header: 'Mileage',
      accessor: (row) => row.mileage,
      sortable: true,
      align: 'right',
      render: (value) => `${value.toLocaleString()} mi`
    },
    {
      key: 'driver',
      header: 'Driver',
      accessor: (row) => row.driver,
      sortable: true,
      filterable: true
    },
    {
      key: 'lastService',
      header: 'Last Service',
      accessor: (row) => row.lastService,
      sortable: true,
      render: (value: Date) => value.toLocaleDateString()
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: () => '',
      align: 'center',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            alert(`Edit ${row.make} ${row.model}`)
          }}
          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90"
        >
          Edit
        </button>
      )
    }
  ]

  // Sample list items
  const maintenanceItems: ListItem[] = [
    {
      id: '1',
      title: 'Oil Change - Honda Civic',
      description: 'Scheduled maintenance at 12,500 miles. Synthetic oil replacement recommended.',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      badge: 'Overdue',
      meta: <span className="text-xs text-black/50">Due: Feb 1, 2024</span>,
      actions: (
        <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90">
          Schedule
        </button>
      )
    },
    {
      id: '2',
      title: 'Tire Rotation - Toyota Camry',
      description: 'Rotate tires to ensure even wear. Current: 28,900 miles.',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
      badge: 'Upcoming',
      meta: <span className="text-xs text-black/50">Due: Mar 15, 2024</span>
    },
    {
      id: '3',
      title: 'Brake Inspection - Ford F-150',
      description: 'Annual brake system inspection and fluid check.',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      meta: <span className="text-xs text-black/50">Due: Apr 1, 2024</span>
    },
  ]

  // Fleet Management Timeline (Compact, Dense)
  const fleetTimeline: TimelineItem[] = [
    {
      id: '1',
      title: 'Oil Change - Honda Civic #1234',
      primaryMetric: '$45',
      description: 'Synthetic oil replacement at Joe\'s Auto Shop',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      variant: 'success',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      metadata: [
        { label: 'Cost', value: '$45.00' },
        { label: 'Mileage', value: '12,450 mi' },
        { label: 'Service Center', value: 'Joe\'s Auto Shop' },
        { label: 'Technician', value: 'Mike Johnson' },
        { label: 'Oil Type', value: '5W-30 Synthetic' },
        { label: 'Filter', value: 'OEM #12345' }
      ],
      ocrData: {
        source: 'receipt',
        confidence: 0.98,
        documentUrl: 'https://example.com/receipt.pdf',
        canEdit: true
      },
      expandable: true
    },
    {
      id: '2',
      title: 'Tire Rotation - Toyota Camry #5678',
      primaryMetric: '$25',
      description: 'Regular tire maintenance performed',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      variant: 'success',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
      metadata: [
        { label: 'Cost', value: '$25.00' },
        { label: 'Mileage', value: '28,900 mi' },
        { label: 'Service Center', value: 'Quick Tire & Lube' }
      ],
      ocrData: {
        source: 'invoice',
        confidence: 0.92,
        documentUrl: 'https://example.com/invoice.pdf',
        canEdit: true
      },
      expandable: true
    },
    {
      id: '3',
      title: 'Low Fuel Alert - Ford F-150 #9012',
      primaryMetric: '18%',
      description: 'Fuel level below 20% threshold',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      variant: 'warning',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      metadata: [
        { label: 'Current Level', value: '18%' },
        { label: 'Last Fill-up', value: '5 days ago' },
        { label: 'Est. Range', value: '45 miles' }
      ],
      expandable: true
    },
    {
      id: '4',
      title: 'Brake Inspection - Tesla Model 3 #3456',
      primaryMetric: '8,200 mi',
      description: 'Routine brake system inspection completed',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      variant: 'success',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      metadata: [
        { label: 'Status', value: 'Passed' },
        { label: 'Pad Life', value: '60% remaining' },
        { label: 'Cost', value: '$0.00 (warranty)' }
      ],
      expandable: true
    }
  ]

  // Personal Use Timeline (Comfortable, OCR-heavy)
  const personalTimeline: TimelineItem[] = [
    {
      id: '1',
      title: 'Oil Change Completed',
      primaryMetric: '$45.00',
      description: 'Your Honda Civic got a fresh oil change at Joe\'s Auto Shop. Everything looks great!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      variant: 'success',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      metadata: [
        { label: 'Cost', value: '$45.00' },
        { label: 'Mileage', value: '12,450 miles' },
        { label: 'Service Center', value: 'Joe\'s Auto Shop' },
        { label: 'Next service', value: '15,000 miles' }
      ],
      ocrData: {
        source: 'receipt',
        confidence: 0.98,
        documentUrl: 'https://example.com/receipt.pdf',
        canEdit: true
      },
      expandable: true,
      details: (
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-900 mb-2">✨ <strong>Pro Tip:</strong> Synthetic oil lasts longer and protects better in extreme temperatures.</p>
          <p className="text-xs text-green-700">Your next oil change is due in 2,550 miles or 3 months.</p>
        </div>
      ),
      actions: (
        <button className="text-sm text-primary hover:underline">
          Schedule Next Service →
        </button>
      )
    },
    {
      id: '2',
      title: 'Document Needs Review',
      primaryMetric: '75%',
      description: 'We scanned your tire rotation invoice but need you to verify some details.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      variant: 'warning',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      metadata: [
        { label: 'Scanned from', value: 'Tire rotation invoice' },
        { label: 'OCR Confidence', value: '75%' }
      ],
      ocrData: {
        source: 'receipt',
        confidence: 0.75,
        documentUrl: 'https://example.com/receipt2.pdf',
        needsReview: true,
        canEdit: true
      },
      expandable: true,
      actions: (
        <button className="px-3 py-1.5 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors">
          Review Now
        </button>
      )
    },
    {
      id: '3',
      title: 'Brake Service Complete',
      primaryMetric: '$320',
      description: 'Brake pads replaced and rotors resurfaced. Your car stops safely now!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
      variant: 'success',
      icon: <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      metadata: [
        { label: 'Cost', value: '$320.00' },
        { label: 'Parts', value: 'Pads + Rotors' },
        { label: 'Warranty', value: '1 year / 12,000 mi' }
      ],
      ocrData: {
        source: 'invoice',
        confidence: 0.96,
        documentUrl: 'https://example.com/invoice3.pdf',
        canEdit: false
      },
      expandable: true
    }
  ]

  return (
    <>
      <Head>
        <title>Data Display - MotoMind Design System</title>
        <meta name="description" content="Tables, Lists, and Timeline components" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        <Container size="lg" useCase="data_tables" override={{
          reason: "Data tables require horizontal space for multiple columns",
          approvedBy: "Design System"
        }}>
          <Section spacing="xl">
            <Stack spacing="2xl">
              
              {/* Page Title */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-black mb-4">Data Display System</h1>
                <p className="text-lg text-black/60">Advanced tables, lists, and timelines for fleet management</p>
              </div>

              {/* 1. Data Table */}
              <Stack spacing="lg">
                <div>
                  <h2 className="text-2xl font-semibold text-black mb-2">1. Data Table ⭐ NEW FEATURES</h2>
                  <p className="text-sm text-black/60">Production-ready table with export, bulk actions, mobile view & column toggle</p>
                </div>
                
                <BaseCard padding="lg">
                  <Stack spacing="md">
                    <DataTable
                      columns={vehicleColumns}
                      data={sampleVehicles}
                      keyExtractor={(row) => row.id}
                      sortable={true}
                      filterable={true}
                      selectable={true}
                      hoverable={true}
                      striped={true}
                      onRowClick={(row) => alert(`Clicked: ${row.make} ${row.model}`)}
                      onSelectionChange={setSelectedVehicles}
                      pagination={{
                        pageSize: 10,
                        currentPage,
                        onPageChange: setCurrentPage
                      }}
                      // NEW: Export feature
                      exportable={true}
                      exportFileName="vehicles-export.csv"
                      // NEW: Bulk actions
                      bulkActions={[
                        {
                          label: 'Schedule Maintenance',
                          onClick: (selected) => alert(`Scheduling ${selected.length} vehicles`),
                          icon: (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )
                        },
                        {
                          label: 'Delete',
                          onClick: (selected) => confirm(`Delete ${selected.length} vehicles?`) && alert('Deleted'),
                          variant: 'danger',
                          icon: (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )
                        }
                      ]}
                      // NEW: Mobile responsive
                      mobileView="auto"
                      // NEW: Column visibility toggle
                      columnToggle={true}
                    />
                  </Stack>
                </BaseCard>

                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-black mb-3">✨ All Features:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-black/70">
                    <div>✅ Sortable columns</div>
                    <div>✅ Inline filters</div>
                    <div>✅ Row selection</div>
                    <div>✅ Custom rendering</div>
                    <div>✅ Pagination</div>
                    <div>🆕 CSV Export</div>
                    <div>🆕 Bulk actions toolbar</div>
                    <div>🆕 Mobile card view</div>
                    <div>🆕 Column toggle</div>
                    <div>✅ Loading states</div>
                    <div>✅ Empty states</div>
                    <div>✅ Click handlers</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">🎯 Try the New Features:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li><strong>CSV Export:</strong> Click "Export CSV" button in top-right to download all data</li>
                    <li><strong>Bulk Actions:</strong> Select multiple rows to see the action toolbar appear</li>
                    <li><strong>Mobile View:</strong> Resize your browser below 768px to see card layout</li>
                    <li><strong>Column Toggle:</strong> Click "Columns" button to show/hide columns</li>
                  </ul>
                </div>
              </Stack>

              {/* 2. Simple List */}
              <Stack spacing="lg">
                <div>
                  <h2 className="text-2xl font-semibold text-black mb-2">2. Simple List ⭐</h2>
                  <p className="text-sm text-black/60">Clean list component for quick data display</p>
                </div>
                
                <BaseCard padding="lg">
                  <Stack spacing="md">
                    <SimpleList
                      items={maintenanceItems}
                      onItemClick={(item) => alert(`Clicked: ${item.title}`)}
                      hoverable={true}
                      divided={true}
                    />
                  </Stack>
                </BaseCard>

                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-black mb-3">✨ Features:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-black/70">
                    <div>✅ Icons & avatars</div>
                    <div>✅ Badges</div>
                    <div>✅ Metadata</div>
                    <div>✅ Inline actions</div>
                    <div>✅ Hover states</div>
                    <div>✅ Custom content</div>
                  </div>
                </div>
              </Stack>

              {/* 3. Timeline - Fleet Management (Compact) */}
              <Stack spacing="lg">
                <div>
                  <h2 className="text-2xl font-semibold text-black mb-2">3a. Timeline - Fleet Management ⭐</h2>
                  <p className="text-sm text-black/60">Compact, dense view for managing 100+ vehicles</p>
                </div>
                
                <BaseCard padding="lg">
                  <Timeline
                    items={fleetTimeline}
                    showTime={true}
                    density="compact"
                    onItemClick={(item) => console.log('Clicked:', item)}
                    onItemExpand={(item, expanded) => console.log('Expanded:', item.id, expanded)}
                  />
                </BaseCard>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-black mb-3">✨ Fleet Features - Scannable by Default:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-black/70">
                    <div>✅ <strong>Clean collapsed view</strong> - Title + metric + time + dot</div>
                    <div>✅ <strong>Click to expand</strong> - All details behind caret</div>
                    <div>✅ <strong>Status dots</strong> - Green (verified), yellow (review)</div>
                    <div>✅ <strong>Primary metric</strong> - Most important value inline</div>
                    <div>✅ <strong>Hover state</strong> - Subtle background on hover</div>
                    <div>✅ <strong>Dense layout</strong> - Scan 10+ items quickly</div>
                  </div>
                  <div className="mt-3 p-3 bg-white/50 rounded text-xs text-black/60">
                    💡 <strong>Try it:</strong> Click any item to expand. Notice how all details (description, metadata, OCR actions) are hidden until you need them. Perfect for scanning large fleets!
                  </div>
                </div>
              </Stack>

              {/* 3. Timeline - Personal Use (Comfortable) */}
              <Stack spacing="lg">
                <div>
                  <h2 className="text-2xl font-semibold text-black mb-2">3b. Timeline - Personal Use ⭐</h2>
                  <p className="text-sm text-black/60">Spacious, friendly view for managing 1-3 vehicles</p>
                </div>
                
                <BaseCard padding="lg">
                  <Timeline
                    items={personalTimeline}
                    showTime={true}
                    density="comfortable"
                    onItemClick={(item) => console.log('Clicked:', item)}
                  />
                </BaseCard>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-black mb-3">✨ Personal Features - Friendly & Clear:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-black/70">
                    <div>✅ <strong>Comfortable spacing</strong> - Easy to read</div>
                    <div>✅ <strong>Primary metric inline</strong> - Cost/value at a glance</div>
                    <div>✅ <strong>Yellow dot = review</strong> - Clear visual indicator</div>
                    <div>✅ <strong>Expand for tips</strong> - Pro tips hidden until clicked</div>
                    <div>✅ <strong>OCR transparency</strong> - Confidence % in expanded view</div>
                    <div>✅ <strong>Friendly CTAs</strong> - "Review Now" button prominent</div>
                  </div>
                  <div className="mt-3 p-3 bg-white/50 rounded text-xs text-black/60">
                    💡 <strong>Try it:</strong> Click the 2nd item (yellow dot) to see the "Review needed" warning. Notice how the OCR confidence (75%) and "Review Now" button appear when expanded. Perfect for casual users!
                  </div>
                </div>
              </Stack>

              {/* Comparison */}
              <Stack spacing="lg">
                <div>
                  <h2 className="text-2xl font-semibold text-black mb-2">Timeline Density Comparison</h2>
                  <p className="text-sm text-black/60">Choose the right density for your use case</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">🎯 Design Philosophy: Collapsed by Default</h4>
                  <p className="text-sm text-blue-800">
                    All timelines now show <strong>only essential info when collapsed</strong>: Icon, Title, Primary Metric, Timestamp, and Status Dot.
                    Everything else (description, metadata, OCR details, actions) is hidden behind an expandable caret.
                    This reduces visual overload while keeping information accessible on-demand.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <h4 className="font-semibold text-black">Compact</h4>
                      <p className="text-xs text-black/60">Fleet management, 50+ vehicles</p>
                      <div className="text-xs space-y-1 text-black/70">
                        <div>• Icons: 8x8 (32px)</div>
                        <div>• Spacing: Tight (12px)</div>
                        <div>• Font: Small (14px)</div>
                        <div>• Target: Desktop power users</div>
                        <div>• Goal: Scan 10+ items quickly</div>
                      </div>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <h4 className="font-semibold text-black">Comfortable</h4>
                      <p className="text-xs text-black/60">Personal use, 1-5 vehicles</p>
                      <div className="text-xs space-y-1 text-black/70">
                        <div>• Icons: 10x10 (40px)</div>
                        <div>• Spacing: Medium (20px)</div>
                        <div>• Font: Base (16px)</div>
                        <div>• Target: Mobile & desktop</div>
                        <div>• Goal: Easy reading, friendly</div>
                      </div>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <h4 className="font-semibold text-black">Spacious</h4>
                      <p className="text-xs text-black/60">Marketing, showcase pages</p>
                      <div className="text-xs space-y-1 text-black/70">
                        <div>• Icons: 12x12 (48px)</div>
                        <div>• Spacing: Wide (24px)</div>
                        <div>• Font: Large (16px+)</div>
                        <div>• Target: Landing pages</div>
                        <div>• Goal: Visual impact</div>
                      </div>
                    </Stack>
                  </BaseCard>
                </div>
              </Stack>

              {/* Usage Guidelines */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">Usage Guidelines</h2>
                
                <Stack spacing="md">
                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">When to Use Each Component</p>
                      <p className="text-sm text-black/60">
                        • <strong>DataTable:</strong> Large datasets, need sorting/filtering/pagination (vehicle rosters, trip logs)
                        <br />
                        • <strong>SimpleList:</strong> Smaller lists, quick views, dashboard widgets (maintenance tasks, recent alerts)
                        <br />
                        • <strong>Timeline (Compact):</strong> Fleet management, high-density event logs (100+ vehicles)
                        <br />
                        • <strong>Timeline (Comfortable):</strong> Personal use, detailed maintenance history (1-5 vehicles)
                        <br />
                        • <strong>Timeline (Spacious):</strong> Marketing pages, showcases, onboarding tutorials
                      </p>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">OCR Data Best Practices</p>
                      <p className="text-sm text-black/60">
                        ✅ Show confidence scores &gt; 95% as "Verified"
                        <br />
                        ✅ Flag confidence &lt; 80% as "Review needed"
                        <br />
                        ✅ Always provide "View original" link to source document
                        <br />
                        ✅ Enable editing for incorrectly parsed data
                        <br />
                        ✅ Use visual badges (receipt/invoice) to show data source
                        <br />
                        ✅ Make review actions prominent with yellow CTA buttons
                      </p>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">General Best Practices</p>
                      <p className="text-sm text-black/60">
                        ✅ Use pagination for 20+ rows in tables
                        <br />
                        ✅ Enable sorting for numerical and date columns
                        <br />
                        ✅ Provide empty states with clear messages
                        <br />
                        ✅ Use status badges for quick visual scanning
                        <br />
                        ✅ Keep action buttons accessible but unobtrusive
                        <br />
                        ✅ Show loading states during data fetch
                        <br />
                        ✅ Use bulk actions for fleet management efficiency
                      </p>
                    </Stack>
                  </BaseCard>
                </Stack>
              </Stack>

            </Stack>
          </Section>
        </Container>
      </div>
    </>
  )
}
