/**
 * VehicleAIChatModal Component
 * 
 * Fully-featured AI assistant chat modal with:
 * - Conversation thread history
 * - Contextual quick questions
 * - Vehicle-aware responses
 * - Streaming support
 */

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Stack, Flex, Text, Button, Card, Modal, Heading } from '@/components/design-system'
import { Sparkles, Send, Loader, AlertCircle, Trash2, MessageSquare, RefreshCw, Menu, X, Plus } from 'lucide-react'
import { ConversationThreadList, ConversationThread } from './ConversationThreadList'

export interface Message {
  id: string
  threadId?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface VehicleContext {
  id: string
  make: string
  model: string
  year: number
  mileage: number
  health?: number
  recentIssues?: string[]
  lastService?: string
}

interface VehicleAIChatModalProps {
  isOpen: boolean
  onClose: () => void
  vehicleContext: VehicleContext
}

export function VehicleAIChatModal({ isOpen, onClose, vehicleContext }: VehicleAIChatModalProps) {
  // Thread management
  const [threads, setThreads] = useState<ConversationThread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [showThreads, setShowThreads] = useState(false)
  const [threadsLoading, setThreadsLoading] = useState(false)
  
  // Message state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load threads when modal opens
  useEffect(() => {
    if (isOpen) {
      loadThreads()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])
  
  // Load messages when thread changes
  useEffect(() => {
    if (currentThreadId) {
      loadMessages(currentThreadId)
    }
  }, [currentThreadId])
  
  // Load threads from API
  const loadThreads = async () => {
    setThreadsLoading(true)
    try {
      const response = await fetch(`/api/vehicles/${vehicleContext.id}/conversations`)
      if (response.ok) {
        const data = await response.json()
        const formattedThreads = (data.threads || []).map((t: any) => ({
          ...t,
          createdAt: new Date(t.created_at),
          updatedAt: new Date(t.updated_at),
          lastMessageAt: t.last_message_at ? new Date(t.last_message_at) : null,
          messageCount: t.message_count || 0
        }))
        setThreads(formattedThreads)
        
        // Auto-select most recent thread or create new
        if (formattedThreads.length > 0) {
          setCurrentThreadId(formattedThreads[0].id)
        } else {
          await createNewThread()
        }
      }
    } catch (err) {
      console.error('Failed to load threads:', err)
      await createNewThread()
    } finally {
      setThreadsLoading(false)
    }
  }
  
  // Load messages for a thread
  const loadMessages = async (threadId: string) => {
    try {
      const response = await fetch(`/api/conversations/${threadId}/messages`)
      if (response.ok) {
        const data = await response.json()
        const formattedMessages = (data.messages || []).map((m: any) => ({
          id: m.id,
          threadId: m.threadId,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp)
        }))
        setMessages(formattedMessages)
      }
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }
  
  // Create new thread
  const createNewThread = async () => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleContext.id}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleContext })
      })
      
      if (response.ok) {
        const data = await response.json()
        const newThread = {
          ...data.thread,
          createdAt: new Date(data.thread.created_at),
          updatedAt: new Date(data.thread.updated_at),
          lastMessageAt: data.thread.last_message_at ? new Date(data.thread.last_message_at) : null,
          messageCount: 0
        }
        setThreads(prev => [newThread, ...prev])
        setCurrentThreadId(newThread.id)
        setMessages([])
        setShowThreads(false)
      }
    } catch (err) {
      console.error('Failed to create thread:', err)
    }
  }
  
  // Delete thread
  const handleDeleteThread = async (threadId: string) => {
    try {
      await fetch(`/api/conversations/${threadId}`, { method: 'DELETE' })
      setThreads(prev => prev.filter(t => t.id !== threadId))
      
      if (currentThreadId === threadId) {
        const remaining = threads.filter(t => t.id !== threadId)
        if (remaining.length > 0) {
          setCurrentThreadId(remaining[0].id)
        } else {
          await createNewThread()
        }
      }
    } catch (err) {
      console.error('Failed to delete thread:', err)
    }
  }

  const contextualPrompts = [
    { 
      icon: '🔧', 
      text: 'When is my next service due?',
      query: `Based on my ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model} at ${vehicleContext.mileage.toLocaleString()} miles, when is my next service due?`
    },
    { 
      icon: '💰', 
      text: 'Estimate annual maintenance cost',
      query: `What are the typical annual maintenance costs for a ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}?`
    },
    { 
      icon: '📊', 
      text: 'Check vehicle health',
      query: `Give me a health assessment of my ${vehicleContext.make} ${vehicleContext.model} based on the timeline and current mileage.`
    },
    { 
      icon: '⚠️', 
      text: 'Common issues for this model',
      query: `What are common issues to watch for in a ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}?`
    }
  ]

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading || !currentThreadId) return

    const optimisticUserMessage: Message = {
      id: `temp-${Date.now()}`,
      threadId: currentThreadId,
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    // Optimistic update
    setMessages(prev => [...prev, optimisticUserMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/conversations/${currentThreadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          vehicleContext
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      // Replace optimistic message with real ones
      setMessages(prev => [
        ...prev.filter(m => m.id !== optimisticUserMessage.id),
        {
          id: data.userMessage.id,
          threadId: data.userMessage.threadId,
          role: data.userMessage.role,
          content: data.userMessage.content,
          timestamp: new Date(data.userMessage.timestamp)
        },
        {
          id: data.assistantMessage.id,
          threadId: data.assistantMessage.threadId,
          role: data.assistantMessage.role,
          content: data.assistantMessage.content,
          timestamp: new Date(data.assistantMessage.timestamp)
        }
      ])
      
      // Update thread in list
      setThreads(prev => prev.map(t => 
        t.id === currentThreadId 
          ? { ...t, updatedAt: new Date(), lastMessageAt: new Date(), messageCount: t.messageCount + 2 }
          : t
      ))
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id))
      setError('Failed to send message. Please try again.')
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuestion = (query: string) => {
    handleSendMessage(query)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="flex h-[80vh] max-h-[800px]">
        {/* Thread Sidebar - Desktop Only */}
        {!isMobile && (
          <div className="w-64 border-r border-gray-200 flex flex-col">
            <div className="flex-1 overflow-y-auto p-3">
              <ConversationThreadList
                threads={threads}
                currentThreadId={currentThreadId}
                onSelectThread={setCurrentThreadId}
                onNewThread={createNewThread}
                onDeleteThread={handleDeleteThread}
                isLoading={threadsLoading}
              />
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Thread Disclosure */}
          {isMobile && (
            <details className="border-b border-gray-200 bg-gray-50">
              <summary className="p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                <Flex align="center" justify="between">
                  <Flex align="center" gap="sm">
                    <MessageSquare className="w-4 h-4 text-gray-600" />
                    <Text className="text-sm font-medium text-gray-900">
                      {threads.find(t => t.id === currentThreadId)?.title || 'New conversation'}
                    </Text>
                  </Flex>
                  <Text className="text-xs text-gray-500">{threads.length} threads</Text>
                </Flex>
              </summary>
              <div className="max-h-[300px] overflow-y-auto p-3 bg-white border-t border-gray-200">
                <ConversationThreadList
                  threads={threads}
                  currentThreadId={currentThreadId}
                  onSelectThread={setCurrentThreadId}
                  onNewThread={createNewThread}
                  onDeleteThread={handleDeleteThread}
                  isLoading={threadsLoading}
                />
              </div>
            </details>
          )}

          {/* Vehicle Context Header */}
          <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <Flex align="center" gap="sm">
              <Flex align="center" justify="center" className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </Flex>
              <Stack spacing="xs">
                <Text className="text-sm font-semibold text-gray-900">
                  {vehicleContext.year} {vehicleContext.make} {vehicleContext.model}
                </Text>
                <Text className="text-xs text-gray-600">
                  {vehicleContext.mileage.toLocaleString()} mi
                  {vehicleContext.health && ` • ${vehicleContext.health}/100 health`}
                </Text>
              </Stack>
            </Flex>
          </div>

          {/* Messages Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && (
            <Stack spacing="lg" className="py-8">
              <Stack spacing="sm" className="text-center">
                <Flex align="center" justify="center" className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto mb-2">
                  <MessageSquare className="w-6 h-6 text-white" />
                </Flex>
                <Text className="text-lg font-semibold text-gray-900">
                  Ask me anything about your vehicle
                </Text>
                <Text className="text-sm text-gray-600 max-w-md mx-auto">
                  I can help with maintenance schedules, cost estimates, common issues, and more.
                </Text>
              </Stack>

              {/* Quick Questions */}
              <Stack spacing="xs">
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Quick Questions
                </Text>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {contextualPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickQuestion(prompt.query)}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                    >
                      <Flex align="center" gap="sm">
                        <span className="text-lg">{prompt.icon}</span>
                        <Text className="text-sm text-gray-700 group-hover:text-blue-700">
                          {prompt.text}
                        </Text>
                      </Flex>
                    </button>
                  ))}
                </div>
              </Stack>
            </Stack>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && (
            <Flex align="center" gap="sm" className="text-gray-500">
              <Loader className="w-4 h-4 animate-spin" />
              <Text className="text-sm">Thinking...</Text>
            </Flex>
          )}

          {error && (
            <Card className="p-3 bg-red-50 border-red-200">
              <Flex align="center" gap="sm">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <Text className="text-sm text-red-700">{error}</Text>
              </Flex>
            </Card>
          )}

          <div ref={messagesEndRef} />
          </div>

          {/* Sticky Input Area */}
          <div className="sticky bottom-0 p-4 border-t border-gray-200 bg-white">
            <Flex gap="sm">
              <input
                ref={inputRef}
                type="text"
                placeholder={`Ask about your ${vehicleContext.make} ${vehicleContext.model}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900 placeholder-gray-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 bg-black text-white hover:bg-gray-800 h-12 w-12 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </Button>
            </Flex>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <Flex justify={isUser ? 'end' : 'start'} className="w-full">
      <div className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        <Stack spacing="xs">
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? 'bg-black text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
            }`}
          >
            <Text className="text-sm whitespace-pre-wrap">{message.content}</Text>
          </div>
          <Text className={`text-xs text-gray-500 ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}
          </Text>
        </Stack>
      </div>
    </Flex>
  )
}
