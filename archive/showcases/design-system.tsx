import React, { useState } from 'react'
import Head from 'next/head'
import { StandardCard, StandardCardHeader, StandardCardContent } from '@/components/ui/StandardCard'
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader'
import { Stack } from '@/components/ui/Stack'
import { Button } from '@/components/ui/button'
import { BaseModal, ModalHeader, ModalContent, ModalFooter } from '@/components/modals/BaseModal'
import { SimpleFormModal } from '@/components/modals/SimpleFormModal'
import { BlockFormModal } from '@/components/modals/BlockFormModal'
import { FullWidthModal } from '@/components/modals/FullWidthModal'
import { StepperModal } from '@/components/modals/StepperModal'
import { AlertModal } from '@/components/modals/AlertModal'
import { Plus, Settings, Car, Fuel, Wrench, Activity, CheckCircle, AlertTriangle, Info, X, FileText, Upload, ChevronRight } from 'lucide-react'

export default function DesignSystemShowcase() {
  // Modal state management
  const [showBaseModal, setShowBaseModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showFullWidthModal, setShowFullWidthModal] = useState(false)
  const [showStepperModal, setShowStepperModal] = useState(false)
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [showIconModal, setShowIconModal] = useState(false)
  const [currentStep, setCurrentStep] = useState('step1')

  return (
    <>
      <Head>
        <title>Design System Components - MotoMind</title>
        <meta name="description" content="Showcase of standardized UI components" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          
          {/* Test PageHeader - Our Core Component */}
          <PageHeader 
            title="Design System Test"
            subtitle="Testing our actual standardized components for broken patterns"
            action={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Test Action
              </Button>
            }
          />

          <Stack spacing="lg">
            
            {/* Test 1: StandardCard Variants */}
            <StandardCard>
              <StandardCardHeader 
                title="StandardCard Test" 
                subtitle="Testing our actual card component"
              />
              <StandardCardContent>
                <Stack spacing="md">
                  
                  {/* Basic Card */}
                  <StandardCard>
                    <StandardCardContent>
                      <SectionHeader title="Basic Card Content" />
                      <p className="text-gray-600 text-sm mt-4">
                        This tests StandardCard with just content - no header.
                      </p>
                    </StandardCardContent>
                  </StandardCard>

                  {/* Card with Header and Action */}
                  <StandardCard>
                    <StandardCardHeader 
                      title="Card with Header" 
                      subtitle="Testing header with action"
                    >
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </StandardCardHeader>
                    <StandardCardContent>
                      <p className="text-gray-600 text-sm">
                        This tests StandardCardHeader with action button.
                      </p>
                    </StandardCardContent>
                  </StandardCard>

                  {/* Premium Variant */}
                  <StandardCard variant="premium">
                    <StandardCardHeader 
                      title="Premium Card Test" 
                      subtitle="Testing premium variant styling"
                    />
                    <StandardCardContent>
                      <p className="text-gray-600 text-sm">
                        This tests the premium variant with rounded-3xl borders.
                      </p>
                    </StandardCardContent>
                  </StandardCard>

                </Stack>
              </StandardCardContent>
            </StandardCard>

            {/* Test 2: SectionHeader Variants */}
            <StandardCard>
              <StandardCardHeader 
                title="SectionHeader Test" 
                subtitle="Testing our section header component"
              />
              <StandardCardContent>
                <Stack spacing="md">
                  
                  {/* Simple SectionHeader */}
                  <SectionHeader title="Simple Section Header" />
                  
                  {/* SectionHeader with Subtitle */}
                  <SectionHeader 
                    title="Section with Subtitle" 
                    subtitle="This section has additional context"
                  />
                  
                  {/* SectionHeader with Action */}
                  <SectionHeader 
                    title="Section with Action" 
                    action={
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        View All
                      </button>
                    }
                  />

                  {/* SectionHeader with Complex Action */}
                  <SectionHeader 
                    title="Section with Status Badge" 
                    action={
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/10 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </div>
                    }
                  />

                </Stack>
              </StandardCardContent>
            </StandardCard>

            {/* Test 3: Stack Component */}
            <StandardCard>
              <StandardCardHeader 
                title="Stack Component Test" 
                subtitle="Testing our spacing utility"
              />
              <StandardCardContent>
                <Stack spacing="md">
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <SectionHeader title="Stack Spacing Test" />
                    <Stack spacing="sm">
                      <div className="bg-blue-100 p-3 rounded text-sm">Stack Item 1</div>
                      <div className="bg-blue-100 p-3 rounded text-sm">Stack Item 2</div>
                      <div className="bg-blue-100 p-3 rounded text-sm">Stack Item 3</div>
                    </Stack>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <SectionHeader title="Large Stack Spacing" />
                    <Stack spacing="lg">
                      <div className="bg-green-100 p-3 rounded text-sm">Large Gap Item 1</div>
                      <div className="bg-green-100 p-3 rounded text-sm">Large Gap Item 2</div>
                    </Stack>
                  </div>

                </Stack>
              </StandardCardContent>
            </StandardCard>

            {/* Test 4: Real Implementation Examples */}
            <StandardCard>
              <StandardCardHeader 
                title="Real Implementation Test" 
                subtitle="Testing components as they're used in the app"
              />
              <StandardCardContent>
                <Stack spacing="md">
                  
                  {/* PhotosCard Pattern */}
                  <StandardCard variant="premium">
                    <SectionHeader title="Photos" />
                    <StandardCardContent>
                      <div className="flex gap-3 overflow-x-auto">
                        <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Plus className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-shrink-0 w-24 h-24 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Car className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-shrink-0 w-24 h-24 bg-green-100 rounded-lg flex items-center justify-center">
                          <Fuel className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </StandardCardContent>
                  </StandardCard>

                  {/* Vehicle Status Pattern */}
                  <StandardCard variant="premium">
                    <SectionHeader 
                      title="Vehicle Status"
                      action={
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/10 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          All Good
                        </div>
                      }
                    />
                    <StandardCardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Current Mileage</div>
                          <div className="text-2xl font-semibold text-gray-900">52,205 mi</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">Next Service</div>
                          <div className="text-2xl font-semibold text-gray-900">55,000 mi</div>
                        </div>
                      </div>
                    </StandardCardContent>
                  </StandardCard>

                  {/* Timeline Pattern */}
                  <StandardCard variant="premium">
                    <SectionHeader 
                      title="Vehicle Timeline"
                      action={
                        <div className="text-sm text-gray-500">
                          3 events
                        </div>
                      }
                    />
                    <StandardCardContent>
                      <Stack spacing="sm">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Activity className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Dashboard Snapshot</div>
                            <div className="text-xs text-gray-500">2 days ago</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Fuel className="w-5 h-5 text-green-600" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Fuel Fill-up</div>
                            <div className="text-xs text-gray-500">1 week ago</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Wrench className="w-5 h-5 text-orange-600" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">Service Record</div>
                            <div className="text-xs text-gray-500">2 weeks ago</div>
                          </div>
                        </div>
                      </Stack>
                    </StandardCardContent>
                  </StandardCard>

                </Stack>
              </StandardCardContent>
            </StandardCard>

            {/* Test 5: Modal System */}
            <StandardCard>
              <StandardCardHeader 
                title="Modal System Test" 
                subtitle="Testing our standardized modal components"
              />
              <StandardCardContent>
                <Stack spacing="md">
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                    
                    {/* BaseModal Test */}
                    <Button 
                      onClick={() => setShowBaseModal(true)}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <Settings className="w-5 h-5 mb-2" />
                      <span className="text-xs">BaseModal</span>
                    </Button>

                    {/* Simple Form Modal Test */}
                    <Button 
                      onClick={() => setShowFormModal(true)}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <Plus className="w-5 h-5 mb-2" />
                      <span className="text-xs">Simple Form</span>
                    </Button>

                    {/* Block Form Modal Test */}
                    <Button 
                      onClick={() => setShowBlockModal(true)}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <FileText className="w-5 h-5 mb-2" />
                      <span className="text-xs">Block Form</span>
                    </Button>

                    {/* Full Width Modal Test */}
                    <Button 
                      onClick={() => setShowFullWidthModal(true)}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <Upload className="w-5 h-5 mb-2" />
                      <span className="text-xs">Full Width</span>
                    </Button>

                    {/* Stepper Modal Test */}
                    <Button 
                      onClick={() => setShowStepperModal(true)}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <ChevronRight className="w-5 h-5 mb-2" />
                      <span className="text-xs">Stepper</span>
                    </Button>

                    {/* Alert Modal Test */}
                    <Button 
                      onClick={() => setShowAlertModal(true)}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <AlertTriangle className="w-5 h-5 mb-2" />
                      <span className="text-xs">Alert</span>
                    </Button>

                    {/* Icon Modal Test */}
                    <Button 
                      onClick={() => setShowIconModal(true)}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <Info className="w-5 h-5 mb-2" />
                      <span className="text-xs">With Icon</span>
                    </Button>

                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <SectionHeader title="Modal Features" />
                    <Stack spacing="sm">
                      <div className="text-sm text-gray-600">• Consistent backdrop blur and overlay</div>
                      <div className="text-sm text-gray-600">• Responsive sizing (sm, md, lg, xl, full)</div>
                      <div className="text-sm text-gray-600">• ESC key and overlay click to close</div>
                      <div className="text-sm text-gray-600">• Body scroll lock when open</div>
                      <div className="text-sm text-gray-600">• Smooth animations (fade + zoom)</div>
                      <div className="text-sm text-gray-600">• Standardized header, content, footer</div>
                    </Stack>
                  </div>

                </Stack>
              </StandardCardContent>
            </StandardCard>

            {/* Test 6: Component Status */}
            <StandardCard>
              <StandardCardHeader 
                title="Design System Status" 
                subtitle="Current implementation state"
              />
              <StandardCardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <SectionHeader title="✅ Working Components" />
                    <Stack spacing="sm">
                      <div className="text-sm text-gray-600">• StandardCard (standard + premium)</div>
                      <div className="text-sm text-gray-600">• StandardCardHeader & Content</div>
                      <div className="text-sm text-gray-600">• PageHeader & SectionHeader</div>
                      <div className="text-sm text-gray-600">• Stack (spacing utility)</div>
                      <div className="text-sm text-gray-600">• BaseModal & variants</div>
                      <div className="text-sm text-gray-600">• ModalHeader, Content, Footer</div>
                    </Stack>
                  </div>

                  <div>
                    <SectionHeader title="🔄 Implementation Progress" />
                    <Stack spacing="sm">
                      <div className="text-sm text-gray-600">• VehicleTimeline.tsx ✅</div>
                      <div className="text-sm text-gray-600">• PhotosCard.tsx ✅</div>
                      <div className="text-sm text-gray-600">• vehicles/dynamic-demo.tsx ✅</div>
                      <div className="text-sm text-gray-600">• Modal system ✅</div>
                      <div className="text-sm text-gray-600">• SmartCard headers 🔄</div>
                      <div className="text-sm text-gray-600">• 15+ more components 📝</div>
                    </Stack>
                  </div>

                </div>
              </StandardCardContent>
            </StandardCard>

          </Stack>

        </div>
      </div>

      {/* Modal Examples */}
      
      {/* BaseModal Example */}
      <BaseModal
        isOpen={showBaseModal}
        onClose={() => setShowBaseModal(false)}
        title="BaseModal Example"
        description="This is our foundation modal component"
        size="md"
      >
        <ModalHeader
          title="BaseModal Example"
          description="This demonstrates our standardized modal header"
          onClose={() => setShowBaseModal(false)}
        />
        <ModalContent>
          <Stack spacing="md">
            <p className="text-gray-600">
              This is the BaseModal component that provides consistent styling, animations, and behavior across all modals.
            </p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <SectionHeader title="Features" />
              <Stack spacing="sm">
                <div className="text-sm text-gray-600">• Backdrop blur overlay</div>
                <div className="text-sm text-gray-600">• ESC key support</div>
                <div className="text-sm text-gray-600">• Click outside to close</div>
                <div className="text-sm text-gray-600">• Body scroll lock</div>
                <div className="text-sm text-gray-600">• Smooth animations</div>
              </Stack>
            </div>
          </Stack>
        </ModalContent>
        <ModalFooter>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowBaseModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowBaseModal(false)}>
              Got it
            </Button>
          </div>
        </ModalFooter>
      </BaseModal>

      {/* Form Modal Example */}
      <SimpleFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={(e) => {
          e.preventDefault()
          setShowFormModal(false)
        }}
        title="Form Modal Example"
        description="Standardized form modal with validation"
        submitLabel="Save Changes"
        size="lg"
      >
        <Stack spacing="md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vehicle Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter vehicle name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
            />
          </div>
        </Stack>
      </SimpleFormModal>

      {/* Block Form Modal Example */}
      <BlockFormModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onSubmit={(e) => {
          e.preventDefault()
          setShowBlockModal(false)
        }}
        title="Block Form Modal"
        description="Form with organized sections and dividers"
        submitLabel="Save Vehicle"
        size="lg"
        sections={[
          {
            id: 'basic',
            title: 'Basic Information',
            description: 'Essential vehicle details',
            content: (
              <Stack spacing="md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter vehicle name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="2023"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Make
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Toyota"
                    />
                  </div>
                </div>
              </Stack>
            )
          },
          {
            id: 'details',
            title: 'Additional Details',
            description: 'Optional vehicle information',
            content: (
              <Stack spacing="md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VIN
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter VIN number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes"
                  />
                </div>
              </Stack>
            )
          }
        ]}
      />

      {/* Full Width Modal Example */}
      <FullWidthModal
        isOpen={showFullWidthModal}
        onClose={() => setShowFullWidthModal(false)}
        onSubmit={(e) => {
          e.preventDefault()
          setShowFullWidthModal(false)
        }}
        title="Full Width Modal"
        description="Wide modal for rich content and media"
        submitLabel="Process Upload"
        size="xl"
        secondaryAction={{
          label: "Save Draft",
          onClick: () => console.log("Save draft")
        }}
      >
        <Stack spacing="lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <SectionHeader title="Upload Area" />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drop files here or click to upload</p>
                <p className="text-sm text-gray-500">Supports JPG, PNG, PDF up to 10MB</p>
              </div>
            </div>
            <div>
              <SectionHeader title="Preview" />
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">File preview will appear here</p>
              </div>
            </div>
          </div>
          <div>
            <SectionHeader title="Processing Options" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
                <div className="font-medium">Auto Extract</div>
                <div className="text-sm text-gray-600">Automatically extract data</div>
              </div>
              <div className="p-4 border rounded-lg">
                <Activity className="w-6 h-6 text-blue-600 mb-2" />
                <div className="font-medium">Smart Analysis</div>
                <div className="text-sm text-gray-600">AI-powered analysis</div>
              </div>
              <div className="p-4 border rounded-lg">
                <Settings className="w-6 h-6 text-gray-600 mb-2" />
                <div className="font-medium">Manual Review</div>
                <div className="text-sm text-gray-600">Review before saving</div>
              </div>
            </div>
          </div>
        </Stack>
      </FullWidthModal>

      {/* Stepper Modal Example */}
      <StepperModal
        isOpen={showStepperModal}
        onClose={() => setShowStepperModal(false)}
        title="Vehicle Setup Wizard"
        description="Step-by-step vehicle configuration"
        size="lg"
        currentStepId={currentStep}
        onStepChange={setCurrentStep}
        onStepComplete={(stepId) => {
          if (stepId === 'step1') setCurrentStep('step2')
          else if (stepId === 'step2') setCurrentStep('step3')
          else if (stepId === 'step3') setShowStepperModal(false)
        }}
        steps={[
          {
            id: 'step1',
            title: 'Basic Information',
            content: (
              <Stack spacing="md">
                <p className="text-gray-600">Enter your vehicle's basic information to get started.</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Car"
                  />
                </div>
              </Stack>
            ),
            canProceed: true,
            ctaLabel: 'Continue'
          },
          {
            id: 'step2',
            title: 'Vehicle Details',
            content: (
              <Stack spacing="md">
                <p className="text-gray-600">Add specific details about your vehicle.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="2023" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Toyota" />
                  </div>
                </div>
              </Stack>
            ),
            canProceed: true,
            ctaLabel: 'Next Step'
          },
          {
            id: 'step3',
            title: 'Confirmation',
            content: (
              <Stack spacing="md">
                <p className="text-gray-600">Review your vehicle information and complete setup.</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium">Vehicle Summary</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Your vehicle has been configured and is ready to use.
                  </div>
                </div>
              </Stack>
            ),
            canProceed: true,
            ctaLabel: 'Complete Setup',
            isCompleted: true
          }
        ]}
      />

      {/* Alert Modal Example */}
      <AlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        onConfirm={() => setShowAlertModal(false)}
        title="Delete Vehicle"
        description="Are you sure you want to delete this vehicle? This action cannot be undone."
        icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      {/* Icon Modal Example */}
      <BaseModal
        isOpen={showIconModal}
        onClose={() => setShowIconModal(false)}
        title="Modal with Icon"
        size="md"
      >
        <ModalHeader
          title="Modal with Icon"
          description="This modal demonstrates icon integration"
          icon={<Car className="w-6 h-6 text-blue-600" />}
          onClose={() => setShowIconModal(false)}
        />
        <ModalContent>
          <Stack spacing="md">
            <p className="text-gray-600">
              Modal headers can include icons for better visual hierarchy and context.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <Car className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-sm font-medium">Vehicle</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <Fuel className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm font-medium">Fuel</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <Wrench className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-sm font-medium">Service</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-sm font-medium">Activity</div>
              </div>
            </div>
          </Stack>
        </ModalContent>
        <ModalFooter>
          <div className="flex justify-end">
            <Button onClick={() => setShowIconModal(false)}>
              Close
            </Button>
          </div>
        </ModalFooter>
      </BaseModal>

    </>
  )
}
