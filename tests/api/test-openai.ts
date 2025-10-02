// Test OpenAI API key
import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🧪 Testing OpenAI API key...')
  
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'No OpenAI API key' })
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    console.log('🤖 Making simple OpenAI call...')
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: "Say 'Hello, API key works!'"
        }
      ],
      max_tokens: 10
    })

    const content = response.choices[0]?.message?.content
    console.log('✅ OpenAI response:', content)

    return res.status(200).json({
      success: true,
      response: content,
      model: "gpt-4o"
    })

  } catch (error) {
    console.error('❌ OpenAI test error:', error)
    return res.status(500).json({
      error: 'OpenAI test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
