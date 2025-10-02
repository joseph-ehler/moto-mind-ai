import { useState, useRef, useEffect } from 'react'

interface Vehicle {
  id: string
  label: string
  make: string
  model: string
  status: 'healthy' | 'warning' | 'flagged'
  lastSeen: Date
  dataQuality: number
  issues: string[]
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  confidence?: 'high' | 'medium' | 'low'
  sources?: string[]
  reasoning?: {
    rootCause: string[]
    supportingData: Array<{ metric: string; value: any; threshold?: any }>
    recommendations: string[]
  }
}

interface FleetChatProps {
  selectedVehicle: string | null
  vehicles: Vehicle[]
}

export function FleetChat({ selectedVehicle, vehicles }: FleetChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your fleet intelligence assistant. Ask me about any vehicle issues, maintenance needs, or operational insights. Try asking "Why was Truck 47 flagged?" to see how I can help.',
      timestamp: new Date(),
      confidence: 'high'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate API call with mock response
    setTimeout(() => {
      const mockResponse = generateMockResponse(input.trim(), selectedVehicle, vehicles)
      setMessages(prev => [...prev, mockResponse])
      setIsLoading(false)
    }, 1500)
  }

  const generateMockResponse = (question: string, vehicleId: string | null, vehicles: Vehicle[]): Message => {
    const vehicle = vehicleId ? vehicles.find(v => v.id === vehicleId) : null
    
    if (question.toLowerCase().includes('truck 47') || question.toLowerCase().includes('flagged')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Truck 47 was flagged due to multiple critical issues that require immediate attention.',
        timestamp: new Date(),
        confidence: 'high',
        sources: ['Samsara Telematics', 'Maintenance Records', 'Route Analysis'],
        reasoning: {
          rootCause: [
            'Brake pad wear exceeds safety threshold',
            'Route inefficiency indicates potential driver behavior issues'
          ],
          supportingData: [
            { metric: 'brake_wear_pct', value: 87, threshold: 85 },
            { metric: 'route_efficiency', value: -12, threshold: -10 },
            { metric: 'harsh_events', value: 3, threshold: 2 }
          ],
          recommendations: [
            'Schedule immediate brake inspection and replacement',
            'Review driver training for route optimization',
            'Monitor harsh braking events for next 30 days'
          ]
        }
      }
    }

    if (vehicle) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Based on the latest data for ${vehicle.label}, here's what I found: The vehicle is currently in ${vehicle.status} status with ${vehicle.dataQuality}% data completeness. ${vehicle.issues.length > 0 ? `Current issues include: ${vehicle.issues.join(', ')}.` : 'No critical issues detected.'}`,
        timestamp: new Date(),
        confidence: vehicle.dataQuality > 80 ? 'high' : vehicle.dataQuality > 60 ? 'medium' : 'low',
        sources: ['Samsara Telematics', 'Vehicle Diagnostics']
      }
    }

    return {
      id: Date.now().toString(),
      type: 'assistant',
      content: 'I can help you analyze vehicle performance, maintenance needs, and operational insights. Please select a vehicle from the list or ask about a specific vehicle by name.',
      timestamp: new Date(),
      confidence: 'medium'
    }
  }

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high':
        return 'text-success-600 bg-success-50'
      case 'medium':
        return 'text-warning-600 bg-warning-50'
      case 'low':
        return 'text-error-600 bg-error-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="flex flex-col h-96">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              
              {message.type === 'assistant' && (
                <div className="mt-3 space-y-2">
                  {/* Confidence Badge */}
                  {message.confidence && (
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(message.confidence)}`}>
                        {message.confidence} confidence
                      </span>
                    </div>
                  )}
                  
                  {/* Reasoning Details */}
                  {message.reasoning && (
                    <div className="bg-gray-50 rounded-md p-3 text-xs">
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-gray-700">Root Cause:</span>
                          <ul className="mt-1 space-y-1">
                            {message.reasoning.rootCause.map((cause, index) => (
                              <li key={index} className="text-gray-600">• {cause}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Supporting Data:</span>
                          <ul className="mt-1 space-y-1">
                            {message.reasoning.supportingData.map((data, index) => (
                              <li key={index} className="text-gray-600">
                                • {data.metric}: {data.value}{data.threshold && ` (threshold: ${data.threshold})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Recommendations:</span>
                          <ul className="mt-1 space-y-1">
                            {message.reasoning.recommendations.map((rec, index) => (
                              <li key={index} className="text-gray-600">• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Sources */}
                  {message.sources && (
                    <div className="flex flex-wrap gap-1">
                      {message.sources.map((source, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-600"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-2 text-xs opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={selectedVehicle ? `Ask about ${vehicles.find(v => v.id === selectedVehicle)?.label}...` : "Ask about your fleet..."}
          className="flex-1 input"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            'Ask'
          )}
        </button>
      </form>
    </div>
  )
}
