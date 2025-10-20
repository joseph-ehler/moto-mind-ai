/**
 * NHTSA Data Parser
 * 
 * Parses TSV files from NHTSA flat file downloads
 * - Complaints (FLAT_CMPL.txt)
 * - Investigations (FLAT_INV.txt)
 */

import * as fs from 'fs'
import { parse } from 'csv-parse/sync'
import { parse as parseStream } from 'csv-parse'

export interface ComplaintRecord {
  // Identifiers
  odiNumber: string
  nhtsaId?: string
  
  // Vehicle info
  make: string
  model: string
  year: string
  vin?: string
  
  // Complaint details
  date: Date
  component: string
  summary: string
  description: string
  
  // Incident details
  crash: boolean
  fire: boolean
  injured: number
  deaths: number
  
  // Context
  mileage?: number
  failDate?: Date
  speed?: number
  
  // Location
  city?: string
  state?: string
  
  // Follow-up
  manufacturerCampaign?: string
}

export interface InvestigationRecord {
  // Identifiers
  nhtsaId: string
  
  // Vehicle info
  make: string
  model: string
  year: string
  
  // Investigation details
  component: string
  subject: string
  summary: string
  
  // Status
  openDate: Date
  closeDate?: Date
  action?: string
  
  // Impact
  potentialAffected?: number
}

export class NHTSAParser {
  
  /**
   * Parse complaints file (TSV format) using streaming for large files
   */
  async parseComplaints(filePath: string, maxRecords?: number): Promise<ComplaintRecord[]> {
    console.log(`\n📋 Parsing complaints: ${filePath}`)
    
    return new Promise((resolve, reject) => {
      const records: ComplaintRecord[] = []
      let recordCount = 0
      
      // Define NHTSA complaint column names (49 total fields)
      const columns = [
        'CMPLID', 'ODINO', 'MFR_NAME', 'MAKETXT', 'MODELTXT', 'YEARTXT',
        'CRASH', 'FAILDATE', 'FIRE', 'INJURED', 'DEATHS', 'COMPDESC',
        'CITY', 'STATE', 'VIN', 'DATEA', 'LDATE', 'MILES', 'OCCURENCES',
        'CDESCR', 'CMPL_TYPE', 'POLICE_RPT_YN', 'PURCH_DT', 'ORIG_OWNER_YN',
        'ANTI_BRAKES_YN', 'CRUISE_CONT_YN', 'NUM_CYLS', 'DRIVE_TRAIN',
        'FUEL_SYS', 'FUEL_TYPE', 'TRANS_TYPE', 'VEH_SPEED', 'DOT',
        'TIRE_SIZE', 'LOC_OF_TIRE', 'TIRE_FAIL_TYPE', 'ORIG_EQUIP_YN',
        'MANUF_DT', 'SEAT_TYPE', 'RESTRAINT_TYPE', 'DEALER_NAME',
        'DEALER_TEL', 'DEALER_CITY', 'DEALER_STATE', 'DEALER_ZIP',
        'PROD_TYPE', 'REPAIRED_YN', 'MEDICAL_ATTN', 'VEHICLES_TOWED_YN'
      ]
      
      const stream = fs.createReadStream(filePath, { encoding: 'utf-8' })
        .pipe(parseStream({
          columns: columns,
          delimiter: '\t',
          skip_empty_lines: true,
          relax_quotes: true,
          relax_column_count: true,
          relax_column_count_more: true,
          skip_records_with_error: true,
          trim: true,
          escape: '\\',
          quote: '"'
        }))
      
      stream.on('data', (row: any) => {
        recordCount++
        
        // Show progress every 100k records
        if (recordCount % 100000 === 0) {
          process.stdout.write(`\r   Parsing: ${(recordCount / 1000).toFixed(0)}k records`)
        }
        
        // Parse and validate
        const record = this.parseComplaintRow(row)
        if (record.make && record.model && record.year) {
          records.push(record)
        }
        
        // Stop at max if specified (for testing)
        if (maxRecords && records.length >= maxRecords) {
          stream.destroy()
        }
      })
      
      stream.on('end', () => {
        console.log(`\n   Found ${recordCount} total records`)
        console.log(`   Valid records: ${records.length}`)
        resolve(records)
      })
      
      stream.on('error', (error) => {
        reject(error)
      })
    })
  }
  
  /**
   * Parse a single complaint row using NHTSA column names
   */
  private parseComplaintRow(row: any): ComplaintRecord {
    return {
      // Identifiers (CMPLID is unique ID, ODINO is reference number)
      odiNumber: row.ODINO || row.CMPLID || '',
      nhtsaId: row.CMPLID || undefined,
      
      // Vehicle
      make: this.normalizeMake(row.MAKETXT || ''),
      model: this.normalizeModel(row.MODELTXT || ''),
      year: (row.YEARTXT || '').toString(),
      vin: row.VIN || undefined,
      
      // Details
      date: this.parseDate(row.DATEA) || new Date(), // Date added to file
      component: row.COMPDESC || '', // Component description
      summary: row.CDESCR || '', // Complaint description (2048 chars)
      description: row.CDESCR || '',
      
      // Incident
      crash: this.parseBoolean(row.CRASH),
      fire: this.parseBoolean(row.FIRE),
      injured: this.parseNumber(row.INJURED),
      deaths: this.parseNumber(row.DEATHS),
      
      // Context
      mileage: this.parseNumber(row.MILES) || undefined,
      failDate: this.parseDate(row.FAILDATE) || undefined,
      speed: this.parseNumber(row.VEH_SPEED) || undefined,
      
      // Location
      city: row.CITY || undefined,
      state: row.STATE || undefined,
      
      // Follow-up (not in flat file, leaving undefined)
      manufacturerCampaign: undefined
    }
  }
  
