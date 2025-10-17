import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Test with the exact text from your receipt
  const testReceiptText = `FUEL DEPOT
1 GOODSPRINGS RD.
JEAN, NV 89019
702-761-7000

DATE                07/10/2020
Time                10:40 AM
PUMP                8
TRAN#               171

DETAILS
BASE PRICE      $ 2.97 / GAL
GALLONS            33.1820
TOTAL           $ 98.55

$ 98.55 REG FUEL
$ 4.43 TAX
$-102.98 VISA DEBIT PAID

$0.00 BALANCE

THANK YOU FOR VISITING
FUEL DEPOT`

  console.log('🔍 Testing receipt parsing with text:', testReceiptText)

  // Test patterns
  const patterns = {
    gallons: [
      /(\d+\.?\d*)\s*GAL/i,
      /GAL\s*(\d+\.?\d*)/i,
      /GALLONS?\s*(\d+\.?\d*)/i,
      /(\d+\.?\d*)\s*GALLONS?/i,
      /GALLONS\s+(\d+\.\d+)/i,
      /GALLONS.*?(\d+\.\d{2,4})/i
    ],
    total: [
      /TOTAL\s*\$?(\d+\.?\d*)/i,
      /\$(\d+\.\d{2})\s*TOTAL/i,
      /AMOUNT\s*\$?(\d+\.?\d*)/i,
      /TOTAL\s+\$\s*(\d+\.\d{2})/i,
      /\$\s*(\d{2,3}\.\d{2})(?:\s|$)/,
      /\$\s*(\d+\.\d{2})\s+REG\s+FUEL/i
    ],
    pricePerGallon: [
      /\$(\d+\.\d{3})\/GAL/i,
      /(\d+\.\d{3})\s*\/\s*GAL/i,
      /PPG\s*\$?(\d+\.\d{3})/i,
      /BASE\s+PRICE\s+\$\s*(\d+\.\d{2,3})\s*\/\s*GAL/i,
      /\$\s*(\d+\.\d{2,3})\s*\/\s*GAL/i
    ]
  }

  const results: any = {}

  // Test gallons patterns
  console.log('\n🔍 Testing GALLONS patterns:')
  for (let i = 0; i < patterns.gallons.length; i++) {
    const pattern = patterns.gallons[i]
    const match = testReceiptText.match(pattern)
    console.log(`Pattern ${i + 1}: ${pattern.source}`)
    if (match) {
      console.log(`✅ MATCH: ${match[1]}`)
      if (!results.gallons) results.gallons = parseFloat(match[1])
    } else {
      console.log('❌ No match')
    }
  }

  // Test total patterns
  console.log('\n🔍 Testing TOTAL patterns:')
  for (let i = 0; i < patterns.total.length; i++) {
    const pattern = patterns.total[i]
    const match = testReceiptText.match(pattern)
    console.log(`Pattern ${i + 1}: ${pattern.source}`)
    if (match) {
      console.log(`✅ MATCH: ${match[1]}`)
      if (!results.total_cost) results.total_cost = parseFloat(match[1])
    } else {
      console.log('❌ No match')
    }
  }

  // Test price per gallon patterns
  console.log('\n🔍 Testing PRICE/GAL patterns:')
  for (let i = 0; i < patterns.pricePerGallon.length; i++) {
    const pattern = patterns.pricePerGallon[i]
    const match = testReceiptText.match(pattern)
    console.log(`Pattern ${i + 1}: ${pattern.source}`)
    if (match) {
      console.log(`✅ MATCH: ${match[1]}`)
      if (!results.price_per_gallon) results.price_per_gallon = parseFloat(match[1])
    } else {
      console.log('❌ No match')
    }
  }

  console.log('\n📊 Final results:', results)

  return res.status(200).json({
    success: true,
    testText: testReceiptText,
    extractedData: results,
    patternTests: {
      gallons: patterns.gallons.map(p => p.source),
      total: patterns.total.map(p => p.source),
      pricePerGallon: patterns.pricePerGallon.map(p => p.source)
    }
  })
}
