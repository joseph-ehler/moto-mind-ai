/**
 * Action Bars Showcase
 */

import React, { useState } from 'react'
import Head from 'next/head'
import {
  Container,
  Section,
  Stack,
  BaseCard,
  PageActionBar,
  ModalActionBar,
  BulkActionBar,
  FloatingActionBar,
  WizardActionBar,
  ToolbarActionBar,
  CommandBar,
  ContextualActionBar,
  BottomSheetActionBar
} from '@/components/design-system'
import { 
  Plus, 
  Download, 
  Trash2, 
  Bold, 
  Italic, 
  Underline, 
  Link,
  Copy,
  Share2
} from 'lucide-react'

export default function ActionBarsShowcasePage() {
  const [selectedCount, setSelectedCount] = useState(3)
  const [wizardStep, setWizardStep] = useState(2)
  const [commandValue, setCommandValue] = useState('')
  const [boldActive, setBoldActive] = useState(false)
  const [showContextual, setShowContextual] = useState(false)
  const [contextualPosition, setContextualPosition] = useState({ top: 300, left: 400 })

  return (
    <>
      <Head>
        <title>Action Bars - MotoMind Design System</title>
        <meta name="description" content="Action bar components" />
      </Head>

      <div className="min-h-screen bg-slate-50">
        <Container size="md" useCase="articles">
          <Section spacing="xl">
            <Stack spacing="2xl">
              
              {/* Page Title */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-black mb-4">Action Bars</h1>
                <p className="text-lg text-black/60">9 complete action bar patterns</p>
              </div>

              {/* 1. Page Action Bar */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">1. Page Action Bar</h2>
                <p className="text-sm text-black/60">Top-level page actions with back button</p>
                
                <BaseCard padding="none" className="overflow-hidden">
                  <PageActionBar
                    title="Edit Vehicle"
                    description="2023 Honda Civic"
                    onBack={() => alert('Back clicked')}
                    primaryAction={{
                      label: 'Save Changes',
                      onClick: () => alert('Save clicked'),
                      disabled: false
                    }}
                    secondaryAction={{
                      label: 'Cancel',
                      onClick: () => alert('Cancel clicked')
                    }}
                  />
                  <div className="px-8 py-6">
                    <p className="text-sm text-black/60">Page content goes here...</p>
                  </div>
                </BaseCard>

                <BaseCard padding="none" className="overflow-hidden">
                  <PageActionBar
                    title="Add New Vehicle"
                    primaryAction={{
                      label: 'Save',
                      onClick: () => alert('Save clicked'),
                      loading: false
                    }}
                    sticky
                  />
                  <div className="px-8 py-6">
                    <p className="text-sm text-black/60">Sticky action bar (try scrolling)</p>
                  </div>
                </BaseCard>
              </Stack>

              {/* 2. Modal Action Bar */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">2. Modal Action Bar</h2>
                <p className="text-sm text-black/60">For modal/sheet footers</p>
                
                <BaseCard padding="none" className="overflow-hidden">
                  <div className="px-8 py-6">
                    <p className="text-sm text-black/60">Modal content goes here...</p>
                  </div>
                  <ModalActionBar
                    primaryAction={{
                      label: 'Confirm',
                      onClick: () => alert('Confirmed')
                    }}
                    secondaryAction={{
                      label: 'Cancel',
                      onClick: () => alert('Cancelled')
                    }}
                  />
                </BaseCard>

                <BaseCard padding="none" className="overflow-hidden">
                  <div className="px-8 py-6">
                    <p className="text-sm text-black/60">Danger variant for destructive actions</p>
                  </div>
                  <ModalActionBar
                    primaryAction={{
                      label: 'Delete Vehicle',
                      onClick: () => alert('Deleted'),
                      loading: false
                    }}
                    secondaryAction={{
                      label: 'Cancel',
                      onClick: () => alert('Cancelled')
                    }}
                    variant="danger"
                  />
                </BaseCard>
              </Stack>

              {/* 3. Bulk Action Bar */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">3. Bulk Action Bar</h2>
                <p className="text-sm text-black/60">For multi-select operations</p>
                
                <div className="relative">
                  <BaseCard padding="lg">
                    <p className="text-sm text-black/60 mb-4">
                      Select multiple items to see bulk actions
                    </p>
                    <button
                      onClick={() => setSelectedCount(selectedCount > 0 ? 0 : 3)}
                      className="px-4 py-2 text-sm font-medium border border-black/10 text-black bg-white rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      {selectedCount > 0 ? 'Deselect All' : 'Select 3 Items'}
                    </button>
                  </BaseCard>
                  
                  {selectedCount > 0 && (
                    <BulkActionBar
                      selectedCount={selectedCount}
                      onClear={() => setSelectedCount(0)}
                      actions={[
                        {
                          label: 'Export',
                          onClick: () => alert('Export clicked'),
                          icon: <Download className="w-4 h-4" />
                        },
                        {
                          label: 'Delete',
                          onClick: () => alert('Delete clicked'),
                          variant: 'danger',
                          icon: <Trash2 className="w-4 h-4" />
                        }
                      ]}
                    />
                  )}
                </div>
              </Stack>

              {/* 4. Floating Action Bar */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">4. Floating Action Bar</h2>
                <p className="text-sm text-black/60">Floating primary action button</p>
                
                <BaseCard padding="lg">
                  <Stack spacing="md">
                    <p className="text-sm text-black/60">
                      Floating button appears in bottom-right corner
                    </p>
                    <p className="text-xs text-black/40">
                      (Scroll down to see it in action on this page)
                    </p>
                  </Stack>
                </BaseCard>
              </Stack>

              {/* 5. Wizard Action Bar */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">5. Wizard Action Bar</h2>
                <p className="text-sm text-black/60">Multi-step flow navigation with progress</p>
                
                <BaseCard padding="none" className="overflow-hidden">
                  <div className="px-8 py-6">
                    <p className="text-sm text-black/60">Step {wizardStep} content goes here...</p>
                  </div>
                  <WizardActionBar
                    currentStep={wizardStep}
                    totalSteps={4}
                    onPrevious={() => setWizardStep(Math.max(1, wizardStep - 1))}
                    onNext={() => setWizardStep(Math.min(4, wizardStep + 1))}
                    onSkip={() => alert('Skipped')}
                    showProgress
                  />
                </BaseCard>
              </Stack>

              {/* 6. Toolbar Action Bar */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">6. Toolbar Action Bar</h2>
                <p className="text-sm text-black/60">Rich editing tools with active states</p>
                
                <BaseCard padding="none" className="overflow-hidden">
                  <ToolbarActionBar
                    tools={[
                      { icon: <Bold className="w-5 h-5" />, label: 'Bold', onClick: () => setBoldActive(!boldActive), active: boldActive },
                      { icon: <Italic className="w-5 h-5" />, label: 'Italic', onClick: () => alert('Italic') },
                      { icon: <Underline className="w-5 h-5" />, label: 'Underline', onClick: () => alert('Underline') },
                      { icon: <Link className="w-5 h-5" />, label: 'Insert Link', onClick: () => alert('Link') }
                    ]}
                  />
                  <div className="px-8 py-6">
                    <p className="text-sm text-black/60">Editor content goes here...</p>
                  </div>
                </BaseCard>
              </Stack>

              {/* 7. Command Bar */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">7. Command Bar</h2>
                <p className="text-sm text-black/60">Keyboard-first command input</p>
                
                <BaseCard padding="none" className="overflow-hidden">
                  <CommandBar
                    placeholder="Search or type a command..."
                    value={commandValue}
                    onChange={setCommandValue}
                    onSubmit={() => alert(`Search: ${commandValue}`)}
                    shortcuts={[
                      { label: 'Search', keys: '⌘K' },
                      { label: 'New', keys: '⌘N' }
                    ]}
                  />
                  <div className="px-8 py-6">
                    <p className="text-sm text-black/60">
                      {commandValue ? `Searching for: ${commandValue}` : 'Type to search...'}
                    </p>
                  </div>
                </BaseCard>
              </Stack>

              {/* 8. Contextual Action Bar */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">8. Contextual Action Bar</h2>
                <p className="text-sm text-black/60">Appears on content selection</p>
                
                <BaseCard padding="lg">
                  <div className="relative">
                    <p className="text-sm text-black/60 mb-4">
                      Click the button to show contextual actions
                    </p>
                    <button
                      onClick={() => setShowContextual(!showContextual)}
                      className="px-4 py-2 text-sm font-medium border border-black/10 text-black bg-white rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      {showContextual ? 'Hide' : 'Show'} Contextual Actions
                    </button>
                  </div>
                </BaseCard>
                
                <ContextualActionBar
                  visible={showContextual}
                  position={contextualPosition}
                  actions={[
                    { icon: <Copy className="w-4 h-4" />, label: 'Copy', onClick: () => alert('Copied') },
                    { icon: <Share2 className="w-4 h-4" />, label: 'Share', onClick: () => alert('Shared') }
                  ]}
                />
              </Stack>

              {/* 9. Bottom Sheet Action Bar */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">9. Bottom Sheet Action Bar</h2>
                <p className="text-sm text-black/60">Mobile-optimized sheet header</p>
                
                <BaseCard padding="none" className="overflow-hidden">
                  <BottomSheetActionBar
                    title="Filter Options"
                    onClose={() => alert('Closed')}
                    primaryAction={{
                      label: 'Apply Filters',
                      onClick: () => alert('Applied')
                    }}
                    showHandle
                  />
                  <div className="px-6 py-6">
                    <p className="text-sm text-black/60">Sheet content goes here...</p>
                  </div>
                </BaseCard>
              </Stack>

              {/* Usage Guidelines */}
              <Stack spacing="lg">
                <h2 className="text-2xl font-semibold text-black">Usage Guidelines</h2>
                
                <Stack spacing="md">
                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">When to Use</p>
                      <p className="text-sm text-black/60">
                        • <strong>Page Action Bar:</strong> Edit pages, forms, detail views
                        <br />
                        • <strong>Modal Action Bar:</strong> Dialogs, sheets, confirmations
                        <br />
                        • <strong>Bulk Action Bar:</strong> Tables, lists with multi-select
                        <br />
                        • <strong>Floating Action Bar:</strong> Primary page action (Add, Create)
                        <br />
                        • <strong>Wizard Action Bar:</strong> Multi-step forms, onboarding
                        <br />
                        • <strong>Toolbar Action Bar:</strong> Text editors, drawing tools
                        <br />
                        • <strong>Command Bar:</strong> Power users, quick search/navigation
                        <br />
                        • <strong>Contextual Action Bar:</strong> Text/content selection
                        <br />
                        • <strong>Bottom Sheet Action Bar:</strong> Mobile sheets, filters
                      </p>
                    </Stack>
                  </BaseCard>

                  <BaseCard padding="md">
                    <Stack spacing="sm">
                      <p className="font-semibold text-black">Accessibility</p>
                      <p className="text-sm text-black/60">
                        ✅ Focus rings on all interactive elements
                        <br />
                        ✅ Proper ARIA labels
                        <br />
                        ✅ Disabled states clearly visible
                        <br />
                        ✅ Loading states with feedback
                      </p>
                    </Stack>
                  </BaseCard>
                </Stack>
              </Stack>

              {/* Add padding for floating button */}
              <div className="h-32" />

            </Stack>
          </Section>
        </Container>
      </div>

      {/* Floating Action Bar Example */}
      <FloatingActionBar
        primaryAction={{
          label: 'Add Vehicle',
          onClick: () => alert('Add Vehicle clicked'),
          icon: <Plus className="w-5 h-5" />
        }}
        position="bottom-right"
      />
    </>
  )
}
