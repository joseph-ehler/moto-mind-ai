/**
 * VehicleAIChatModal V2 - Top-Tier Implementation
 * 
 * Features:
 * - Mobile-first responsive design (full-screen on mobile)
 * - Persistent conversation threads
 * - Thread management sidebar
 * - Optimistic UI updates
 * - Message actions (copy, regenerate, feedback)
 * - Design system compliant
 */

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Stack, Flex, Text, Button, Card, Modal, Heading } from '@/components/design-system'
import { 
  Sparkles, Send, Loader, AlertCircle, Trash2, MessageSquare, 
  RefreshCw, Copy, ThumbsUp, ThumbsDown, Menu, X, Plus, Check,
  ChevronLeft, MoreVertical
} from 'lucide-react'

// Types
export interface Message {
  id: string
  threadId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  tokensUsed?: number
  feedbackRating?: 1 | 2 | 3 | 4 | 5
  isOptimistic?: boolean // For instant UI updates before API confirms
}

export interface ConversationThread {
  id: string
  vehicleId: string
  title: string | null
  createdAt: Date
  updatedAt: Date
  lastMessageAt: Date | null
  messageCount: number
  isArchived: boolean
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
  // State
  const [threads, setThreads] = useState<ConversationThread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showThreads, setShowThreads] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load threads on mount
  useEffect(() => {
    if (isOpen) {
      loadThreads()
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Load messages when thread changes
  useEffect(() => {
    if (currentThreadId) {
      loadMessages(currentThreadId)
    }
  }, [currentThreadId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load threads from API
  const loadThreads = async () => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleContext.id}/conversations`)
      if (response.ok) {
        const data = await response.json()
        setThreads(data.threads || [])
        
        // Auto-select most recent thread or create new
        if (data.threads?.length > 0) {
          setCurrentThreadId(data.threads[0].id)
        } else {
          await createNewThread()
        }
      }
    } catch (err) {
      console.error('Failed to load threads:', err)
    }
  }

  // Load messages for a thread
  const loadMessages = async (threadId: string) => {
    try {
      const response = await fetch(`/api/conversations/${threadId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
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
        setThreads(prev => [data.thread, ...prev])
        setCurrentThreadId(data.thread.id)
        setMessages([])
        setShowThreads(false)
      }
    } catch (err) {
      console.error('Failed to create thread:', err)
    }
  }

  // Send message with optimistic UI
  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading || !currentThreadId) return

    // Cancel any pending requests
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    const optimisticUserMessage: Message = {
      id: `temp-${Date.now()}`,
      threadId: currentThreadId,
      role: 'user',
      content: text,
      timestamp: new Date(),
      isOptimistic: true
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
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()

      // Replace optimistic message with real one
      setMessages(prev => [
        ...prev.filter(m => m.id !== optimisticUserMessage.id),
        data.userMessage,
        data.assistantMessage
      ])

      // Update thread in list
      setThreads(prev => prev.map(t => 
        t.id === currentThreadId 
          ? { ...t, updatedAt: new Date(), lastMessageAt: new Date(), messageCount: t.messageCount + 2 }
          : t
      ))
    } catch (err: any) {
      if (err.name === 'AbortError') return
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id))
      setError('Failed to send message. Please try again.')
      console.error('Send message error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Copy message to clipboard
  const handleCopyMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopiedMessageId(message.id)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Regenerate assistant response
  const handleRegenerateResponse = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1) return

    const userMessage = messages[messageIndex - 1] // Get previous user message
    if (!userMessage || userMessage.role !== 'user') return

    // Remove the assistant message to be regenerated
    setMessages(prev => prev.filter(m => m.id !== messageId))
    
    // Resend the user message
    await handleSendMessage(userMessage.content)
  }

  // Submit feedback
  const handleFeedback = async (messageId: string, rating: 1 | 5) => {
    try {
      await fetch(`/api/conversations/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      })

      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, feedbackRating: rating } : m
      ))
    } catch (err) {
      console.error('Failed to submit feedback:', err)
    }
  }

  // Delete thread
  const handleDeleteThread = async (threadId: string) => {
    if (!confirm('Delete this conversation?')) return

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

  // Quick questions
  const contextualPrompts = [
    { 
      icon: '🔧', 
      text: 'When is my next service due?',
      query: `Based on my ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model} at ${vehicleContext.mileage.toLocaleString()} miles, when is my next service due?`
    },
    { 
      icon: '💰', 
      text: 'Estimate maintenance costs',
      query: `What are the typical annual maintenance costs for a ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}?`
    },
    { 
      icon: '📊', 
      text: 'Check vehicle health',
      query: `Give me a health assessment of my ${vehicleContext.make} ${vehicleContext.model}.`
    },
    { 
      icon: '⚠️', 
      text: 'Common issues',
      query: `What are common issues for a ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}?`
    }
  ]

  const currentThread = threads.find(t => t.id === currentThreadId)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="" // Custom title in content
      size="xl"
      className={isMobile ? 'h-full' : ''}
    >
      <Flex gap="none" className="h-[600px] md:h-[700px]">
        {/* Thread Sidebar - Desktop always visible, Mobile toggle */}
        {(showThreads || !isMobile) && (
          <div className={`${
            isMobile 
              ? 'fixed inset-0 z-50 bg-white' 
              : 'w-64 border-r border-gray-200'
          } flex flex-col`}>
            {/* Sidebar Header */}
            <Flex justify="between" align="center" className="p-4 border-b border-gray-200">
              <Heading level="subtitle" className="text-lg font-semibold">Conversations</Heading>
              {isMobile && (
                <button onClick={() => setShowThreads(false)} className="p-1">
                  <X className="w-5 h-5" />
                </button>
              )}
            </Flex>

            {/* New Thread Button */}
            <div className="p-3">
              <Button
                onClick={createNewThread}
                className="w-full bg-black text-white hover:bg-gray-800 rounded-lg h-10"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            {/* Thread List */}
            <Stack spacing="xs" className="flex-1 overflow-y-auto p-3">
              {threads.map(thread => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  isActive={thread.id === currentThreadId}
                  onClick={() => {
                    setCurrentThreadId(thread.id)
                    if (isMobile) setShowThreads(false)
                  }}
                  onDelete={() => handleDeleteThread(thread.id)}
                />
              ))}
            </Stack>
          </div>
        )}

        {/* Main Chat Area */}
        <Flex direction="column" className="flex-1">
          {/* Chat Header */}
          <Flex justify="between" align="center" className="p-4 border-b border-gray-200">
            <Flex align="center" gap="sm">
              {isMobile && (
                <button onClick={() => setShowThreads(true)} className="p-1 mr-2">
                  <Menu className="w-5 h-5" />
                </button>
              )}
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
          </Flex>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4">
            <Stack spacing="lg">
              {messages.length === 0 && !isLoading && (
                <EmptyState
                  prompts={contextualPrompts}
                  onSelectPrompt={(query) => handleSendMessage(query)}
                />
              )}

              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onCopy={() => handleCopyMessage(message)}
                  onRegenerate={() => handleRegenerateResponse(message.id)}
                  onFeedback={(rating) => handleFeedback(message.id, rating)}
                  isCopied={copiedMessageId === message.id}
                />
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
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <Text className="text-sm text-red-700">{error}</Text>
                  </Flex>
                </Card>
              )}

              <div ref={messagesEndRef} />
            </Stack>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <Flex gap="sm">
              <input
                ref={inputRef}
                type="text"
                placeholder={`Ask about your ${vehicleContext.make} ${vehicleContext.model}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
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
        </Flex>
      </Flex>
    </Modal>
  )
}

