/**
 * Runtime Validation Schemas
 * Using Zod for runtime type safety
 */

import { z } from 'zod'

/**
 * NHTSA API Schemas
 */
export const NHTSAResponseSchema = z.object({
  Count: z.number(),
  Message: z.string(),
  SearchCriteria: z.string().nullable().optional(),
  Results: z.array(z.record(z.string()))
})

export type NHTSAResponse = z.infer<typeof NHTSAResponseSchema>

/**
 * EPA API Schemas
 */
export const EPAVehicleOptionSchema = z.object({
  text: z.string(),
  value: z.string()
})

export const EPAMenuResponseSchema = z.object({
  menuItem: z.array(EPAVehicleOptionSchema).optional()
})

export const EPAVehicleDataSchema = z.object({
  city08: z.number().optional(),
  highway08: z.number().optional(),
  comb08: z.number().optional(),
  fuelType1: z.string().optional(),
  fuelCost08: z.number().optional(),
  co2TailpipeGpm: z.number().optional(),
  youSaveSpend: z.number().optional(),
  barrels08: z.number().optional(),
  rangeA: z.string().optional() // For EVs
})

export type EPAVehicleData = z.infer<typeof EPAVehicleDataSchema>

/**
 * Validation Functions
 */

export function validateNHTSAResponse(data: unknown): NHTSAResponse {
  try {
    return NHTSAResponseSchema.parse(data)
  } catch (error) {
    console.error('[Validation] NHTSA response invalid:', error)
    throw new Error('Invalid NHTSA API response format')
  }
}

export function validateEPAMenuResponse(data: unknown) {
  try {
    return EPAMenuResponseSchema.parse(data)
  } catch (error) {
    console.error('[Validation] EPA menu response invalid:', error)
    // Return empty array instead of throwing
    return { menuItem: [] }
  }
}

export function validateEPAVehicleData(data: unknown): EPAVehicleData {
  try {
    return EPAVehicleDataSchema.parse(data)
  } catch (error) {
    console.error('[Validation] EPA vehicle data invalid:', error)
    throw new Error('Invalid EPA vehicle data format')
  }
}

/**
 * Safe parse functions (don't throw)
 */

export function safeParseNHTSA(data: unknown) {
  const result = NHTSAResponseSchema.safeParse(data)
  if (!result.success) {
    console.error('[Validation] NHTSA parse failed:', result.error)
  }
  return result
}

export function safeParseEPA(data: unknown) {
  const result = EPAVehicleDataSchema.safeParse(data)
  if (!result.success) {
    console.error('[Validation] EPA parse failed:', result.error)
  }
  return result
}
