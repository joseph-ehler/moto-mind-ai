import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantIsolation } from '@/features/auth'

import { Pool } from 'pg'
import { config } from 'dotenv'
import PDFDocument from 'pdfkit'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

interface ReportData {
  vehicle: any
  explanation: any
  evidence: any[]
  generatedAt: Date
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const client = await pool.connect()

  try {
    const { vehicleId, explanationId, question } = req.body

    if (!vehicleId) {
      return res.status(400).json({ error: 'Vehicle ID is required' })
    }

    console.log('📄 Generating PDF report for vehicle:', vehicleId)

    // Gather report data
    const reportData = await gatherReportData(client, vehicleId, explanationId, question)

    // Generate PDF
    const pdfBuffer = await generatePDFReport(reportData)

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="vehicle-report-${vehicleId}-${Date.now()}.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)

    res.status(200).send(pdfBuffer)

  } catch (error) {
    console.error('PDF generation error:', error)
    return res.status(500).json({
      error: 'Failed to generate PDF report',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    client.release()
  }
}

async function gatherReportData(client: any, vehicleId: string, explanationId?: string, question?: string): Promise<ReportData> {
  // Get vehicle details
  const vehicleResult = await client.query(`
    SELECT v.*, t.name as tenant_name 
    FROM vehicles v 
    JOIN tenants t ON v.tenant_id = t.id 
    WHERE v.id = $1
  `, [vehicleId])

  if (vehicleResult.rows.length === 0) {
    throw new Error('Vehicle not found')
  }

  const vehicle = vehicleResult.rows[0]

  // Get recent events for evidence
  const eventsResult = await client.query(`
    SELECT event_type, payload, confidence, created_at, verified_by_user
    FROM manual_events 
    WHERE vehicle_id = $1 
    AND created_at > NOW() - INTERVAL '30 days'
    ORDER BY created_at DESC
    LIMIT 10
  `, [vehicleId])

  const evidence = eventsResult.rows.map(event => ({
    type: event.event_type,
    data: event.payload,
    confidence: event.confidence,
    date: event.created_at,
    verified: event.verified_by_user,
    source: event.payload.source || 'smartphone_capture'
  }))

  // Get latest metrics
  const metricsResult = await client.query(`
    SELECT * FROM vehicle_metrics 
    WHERE vehicle_id = $1 
    ORDER BY metric_date DESC 
    LIMIT 1
  `, [vehicleId])

  const metrics = metricsResult.rows[0]

  // Get real explanation from our explain-with-guardrails API
  let explanation
  try {
    const explanationResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3006'}/api/explain-with-guardrails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId,
        question: question || 'Why is my fuel efficiency different from expected?',
        context: 'pdf_report'
      })
    })

    if (explanationResponse.ok) {
      const explanationData = await explanationResponse.json()
      explanation = {
        question: question || 'Vehicle performance analysis',
        rootCause: explanationData.rootCause || 'Analysis based on available data',
        evidence: explanationData.evidence || ['Data analysis in progress'],
        nextSteps: explanationData.nextSteps || ['Continue monitoring vehicle performance'],
        confidence: explanationData.confidence || 'Medium',
        dataCompleteness: explanationData.dataQuality?.completeness || 0,
        type: explanationData.type
      }
    } else {
      throw new Error('Explanation API failed')
    }
  } catch (error) {
    console.log('⚠️ Using fallback explanation due to API error:', error)
    // Fallback explanation based on actual data patterns
    const hasRecentData = evidence.length > 0
    const dataCompleteness = hasRecentData ? Math.min(evidence.length * 25, 100) : 0
    
    explanation = {
      question: question || 'Vehicle performance analysis',
      rootCause: hasRecentData 
        ? `Based on ${evidence.length} recent data points, analysis shows mixed data quality.`
        : 'Insufficient recent data for comprehensive analysis.',
      evidence: hasRecentData 
        ? evidence.slice(0, 3).map(e => `${e.type.replace('_', ' ').toUpperCase()} captured on ${new Date(e.date).toLocaleDateString()}`)
        : ['No recent vehicle data available'],
      nextSteps: hasRecentData
        ? ['Add more fuel receipts for better MPG analysis', 'Include maintenance records for comprehensive insights']
        : ['Capture current odometer reading', 'Add recent fuel receipt', 'Begin regular data collection'],
      confidence: hasRecentData ? 'Medium' : 'Low',
      dataCompleteness,
      type: hasRecentData ? 'partial_analysis' : 'insufficient_data'
    }
  }

  return {
    vehicle,
    explanation,
    evidence,
    generatedAt: new Date()
  }
}

