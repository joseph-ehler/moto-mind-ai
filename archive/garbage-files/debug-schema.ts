import type { NextApiRequest, NextApiResponse } from 'next'
import { Pool } from 'pg'
import { config } from 'dotenv'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const client = await pool.connect()

  try {
    // Check uploads table columns
    const uploadsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'uploads' 
      ORDER BY ordinal_position
    `)

    // Check manual_events table columns
    const eventsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'manual_events' 
      ORDER BY ordinal_position
    `)

    // Check vehicles table columns
    const vehiclesColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'vehicles' 
      ORDER BY ordinal_position
    `)

    return res.status(200).json({
      uploads: uploadsColumns.rows,
      manual_events: eventsColumns.rows,
      vehicles: vehiclesColumns.rows
    })

  } catch (error) {
    console.error('Schema debug error:', error)
    return res.status(500).json({
      error: 'Failed to get schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    client.release()
  }
}
