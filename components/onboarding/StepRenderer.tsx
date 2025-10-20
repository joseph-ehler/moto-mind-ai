/**
 * Step Renderer
 * 
 * Consumes JSON configuration and renders the appropriate screen.
 * This is the "generator" that builds UI from JSON.
 * 
 * Usage:
 * ```tsx
 * import flowConfig from '@/config/onboarding/vehicle-flow.json'
 * 
 * <StepRenderer
 *   step={flowConfig.steps[currentIndex]}
 *   values={values}
 *   onChange={handleChange}
 *   errors={errors}
 * />
 * ```
 */

'use client'

import * as React from 'react'
import { WelcomeScreen, ChapterIntro } from './WelcomeScreen'
import { FormScreen, type FieldConfig, type HelpConfig, type HelperConfig } from './layouts/FormScreen'
import { LoadingScene } from './LoadingScene'
import { Car, Clock, Shield, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'

// Icon mapping
const ICON_MAP = {
  car: Car,
  clock: Clock,
  shield: Shield,
  alert: AlertCircle,
  check: CheckCircle2,
  sparkles: Sparkles,
}

function getIcon(iconName?: string, size: 'sm' | 'md' | 'lg' = 'md') {
  if (!iconName) return undefined
  
  const Icon = ICON_MAP[iconName as keyof typeof ICON_MAP]
  if (!Icon) return undefined
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }
  
  return <Icon className={sizeClasses[size]} />
}

// JSON step types
export type StepConfig = 
  | InformationalStepConfig
  | ChapterStepConfig
  | FormStepConfig
  | ProcessingStepConfig
  | ConfirmationStepConfig

interface BaseStepConfig {
  id: string
  type: string
  title: string
  description?: string
}

interface InformationalStepConfig extends BaseStepConfig {
  type: 'informational'
  subtitle?: string
  steps?: string[]
  benefits?: Array<{
    icon?: string
    label: string
  }>
  icon?: string
}

interface ChapterStepConfig extends BaseStepConfig {
  type: 'chapter'
  chapterNumber?: number
  highlights?: string[]
  icon?: string
}

interface FormStepConfig extends BaseStepConfig {
  type: 'form'
  icon?: string
  fields: FieldConfig[]
  help?: HelpConfig
  helpers?: HelperConfig[]
}

interface ProcessingStepConfig extends BaseStepConfig {
  type: 'processing'
  process: {
    endpoint: string
    method?: string
    timeoutMs: number
    slowHintMs: number
    ticker?: string[]
  }
  autoAdvance: boolean
}

interface ConfirmationStepConfig extends BaseStepConfig {
  type: 'confirmation'
  continueLabel?: string
}

export interface StepRendererProps {
  step: StepConfig
  
  // Form state
  values?: Record<string, string>
  onChange?: (fieldId: string, value: string) => void
  errors?: Record<string, string>
  
  // Processing state
  onTimeout?: () => void
  onRetry?: () => void
  onBack?: () => void
  error?: {
    code?: string
    title?: string
    message: string
  } | null
  
  // Confirmation state
  data?: any
}

export function StepRenderer({
  step,
  values = {},
  onChange = () => {},
  errors = {},
  onTimeout,
  onRetry,
  onBack,
  error,
  data,
}: StepRendererProps) {
  switch (step.type) {
    case 'informational':
      return renderInformational(step)
    
    case 'chapter':
      return renderChapter(step)
    
    case 'form':
      return renderForm(step, values, onChange, errors)
    
    case 'processing':
      return renderProcessing(step, onTimeout, onRetry, onBack, error)
    
    case 'confirmation':
      return renderConfirmation(step, data)
    
    default:
      return (
        <div className="text-center p-8">
          <p className="text-red-600">
            Unknown step type: {(step as any).type}
          </p>
        </div>
      )
  }
}

/**
 * Render informational step (Welcome)
 */
function renderInformational(step: InformationalStepConfig) {
  return (
    <WelcomeScreen
      title={step.title}
      subtitle={step.subtitle}
      description={step.description || ''}
      steps={step.steps}
      benefits={step.benefits?.map(b => ({
        icon: getIcon(b.icon, 'sm'),
        label: b.label,
      }))}
      illustration={getIcon(step.icon, 'lg')}
    />
  )
}

/**
 * Render chapter intro
 */
function renderChapter(step: ChapterStepConfig) {
  return (
    <ChapterIntro
      chapterNumber={step.chapterNumber}
      title={step.title}
      description={step.description || ''}
      highlights={step.highlights}
      icon={getIcon(step.icon, 'md')}
    />
  )
}

/**
 * Render form step
 */
function renderForm(
  step: FormStepConfig,
  values: Record<string, string>,
  onChange: (fieldId: string, value: string) => void,
  errors: Record<string, string>
) {
  return (
    <FormScreen
      title={step.title}
      description={step.description}
      icon={getIcon(step.icon, 'sm')}
      fields={step.fields}
      help={step.help}
      helpers={step.helpers}
      values={values}
      onChange={onChange}
      errors={errors}
    />
  )
}

/**
 * Render processing step (Loading)
 */
function renderProcessing(
  step: ProcessingStepConfig,
  onTimeout?: () => void,
  onRetry?: () => void,
  onBack?: () => void,
  error?: {
    code?: string
    title?: string
    message: string
  } | null
) {
  const ticker = step.process.ticker || ['Processing...']
  
  return (
    <LoadingScene
      ticker={ticker}
      slowHintMs={step.process.slowHintMs}
      timeoutMs={step.process.timeoutMs}
      onTimeout={onTimeout}
      onRetry={onRetry}
      onBack={onBack}
      error={error}
    />
  )
}

/**
 * Render confirmation step
 */
function renderConfirmation(step: ConfirmationStepConfig, data: any) {
  // This would be replaced with actual confirmation component
  // For now, just a placeholder
  return (
    <div className="text-center p-8">
      <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
      <p className="text-gray-600">{step.description}</p>
      {/* Vehicle confirmation UI would go here */}
    </div>
  )
}
