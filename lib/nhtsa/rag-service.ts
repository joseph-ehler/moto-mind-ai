/**
 * NHTSA RAG (Retrieval-Augmented Generation) Service
 * 
 * "Ask My Car" - Natural language Q&A with citations
 * 
 * Flow:
 * 1. User asks: "Why does my Jeep stall at 45mph?"
 * 2. Generate embedding for question
 * 3. Find similar complaints via vector search
 * 4. Extract patterns and aggregate
 * 5. Generate answer with GPT-4 + citations
 * 6. Return structured response with evidence
 */

import OpenAI from 'openai'
import { getEmbeddingsService } from './embeddings-service'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface Citation {
  odiNumber: string
  date: string
  snippet: string
  component: string
  mileage: number | null
  similarity: number
  crash: boolean
  fire: boolean
}

interface Pattern {
  component: string
  count: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  avgMileage: number | null
}

interface RAGResponse {
  answer: string
  citations: Citation[]
  patterns: Pattern[]
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  relatedQuestions: string[]
}

export class RAGService {
  private embeddings = getEmbeddingsService()
  
  /**
   * Ask a question about a vehicle
   */
  async ask(
    question: string,
    vehicle?: {
      year?: string
      make?: string
      model?: string
    }
  ): Promise<RAGResponse> {
    
    // Step 1: Find similar complaints via vector search
    const similar = await this.embeddings.searchSimilar(question, {
      threshold: 0.65, // Lower threshold for broader matches
      limit: 20, // Get more for better patterns
      year: vehicle?.year,
      make: vehicle?.make,
      model: vehicle?.model
    })
    
    if (similar.length === 0) {
      return this.noResultsResponse(question, vehicle)
    }
    
    // Step 2: Extract patterns
    const patterns = this.extractPatterns(similar)
    
    // Step 3: Format citations
    const citations = this.formatCitations(similar.slice(0, 10))
    
    // Step 4: Generate answer with GPT-4
    const answer = await this.generateAnswer(question, similar, patterns, vehicle)
    
    // Step 5: Assess confidence
    const confidence = this.assessConfidence(similar, patterns)
    
    // Step 6: Generate related questions
    const relatedQuestions = this.generateRelatedQuestions(patterns, vehicle)
    
    return {
      answer,
      citations,
      patterns,
      confidence,
      relatedQuestions
    }
  }
  
  /**
   * Extract problem patterns from similar complaints
   */
  private extractPatterns(complaints: any[]): Pattern[] {
    // Group by component
    const byComponent = new Map<string, any[]>()
    
    for (const c of complaints) {
      if (!c.component) continue
      
      const existing = byComponent.get(c.component) || []
      existing.push(c)
      byComponent.set(c.component, existing)
    }
    
    // Create patterns
    const patterns: Pattern[] = []
    
    for (const [component, items] of byComponent.entries()) {
      const count = items.length
      const mileages = items.map(i => i.mileage).filter(m => m > 0)
      const avgMileage = mileages.length > 0 
        ? Math.round(mileages.reduce((a, b) => a + b, 0) / mileages.length)
        : null
      
      // Calculate severity
      const crashes = items.filter(i => i.crash).length
      const fires = items.filter(i => i.fire).length
      const injuries = items.reduce((sum, i) => sum + (i.injured || 0), 0)
      
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
      if (crashes > 0 || fires > 0 || injuries > 0) {
        severity = 'HIGH'
      } else if (count >= 5) {
        severity = 'MEDIUM'
      }
      
      patterns.push({
        component,
        count,
        severity,
        avgMileage
      })
    }
    
    // Sort by count descending
    return patterns.sort((a, b) => b.count - a.count).slice(0, 5)
  }
  
  /**
   * Format citations for display
   */
  private formatCitations(complaints: any[]): Citation[] {
    return complaints.map(c => ({
      odiNumber: c.odi_number,
      date: new Date(c.complaint_date).toLocaleDateString(),
      snippet: this.extractSnippet(c.summary || c.description, 150),
      component: c.component,
      mileage: c.mileage,
      similarity: Math.round(c.similarity * 100) / 100,
      crash: c.crash || false,
      fire: c.fire || false
    }))
  }
  
