/**
 * Event Utility Functions
 * 
 * Helper functions for event detail page
 */

import jsPDF from 'jspdf'
import type { EventData } from '@/types/event'

/**
 * Format date without timezone conversion
 * Prevents off-by-one day errors when displaying dates
 */
export const formatDateWithoutTimezone = (
  dateString: string, 
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateStr = dateString?.split('T')[0] // Get YYYY-MM-DD
  if (!dateStr) return 'Unknown'
  const [year, month, day] = dateStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return date.toLocaleDateString('en-US', options || { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Generate PDF receipt for an event
 */
export const generateEventPDF = (event: EventData): void => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Fuel Fill-Up Receipt', 105, 20, { align: 'center' })
  
  // Subheader
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('MotoMind AI', 105, 27, { align: 'center' })
  
  doc.setTextColor(0, 0, 0)
  let yPos = 40
  
  // Date & Location Section
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Event Details', 20, yPos)
  yPos += 8
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${formatDateWithoutTimezone(event.date)}`, 20, yPos)
  yPos += 6
  if (event.payload?.time) {
    doc.text(`Time: ${event.payload.time}`, 20, yPos)
    yPos += 6
  }
  doc.text(`Station: ${event.display_vendor || event.vendor || 'Unknown'}`, 20, yPos)
  yPos += 6
  if (event.geocoded_address) {
    doc.text(`Address: ${event.geocoded_address}`, 20, yPos)
    yPos += 6
  }
  
  yPos += 6
  
  // Financial Summary
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Financial Summary', 20, yPos)
  yPos += 8
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Cost: $${event.total_amount?.toFixed(2) || '0.00'}`, 20, yPos)
  yPos += 6
  doc.text(`Gallons: ${event.gallons?.toFixed(2) || '0.00'} gal`, 20, yPos)
  yPos += 6
  const pricePerGallon = event.total_amount && event.gallons ? (event.total_amount / event.gallons).toFixed(2) : '0.00'
  doc.text(`Price per Gallon: $${pricePerGallon}`, 20, yPos)
  yPos += 6
  if (event.payload?.tax_amount) {
    doc.text(`Tax: $${event.payload.tax_amount}`, 20, yPos)
    yPos += 6
  }
  
  yPos += 6
  
  // Weather Conditions
  if (event.weather_temperature_f) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Weather Conditions', 20, yPos)
    yPos += 8
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Temperature: ${event.weather_temperature_f}°F`, 20, yPos)
    yPos += 6
    if (event.weather_condition) {
      doc.text(`Condition: ${event.weather_condition}`, 20, yPos)
      yPos += 6
    }
    if (event.weather_windspeed_mph) {
      doc.text(`Wind Speed: ${event.weather_windspeed_mph} mph`, 20, yPos)
      yPos += 6
    }
    
    yPos += 6
  }
  
  // Vehicle Information
  if (event.vehicle) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Vehicle', 20, yPos)
    yPos += 8
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${event.vehicle.year} ${event.vehicle.make} ${event.vehicle.model}`, 20, yPos)
    yPos += 6
    if (event.miles) {
      doc.text(`Odometer: ${event.miles.toLocaleString()} miles`, 20, yPos)
      yPos += 6
    }
  }
  
  yPos += 6
  
  // Notes
  if (event.notes) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes', 20, yPos)
    yPos += 8
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const splitNotes = doc.splitTextToSize(event.notes, 170)
    doc.text(splitNotes, 20, yPos)
    yPos += (splitNotes.length * 6) + 6
  }
  
  // Footer with AI disclaimer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('✨ Some data enhanced by AI. Always verify important information.', 105, pageHeight - 15, { align: 'center' })
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, pageHeight - 10, { align: 'center' })
  
  // Generate filename
  const dateStr = event.date.split('T')[0]
  const vendorSlug = (event.display_vendor || event.vendor || 'fuel-fillup').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  const filename = `${dateStr}-${vendorSlug}.pdf`
  
  // Download
  doc.save(filename)
}