// Thread List Item Component
function ThreadListItem({ 
  thread, 
  isActive, 
  onClick, 
  onDelete 
}: { 
  thread: ConversationThread
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg text-left transition-colors relative group ${
        isActive 
          ? 'bg-blue-50 border border-blue-200' 
          : 'bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <Flex justify="between" align="start">
        <Stack spacing="xs" className="flex-1 min-w-0">
          <Text className={`text-sm font-medium truncate ${
            isActive ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {thread.title || 'New conversation'}
          </Text>
          <Text className="text-xs text-gray-600">
            {thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'} •{' '}
            {formatRelativeTime(thread.updatedAt)}
          </Text>
        </Stack>

        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
        >
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </button>
      </Flex>

      {showMenu && (
        <div className="absolute right-2 top-12 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
              setShowMenu(false)
            }}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <Flex align="center" gap="xs">
              <Trash2 className="w-4 h-4" />
              Delete
            </Flex>
          </button>
        </div>
      )}
    </button>
  )
}

// Message Bubble Component
function MessageBubble({
  message,
  onCopy,
  onRegenerate,
  onFeedback,
  isCopied
}: {
  message: Message
  onCopy: () => void
  onRegenerate: () => void
  onFeedback: (rating: 1 | 5) => void
  isCopied: boolean
}) {
  const isUser = message.role === 'user'
  const [showActions, setShowActions] = useState(false)

  return (
    <Flex justify={isUser ? 'end' : 'start'} className="w-full">
      <div 
        className={`max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <Stack spacing="xs">
          <Card
            className={`p-4 ${
              isUser
                ? 'bg-black text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
            } ${message.isOptimistic ? 'opacity-60' : ''}`}
          >
            <Text className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
            </Text>
          </Card>

          <Flex justify="between" align="center">
            <Text className={`text-xs text-gray-500 ${isUser ? 'text-right' : 'text-left'}`}>
              {message.timestamp.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </Text>

            {/* Message Actions */}
            {(showActions || isCopied) && (
              <Flex gap="xs">
                <button
                  onClick={onCopy}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Copy message"
                >
                  {isCopied ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-600" />
                  )}
                </button>

                {!isUser && (
                  <>
                    <button
                      onClick={onRegenerate}
                      className="p-1 rounded hover:bg-gray-200 transition-colors"
                      title="Regenerate response"
                    >
                      <RefreshCw className="w-3 h-3 text-gray-600" />
                    </button>

                    {!message.feedbackRating && (
                      <>
                        <button
                          onClick={() => onFeedback(5)}
                          className="p-1 rounded hover:bg-green-100 transition-colors"
                          title="Helpful"
                        >
                          <ThumbsUp className="w-3 h-3 text-gray-600" />
                        </button>
                        <button
                          onClick={() => onFeedback(1)}
                          className="p-1 rounded hover:bg-red-100 transition-colors"
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-3 h-3 text-gray-600" />
                        </button>
                      </>
                    )}

                    {message.feedbackRating === 5 && (
                      <ThumbsUp className="w-3 h-3 text-green-600" />
                    )}
                    {message.feedbackRating === 1 && (
                      <ThumbsDown className="w-3 h-3 text-red-600" />
                    )}
                  </>
                )}
              </Flex>
            )}
          </Flex>
        </Stack>
      </div>
    </Flex>
  )
}

// Empty State Component
function EmptyState({ 
  prompts, 
  onSelectPrompt 
}: { 
  prompts: Array<{ icon: string; text: string; query: string }>
  onSelectPrompt: (query: string) => void
}) {
  return (
    <Stack spacing="lg" className="py-8">
      <Stack spacing="sm" className="text-center">
        <Flex align="center" justify="center" className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto mb-2">
          <MessageSquare className="w-6 h-6 text-white" />
        </Flex>
        <Heading level="subtitle" className="text-lg font-semibold text-gray-900">
          Ask me anything
        </Heading>
        <Text className="text-sm text-gray-600 max-w-md mx-auto">
          I can help with maintenance schedules, cost estimates, common issues, and more.
        </Text>
      </Stack>

      <Stack spacing="xs">
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Quick Questions
        </Text>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {prompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(prompt.query)}
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
  )
}

// Utility: Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(date).toLocaleDateString()
}