async function generatePDFReport(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'LETTER',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })

      const buffers: Buffer[] = []
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers)
        resolve(pdfBuffer)
      })

      // Header Section
      generateHeader(doc, data)
      
      // Vehicle Information
      generateVehicleInfo(doc, data)
      
      // Analysis Section
      generateAnalysis(doc, data)
      
      // Evidence Table
      generateEvidenceTable(doc, data)
      
      // Footer
      generateFooter(doc, data)

      doc.end()

    } catch (error) {
      reject(error)
    }
  })
}

function generateHeader(doc: PDFKit.PDFDocument, data: ReportData) {
  // Company header
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .text('MotoMindAI', 50, 50)
     .fontSize(12)
     .font('Helvetica')
     .text('Fleet Intelligence Report', 50, 75)

  // Report date
  doc.fontSize(10)
     .text(`Generated: ${data.generatedAt.toLocaleDateString()} ${data.generatedAt.toLocaleTimeString()}`, 400, 50)
     .text(`Report ID: ${data.vehicle.id.slice(0, 8)}`, 400, 65)

  // Horizontal line
  doc.moveTo(50, 95)
     .lineTo(550, 95)
     .stroke()

  doc.moveDown(2)
}

function generateVehicleInfo(doc: PDFKit.PDFDocument, data: ReportData) {
  const { vehicle } = data
  const startY = doc.y

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Vehicle Information', 50, startY)

  doc.fontSize(11)
     .font('Helvetica')
     .text(`Vehicle: ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`, 50, startY + 25)
     .text(`Label: ${vehicle.label || 'N/A'}`, 50, startY + 40)
     .text(`VIN: ${vehicle.vin || 'Not provided'}`, 50, startY + 55)

  // Current odometer (from recent events)
  const latestOdometer = data.evidence.find(e => e.type === 'odometer_reading')
  if (latestOdometer) {
    doc.text(`Current Odometer: ${latestOdometer.data.miles?.toLocaleString() || 'N/A'} miles`, 300, startY + 25)
  }

  // Data completeness indicator with real calculation
  const completeness = data.explanation.dataCompleteness
  const completenessColor = completeness >= 80 ? 'green' : completeness >= 50 ? 'orange' : 'red'
  
  doc.text(`Data Completeness: ${completeness}%`, 300, startY + 40)
  
  // Add data quality insights
  if (completeness < 50) {
    doc.fontSize(9)
       .fillColor('red')
       .text('• Low data quality may affect analysis accuracy', 300, startY + 55)
  } else if (completeness < 80) {
    doc.fontSize(9)
       .fillColor('orange')
       .text('• Moderate data quality - add more data for better insights', 300, startY + 55)
  }
  
  if (completeness < 80) {
    doc.fontSize(9)
       .fillColor('gray')
       .text('• Add fuel receipts for better analysis', 300, startY + 55)
  }

  doc.fillColor('black')
  doc.moveDown(3)
}

