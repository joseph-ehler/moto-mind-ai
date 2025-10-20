/**
 * Ultra God-Tier Wizard: Flow Schema
 * 
 * Strict, validated schema for flow JSON.
 * Enforces contracts, privacy tags, and consistency.
 * 
 * Phase A: Contracts & Validator
 */

import { z } from 'zod'

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const DataClassification = z.enum([
  'PUBLIC',
  'OPERATIONAL',
  'PSEUDONYMIZED',
  'SENSITIVE',
])

export const DataPurpose = z.enum([
  'onboarding',
  'safety',
  'analytics',
  'support',
  'features',
  'legal',
])

export const RetentionPeriod = z.enum([
  'session',
  '30d',
  '180d',
  'until-delete',
  'legal-minimum',
])

// ============================================================================
// PRIVACY SCHEMA (Required for all data)
// ============================================================================

export const PrivacySchema = z.object({
  classification: DataClassification,
  purpose: z.array(DataPurpose).min(1),
  retention: RetentionPeriod,
  allowInAI: z.boolean(),
  doNotTrain: z.boolean().optional(),
  maskInLogs: z.boolean().optional(),
  needsConsent: z.boolean().optional(),
  description: z.string().optional(),
})

// ============================================================================
// FIELD SCHEMAS
// ============================================================================

export const FieldType = z.enum([
  'text',
  'number',
  'textarea',
  'select',
  'chips',
  'singleChoice',
  'multiChoice',
  'date',
  'time',
  'toggle',
])

export const FieldPreset = z.enum([
  'vinUppercase',
  'email',
  'phone',
  'currency',
  'percentage',
])

export const TransformSchema = z.object({
  uppercase: z.boolean().optional(),
  lowercase: z.boolean().optional(),
  strip: z.array(z.string()).optional(),
  trim: z.boolean().optional(),
})

export const ValidationSchema = z.object({
  required: z.boolean().optional(),
  length: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  excludeChars: z.array(z.string()).optional(),
})

// B-3: Async validation via data sources
export const ValidationAsyncSchema = z.object({
  source: z.string(), // Data source name
  debounceMs: z.number().min(100).max(5000).optional(), // 100ms to 5s
})

export const AdornmentSchema = z.object({
  type: z.enum(['icon', 'unit', 'prefix', 'suffix', 'counter']),
  text: z.string().optional(),
  icon: z.string().optional(),
})

export const FieldSchema = z.object({
  id: z.string(),
  type: FieldType,
  preset: FieldPreset.optional(),
  bind: z.string(), // e.g., "vehicle.vin"
  
  // Labels (support i18n keys)
  label: z.string().optional(),
  labelKey: z.string().optional(),
  placeholder: z.string().optional(),
  placeholderKey: z.string().optional(),
  helper: z.string().optional(),
  helperKey: z.string().optional(),
  
  // Transformations
  transform: TransformSchema.optional(),
  
  // Validation
  validation: ValidationSchema.optional(),
  validationAsync: ValidationAsyncSchema.optional(), // B-3: Async validation via data sources
  
  // Mobile optimization
  inputMode: z.enum(['text', 'numeric', 'tel', 'email', 'url', 'search']).optional(),
  enterKeyHint: z.enum(['enter', 'done', 'go', 'next', 'previous', 'search', 'send']).optional(),
  autoComplete: z.string().optional(),
  
  // Adornments
  adornments: z.object({
    left: AdornmentSchema.optional(),
    right: AdornmentSchema.optional(),
  }).optional(),
  
  // Options (for select/chips/choice)
  options: z.array(z.union([
    z.string(),
    z.object({
      value: z.string(),
      label: z.string(),
      labelKey: z.string().optional(),
    })
  ])).optional(),
  
  // Privacy (REQUIRED in strict mode)
  privacy: PrivacySchema,
  
  // Accessibility
  a11y: z.object({
    describedBy: z.string().optional(),
    labelledBy: z.string().optional(),
  }).optional(),
})

// ============================================================================
// HELPER SCHEMAS
// ============================================================================

