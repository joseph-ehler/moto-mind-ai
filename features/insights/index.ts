/**
 * Insights Feature - Public API
 * 
 * AI-powered Q&A system for vehicle insights.
 * Allows users to ask questions about their vehicles and get
 * intelligent, contextual answers based on their data.
 * 
 * Architecture:
 * - domain/ - Types for questions, answers, insights
 * - data/ - AI API integration (placeholder)
 * - hooks/ - React hooks for Q&A (placeholder)
 * - ui/ - AskQuestion component
 * - __tests__/ - Feature tests
 */

// Domain exports
export type {
  InsightQuestion,
  InsightAnswer,
  Insight,
  InsightCategory,
  AskInsightInput,
} from './domain'

// Data layer (future)
// export { askQuestion, getInsights } from './data'

// Hooks (future)
// export { useAskQuestion, useInsights } from './hooks'

// UI Components
export { AskQuestion } from './ui'
