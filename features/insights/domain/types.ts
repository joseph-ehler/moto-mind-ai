/**
 * Insights Domain Types
 * 
 * Types for AI-powered vehicle Q&A system.
 */

/**
 * Question submitted by user
 */
export interface InsightQuestion {
  id: string
  vehicle_id: string
  question: string
  created_at: Date
  answered: boolean
}

/**
 * AI-generated answer
 */
export interface InsightAnswer {
  id: string
  question_id: string
  answer: string
  confidence: number
  sources: string[]
  created_at: Date
}

/**
 * Complete insight (question + answer)
 */
export interface Insight {
  question: InsightQuestion
  answer?: InsightAnswer
}

/**
 * Insight categories
 */
export type InsightCategory =
  | 'maintenance'
  | 'cost'
  | 'efficiency'
  | 'history'
  | 'recommendations'
  | 'general'

/**
 * Question input
 */
export interface AskInsightInput {
  vehicle_id: string
  question: string
  category?: InsightCategory
}