export const HelperSchema = z.object({
  type: z.enum(['info', 'tip', 'warning', 'success']),
  content: z.string().optional(),
  contentKey: z.string().optional(),
})

export const HelpSchema = z.object({
  title: z.string().optional(),
  titleKey: z.string().optional(),
  items: z.array(z.string()),
})

// ============================================================================
// NAVIGATION SCHEMA
// ============================================================================

export const NavigationSchema = z.object({
  continueLabel: z.string().optional(),
  continueLabelKey: z.string().optional(),
  showFooterBack: z.boolean().optional(),
  hideContinueButton: z.boolean().optional(),
})

// ============================================================================
// VALIDATION LOGIC SCHEMA (Expressions)
// ============================================================================

export const ValidationLogicSchema = z.object({
  continueEnabledWhen: z.string().optional(), // Expression
})

// ============================================================================
// LOADING SCHEMA (Processing steps)
// ============================================================================

export const LoadingSchema = z.object({
  baseTickers: z.array(z.string()),
  aiTickers: z.object({
    enabled: z.boolean(),
    timeoutMs: z.number().optional(),
  }).optional(),
  slowHintMs: z.number(),
  timeoutMs: z.number(),
})

// ============================================================================
// STEP SCHEMAS (Different types)
// ============================================================================

// B-3: Data Source Hooks
export const OnEnterHookSchema = z.object({
  fetch: z.array(z.string()).optional(), // Data source names to fetch
  continueWhen: z.string().optional(), // Expression: when to auto-advance
})

const BaseStepSchema = z.object({
  id: z.string(),
  type: z.string(),
  
  // Conditional rendering
  shouldExistWhen: z.string().optional(), // Expression
  weight: z.number().optional(), // Progress weight (default 1.0)
  
  // Labels (support i18n)
  title: z.string().optional(),
  titleKey: z.string().optional(),
  subtitle: z.string().optional(),
  subtitleKey: z.string().optional(),
  description: z.string().optional(),
  descriptionKey: z.string().optional(),
  
  icon: z.string().optional(),
  
  // Privacy
  privacy: PrivacySchema.optional(),
  
  // Navigation
  navigation: NavigationSchema.optional(),
  
  // B-3: Data Fetching
  onEnter: OnEnterHookSchema.optional(),
})

export const InformationalStepSchema = BaseStepSchema.extend({
  type: z.literal('informational'),
  steps: z.array(z.string()).optional(),
  benefits: z.array(z.object({
    icon: z.string().optional(),
    label: z.string().optional(),
    labelKey: z.string().optional(),
  })).optional(),
})

export const ChapterStepSchema = BaseStepSchema.extend({
  type: z.literal('chapter'),
  chapterNumber: z.number().optional(),
  highlights: z.array(z.string()).optional(),
})

export const FormStepSchema = BaseStepSchema.extend({
  type: z.enum(['form.singleQuestion', 'form.cardGrid', 'form.twoColumn']),
  fields: z.array(FieldSchema).min(1),
  help: HelpSchema.optional(),
  helpers: z.array(HelperSchema).optional(),
  validationLogic: ValidationLogicSchema.optional(),
})

export const ProcessingStepSchema = BaseStepSchema.extend({
  type: z.literal('processing.scene'),
  loading: LoadingSchema,
})

export const ConfirmStepSchema = BaseStepSchema.extend({
  type: z.literal('confirm.card'),
})

export const StepSchema = z.discriminatedUnion('type', [
  InformationalStepSchema,
  ChapterStepSchema,
  FormStepSchema,
  ProcessingStepSchema,
  ConfirmStepSchema,
])

// ============================================================================
// CHAPTER SCHEMA
// ============================================================================

export const ChapterSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameKey: z.string().optional(),
  weight: z.number().default(1.0),
  steps: z.array(StepSchema).min(1),
  
  // Hooks
  onEnter: z.string().optional(), // Expression or function name
  onExit: z.string().optional(),
})

// ============================================================================
// DATA SOURCE SCHEMA (B-3: Declarative Fetch)
// ============================================================================

