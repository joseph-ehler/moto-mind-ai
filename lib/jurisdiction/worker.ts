import { getSupabaseServer } from '@/lib/supabase-server'
import crypto from 'crypto'



export interface JurisdictionRule {
  id: string
  country: string
  state?: string
  county?: string
  kind: 'registration' | 'inspection' | 'emissions'
  cadence: 'annual' | 'biannual' | 'none'
  due_rule?: 'birthMonth' | 'fixedMonth' | 'monthFromPurchase'
  due_month?: number
  grace_days?: number
  notes?: string
  source: string
}

export interface GarageJurisdictionProfile {
  id: string
  garage_id: string
  country: string
  state?: string
  county?: string
  rules_json: Record<string, JurisdictionRule>
  derived_at: string
}

/**
 * Apply jurisdiction rules to a garage and create/update vehicle reminders
 */
export async function applyJurisdictionToGarage(garageId: string): Promise<GarageJurisdictionProfile | null> {
  try {
    console.log(`🏛️ Applying jurisdiction rules to garage: ${garageId}`)

    // 1. Get garage location
    const { data: garage, error: garageError } = await supabase
      .from('garages')
      .select('id, name, address, lat, lng, meta')
      .eq('id', garageId)
      .single()

    if (garageError || !garage) {
      console.error('Failed to fetch garage:', garageError)
      return null
    }

    // 2. Compute effective jurisdiction profile
    const profile = await computeEffectiveProfile(garage)
    
    // 3. Upsert garage jurisdiction profile
    const { data: savedProfile, error: profileError } = await supabase
      .from('garage_jurisdiction_profiles')
      .upsert({
        garage_id: garageId,
        country: profile.country,
        state: profile.state,
        county: profile.county,
        rules_json: profile.rules_json,
        derived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Failed to save jurisdiction profile:', profileError)
      return null
    }

    // 4. Apply rules to vehicles at this garage
    await applyRulesToVehicles(garageId, profile.rules_json)

    console.log(`✅ Applied jurisdiction rules to garage ${garage.name}`)
    return savedProfile as GarageJurisdictionProfile

  } catch (error) {
    console.error('Error applying jurisdiction to garage:', error)
    return null
  }
}

/**
 * Compute effective jurisdiction rules for a garage location
 * Priority: county > state > country (most specific wins)
 */
async function computeEffectiveProfile(garage: any): Promise<{
  country: string
  state?: string
  county?: string
  rules_json: Record<string, JurisdictionRule>
}> {
  // Extract location from address or meta
  let country = 'US'
  let state: string | undefined = undefined
  
  // Try to extract state from address (simple pattern matching)
  if (garage.address) {
    const addressMatch = garage.address.match(/\b([A-Z]{2})\b/)
    if (addressMatch) {
      state = addressMatch[1]
    }
  }
  
  // Try to extract from meta if available
  if (garage.meta?.state) {
    state = garage.meta.state
  }
  if (garage.meta?.country) {
    country = garage.meta.country
  }
  
  const county: string | undefined = undefined // TODO: Extract from address if needed

  // Fetch applicable rules (most specific first)
  const { data: rules, error } = await supabase
    .from('jurisdiction_rules')
    .select('*')
    .eq('country', country)
    .or(`state.is.null,state.eq.${state}`)
    .order('state', { ascending: false, nullsFirst: false }) // state-specific rules first

  if (error) {
    console.error('Failed to fetch jurisdiction rules:', error)
    return { country, state, county, rules_json: {} }
  }

  // Build effective rules map (kind -> rule)
  const effectiveRules: Record<string, JurisdictionRule> = {}
  
  for (const rule of rules || []) {
    // Skip if we already have a more specific rule for this kind
    if (effectiveRules[rule.kind]) continue
    
    // Apply rule if it matches location specificity
    if (!rule.state || rule.state === state) {
      effectiveRules[rule.kind] = rule
    }
  }

  console.log(`📍 Computed ${Object.keys(effectiveRules).length} effective rules for ${garage.name}`)
  
  return {
    country,
    state,
    county,
    rules_json: effectiveRules
  }
}

/**
 * Create/update jurisdiction-based reminders for vehicles at a garage
 */
async function applyRulesToVehicles(garageId: string, rules: Record<string, JurisdictionRule>) {
  // Get vehicles at this garage
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('id, nickname, make, model, year')
    .eq('garage_id', garageId)
    .is('deleted_at', null)

  if (vehiclesError || !vehicles) {
    console.error('Failed to fetch vehicles for garage:', vehiclesError)
    return
  }

  console.log(`🚗 Applying rules to ${vehicles.length} vehicles`)

  // Create reminders for each vehicle based on applicable rules
  for (const vehicle of vehicles) {
    for (const [kind, rule] of Object.entries(rules)) {
      // Skip rules that don't generate reminders
      if (rule.cadence === 'none') continue

      await upsertJurisdictionReminder(vehicle.id, garageId, rule)
    }
  }
}

/**
 * Create or update a jurisdiction-based reminder for a vehicle
 */
async function upsertJurisdictionReminder(vehicleId: string, garageId: string, rule: JurisdictionRule) {
  // Create a hash of the rule to enable idempotent updates
  const rulePayload = {
    kind: rule.kind,
    cadence: rule.cadence,
    due_rule: rule.due_rule,
    due_month: rule.due_month,
    notes: rule.notes
  }
  const ruleHash = crypto.createHash('sha256').update(JSON.stringify(rulePayload)).digest('hex')

  // Check if we already have this reminder
  const { data: existing } = await supabase
    .from('reminders')
    .select('id, rule_hash')
    .eq('vehicle_id', vehicleId)
    .eq('kind', rule.kind)
    .eq('source', 'jurisdiction')
    .single()

  // Skip if rule hasn't changed
  if (existing && existing.rule_hash === ruleHash) {
    return
  }

  // Calculate due date based on rule
  const dueDate = calculateDueDate(rule)
  
  const reminderData = {
    vehicle_id: vehicleId,
    garage_id_at_creation: garageId,
    kind: rule.kind,
    title: `${rule.kind.charAt(0).toUpperCase() + rule.kind.slice(1)} Due`,
    description: rule.notes || `${rule.cadence} ${rule.kind} required`,
    due_date: dueDate,
    repeats: rule.cadence,
    status: 'open',
    source: 'jurisdiction',
    rule_hash: ruleHash,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  if (existing) {
    // Update existing reminder
    await supabase
      .from('reminders')
      .update(reminderData)
      .eq('id', existing.id)
  } else {
    // Create new reminder
    await supabase
      .from('reminders')
      .insert(reminderData)
  }

  console.log(`📋 ${existing ? 'Updated' : 'Created'} ${rule.kind} reminder for vehicle ${vehicleId}`)
}

/**
 * Calculate due date based on jurisdiction rule
 */
function calculateDueDate(rule: JurisdictionRule): string | null {
  if (!rule.due_rule) return null

  const now = new Date()
  let dueDate = new Date()

  switch (rule.due_rule) {
    case 'birthMonth':
      // TODO: Get owner birth month from profile
      // For now, use current month + 1 year
      dueDate.setFullYear(now.getFullYear() + 1)
      break
      
    case 'fixedMonth':
      if (rule.due_month) {
        dueDate.setMonth(rule.due_month - 1) // 0-indexed
        dueDate.setDate(1)
        // If past this year's date, use next year
        if (dueDate < now) {
          dueDate.setFullYear(now.getFullYear() + 1)
        }
      }
      break
      
    case 'monthFromPurchase':
      // TODO: Get vehicle purchase date
      // For now, use 1 year from now
      dueDate.setFullYear(now.getFullYear() + 1)
      break
  }

  return dueDate.toISOString().split('T')[0] // Return YYYY-MM-DD
}

/**
 * Get jurisdiction profile for a garage
 */
export async function getGarageJurisdiction(garageId: string): Promise<GarageJurisdictionProfile | null> {
  const { data, error } = await supabase
    .from('garage_jurisdiction_profiles')
    .select('*')
    .eq('garage_id', garageId)
    .single()

  if (error) {
    console.error('Failed to fetch garage jurisdiction:', error)
    return null
  }

  return data as GarageJurisdictionProfile
}