  /**
   * Parse investigations file (TSV format) using streaming
   */
  async parseInvestigations(filePath: string, maxRecords?: number): Promise<InvestigationRecord[]> {
    console.log(`\n🔍 Parsing investigations: ${filePath}`)
    
    return new Promise((resolve, reject) => {
      const records: InvestigationRecord[] = []
      let recordCount = 0
      
      // Define NHTSA investigation column names (11 total fields)
      const columns = [
        'NHTSA_ACTION_NUMBER', 'MAKE', 'MODEL', 'YEAR', 'COMPNAME',
        'MFR_NAME', 'ODATE', 'CDATE', 'CAMPNO', 'SUBJECT', 'SUMMARY'
      ]
      
      const stream = fs.createReadStream(filePath, { encoding: 'utf-8' })
        .pipe(parseStream({
          columns: columns,
          delimiter: '\t',
          skip_empty_lines: true,
          relax_quotes: true,
          relax_column_count: true,
          relax_column_count_more: true,
          skip_records_with_error: true,
          trim: true,
          escape: '\\',
          quote: '"'
        }))
      
      stream.on('data', (row: any) => {
        recordCount++
        
        // Show progress every 1000 records
        if (recordCount % 1000 === 0) {
          process.stdout.write(`\r   Parsing: ${recordCount} records`)
        }
        
        // Parse and validate
        const record = this.parseInvestigationRow(row)
        if (record.make && record.model && record.year) {
          records.push(record)
        }
        
        // Stop at max if specified (for testing)
        if (maxRecords && records.length >= maxRecords) {
          stream.destroy()
        }
      })
      
      stream.on('end', () => {
        console.log(`\n   Found ${recordCount} total records`)
        console.log(`   Valid records: ${records.length}`)
        resolve(records)
      })
      
      stream.on('error', (error) => {
        reject(error)
      })
    })
  }
  
  /**
   * Parse a single investigation row using NHTSA column names
   */
  private parseInvestigationRow(row: any): InvestigationRecord {
    return {
      nhtsaId: row.NHTSA_ACTION_NUMBER || '',
      
      make: this.normalizeMake(row.MAKE || ''),
      model: this.normalizeModel(row.MODEL || ''),
      year: (row.YEAR || '').toString(),
      
      component: row.COMPNAME || '', // Component description
      subject: row.SUBJECT || '', // Summary description (200 chars)
      summary: row.SUMMARY || '', // Summary detail (6000 chars)
      
      openDate: this.parseDate(row.ODATE) || new Date(), // Date opened
      closeDate: this.parseDate(row.CDATE) || undefined, // Date closed
      action: row.CAMPNO || undefined, // Recall campaign number if applicable
      
      potentialAffected: undefined // Not in flat file
    }
  }
  
  /**
   * Normalize make (uppercase, trim)
   */
  private normalizeMake(make: string): string {
    return make
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9\s-]/g, '') // Remove special chars
  }
  
  /**
   * Normalize model (uppercase, trim)
   */
  private normalizeModel(model: string): string {
    return model
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9\s-]/g, '') // Remove special chars
  }
  
  /**
   * Parse date string (handles multiple formats)
   */
  private parseDate(dateStr: string | undefined): Date | null {
    if (!dateStr || dateStr.trim() === '') return null
    
    try {
      // Try ISO format first
      const isoDate = new Date(dateStr)
      if (!isNaN(isoDate.getTime()) && isoDate.getFullYear() > 1900) {
        return isoDate
      }
      
      // Try MM/DD/YYYY
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const [month, day, year] = parts.map(p => parseInt(p, 10))
        if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
          const date = new Date(year, month - 1, day)
          if (!isNaN(date.getTime())) {
            return date
          }
        }
      }
      
      // Try YYYYMMDD
      if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
        const year = parseInt(dateStr.substring(0, 4), 10)
        const month = parseInt(dateStr.substring(4, 6), 10)
        const day = parseInt(dateStr.substring(6, 8), 10)
        const date = new Date(year, month - 1, day)
        if (!isNaN(date.getTime())) {
          return date
        }
      }
      
    } catch (error) {
      // Fall through to return null
    }
    
    return null
  }
  
  /**
   * Parse boolean (Y/N, true/false, 1/0)
   */
  private parseBoolean(value: string | undefined): boolean {
    if (!value) return false
    
    const normalized = value.toString().toUpperCase().trim()
    return normalized === 'Y' || normalized === 'YES' || normalized === 'TRUE' || normalized === '1'
  }
  
  /**
   * Parse number (handles empty/invalid strings)
   */
  private parseNumber(value: string | undefined): number {
    if (!value || value.trim() === '') return 0
    
    const num = parseInt(value.toString().replace(/,/g, ''), 10)
    return isNaN(num) ? 0 : num
  }
}

/**
 * Singleton instance
 */
let parser: NHTSAParser | null = null

export function getNHTSAParser(): NHTSAParser {
  if (!parser) {
    parser = new NHTSAParser()
  }
  return parser
}
