export interface FuelReceiptData {
  gallons?: number
  total_cost?: number
  price_per_gallon?: number
  station_name?: string
  date?: string
  ocr_confidence: number
  source: 'tesseract_ocr' | 'openai_vision'
}
