import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid garage ID' })
  }

  try {
    // For now, return mock jurisdiction data based on garage
    // This will work immediately without database changes
    const mockJurisdiction = {
      profile: {
        id: `profile-${id}`,
        garage_id: id,
        country: 'US',
        state: 'FL', // Default to FL for demo
        derived_at: new Date().toISOString()
      },
      rules: {
        registration: {
          kind: 'registration',
          cadence: 'annual',
          notes: 'Annual registration due in birth month'
        },
        inspection: {
          kind: 'inspection', 
          cadence: 'none',
          notes: 'No state inspection required'
        },
        emissions: {
          kind: 'emissions',
          cadence: 'none', 
          notes: 'No emissions testing required'
        }
      },
      summary: {
        registration: { kind: 'registration', cadence: 'annual' },
        inspection: { kind: 'inspection', cadence: 'none' },
        emissions: { kind: 'emissions', cadence: 'none' }
      },
      summaryText: 'Florida: annual registration, no emissions',
      lastUpdated: new Date().toISOString()
    }

    res.status(200).json(mockJurisdiction)

  } catch (error) {
    console.error('Get jurisdiction error:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
