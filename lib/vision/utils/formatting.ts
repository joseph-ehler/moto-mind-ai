// Formatting Utilities
// Pure functions for date, amount, and vendor formatting

/**
 * Extracts vendor name from various possible fields
 */
export function extractVendor(data: any): string | null {
  const vendorFields = [
    'vendor_name', 'business_name', 'shop_name', 'station_name', 
    'company_name', 'merchant_name', 'insurance_company'
  ]
  
  // Check top level
  for (const field of vendorFields) {
    if (data[field] && typeof data[field] === 'string') {
      return data[field]
    }
  }
  
  // Check extracted_data
  if (data.extracted_data) {
    for (const field of vendorFields) {
      if (data.extracted_data[field] && typeof data.extracted_data[field] === 'string') {
        return data.extracted_data[field]
      }
    }
  }
  
  return null
}

/**
 * Extracts amount from various possible fields
 */
export function extractAmount(data: any): number | null {
  const amountFields = ['total_amount', 'amount', 'cost', 'price', 'fee']
  
  // Check top level
  for (const field of amountFields) {
    const value = data[field]
    if (typeof value === 'number' && value > 0) {
      return value
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[$,]/g, ''))
      if (!isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }
  }
  
  // Check extracted_data
  if (data.extracted_data) {
    for (const field of amountFields) {
      const value = data.extracted_data[field]
      if (typeof value === 'number' && value > 0) {
        return value
      }
      if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[$,]/g, ''))
        if (!isNaN(parsed) && parsed > 0) {
          return parsed
        }
      }
    }
  }
  
  return null
}

/**
 * Extracts date from various possible fields
 */
export function extractDate(data: any): string | null {
  const dateFields = ['date', 'service_date', 'transaction_date', 'accident_date']
  
  // Check top level
  for (const field of dateFields) {
    if (data[field] && typeof data[field] === 'string') {
      return data[field]
    }
  }
  
  // Check extracted_data
  if (data.extracted_data) {
    for (const field of dateFields) {
      if (data.extracted_data[field] && typeof data.extracted_data[field] === 'string') {
        return data.extracted_data[field]
      }
    }
  }
  
  return null
}

/**
 * Formats date for display
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return dateStr // Return original if invalid
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}
