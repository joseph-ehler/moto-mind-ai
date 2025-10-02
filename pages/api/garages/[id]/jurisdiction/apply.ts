import { NextApiRequest, NextApiResponse } from 'next'
import { applyJurisdictionToGarage } from '@/lib/jurisdiction/worker'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid garage ID' })
  }

  try {
    console.log(`🏛️ API: Applying jurisdiction rules to garage ${id}`)
    
    // Apply jurisdiction rules (this could be queued in production)
    const profile = await applyJurisdictionToGarage(id)

    if (!profile) {
      return res.status(500).json({ error: 'Failed to apply jurisdiction rules' })
    }

    res.status(200).json({
      success: true,
      profile: {
        id: profile.id,
        garage_id: profile.garage_id,
        country: profile.country,
        state: profile.state,
        county: profile.county,
        rulesCount: Object.keys(profile.rules_json).length,
        derived_at: profile.derived_at
      },
      message: 'Jurisdiction rules applied successfully'
    })

  } catch (error) {
    console.error('Apply jurisdiction error:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
