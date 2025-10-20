/**
 * Test Wizard Page
 * 
 * Phase 0 test: Verify wizard core works with 3 dummy steps.
 * Tests: navigation, validation, progress, back/continue.
 */

'use client'

import { useEffect } from 'react'
import { OnboardingShell } from '@/components/onboarding/OnboardingShell'
import { ValidationProvider, useValidation } from '@/wizard/validation-context'
import { useOnboardingWizard } from '@/wizard/useOnboardingWizard'
import { buildPredicateRegistry, normalizeRegistry } from '@/wizard/flow-registry'
import { createOnboardingStore } from '@/lib/store/base'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Test registry
const testRegistry = {
  metadata: {
    name: 'Test Wizard',
    version: '1.0',
    totalSteps: 3,
    estimatedTime: '1 minute',
    url: '/onboarding/test-wizard'
  },
  shell: {
    header: {
      left: 'Back',
      center: { progress: 'bar+dots', format: 'Step {x} of {y}' },
      right: ['Save & exit', 'Start over']
    },
    footer: {
      left: 'Skip for now',
      right: 'Continue',
      keyboard: { enter: 'continue', esc: 'blur' }
    }
  },
  baseFlow: [
    {
      id: 'intro',
      type: 'informational' as const,
      title: 'Welcome',
      question: 'Let\'s test the wizard core',
      skippable: false,
      estimatedSeconds: 5
    },
    {
      id: 'name',
      type: 'input' as const,
      title: 'Your name',
      question: 'What should we call you?',
      response: { key: 'name' },
      validation: { required: true, minLength: 2 },
      skippable: false,
      estimatedSeconds: 10
    },
    {
      id: 'complete',
      type: 'results' as const,
      title: 'All done!',
      question: 'Test wizard complete',
      skippable: false,
      estimatedSeconds: 5
    }
  ]
}

// Create test store
const testStore = createOnboardingStore('test', 'v1')

// Step components
function IntroStep() {
  const { setValid } = useValidation()
  
  useEffect(() => {
    setValid(true) // Informational steps are always valid
  }, [setValid])
  
  return (
    <div className="space-y-6 text-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to the Test Wizard
        </h1>
        <p className="text-lg text-gray-600">
          This tests the Phase 0 wizard core:
        </p>
        <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>OnboardingShell with header/footer</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>useOnboardingWizard controller</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>ValidationContext</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Navigation (back/continue)</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>Progress calculation</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

function NameStep() {
  const { setValid } = useValidation()
  const wizard = useOnboardingWizard({
    steps: normalizeRegistry(testRegistry),
    store: testStore,
    predicates: {},
    persistenceKey: 'test:wizard:v1'
  })
  
  const name = wizard.data.name || ''
  
  useEffect(() => {
    setValid(name.length >= 2)
  }, [name, setValid])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    wizard.setData('name', e.target.value)
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Your name
        </h1>
        <p className="text-lg text-gray-600">
          What should we call you?
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={handleChange}
          placeholder="Enter your name"
          autoFocus
          className="text-lg"
        />
        {name.length > 0 && name.length < 2 && (
          <p className="text-sm text-red-600">
            Name must be at least 2 characters
          </p>
        )}
      </div>
    </div>
  )
}

function CompleteStep() {
  const { setValid } = useValidation()
  const wizard = useOnboardingWizard({
    steps: normalizeRegistry(testRegistry),
    store: testStore,
    predicates: {},
    persistenceKey: 'test:wizard:v1'
  })
  
  const name = wizard.data.name || 'there'
  
  useEffect(() => {
    setValid(true)
  }, [setValid])
  
  return (
    <div className="space-y-6 text-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          All done, {name}! 🎉
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Phase 0 wizard core is working!
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
          <h2 className="font-semibold text-green-900 mb-3">
            What we tested:
          </h2>
          <ul className="space-y-2 text-left text-green-800">
            <li>✓ Shell rendered correctly</li>
            <li>✓ Progress bar updated</li>
            <li>✓ Back button worked</li>
            <li>✓ Continue disabled until valid</li>
            <li>✓ Validation context synced</li>
            <li>✓ Data persisted to store</li>
          </ul>
        </div>
        
        <div className="mt-8">
          <Button
            onClick={() => wizard.reset()}
            variant="outline"
          >
            Start over
          </Button>
        </div>
      </div>
    </div>
  )
}

// Main wizard component
function TestWizardContent() {
  const wizard = useOnboardingWizard({
    steps: normalizeRegistry(testRegistry),
    store: testStore,
    predicates: buildPredicateRegistry(testRegistry),
    weights: { parent: 1, mini: 0.5 },
    persistenceKey: 'test:wizard:v1'
  })
  
  const renderStep = () => {
    switch (wizard.currentStep?.id) {
      case 'intro':
        return <IntroStep />
      case 'name':
        return <NameStep />
      case 'complete':
        return <CompleteStep />
      default:
        return <div>Unknown step</div>
    }
  }
  
  return (
    <OnboardingShell
      currentStep={wizard.currentIndex + 1}
      totalSteps={wizard.totalSteps}
      progress={wizard.progress}
      onBack={wizard.back}
      onNext={wizard.next}
      onStartOver={wizard.reset}
      canGoBack={wizard.canGoBack}
      canGoNext={wizard.canGoNext}
      canSkip={wizard.canSkip}
      hideSkip
    >
      {renderStep()}
    </OnboardingShell>
  )
}

export default function TestWizardPage() {
  return (
    <ValidationProvider>
      <TestWizardContent />
    </ValidationProvider>
  )
}
