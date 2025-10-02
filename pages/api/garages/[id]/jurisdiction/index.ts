import { NextApiRequest, NextApiResponse } from 'next'
import { getGarageJurisdiction } from '@/lib/jurisdiction/worker'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid garage ID' })
  }

  try {
    const profile = await getGarageJurisdiction(id)

    if (!profile) {
      return res.status(404).json({ error: 'Jurisdiction profile not found' })
    }

    // Transform for UI consumption
    const rules = Object.values(profile.rules_json)
    const summary = {
      registration: rules.find(r => r.kind === 'registration'),
      inspection: rules.find(r => r.kind === 'inspection'), 
      emissions: rules.find(r => r.kind === 'emissions')
    }

    // Generate human-readable summary
    const summaryText = generateJurisdictionSummary(profile.state || profile.country, summary)

    res.status(200).json({
      profile: {
        id: profile.id,
        garage_id: profile.garage_id,
        country: profile.country,
        state: profile.state,
        county: profile.county,
        derived_at: profile.derived_at
      },
      rules: profile.rules_json,
      summary,
      summaryText,
      lastUpdated: profile.derived_at
    })

  } catch (error) {
    console.error('Get jurisdiction error:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function generateJurisdictionSummary(location: string, summary: any): string {
  const parts: string[] = []
  
  if (summary.registration && summary.registration.cadence !== 'none') {
    parts.push(`${summary.registration.cadence} registration`)
  }
  
  if (summary.inspection && summary.inspection.cadence !== 'none') {
    parts.push(`${summary.inspection.cadence} inspection`)
  }
  
  if (summary.emissions && summary.emissions.cadence !== 'none') {
    parts.push(`${summary.emissions.cadence} emissions`)
  } else {
    parts.push('no emissions')
  }

  return `${location}: ${parts.join(', ')}`
}
