// Debug API to check table structure
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🔍 Checking table structure...')

    // Get table structure using information_schema
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'vehicle_images' 
          ORDER BY ordinal_position;
        `
      })

    if (columnsError) {
      console.error('❌ Error getting table structure:', columnsError)
      
      // Fallback: try a simple select to see what columns exist
      const { data: testData, error: testError } = await supabase
        .from('vehicle_images')
        .select('*')
        .limit(0)

      return res.status(200).json({
        error: 'Could not get table structure',
        columnsError: columnsError.message,
        testError: testError?.message,
        fallbackTest: 'Attempted select * with limit 0'
      })
    }

    console.log('✅ Table structure retrieved:', columns)

    // Also check if table exists at all
    const { data: tableExists, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'vehicle_images'
          );
        `
      })

    return res.status(200).json({
      success: true,
      tableExists: tableExists,
      columns: columns,
      tableError: tableError?.message
    })

  } catch (error) {
    console.error('❌ Debug API error:', error)
    return res.status(500).json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
