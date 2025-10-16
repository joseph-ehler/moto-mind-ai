import React from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  Flex,
  BaseCard,
  Modal,
  Drawer,
  Popover,
  Tooltip,
  FormModal,
  ConfirmationModal,
  AlertModal
} from '@/components/design-system'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'
type ModalVariant = 'default' | 'centered' | 'fullscreen'
type DrawerPosition = 'left' | 'right' | 'top' | 'bottom'
type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'
type DrawerVariant = 'default' | 'form' | 'detail' | 'media' | 'data'
type PopoverPosition = 'top' | 'bottom' | 'left' | 'right'
type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export default function OverlaysShowcasePage() {
  // Modal states
  const [showModal, setShowModal] = React.useState(false)
  const [modalSize, setModalSize] = React.useState<ModalSize>('md')
  const [modalVariant, setModalVariant] = React.useState<ModalVariant>('default')
  
  // Drawer states
  const [showDrawer, setShowDrawer] = React.useState(false)
  const [drawerPosition, setDrawerPosition] = React.useState<DrawerPosition>('right')
  const [drawerSize, setDrawerSize] = React.useState<DrawerSize>('md')
  const [drawerVariant, setDrawerVariant] = React.useState<DrawerVariant>('default')
  const [drawerStickyHeader, setDrawerStickyHeader] = React.useState(true)
  const [drawerStickyFooter, setDrawerStickyFooter] = React.useState(true)
  
  // Specialized modals
  const [showFormModal, setShowFormModal] = React.useState(false)
  const [showConfirmation, setShowConfirmation] = React.useState(false)
  const [confirmationVariant, setConfirmationVariant] = React.useState<'default' | 'danger'>('default')
  const [showAlert, setShowAlert] = React.useState(false)
  const [alertVariant, setAlertVariant] = React.useState<AlertVariant>('info')
  
  // Popover & Tooltip
  const [showPopover, setShowPopover] = React.useState(false)
  const [popoverPosition, setPopoverPosition] = React.useState<PopoverPosition>('bottom')
  
  const [isLoading, setIsLoading] = React.useState(false)
  const [formError, setFormError] = React.useState('')

  const handleConfirm = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setShowConfirmationDialog(false)
      alert('Confirmed!')
    }, 1500)
  }

  return (
    <>
      <Head>
        <title>Overlays - MotoMind Design System</title>
        <meta name="description" content="Modals, Drawers, Popovers, and Tooltips" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        <Container size="lg" useCase="data_tables" override={{
          reason: "Showcase needs wider layout for side-by-side examples",
          approvedBy: "Design System"
        }}>
          <Section spacing="xl">
            <Stack spacing="2xl">
              
              {/* Page Title */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-black mb-4">Overlay System</h1>
                <p className="text-lg text-black/60">Modals, Slideovers, Popovers & Tooltips</p>
              </div>

              {/* 1. Dialog */}
              <Stack spacing="lg">
                <div>
                  <h2 className="text-2xl font-semibold text-black mb-2">1. Dialog ⭐</h2>
                  <p className="text-sm text-black/60">Center overlay for focused content</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <BaseCard padding="lg">
                    <Stack spacing="md">
                      <h4 className="font-semibold text-black">Default Dialog</h4>
                      <p className="text-sm text-black/60">Standard centered dialog</p>
                      <button
                        onClick={() => setShowDialog(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Open Dialog
                      </button>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="lg">
                    <Stack spacing="md">
                      <h4 className="font-semibold text-black">Form Dialog</h4>
                      <p className="text-sm text-black/60">With form helpers</p>
                      <button
                        onClick={() => setShowFormDialog(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Open Form
                      </button>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="lg">
                    <Stack spacing="md">
                      <h4 className="font-semibold text-black">Fullscreen Dialog</h4>
                      <p className="text-sm text-black/60">Entire viewport</p>
                      <button
                        onClick={() => setShowFullscreenDialog(true)}
                        className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Open Fullscreen
                      </button>
                    </Stack>
                  </BaseCard>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-black mb-3">✨ Features:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-black/70">
                    <div>✅ <strong>Focus trapping</strong> - Keyboard accessible</div>
                    <div>✅ <strong>ESC to close</strong> - Keyboard shortcut</div>
                    <div>✅ <strong>Body scroll lock</strong> - No background scroll</div>
                    <div>✅ <strong>Backdrop blur</strong> - Modern aesthetic</div>
                    <div>✅ <strong>5 sizes</strong> - sm, md, lg, xl, full</div>
                    <div>✅ <strong>Smooth animations</strong> - Fade + scale</div>
                  </div>
                </div>
              </Stack>

              {/* 2. Slideover */}
              <Stack spacing="lg">
                <div>
                  <h2 className="text-2xl font-semibold text-black mb-2">2. Slideover ⭐</h2>
                  <p className="text-sm text-black/60">Side panel for details and forms</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <BaseCard padding="lg">
                    <Stack spacing="md">
                      <h4 className="font-semibold text-black">Position Options</h4>
                      <Flex gap="sm" className="flex-wrap">
                        {(['right', 'left', 'top', 'bottom'] as const).map(pos => (
                          <button
                            key={pos}
                            onClick={() => {
                              setDrawerPosition(pos)
                              setShowDrawer(true)
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm transition-colors capitalize"
                          >
                            {pos}
                          </button>
                        ))}
                      </Flex>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="lg">
                    <Stack spacing="md">
                      <h4 className="font-semibold text-black">NEW: Wide Content ⭐</h4>
                      <Flex gap="sm" className="flex-wrap">
                        <button
                          onClick={() => setShowDataDrawer(true)}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                        >
                          Data Table (xl)
                        </button>
                        <button
                          onClick={() => setShowMediaDrawer(true)}
                          className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors"
                        >
                          Media Gallery (full)
                        </button>
                      </Flex>
                    </Stack>
                  </BaseCard>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-black mb-3">✨ Enhanced Features:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-black/70">
                    <div>✅ <strong>5 sizes</strong> - sm, md, lg, xl, full ⭐</div>
                    <div>✅ <strong>5 variants</strong> - form, detail, media, data ⭐</div>
                    <div>✅ <strong>Sticky header/footer</strong> - Always visible ⭐</div>
                    <div>✅ <strong>Optional footer</strong> - Sticky actions</div>
                    <div>✅ <strong>Auto scroll</strong> - Long content supported</div>
                    <div>✅ <strong>ESC to close</strong> - Keyboard friendly</div>
                  </div>
                </div>
              </Stack>

              {/* 3. Popover */}
              <Stack spacing="lg">
                <div>
                  <h2 className="text-2xl font-semibold text-black mb-2">3. Popover ⭐</h2>
                  <p className="text-sm text-black/60">Contextual content on click</p>
                </div>
                
                <BaseCard padding="lg">
                  <Stack spacing="md">
                    <h4 className="font-semibold text-black">Position Examples</h4>
                    <Flex gap="lg" align="center" className="flex-wrap">
                      <Popover
                        isOpen={showPopover}
                        onClose={() => setShowPopover(false)}
                        trigger={
                          <button
                            onClick={() => setShowPopover(!showPopover)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                          >
                            Toggle Popover
                          </button>
                        }
                        position="bottom"
                        align="start"
                      >
                        <Stack spacing="sm">
                          <h4 className="font-semibold text-sm">Vehicle Actions</h4>
                          <div className="space-y-1">
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded transition-colors">
                              View Details
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded transition-colors">
                              Edit Vehicle
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 rounded transition-colors">
                              Log Maintenance
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors">
                              Remove
                            </button>
                          </div>
                        </Stack>
                      </Popover>

                      <span className="text-sm text-black/60">← Click to see menu</span>
                    </Flex>
                  </Stack>
                </BaseCard>

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-black mb-3">✨ Features:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-black/70">
                    <div>✅ <strong>Smart positioning</strong> - 4 positions</div>
                    <div>✅ <strong>Alignment</strong> - start, center, end</div>
                    <div>✅ <strong>Click outside</strong> - Auto-close</div>
                    <div>✅ <strong>ESC to close</strong> - Keyboard friendly</div>
                    <div>✅ <strong>Custom content</strong> - Any React node</div>
                    <div>✅ <strong>Compact design</strong> - Minimal footprint</div>
                  </div>
                </div>
              </Stack>

              {/* 4. Tooltip */}
              <Stack spacing="lg">
                <div>
                  <h2 className="text-2xl font-semibold text-black mb-2">4. Tooltip ⭐</h2>
                  <p className="text-sm text-black/60">Hover hints and helper text</p>
                </div>
                
                <BaseCard padding="lg">
                  <Stack spacing="md">
                    <h4 className="font-semibold text-black">Position Examples</h4>
                    <Flex gap="lg" align="center" className="flex-wrap">
                      <Tooltip content="Top tooltip" position="top">
                        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                          Hover (Top)
                        </button>
                      </Tooltip>

                      <Tooltip content="Bottom tooltip" position="bottom">
                        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                          Hover (Bottom)
                        </button>
                      </Tooltip>

                      <Tooltip content="Left tooltip" position="left">
                        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                          Hover (Left)
                        </button>
                      </Tooltip>

                      <Tooltip content="Right tooltip" position="right">
                        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                          Hover (Right)
                        </button>
                      </Tooltip>
                    </Flex>

                    <div className="text-sm text-black/60">
                      Tooltips also work with keyboard focus (tab to buttons above)
                    </div>
                  </Stack>
                </BaseCard>

                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-black mb-3">✨ Features:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-black/70">
                    <div>✅ <strong>Hover activated</strong> - Mouseover shows</div>
                    <div>✅ <strong>Keyboard focus</strong> - Accessible</div>
                    <div>✅ <strong>Delay option</strong> - Prevent accidental triggers</div>
                    <div>✅ <strong>Arrow pointer</strong> - Points to target</div>
                    <div>✅ <strong>Dark theme</strong> - High contrast</div>
                    <div>✅ <strong>4 positions</strong> - Smart placement</div>
                  </div>
                </div>
              </Stack>

              {/* 5. Alert & Confirmation Dialogs */}
              <Stack spacing="lg">
                <div>
                  <h2 className="text-2xl font-semibold text-black mb-2">5. Alert & Confirmation ⭐</h2>
                  <p className="text-sm text-black/60">System alerts and confirmations</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <BaseCard padding="lg">
                    <Stack spacing="md">
                      <h4 className="font-semibold text-black">Alert Dialog</h4>
                      <p className="text-sm text-black/60">System notifications</p>
                      <button
                        onClick={() => setShowAlertDialog(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Show Alert
                      </button>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="lg">
                    <Stack spacing="md">
                      <h4 className="font-semibold text-black">Confirmation</h4>
                      <p className="text-sm text-black/60">User confirmations</p>
                      <button
                        onClick={() => setShowConfirmationDialog(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Confirm Action
                      </button>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="lg">
                    <Stack spacing="md">
                      <h4 className="font-semibold text-black">Use Cases</h4>
                      <div className="text-sm text-black/60 space-y-1">
                        <div>• Success messages</div>
                        <div>• Delete confirmations</div>
                        <div>• Error alerts</div>
                        <div>• Warning dialogs</div>
                      </div>
                    </Stack>
                  </BaseCard>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-black mb-3">✨ Features:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-black/70">
                    <div>✅ <strong>Two variants</strong> - default, danger</div>
                    <div>✅ <strong>Loading states</strong> - Async actions</div>
                    <div>✅ <strong>Auto-sized</strong> - Always compact</div>
                    <div>✅ <strong>Prevents close</strong> - While loading</div>
                    <div>✅ <strong>Clear actions</strong> - Cancel vs Confirm</div>
                    <div>✅ <strong>ESC support</strong> - Quick cancel</div>
                  </div>
                </div>
              </Stack>

              {/* Usage Guidelines */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">Usage Guidelines</h2>
                
                <Stack spacing="md">
                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">When to Use Each Overlay</p>
                      <p className="text-sm text-black/60">
                        • <strong>Modal Dialog:</strong> Focus attention, forms, important info (vehicle add form)
                        <br />
                        • <strong>Slideover:</strong> Secondary content, quick edits, filters (vehicle details panel)
                        <br />
                        • <strong>Popover:</strong> Contextual menus, actions, quick info (action menus)
                        <br />
                        • <strong>Tooltip:</strong> Helper text, hints, definitions (icon explanations)
                        <br />
                        • <strong>Confirm Dialog:</strong> Destructive actions, important decisions (delete vehicle)
                      </p>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">Best Practices</p>
                      <p className="text-sm text-black/60">
                        ✅ Use modals sparingly - they interrupt user flow
                        <br />
                        ✅ Prefer slideovers for secondary content
                        <br />
                        ✅ Keep overlay content focused and actionable
                        <br />
                        ✅ Always provide a way to close (X button + ESC)
                        <br />
                        ✅ Use confirmation dialogs for destructive actions
                        <br />
                        ✅ Tooltips should be concise (1-2 sentences max)
                        <br />
                        ✅ Test keyboard navigation and accessibility
                      </p>
                    </Stack>
                  </BaseCard>
                </Stack>
              </Stack>

            </Stack>
          </Section>
        </Container>
      </div>

      {/* Actual Overlays */}
      <Modal
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        title="Add New Vehicle"
        description="Enter vehicle details to add to your fleet"
        size="md"
        footer={
          <Flex justify="end" gap="sm">
            <button
              onClick={() => setShowDialog(false)}
              className="px-4 py-2 border border-black/10 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert('Vehicle added!')
                setShowDialog(false)
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Add Vehicle
            </button>
          </Flex>
        }
      >
        <Stack spacing="md">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Vehicle Make</label>
            <input
              type="text"
              placeholder="Honda, Toyota, Ford..."
              className="w-full px-3 py-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Model</label>
            <input
              type="text"
              placeholder="Civic, Camry, F-150..."
              className="w-full px-3 py-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Year</label>
            <input
              type="number"
              placeholder="2023"
              className="w-full px-3 py-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </Stack>
      </Modal>

      <Modal
        isOpen={showFullscreenDialog}
        onClose={() => setShowFullscreenDialog(false)}
        title="Vehicle Details"
        description="Full maintenance history and specifications"
        variant="fullscreen"
        footer={
          <Flex justify="end" gap="sm">
            <button
              onClick={() => setShowFullscreenDialog(false)}
              className="px-4 py-2 border border-black/10 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </Flex>
        }
      >
        <div className="p-6">
          <Stack spacing="lg">
            <div>
              <h3 className="text-xl font-semibold text-black mb-2">2022 Honda Civic</h3>
              <p className="text-black/60">VIN: JH2PE1234567890</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Specifications</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-black/50">Engine:</span> 2.0L I4</div>
                  <div><span className="text-black/50">Transmission:</span> CVT</div>
                  <div><span className="text-black/50">Mileage:</span> 12,450 miles</div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Recent Activity</h4>
                <div className="space-y-2 text-sm">
                  <div>Oil change - 2 days ago</div>
                  <div>Tire rotation - 1 week ago</div>
                  <div>Inspection passed - 2 weeks ago</div>
                </div>
              </div>
            </div>
          </Stack>
        </div>
      </Modal>

      <Drawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        position={drawerPosition}
        title="Vehicle Details"
        description="Honda Civic 2022"
        size="md"
        footer={
          <Flex justify="end" gap="sm">
            <button
              onClick={() => setShowDrawer(false)}
              className="px-4 py-2 border border-black/10 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => alert('Saved!')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Save Changes
            </button>
          </Flex>
        }
      >
        <Stack spacing="md">
          <div>
            <h4 className="font-semibold text-black mb-2">Quick Info</h4>
            <div className="space-y-2 text-sm">
              <div><strong>VIN:</strong> JH2PE1234567890</div>
              <div><strong>Mileage:</strong> 12,450 miles</div>
              <div><strong>Status:</strong> Active</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-black mb-2">Upcoming</h4>
            <div className="space-y-2 text-sm">
              <div>• Oil change due in 550 miles</div>
              <div>• Tire rotation due in 2,000 miles</div>
              <div>• Inspection due in 90 days</div>
            </div>
          </div>
        </Stack>
      </Drawer>

      {/* Data Drawer - Wide table view */}
      <Drawer
        isOpen={showDataDrawer}
        onClose={() => setShowDataDrawer(false)}
        position="right"
        size="xl"
        variant="data"
        title="Service History"
        description="Complete maintenance records"
        stickyHeader={true}
        stickyFooter={true}
        footer={
          <Flex justify="between">
            <span className="text-sm text-black/60">12 total records</span>
            <Flex gap="sm">
              <button
                onClick={() => setShowDataDrawer(false)}
                className="px-4 py-2 border border-black/10 rounded-lg hover:bg-slate-50 transition-colors text-sm"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm">
                Export CSV
              </button>
            </Flex>
          </Flex>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Date</th>
                <th className="px-3 py-2 text-left font-semibold">Service Type</th>
                <th className="px-3 py-2 text-left font-semibold">Mileage</th>
                <th className="px-3 py-2 text-right font-semibold">Cost</th>
                <th className="px-3 py-2 text-left font-semibold">Provider</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {[...Array(15)].map((_, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-3 py-2">2024-0{(i % 9) + 1}-15</td>
                  <td className="px-3 py-2">Oil Change</td>
                  <td className="px-3 py-2">{12000 + i * 500} mi</td>
                  <td className="px-3 py-2 text-right">${45 + i * 5}.00</td>
                  <td className="px-3 py-2">MotoMind Auto</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      Complete
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Drawer>

      {/* Media Drawer - Full width gallery */}
      <Drawer
        isOpen={showMediaDrawer}
        onClose={() => setShowMediaDrawer(false)}
        position="bottom"
        size="full"
        variant="media"
        title="Vehicle Photo Gallery"
        description="All uploaded images"
        stickyHeader={true}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 p-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center text-slate-500 hover:scale-105 transition-transform cursor-pointer"
            >
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          ))}
        </div>
      </Drawer>

      <FormModal
        isOpen={showFormDialog}
        onClose={() => setShowFormDialog(false)}
        onSubmit={(e) => {
          e.preventDefault()
          alert('Form submitted!')
          setShowFormDialog(false)
        }}
        title="Add Vehicle"
        description="Enter vehicle information"
        submitLabel="Add Vehicle"
        isLoading={isLoading}
        error={formError}
      >
        <Stack spacing="md">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Make</label>
            <input
              type="text"
              placeholder="Honda"
              className="w-full px-3 py-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Model</label>
            <input
              type="text"
              placeholder="Civic"
              className="w-full px-3 py-2 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </Stack>
      </FormModal>

      <AlertModal
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        title="Success!"
        description="Your vehicle has been added successfully."
        variant="success"
      />

      <ConfirmationModal
        isOpen={showConfirmationDialog}
        onClose={() => setShowConfirmationDialog(false)}
        onConfirm={handleConfirm}
        title="Confirm Action"
        description="Are you sure you want to proceed with this action?"
        confirmLabel="Yes, Proceed"
        cancelLabel="Cancel"
        variant="default"
        isLoading={isLoading}
      />
    </>
  )
}
