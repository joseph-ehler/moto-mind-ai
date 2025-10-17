'use client'

/**
 * Vehicle AI Chat Page - Clean & Minimal
 * 
 * Contextual AI assistant for specific vehicle maintenance questions
 */

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Section, Stack, Card, Heading, Text, Flex } from '@/components/design-system'
import { 
  ArrowLeft,
  MessageSquare,
  Send,
  Sparkles,
  User,
  Bot
} from 'lucide-react'
import { AppNavigation } from '@/components/app/AppNavigation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function VehicleChatPage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = (params?.id as string) || '123'

  // Mock vehicle data - replace with real data from API
  const vehicle = {
    id: vehicleId,
    year: 2015,
    make: 'Honda',
    model: 'Accord',
    trim: 'EX-L',
    current_mileage: 85234
  }

  const displayName = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI assistant for your ${displayName}. I can help answer questions about maintenance, troubleshooting, and general care. What would you like to know?`,
      timestamp: new Date()
    }
  ])
  
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const suggestedQuestions = [
    "When should I change my oil?",
    "What tire pressure should I use?",
    "How often should I rotate tires?",
    "What does a check engine light mean?",
    "When is my next service due?"
  ]

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI response (replace with real API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getContextualResponse(inputValue),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question)
  }

  const getContextualResponse = (question: string): string => {
    // Mock contextual responses based on vehicle
    if (question.toLowerCase().includes('oil')) {
      return `For your ${displayName}, Honda recommends changing the oil every 7,500 miles or 12 months under normal driving conditions. You're currently at ${vehicle.current_mileage.toLocaleString()} miles. Based on your service history, you're due for an oil change in about 200 miles.`
    }
    if (question.toLowerCase().includes('tire')) {
      return `Your ${displayName} uses 225/50R17 tires. The recommended tire pressure is 32 PSI for both front and rear tires when cold. You should rotate your tires every 5,000-7,500 miles to ensure even wear.`
    }
    return `That's a great question about your ${displayName}! While I'm still learning to provide detailed answers, I recommend checking your owner's manual or consulting with a certified Honda technician for specific guidance. Is there anything else I can help with?`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      <AppNavigation />
      
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="xl">
            {/* Back Button */}
            <button
              onClick={() => router.push(`/vehicles/${vehicleId}`)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to vehicle</span>
            </button>

            {/* Header */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <Section spacing="md">
                <Flex align="center" gap="md">
                  <Flex align="center" justify="center" className="w-12 h-12 rounded-full bg-purple-600 flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-white" />
                  </Flex>
                  <Stack spacing="xs">
                    <Heading level="subtitle" className="text-purple-900">AI Assistant</Heading>
                    <Text className="text-sm text-purple-700">{displayName}</Text>
                    <Text className="text-xs text-purple-600">{vehicle.current_mileage.toLocaleString()} miles</Text>
                  </Stack>
                </Flex>
              </Section>
            </Card>

            {/* Chat Messages */}
            <Stack spacing="md">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              
              {isTyping && (
                <Flex align="start" gap="md">
                  <Flex align="center" justify="center" className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0">
                    <Bot className="w-4 h-4 text-purple-600" />
                  </Flex>
                  <Card className="flex-1 bg-purple-50 border-purple-100">
                    <Section spacing="sm">
                      <Flex align="center" gap="xs">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </Flex>
                    </Section>
                  </Card>
                </Flex>
              )}
            </Stack>

            {/* Suggested Questions */}
            {messages.length === 1 && (
              <Stack spacing="sm">
                <Text className="text-sm font-medium text-gray-700">Suggested questions:</Text>
                <Stack spacing="xs">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm text-gray-700"
                    >
                      {question}
                    </button>
                  ))}
                </Stack>
              </Stack>
            )}

            {/* Spacer for fixed input */}
            <div className="h-24" />
          </Stack>
        </Section>
      </Container>

      {/* Fixed Input Area */}
      <div style={{ position: 'fixed', bottom: '80px', left: 0, right: 0, zIndex: 99999, padding: '1rem' }}>
        <div className="max-w-2xl mx-auto bg-white rounded-xl border-2 border-gray-200 shadow-lg p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your vehicle..."
              className="flex-1 resize-none bg-transparent outline-none text-sm placeholder:text-gray-400 min-h-[40px] max-h-[120px]"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                inputValue.trim() && !isTyping
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add bottom padding for mobile nav */}
      <div className="h-20 md:h-0" />
    </>
  )
}

/**
 * Chat Message Component
 */
function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <Flex align="start" gap="md" className={isUser ? 'flex-row-reverse' : ''}>
      {/* Avatar */}
      <Flex 
        align="center" 
        justify="center" 
        className={`w-8 h-8 rounded-full flex-shrink-0 ${
          isUser ? 'bg-blue-600' : 'bg-purple-100'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-purple-600" />
        )}
      </Flex>

      {/* Message Bubble */}
      <Card 
        className={`flex-1 max-w-[80%] ${
          isUser 
            ? 'bg-blue-600 border-blue-600' 
            : 'bg-purple-50 border-purple-100'
        }`}
      >
        <Section spacing="sm">
          <Text 
            className={`text-sm leading-relaxed ${
              isUser ? 'text-white' : 'text-gray-900'
            }`}
          >
            {message.content}
          </Text>
        </Section>
      </Card>
    </Flex>
  )
}
