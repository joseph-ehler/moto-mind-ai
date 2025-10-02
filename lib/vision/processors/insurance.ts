// Insurance Card Processor
// Processes insurance cards and extracts policy information

import { ProcessorResult } from '../types'
import { rollupValidation } from '../validators/rollup'

/**
 * Processes insurance card data into standardized format
 */
export function processInsuranceCard(rawExtraction: any): ProcessorResult {
  const warnings: string[] = []
  
  // Step 1: Validate policy information
  const policyValidation = validatePolicyInformation(rawExtraction)
  if (!policyValidation.isValid) {
    warnings.push(...policyValidation.errors)
  }
  
  // Step 2: Validate dates
  const dateValidation = validateInsuranceDates(rawExtraction)
  if (!dateValidation.isValid) {
    warnings.push(...dateValidation.errors)
  }
  
  // Step 3: Process coverage information
  const processedCoverage = processCoverageDetails(rawExtraction.coverage_limits)
  
  // Step 4: Validate vehicle information
  const vehicleValidation = validateVehicleInfo(rawExtraction.vehicle_info)
  
  // Step 5: Generate summary
  const summary = generateInsuranceSummary({
    insurance_company: rawExtraction.insurance_company,
    policy_number: rawExtraction.policy_number,
    effective_date: rawExtraction.effective_date,
    expiration_date: rawExtraction.expiration_date
  })
  
  // Step 6: Calculate confidence
  const validation = calculateInsuranceValidation(rawExtraction, {
    policyValidation,
    dateValidation,
    vehicleValidation
  })
  
  const enrichedData = {
    key_facts: {
      insurance_company: rawExtraction.insurance_company,
      policy_number: rawExtraction.policy_number,
      effective_date: rawExtraction.effective_date,
      expiration_date: rawExtraction.expiration_date,
      vehicle_info: rawExtraction.vehicle_info,
      coverage_limits: processedCoverage,
      agent_info: rawExtraction.agent_info
    },
    summary,
    validation,
    confidence: validation.rollup === 'ok' ? 0.85 : 0.6,
    processing_metadata: {
      model_version: 'gpt-4o',
      prompt_hash: 'insurance_v2_enhanced',
      processing_ms: 0 // Will be set by caller
    }
  }
  
  return {
    enrichedData,
    confidence: enrichedData.confidence,
    warnings,
    nextActions: generateInsuranceNextActions(enrichedData.key_facts)
  }
}

/**
 * Validates policy information
 */
