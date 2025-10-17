// Test endpoint to verify OpenAI Vision is working
import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Test with a simple text prompt first
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: "Say 'OpenAI API is working!' if you can read this."
        }
      ],
      max_tokens: 50,
    })

    const result = response.choices[0]?.message?.content?.trim()

    return res.status(200).json({
      success: true,
      message: result,
      api_key_configured: !!process.env.OPENAI_API_KEY,
      model_used: "gpt-4o-mini"
    })

  } catch (error) {
    console.error('OpenAI test error:', error)
    
    return res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      api_key_configured: !!process.env.OPENAI_API_KEY
    })
  }
}
