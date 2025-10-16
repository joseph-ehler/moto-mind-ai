import React, { useState } from 'react'
import { ExplanationResult } from '../explain/ExplanationResult'

interface AskQuestionProps {
  vehicleId: string
  onAddData?: (type: string) => void
}

export function AskQuestion({ vehicleId, onAddData }: AskQuestionProps) {
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const commonQuestions = [
    "Why is my fuel efficiency down?",
    "How does my MPG compare to baseline?",
    "What maintenance should I do next?",
    "Are there any performance issues?",
    "How can I improve fuel economy?"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🤔 Asking question:', question)

      const response = await fetch('/api/explain-with-guardrails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId,
          question: question.trim(),
          context: 'user_question'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get explanation: ${response.status}`)
      }

      const data = await response.json()
      console.log('💡 Got explanation:', data)
      
      setResult(data)

    } catch (err) {
      console.error('Question error:', err)
      setError(err instanceof Error ? err.message : 'Failed to get explanation')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (quickQuestion: string) => {
    setQuestion(quickQuestion)
  }

  return (
    <div className="space-y-6">
      {/* Question Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Ask About Your Vehicle
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to know?
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Why is my fuel efficiency down this month?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                'Get Answer'
              )}
            </button>

            {question && (
              <button
                type="button"
                onClick={() => setQuestion('')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Quick Questions */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-3">Common questions:</p>
          <div className="flex flex-wrap gap-2">
            {commonQuestions.map((q, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(q)}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Unable to get answer
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <ExplanationResult
          vehicleId={vehicleId}
          question={question}
          result={result}
          onAddData={onAddData}
        />
      )}
    </div>
  )
}
