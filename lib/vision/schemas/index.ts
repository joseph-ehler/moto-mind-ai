/**
 * Vision Schema System - Clean Architecture
 * 
 * Layer 1: Field Definitions (this module)
 * Layer 2: Extraction Prompts (prompts/)
 * Layer 3: Validation Logic (validators/)
 * Layer 4: Prompt Assembly (prompts/builder.ts)
 */

export * from './fields'
export { buildExtractionPrompt, getStructuredOutputSchema, buildTestPrompt } from '../prompts/builder'
export { validateDashboardExtraction, processDashboardExtraction, normalizeOdometerToMiles } from '../validators/dashboard'
export { DASHBOARD_SYSTEM_PROMPT, DASHBOARD_FEW_SHOT, DASHBOARD_CRITICAL_RULES } from '../prompts/dashboard'