function validatePolicyInformation(data: any): {
  isValid: boolean
  errors: string[]
  confidence: number
} {
  const errors: string[] = []
  let confidence = 1.0
  
  // Check for required fields
  if (!data.insurance_company) {
    errors.push('Missing insurance company name')
    confidence -= 0.4
  }
  
  if (!data.policy_number) {
    errors.push('Missing policy number')
    confidence -= 0.5
  } else {
    // Validate policy number format (basic check)
    const policyNum = data.policy_number.toString()
    if (policyNum.length < 5 || policyNum.length > 20) {
      errors.push('Policy number format seems unusual')
      confidence -= 0.2
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    confidence: Math.max(0, Math.min(1, confidence))
  }
}

/**
 * Validates insurance dates
 */
function validateInsuranceDates(data: any): {
  isValid: boolean
  errors: string[]
  confidence: number
} {
  const errors: string[] = []
  let confidence = 1.0
  
  const { effective_date, expiration_date } = data
  
  if (!effective_date || !expiration_date) {
    errors.push('Missing policy dates')
    return { isValid: false, errors, confidence: 0.3 }
  }
  
  try {
    const effectiveDate = new Date(effective_date)
    const expirationDate = new Date(expiration_date)
    const now = new Date()
    
    // Check if dates are valid
    if (isNaN(effectiveDate.getTime()) || isNaN(expirationDate.getTime())) {
      errors.push('Invalid date format')
      confidence -= 0.5
    } else {
      // Check date logic
      if (effectiveDate >= expirationDate) {
        errors.push('Effective date is after expiration date')
        confidence -= 0.4
      }
      
      // Check if policy is expired
      if (expirationDate < now) {
        errors.push('Insurance policy has expired')
        confidence -= 0.2 // Not invalid, just expired
      }
      
      // Check for unrealistic date ranges
      const daysDiff = (expirationDate.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff < 30 || daysDiff > 400) {
        errors.push('Unusual policy duration')
        confidence -= 0.1
      }
    }
  } catch (error) {
    errors.push('Date parsing failed')
    confidence -= 0.5
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    confidence: Math.max(0, Math.min(1, confidence))
  }
}

/**
 * Processes coverage details into standardized format
 */
function processCoverageDetails(coverageLimits: any): any {
  if (!coverageLimits || typeof coverageLimits !== 'object') {
    return null
  }
  
  const processed: any = {}
  
  // Standardize coverage types
  const coverageMap: Record<string, string> = {
    'liability': 'liability',
    'bodily_injury': 'liability',
    'property_damage': 'liability',
    'comprehensive': 'comprehensive',
    'comp': 'comprehensive',
    'collision': 'collision',
    'coll': 'collision',
    'uninsured_motorist': 'uninsured_motorist',
    'um': 'uninsured_motorist',
    'pip': 'personal_injury_protection',
    'personal_injury_protection': 'personal_injury_protection'
  }
  
  for (const [key, value] of Object.entries(coverageLimits)) {
    const standardKey = coverageMap[key.toLowerCase()] || key.toLowerCase()
    processed[standardKey] = value
  }
  
  return processed
}

/**
 * Validates vehicle information on insurance card
 */
function validateVehicleInfo(vehicleInfo: any): {
  isValid: boolean
  confidence: number
} {
  if (!vehicleInfo || typeof vehicleInfo !== 'object') {
    return { isValid: true, confidence: 0.5 } // Not required
  }
  
  let confidence = 0.8
  
  // Check for reasonable vehicle data
  if (vehicleInfo.year) {
    const year = parseInt(vehicleInfo.year)
    const currentYear = new Date().getFullYear()
    
    if (year < 1900 || year > currentYear + 2) {
      confidence -= 0.3
    }
  }
  
  if (vehicleInfo.vin) {
    // Basic VIN validation (17 characters)
    if (vehicleInfo.vin.length !== 17) {
      confidence -= 0.2
    }
  }
  
  return {
    isValid: confidence > 0.3,
    confidence
  }
}

/**
 * Generates human-readable insurance summary
 */
function generateInsuranceSummary(data: {
  insurance_company: string | null
  policy_number: string | null
  effective_date: string | null
  expiration_date: string | null
}): string {
  const parts: string[] = []
  
  // Company
  if (data.insurance_company) {
    parts.push(`${data.insurance_company} insurance`)
  } else {
    parts.push('Insurance card')
  }
  
  // Policy number
  if (data.policy_number) {
    parts.push(`Policy ${data.policy_number}`)
  }
  
  // Expiration
  if (data.expiration_date) {
    try {
      const expDate = new Date(data.expiration_date)
      const formatted = expDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      parts.push(`expires ${formatted}`)
    } catch {
      parts.push(`expires ${data.expiration_date}`)
    }
  }
  
  return parts.join(' • ')
}

/**
 * Calculates validation scores for insurance data
 */
function calculateInsuranceValidation(
  rawExtraction: any,
  validationResults: {
    policyValidation: any
    dateValidation: any
    vehicleValidation: any
  }
) {
  const fieldValidations: Record<string, { confidence: number; isValid: boolean }> = {}
  
  // Policy confidence
  fieldValidations.policy_conf = {
    confidence: validationResults.policyValidation.confidence,
    isValid: validationResults.policyValidation.isValid
  }
  
  // Date confidence
  fieldValidations.date_conf = {
    confidence: validationResults.dateValidation.confidence,
    isValid: validationResults.dateValidation.isValid
  }
  
  // Vehicle confidence
  fieldValidations.vehicle_conf = {
    confidence: validationResults.vehicleValidation.confidence,
    isValid: validationResults.vehicleValidation.isValid
  }
  
  // Company name confidence
  if (rawExtraction.insurance_company) {
    const companyLength = rawExtraction.insurance_company.length
    fieldValidations.company_conf = {
      confidence: companyLength > 3 ? 0.9 : 0.6,
      isValid: companyLength > 1
    }
  }
  
  return rollupValidation(fieldValidations, rawExtraction, {
    requiredFields: ['insurance_company', 'policy_number'],
    criticalFields: ['policy_number'],
    minOverallConfidence: 0.7
  })
}

/**
 * Generates suggested next actions for insurance records
 */
function generateInsuranceNextActions(keyFacts: any): string[] {
  const actions: string[] = []
  
  // Expiration reminder
  if (keyFacts.expiration_date) {
    try {
      const expDate = new Date(keyFacts.expiration_date)
      const now = new Date()
      const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExpiry < 0) {
        actions.push('⚠️ Insurance policy has expired - renew immediately')
      } else if (daysUntilExpiry < 30) {
        actions.push(`Insurance expires in ${daysUntilExpiry} days - schedule renewal`)
      } else if (daysUntilExpiry < 60) {
        actions.push('Set reminder to renew insurance policy')
      }
    } catch {
      // Date parsing failed, skip expiration check
    }
  }
  
  // Coverage review
  if (keyFacts.coverage_limits) {
    actions.push('Review coverage limits with agent if needed')
  }
  
  // Agent contact
  if (keyFacts.agent_info?.phone) {
    actions.push('Save agent contact information')
  }
  
  // Vehicle verification
  if (keyFacts.vehicle_info) {
    actions.push('Verify vehicle information matches your records')
  }
  
  return actions
}