function generateAnalysis(doc: PDFKit.PDFDocument, data: ReportData) {
  const { explanation } = data
  const startY = doc.y

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Analysis', 50, startY)

  // Question
  if (explanation.question) {
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Question:', 50, startY + 25)
       .font('Helvetica')
       .text(explanation.question, 110, startY + 25, { width: 400 })
  }

  // Root Cause
  doc.fontSize(11)
     .font('Helvetica-Bold')
     .text('Root Cause:', 50, doc.y + 15)
     .font('Helvetica')
     .text(explanation.rootCause, 50, doc.y + 5, { width: 500 })

  // Evidence Points
  if (explanation.evidence && explanation.evidence.length > 0) {
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Key Evidence:', 50, doc.y + 15)

    explanation.evidence.forEach((point: string, index: number) => {
      doc.fontSize(10)
         .font('Helvetica')
         .text(`• ${point}`, 60, doc.y + 5, { width: 480 })
    })
  }

  // Next Steps
  if (explanation.nextSteps && explanation.nextSteps.length > 0) {
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .text('Recommended Actions:', 50, doc.y + 15)

    explanation.nextSteps.forEach((step: string, index: number) => {
      doc.fontSize(10)
         .font('Helvetica')
         .text(`${index + 1}. ${step}`, 60, doc.y + 5, { width: 480 })
    })
  }

  // Confidence indicator
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text(`Analysis Confidence: ${explanation.confidence}`, 50, doc.y + 20)

  doc.moveDown(2)
}

function generateEvidenceTable(doc: PDFKit.PDFDocument, data: ReportData) {
  const startY = doc.y

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('Supporting Data', 50, startY)

  // Table headers
  const tableTop = startY + 25
  const col1 = 50   // Date
  const col2 = 120  // Type
  const col3 = 220  // Value
  const col4 = 350  // Confidence
  const col5 = 450  // Source

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('Date', col1, tableTop)
     .text('Type', col2, tableTop)
     .text('Value', col3, tableTop)
     .text('Confidence', col4, tableTop)
     .text('Source', col5, tableTop)

  // Table line
  doc.moveTo(col1, tableTop + 15)
     .lineTo(550, tableTop + 15)
     .stroke()

  // Table rows
  let rowY = tableTop + 25
  const maxRows = Math.min(data.evidence.length, 8) // Fit on one page

  data.evidence.slice(0, maxRows).forEach((item, index) => {
    const date = new Date(item.date).toLocaleDateString()
    const type = item.type.replace('_', ' ').toUpperCase()
    
    let value = 'N/A'
    if (item.type === 'odometer_reading' && item.data.miles) {
      value = `${item.data.miles.toLocaleString()} mi`
    } else if (item.type === 'fuel_purchase' && item.data.gallons) {
      value = `${item.data.gallons} gal`
    }

    const confidence = `${item.confidence}%`
    const source = item.verified ? '✓ Verified' : 'Auto-extracted'

    doc.fontSize(9)
       .font('Helvetica')
       .text(date, col1, rowY)
       .text(type, col2, rowY)
       .text(value, col3, rowY)
       .text(confidence, col4, rowY)
       .text(source, col5, rowY)

    rowY += 15
  })

  doc.moveDown(2)
}

function generateFooter(doc: PDFKit.PDFDocument, data: ReportData) {
  const pageHeight = doc.page.height
  const footerY = pageHeight - 100

  // Signature line
  doc.moveTo(50, footerY)
     .lineTo(250, footerY)
     .stroke()

  doc.fontSize(9)
     .text('Technician Signature', 50, footerY + 10)
     .text('Date: _______________', 50, footerY + 25)

  // Disclaimer
  doc.fontSize(8)
     .fillColor('gray')
     .text('This report is generated by MotoMindAI based on smartphone-captured data. For critical decisions, consult a qualified technician.', 50, footerY + 50, { width: 500 })

  // QR code placeholder (future enhancement)
  doc.rect(450, footerY - 20, 50, 50)
     .stroke()
  doc.fontSize(7)
     .text('QR Code', 460, footerY + 5)
     .text('(View Online)', 455, footerY + 15)
}


export default withTenantIsolation(handler)
