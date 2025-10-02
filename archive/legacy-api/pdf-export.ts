// MotoMindAI: PDF Export API
// Generates clean, professional vehicle reports

import type { NextApiRequest, NextApiResponse } from 'next'
import { withTenantTransaction } from '../../backend/database'

// Mock auth for development
function mockAuth(req: NextApiRequest) {
  return {
    tenantId: 'demo-tenant-123',
    userId: 'demo-user-456',
    role: 'owner'
  }
}

interface PDFExportRequest {
  explanationId: string
  format?: 'summary' | 'detailed'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const auth = mockAuth(req)
    const { explanationId, format = 'summary' }: PDFExportRequest = req.body

    if (!explanationId) {
      return res.status(400).json({ error: 'explanationId required' })
    }

    // Get explanation data with related information
    const result = await withTenantTransaction(
      { tenantId: auth.tenantId, userId: auth.userId },
      async (client) => {
        // Get explanation with vehicle and metrics
        const explanationQuery = await client.query(`
          SELECT 
            e.*,
            v.label as vehicle_label,
            v.make,
            v.model,
            v.vin,
            vm.fuel_efficiency_mpg,
            vm.miles_driven,
            vm.data_completeness_pct,
            vm.metric_date,
            t.name as tenant_name
          FROM explanations e
          JOIN vehicles v ON e.vehicle_id = v.id
          LEFT JOIN vehicle_metrics vm ON v.id = vm.vehicle_id 
            AND vm.metric_date = (
              SELECT MAX(metric_date) 
              FROM vehicle_metrics 
              WHERE vehicle_id = v.id
            )
          JOIN tenants t ON e.tenant_id = t.id
          WHERE e.id = $1 AND e.tenant_id = $2
        `, [explanationId, auth.tenantId])

        if (explanationQuery.rows.length === 0) {
          throw new Error('Explanation not found')
        }

        const data = explanationQuery.rows[0]
        
        // Get related manual events for evidence
        const eventsQuery = await client.query(`
          SELECT event_type, payload, confidence, created_at
          FROM manual_events
          WHERE tenant_id = $1 AND vehicle_id = $2
            AND DATE(created_at) = DATE($3)
          ORDER BY created_at DESC
        `, [auth.tenantId, data.vehicle_id, data.created_at])

        return {
          explanation: data,
          events: eventsQuery.rows
        }
      }
    )

    // Generate HTML content for PDF
    const htmlContent = generatePDFHTML(result, format)
    
    // For now, return HTML that can be printed to PDF by browser
    // In production, you'd use puppeteer or similar to generate actual PDF
    res.setHeader('Content-Type', 'text/html')
    res.status(200).send(htmlContent)

  } catch (error) {
    console.error('PDF export error:', error)
    return res.status(500).json({ error: 'Failed to generate PDF export' })
  }
}

function generatePDFHTML(data: any, format: string): string {
  const { explanation, events } = data
  const reasoning = typeof explanation.reasoning === 'string' 
    ? JSON.parse(explanation.reasoning) 
    : explanation.reasoning

  const currentDate = new Date().toLocaleDateString()
  const reportDate = new Date(explanation.created_at).toLocaleDateString()

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Fleet Intelligence Report - ${explanation.vehicle_label}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .report-title {
      font-size: 20px;
      color: #1f2937;
      margin: 0;
    }
    .vehicle-info {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .vehicle-info h3 {
      margin-top: 0;
      color: #374151;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-label {
      font-weight: 600;
      color: #6b7280;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h3 {
      color: #1f2937;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .answer {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 0 8px 8px 0;
    }
    .causes, .recommendations {
      background: #f0f9ff;
      border-left: 4px solid #0ea5e9;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 0 8px 8px 0;
    }
    .evidence {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 0 8px 8px 0;
    }
    .evidence-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #dcfce7;
    }
    .evidence-item:last-child {
      border-bottom: none;
    }
    .metric-name {
      font-weight: 600;
    }
    .metric-value {
      font-family: 'Monaco', monospace;
      background: #ffffff;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #d1d5db;
    }
    .data-quality {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin-bottom: 20px;
      border-radius: 0 8px 8px 0;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    .signature-line {
      margin-top: 40px;
      border-bottom: 1px solid #374151;
      width: 300px;
      padding-bottom: 5px;
    }
    .confidence-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .confidence-high {
      background: #dcfce7;
      color: #166534;
    }
    .confidence-medium {
      background: #fef3c7;
      color: #92400e;
    }
    .confidence-low {
      background: #fee2e2;
      color: #991b1b;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .header {
        break-after: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">MotoMindAI</div>
    <h1 class="report-title">Fleet Intelligence Report</h1>
    <p>Generated on ${currentDate} | Report Date: ${reportDate}</p>
  </div>

  <div class="vehicle-info">
    <h3>Vehicle Information</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Vehicle:</span>
        <span>${explanation.vehicle_label}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Make/Model:</span>
        <span>${explanation.make} ${explanation.model}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Current MPG:</span>
        <span>${explanation.fuel_efficiency_mpg || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Data Quality:</span>
        <span>${explanation.data_completeness_pct}%</span>
      </div>
    </div>
  </div>

  <div class="section">
    <h3>Question Asked</h3>
    <p><strong>"${explanation.question}"</strong></p>
  </div>

  <div class="section">
    <h3>Analysis Results 
      <span class="confidence-badge confidence-${explanation.confidence}">
        ${explanation.confidence} confidence
      </span>
    </h3>
    
    <div class="answer">
      <h4>Summary</h4>
      <p>${reasoning.answer || 'Analysis complete - see details below.'}</p>
    </div>

    ${reasoning.rootCause && reasoning.rootCause.length > 0 ? `
    <div class="causes">
      <h4>Root Causes Identified</h4>
      <ul>
        ${reasoning.rootCause.map((cause: string) => `<li>${cause}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${reasoning.supportingData && reasoning.supportingData.length > 0 ? `
    <div class="evidence">
      <h4>Supporting Evidence</h4>
      ${reasoning.supportingData.map((item: any) => `
        <div class="evidence-item">
          <span class="metric-name">${item.metric}</span>
          <span class="metric-value">${item.value}${item.threshold ? ` (threshold: ${item.threshold})` : ''}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${reasoning.recommendations && reasoning.recommendations.length > 0 ? `
    <div class="recommendations">
      <h4>Recommended Actions</h4>
      <ul>
        ${reasoning.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
  </div>

  ${events.length > 0 ? `
  <div class="section">
    <h3>Data Sources</h3>
    <div class="evidence">
      ${events.map((event: any) => `
        <div class="evidence-item">
          <span class="metric-name">${event.event_type.replace('_', ' ')}</span>
          <span class="metric-value">${event.confidence}% confidence</span>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${explanation.data_completeness_pct < 80 ? `
  <div class="data-quality">
    <h4>Data Quality Notice</h4>
    <p>This analysis is based on ${explanation.data_completeness_pct}% complete data. 
    Adding more vehicle data (odometer readings, fuel receipts, maintenance records) 
    will improve the accuracy and confidence of future analyses.</p>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>MotoMindAI Fleet Intelligence Report</strong></p>
    <p>This report was generated using smartphone-captured vehicle data and AI analysis. 
    All recommendations should be verified by qualified mechanics before implementation.</p>
    <p>Report ID: ${explanation.id} | Tenant: ${explanation.tenant_name}</p>
    
    <div class="signature-line"></div>
    <p style="margin-top: 10px;">Authorized Signature & Date</p>
  </div>
</body>
</html>
  `
}
