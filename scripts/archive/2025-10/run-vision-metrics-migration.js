#!/usr/bin/env node

// Direct SQL migration runner for vision metrics tables
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://ucbbzzoimghnaoihyqbd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjYmJ6em9pbWdobmFvaWh5cWJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY4NDIxMywiZXhwIjoyMDc0MjYwMjEzfQ.Fq9BQHT8rQ2iNpgugdf-JdvdRYMf1vFTU1pvh88xbag'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createVisionMetricsTables() {
  console.log('🚀 Creating vision metrics tables...')
  
  try {
    // Create vision_metrics table
    const { error: metricsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS vision_metrics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            document_type TEXT NOT NULL,
            processing_time_ms INTEGER NOT NULL,
            success BOOLEAN NOT NULL DEFAULT false,
            confidence DECIMAL(3,2),
            error_code TEXT,
            retry_attempt INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT vision_metrics_confidence_check CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
        );
      `
    })

    if (metricsError) {
      console.error('❌ Error creating vision_metrics table:', metricsError)
    } else {
      console.log('✅ Created vision_metrics table')
    }

    // Create vision_accuracy table
    const { error: accuracyError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS vision_accuracy (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL,
            document_type TEXT NOT NULL,
            field_name TEXT NOT NULL,
            is_correct BOOLEAN NOT NULL,
            predicted_confidence DECIMAL(3,2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT vision_accuracy_confidence_check CHECK (predicted_confidence >= 0 AND predicted_confidence <= 1)
        );
      `
    })

    if (accuracyError) {
      console.error('❌ Error creating vision_accuracy table:', accuracyError)
    } else {
      console.log('✅ Created vision_accuracy table')
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_vision_metrics_tenant_created ON vision_metrics(tenant_id, created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_vision_metrics_document_type ON vision_metrics(document_type);',
      'CREATE INDEX IF NOT EXISTS idx_vision_metrics_success ON vision_metrics(success);',
      'CREATE INDEX IF NOT EXISTS idx_vision_accuracy_tenant_created ON vision_accuracy(tenant_id, created_at DESC);',
      'CREATE INDEX IF NOT EXISTS idx_vision_accuracy_field ON vision_accuracy(field_name);',
      'CREATE INDEX IF NOT EXISTS idx_vision_accuracy_document_type ON vision_accuracy(document_type);'
    ]

    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc('exec', { sql: indexSql })
      if (indexError) {
        console.error('❌ Error creating index:', indexError)
      }
    }

    console.log('✅ Created all indexes')

    console.log('🎉 Vision metrics tables created successfully!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

createVisionMetricsTables()