export const RetryConfigSchema = z.object({
  retries: z.number().min(0).max(5),
  backoff: z.enum(['exponential', 'linear', 'fixed']),
  baseMs: z.number().min(100),
  maxMs: z.number().min(1000),
})

export const CacheConfigSchema = z.object({
  ttlMs: z.number().min(1000).max(604800000), // 1s to 7 days
  key: z.string().optional(), // Template: "vin:{{fields.vin.value}}"
  staleWhileRevalidate: z.boolean().optional(),
})

export const DataSourceSchema = z.object({
  // Core
  type: z.enum(['http.get', 'http.post', 'computed', 'cache', 'chain']),
  
  // HTTP
  url: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(), // Template support: {{ctx.tenantId}}
  timeoutMs: z.number().min(1000).max(30000).optional(), // 1s to 30s
  
  // Resilience
  retry: RetryConfigSchema.optional(),
  
  // Caching
  cache: CacheConfigSchema.optional(),
  
  // Request/Response mapping
  mapRequest: z.record(z.string(), z.string()).optional(), // { "vin": "{{fields.vin.value}}" }
  mapResponse: z.record(z.string(), z.string()).optional(), // { "vehicle.make": "{{data.make}}" }
  
  // Computed (for type: 'computed')
  compute: z.string().optional(), // Expression: "ctx.form.vehicle.mileage > 100000"
  
  // Chain (for type: 'chain')
  steps: z.array(z.string()).optional(), // ["vinDecode", "userProfile"]
  
  // Idempotency (for POST requests with retry)
  idempotent: z.boolean().optional(), // Mark POST as safe to retry
  dedupeKey: z.string().optional(), // Template for Idempotency-Key header: "{{ctx.requestId}}"
  
  // Response validation (Zod schema - runtime only, not in JSON)
  // responseSchema: z.any().optional(), // Not in JSON schema
  
  // Stale-While-Revalidate
  staleWhileRevalidate: z.boolean().optional(),
  
  // Privacy & Analytics
  privacy: PrivacySchema.optional(),
  analytics: z.object({
    event: z.string(),
  }).optional(),
})

// ============================================================================
// THEMING SCHEMA
// ============================================================================

export const ThemingSchema = z.object({
  brand: z.string(),
  tone: z.enum(['calm', 'energetic', 'professional', 'friendly']),
  surface: z.string().optional(),
  radius: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
  shadow: z.enum(['none', 'sm', 'md', 'lg']).optional(),
})

// ============================================================================
// ANALYTICS SCHEMA
// ============================================================================

export const AnalyticsSchema = z.object({
  namespace: z.string(),
  flow: z.string(),
  enableTiming: z.boolean().optional(),
})

// ============================================================================
// FLOW SCHEMA (Root)
// ============================================================================

export const FlowSchema = z.object({
  // Metadata
  id: z.string(),
  version: z.string(),
  schemaVersion: z.string().default('1.0.0'),
  
  // i18n
  i18nNS: z.string(),
  defaultLocale: z.string().optional(),
  
  // Theming
  theming: ThemingSchema,
  
  // Privacy defaults
  privacy: z.object({
    defaultRetention: RetentionPeriod,
    strictMode: z.boolean().optional(),
  }),
  
  // Analytics
  analytics: AnalyticsSchema,
  
  // Data sources (reusable)
  dataSources: z.record(z.string(), DataSourceSchema).optional(),
  
  // Chapters
  chapters: z.array(ChapterSchema).min(1),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FlowConfig = z.infer<typeof FlowSchema>
export type ChapterConfig = z.infer<typeof ChapterSchema>
export type StepConfig = z.infer<typeof StepSchema>
export type FieldConfig = z.infer<typeof FieldSchema>
export type PrivacyConfig = z.infer<typeof PrivacySchema>
export type DataSourceConfig = z.infer<typeof DataSourceSchema>
export type ThemingConfig = z.infer<typeof ThemingSchema>
export type AnalyticsConfig = z.infer<typeof AnalyticsSchema>