  /**
   * Extract snippet from text
   */
  private extractSnippet(text: string, maxLength: number): string {
    if (!text) return ''
    if (text.length <= maxLength) return text
    
    // Try to break at sentence
    const snippet = text.substring(0, maxLength)
    const lastPeriod = snippet.lastIndexOf('.')
    const lastSpace = snippet.lastIndexOf(' ')
    
    if (lastPeriod > maxLength * 0.7) {
      return snippet.substring(0, lastPeriod + 1)
    } else if (lastSpace > maxLength * 0.7) {
      return snippet.substring(0, lastSpace) + '...'
    }
    
    return snippet + '...'
  }
  
  /**
   * Generate answer using GPT-4
   */
  private async generateAnswer(
    question: string,
    complaints: any[],
    patterns: Pattern[],
    vehicle?: any
  ): Promise<string> {
    
    // Build context from complaints
    const context = complaints.slice(0, 10).map((c, i) => 
      `[${i + 1}] ${c.year} ${c.make} ${c.model} - ${c.component}: ${c.summary || c.description.substring(0, 200)}`
    ).join('\n\n')
    
    const vehicleContext = vehicle 
      ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      : 'the vehicle in question'
    
    const prompt = `You are an automotive expert analyzing NHTSA safety complaints. Based on ${complaints.length} real owner reports, answer this question:

"${question}"

Vehicle: ${vehicleContext}

Owner Reports:
${context}

Problem Patterns Identified:
${patterns.map(p => `- ${p.component}: ${p.count} reports${p.avgMileage ? ` (avg ${p.avgMileage.toLocaleString()} miles)` : ''}`).join('\n')}

Instructions:
- Provide a clear, helpful answer based ONLY on the reports above
- Start with "Based on ${complaints.length} owner reports..."
- Mention the most common problem pattern
- Include relevant context (mileage, severity)
- Be specific but not alarmist
- If patterns show high severity (crashes/fires), mention it factually
- Keep answer under 150 words
- End with practical advice

Answer:`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300
    })
    
    return response.choices[0].message.content || 'Unable to generate answer.'
  }
  
  /**
   * Assess answer confidence
   */
  private assessConfidence(complaints: any[], patterns: Pattern[]): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (complaints.length >= 10 && patterns.length >= 2) {
      return 'HIGH'
    } else if (complaints.length >= 5) {
      return 'MEDIUM'
    }
    return 'LOW'
  }
  
  /**
   * Generate related questions
   */
  private generateRelatedQuestions(patterns: Pattern[], vehicle?: any): string[] {
    const questions: string[] = []
    
    if (patterns.length > 0) {
      const top = patterns[0]
      questions.push(`What are common ${top.component.toLowerCase()} problems?`)
      
      if (top.avgMileage) {
        questions.push(`When do ${top.component.toLowerCase()} issues typically occur?`)
      }
    }
    
    if (vehicle?.make && vehicle?.model) {
      questions.push(`What are the most common problems with ${vehicle.year || 'this'} ${vehicle.make} ${vehicle.model}?`)
    }
    
    questions.push('Are there any recalls for my vehicle?')
    
    return questions.slice(0, 3)
  }
  
  /**
   * No results response
   */
  private noResultsResponse(question: string, vehicle?: any): RAGResponse {
    return {
      answer: `I couldn't find any owner reports matching "${question}"${vehicle ? ` for ${vehicle.year} ${vehicle.make} ${vehicle.model}` : ''}. This could mean:\n\n- This issue is uncommon or hasn't been reported to NHTSA\n- Try rephrasing your question more generally\n- Check with your mechanic for a professional diagnosis`,
      citations: [],
      patterns: [],
      confidence: 'LOW',
      relatedQuestions: [
        'What are the most common problems?',
        'Are there any safety recalls?',
        'What do other owners report?'
      ]
    }
  }
}

// Singleton
let instance: RAGService | null = null

export function getRAGService(): RAGService {
  if (!instance) {
    instance = new RAGService()
  }
  return instance
}
