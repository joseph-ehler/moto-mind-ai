/**
 * Test Few-Shot Example Impact
 * Measures extraction quality with vs without few-shot examples
 * Run this to determine if few-shot examples justify token cost
 */

import { OpenAI } from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { DASHBOARD_SYSTEM_PROMPT, DASHBOARD_FEW_SHOT } from '../prompts/dashboard'
import { DASHBOARD_JSON_SCHEMA } from '../schemas/fields'
import { processDashboardExtraction } from '../validators/dashboard'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface TestCase {
  name: string
  imageBase64: string
  expectedOdometer: number | null
  expectedFuelEighths: number | null
  expectedTripA: number | null
}

interface TestResult {
  testCase: string
  withFewShot: {
    odometer: number | null
    fuel: number | null
    tripA: number | null
    confidence: number
    errors: string[]
    inputTokens: number
    outputTokens: number
    cost: number
  }
  withoutFewShot: {
    odometer: number | null
    fuel: number | null
    tripA: number | null
    confidence: number
    errors: string[]
    inputTokens: number
    outputTokens: number
    cost: number
  }
  accuracy: {
    withFewShot: boolean
    withoutFewShot: boolean
  }
}

/**
 * Build prompt WITH few-shot examples
 */
function buildPromptWithFewShot(imageBase64: string): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: DASHBOARD_SYSTEM_PROMPT
    }
  ]

  // Add few-shot examples
  DASHBOARD_FEW_SHOT.forEach(example => {
    messages.push(
      {
        role: 'user',
        content: `Extract from: ${example.scenario}`
      },
      {
        role: 'assistant',
        content: JSON.stringify(example.correct, null, 2)
      }
    )
  })

  // Add actual request
  messages.push({
    role: 'user',
    content: [
      {
        type: 'text',
        text: `Extract dashboard data. Return JSON matching this schema:\n\`\`\`json\n${JSON.stringify(DASHBOARD_JSON_SCHEMA, null, 2)}\n\`\`\``
      },
      {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`
        }
      }
    ]
  })

  return messages
}

/**
 * Build prompt WITHOUT few-shot examples
 */
function buildPromptWithoutFewShot(imageBase64: string): ChatCompletionMessageParam[] {
  return [
    {
      role: 'system',
      content: DASHBOARD_SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Extract dashboard data. Return JSON matching this schema:\n\`\`\`json\n${JSON.stringify(DASHBOARD_JSON_SCHEMA, null, 2)}\n\`\`\``
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`
          }
        }
      ]
    }
  ]
}

/**
 * Calculate OpenAI API cost
 */
function calculateCost(inputTokens: number, outputTokens: number): number {
  // GPT-4o pricing (as of 2024): $5/1M input, $15/1M output
  const inputCost = (inputTokens / 1_000_000) * 5
  const outputCost = (outputTokens / 1_000_000) * 15
  return inputCost + outputCost
}

/**
 * Run single extraction test
 */
async function runExtraction(messages: ChatCompletionMessageParam[]) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    response_format: { type: 'json_object' },
    temperature: 0  // Deterministic for testing
  })

  const rawData = JSON.parse(response.choices[0].message.content || '{}')
  const { data, validation } = processDashboardExtraction(rawData)

  return {
    data,
    validation,
    usage: response.usage!
  }
}

/**
 * Test single case with and without few-shot
 */
async function testCase(testCase: TestCase): Promise<TestResult> {
  console.log(`\n📸 Testing: ${testCase.name}`)

  // Test WITH few-shot
  console.log('  🎯 With few-shot examples...')
  const withFewShotMessages = buildPromptWithFewShot(testCase.imageBase64)
  const withFewShotResult = await runExtraction(withFewShotMessages)

  // Test WITHOUT few-shot
  console.log('  🎯 Without few-shot examples...')
  const withoutFewShotMessages = buildPromptWithoutFewShot(testCase.imageBase64)
  const withoutFewShotResult = await runExtraction(withoutFewShotMessages)

  // Check accuracy
  const withFewShotCorrect = 
    withFewShotResult.data.odometer_miles === testCase.expectedOdometer &&
    withFewShotResult.data.fuel_eighths === testCase.expectedFuelEighths &&
    withFewShotResult.data.trip_a_miles === testCase.expectedTripA

  const withoutFewShotCorrect =
    withoutFewShotResult.data.odometer_miles === testCase.expectedOdometer &&
    withoutFewShotResult.data.fuel_eighths === testCase.expectedFuelEighths &&
    withoutFewShotResult.data.trip_a_miles === testCase.expectedTripA

  return {
    testCase: testCase.name,
    withFewShot: {
      odometer: withFewShotResult.data.odometer_miles,
      fuel: withFewShotResult.data.fuel_eighths,
      tripA: withFewShotResult.data.trip_a_miles,
      confidence: withFewShotResult.data.confidence,
      errors: withFewShotResult.validation.errors,
      inputTokens: withFewShotResult.usage.prompt_tokens,
      outputTokens: withFewShotResult.usage.completion_tokens,
      cost: calculateCost(
        withFewShotResult.usage.prompt_tokens,
        withFewShotResult.usage.completion_tokens
      )
    },
    withoutFewShot: {
      odometer: withoutFewShotResult.data.odometer_miles,
      fuel: withoutFewShotResult.data.fuel_eighths,
      tripA: withoutFewShotResult.data.trip_a_miles,
      confidence: withoutFewShotResult.data.confidence,
      errors: withoutFewShotResult.validation.errors,
      inputTokens: withoutFewShotResult.usage.prompt_tokens,
      outputTokens: withoutFewShotResult.usage.completion_tokens,
      cost: calculateCost(
        withoutFewShotResult.usage.prompt_tokens,
        withoutFewShotResult.usage.completion_tokens
      )
    },
    accuracy: {
      withFewShot: withFewShotCorrect,
      withoutFewShot: withoutFewShotCorrect
    }
  }
}

/**
 * Run full test suite
 */
export async function testFewShotImpact(testCases: TestCase[]) {
  console.log('🧪 Testing Few-Shot Example Impact\n')
  console.log(`Running ${testCases.length} test cases...\n`)

  const results: TestResult[] = []

  for (const testCase of testCases) {
    const result = await testCase(testCase)
    results.push(result)

    // Log result
    console.log(`  ✅ With few-shot: ${result.accuracy.withFewShot ? 'CORRECT' : 'WRONG'}`)
    console.log(`  ✅ Without few-shot: ${result.accuracy.withoutFewShot ? 'CORRECT' : 'WRONG'}`)
  }

  // Calculate summary statistics
  const withFewShotCorrect = results.filter(r => r.accuracy.withFewShot).length
  const withoutFewShotCorrect = results.filter(r => r.accuracy.withoutFewShot).length

  const avgWithFewShotCost = results.reduce((sum, r) => sum + r.withFewShot.cost, 0) / results.length
  const avgWithoutFewShotCost = results.reduce((sum, r) => sum + r.withoutFewShot.cost, 0) / results.length

  const avgWithFewShotTokens = results.reduce((sum, r) => sum + r.withFewShot.inputTokens + r.withFewShot.outputTokens, 0) / results.length
  const avgWithoutFewShotTokens = results.reduce((sum, r) => sum + r.withoutFewShot.inputTokens + r.withoutFewShot.outputTokens, 0) / results.length

  // Print summary
  console.log('\n📊 SUMMARY\n')
  console.log('Accuracy:')
  console.log(`  With few-shot:    ${withFewShotCorrect}/${results.length} (${(withFewShotCorrect / results.length * 100).toFixed(1)}%)`)
  console.log(`  Without few-shot: ${withoutFewShotCorrect}/${results.length} (${(withoutFewShotCorrect / results.length * 100).toFixed(1)}%)`)
  
  console.log('\nCost per extraction:')
  console.log(`  With few-shot:    $${avgWithFewShotCost.toFixed(6)}`)
  console.log(`  Without few-shot: $${avgWithoutFewShotCost.toFixed(6)}`)
  console.log(`  Savings:          $${(avgWithFewShotCost - avgWithoutFewShotCost).toFixed(6)} (${((1 - avgWithoutFewShotCost / avgWithFewShotCost) * 100).toFixed(1)}%)`)

  console.log('\nTokens per extraction:')
  console.log(`  With few-shot:    ${avgWithFewShotTokens.toFixed(0)} tokens`)
  console.log(`  Without few-shot: ${avgWithoutFewShotTokens.toFixed(0)} tokens`)
  console.log(`  Reduction:        ${(avgWithFewShotTokens - avgWithoutFewShotTokens).toFixed(0)} tokens (${((1 - avgWithoutFewShotTokens / avgWithFewShotTokens) * 100).toFixed(1)}%)`)

  // Recommendation
  console.log('\n💡 RECOMMENDATION\n')
  
  if (withFewShotCorrect === withoutFewShotCorrect) {
    console.log('✅ Remove few-shot examples - they provide no accuracy benefit')
    console.log(`   Save $${(avgWithFewShotCost - avgWithoutFewShotCost).toFixed(6)} per extraction`)
    console.log(`   At 1000 extractions/month: $${((avgWithFewShotCost - avgWithoutFewShotCost) * 1000).toFixed(2)} savings`)
  } else if (withFewShotCorrect > withoutFewShotCorrect) {
    const accuracyGain = ((withFewShotCorrect - withoutFewShotCorrect) / results.length) * 100
    const costIncrease = avgWithFewShotCost - avgWithoutFewShotCost
    console.log(`⚖️  Keep few-shot examples - they improve accuracy by ${accuracyGain.toFixed(1)}%`)
    console.log(`   Cost increase: $${costIncrease.toFixed(6)} per extraction`)
    console.log(`   At 1000 extractions/month: $${(costIncrease * 1000).toFixed(2)} additional cost`)
  } else {
    console.log('❌ Few-shot examples make accuracy WORSE - remove them immediately!')
  }

  return {
    results,
    summary: {
      withFewShotAccuracy: withFewShotCorrect / results.length,
      withoutFewShotAccuracy: withoutFewShotCorrect / results.length,
      avgCostWithFewShot: avgWithFewShotCost,
      avgCostWithoutFewShot: avgWithoutFewShotCost,
      avgTokensWithFewShot: avgWithFewShotTokens,
      avgTokensWithoutFewShot: avgWithoutFewShotTokens
    }
  }
}

// Example usage
if (require.main === module) {
  const testCases: TestCase[] = [
    // Add your real dashboard photos here
    // Example:
    // {
    //   name: 'Honda dashboard with trip meter',
    //   imageBase64: 'base64string...',
    //   expectedOdometer: 85432,
    //   expectedFuelEighths: 8,
    //   expectedTripA: 234.1
    // }
  ]

  if (testCases.length === 0) {
    console.log('❌ No test cases provided')
    console.log('\nAdd real dashboard photos to testCases array:')
    console.log('1. Upload dashboard photos')
    console.log('2. Convert to base64')
    console.log('3. Manually verify expected values')
    console.log('4. Add to testCases array')
    console.log('5. Run: npm run test:few-shot-impact')
    process.exit(1)
  }

  testFewShotImpact(testCases)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err)
      process.exit(1)
    })
}
