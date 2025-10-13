/**
 * VehicleAIChatModal V3 - Enterprise Grade
 * 
 * Mobile-first, conversation-focused design
 * - Compact thread switcher (no bulky sidebar)
 * - Slide-over thread panel
 * - Sticky input with send button
 * - Clean, modern aesthetic
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Stack, Flex, Text, Button, Card, Modal, Heading } from '@/components/design-system'
import { 
  Sparkles, Send, Loader, AlertCircle, MessageSquare, 
  ChevronDown, X, Plus, Clock, MoreVertical, Trash2
} from 'lucide-react'

// Types
export interface Message {
  id: string
  threadId?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
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
  // Thread management
  const [threads, setThreads] = useState<ConversationThread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [showThreadPanel, setShowThreadPanel] = useState(false)
  const [threadsLoading, setThreadsLoading] = useState(false)
  
  // Message state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load threads on mount
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
        setShowThreadPanel(false)
      }
    } catch (err) {
      console.error('Failed to create thread:', err)
    }
  }

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

    setMessages(prev => [...prev, optimisticUserMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/conversations/${currentThreadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, vehicleContext })
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()

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
      
      setThreads(prev => prev.map(t => 
        t.id === currentThreadId 
          ? { ...t, updatedAt: new Date(), lastMessageAt: new Date(), messageCount: t.messageCount + 2 }
          : t
      ))
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== optimisticUserMessage.id))
      setError('Failed to send message. Please try again.')
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const contextualPrompts = [
    { icon: '🔧', text: 'When is my next service due?', query: `Based on my ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model} at ${vehicleContext.mileage.toLocaleString()} miles, when is my next service due?` },
    { icon: '💰', text: 'Estimate maintenance costs', query: `What are the typical annual maintenance costs for a ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}?` },
    { icon: '📊', text: 'Check vehicle health', query: `Give me a health assessment of my ${vehicleContext.make} ${vehicleContext.model}.` },
    { icon: '⚠️', text: 'Common issues', query: `What are common issues for a ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}?` }
  ]

  const currentThread = threads.find(t => t.id === currentThreadId)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="relative flex flex-col h-[85vh] max-h-[900px]">
        {/* Compact Header with Thread Switcher */}
        <div className="flex-shrink-0 border-b border-gray-200">
          <Flex align="center" justify="between" className="p-4">
            {/* Thread Switcher */}
            <button
              onClick={() => setShowThreadPanel(true)}
              className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors min-w-0"
            >
              <MessageSquare className="w-4 h-4 text-gray-600 flex-shrink-0" />
              <Text className="text-sm font-medium text-gray-900 truncate">
                {currentThread?.title || 'New conversation'}
              </Text>
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>

            {/* Vehicle Badge */}
            <Flex align="center" gap="xs" className="ml-3 px-3 py-2 bg-blue-50 rounded-lg flex-shrink-0">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <Text className="text-xs font-medium text-blue-900 hidden sm:block">
                {vehicleContext.year} {vehicleContext.make}
              </Text>
            </Flex>
          </Flex>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <Stack spacing="md">
            {messages.length === 0 && !isLoading && (
              <EmptyState prompts={contextualPrompts} onSelectPrompt={handleSendMessage} />
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
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <Text className="text-sm text-red-700">{error}</Text>
                </Flex>
              </Card>
            )}

            <div ref={messagesEndRef} />
          </Stack>
        </div>

        {/* Sticky Input Bar */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
          <Flex gap="sm">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900 placeholder-gray-500 disabled:bg-gray-50"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 bg-blue-600 text-white hover:bg-blue-700 h-12 w-12 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </Button>
          </Flex>
        </div>

        {/* Slide-over Thread Panel */}
        {showThreadPanel && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
              onClick={() => setShowThreadPanel(false)}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
              {/* Panel Header */}
              <Flex justify="between" align="center" className="p-4 border-b border-gray-200">
                <Heading level="subtitle" className="text-lg font-semibold text-gray-900">
                  Conversations
                </Heading>
                <button 
                  onClick={() => setShowThreadPanel(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </Flex>

              {/* New Thread Button */}
              <div className="p-3 border-b border-gray-200">
                <Button
                  onClick={() => {
                    createNewThread()
                    setShowThreadPanel(false)
                  }}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-lg h-10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Conversation
                </Button>
              </div>

              {/* Thread List */}
              <div className="flex-1 overflow-y-auto p-3">
                <Stack spacing="xs">
                  {threadsLoading ? (
                    <Stack spacing="sm">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                      ))}
                    </Stack>
                  ) : threads.length === 0 ? (
                    <Flex direction="col" align="center" justify="center" className="h-full py-12">
                      <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                      <Text className="text-sm text-gray-600 text-center">
                        No conversations yet
                      </Text>
                    </Flex>
                  ) : (
                    threads.map(thread => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === currentThreadId}
                        onClick={() => {
                          setCurrentThreadId(thread.id)
                          setShowThreadPanel(false)
                        }}
                        onDelete={() => handleDeleteThread(thread.id)}
                      />
                    ))
                  )}
                </Stack>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

// Thread Item Component
function ThreadItem({ 
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
  const [timestamp, setTimestamp] = useState('')

  useEffect(() => {
    setTimestamp(formatRelativeTime(thread.updatedAt))
  }, [thread.updatedAt])

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg text-left transition-all relative group ${
        isActive 
          ? 'bg-blue-50 border border-blue-200' 
          : 'bg-white hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <Flex justify="between" align="start" gap="sm">
        <Stack spacing="xs" className="flex-1 min-w-0">
          <Text className={`text-sm font-medium truncate ${
            isActive ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {thread.title || 'New conversation'}
          </Text>
          <Flex align="center" gap="xs">
            <Text className="text-xs text-gray-600">
              {thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}
            </Text>
            <span className="text-gray-400">•</span>
            <Flex align="center" gap="xs">
              <Clock className="w-3 h-3 text-gray-400" />
              <Text className="text-xs text-gray-500">{timestamp}</Text>
            </Flex>
          </Flex>
        </Stack>

        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
        >
          <MoreVertical className="w-4 h-4 text-gray-600" />
        </button>
      </Flex>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(false)
            }}
          />
          <div className="absolute right-2 top-12 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm('Delete this conversation?')) {
                  onDelete()
                }
                setShowMenu(false)
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </button>
  )
}

// Message Bubble Component
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const [timestamp, setTimestamp] = useState('')

  useEffect(() => {
    setTimestamp(message.timestamp.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }))
  }, [message.timestamp])

  return (
    <Flex justify={isUser ? 'end' : 'start'} className="w-full">
      <Stack spacing="xs" className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <Card
          className={`px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'
          }`}
        >
          <Text className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </Text>
        </Card>
        <Text className="text-xs text-gray-500 px-2">
          {timestamp}
        </Text>
      </Stack>
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
    <Stack spacing="lg" className="py-12">
      <Stack spacing="sm" className="text-center">
        <Flex align="center" justify="center" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mx-auto mb-2">
          <Sparkles className="w-8 h-8 text-white" />
        </Flex>
        <Heading level="subtitle" className="text-xl font-semibold text-gray-900">
          How can I help?
        </Heading>
        <Text className="text-sm text-gray-600 max-w-md mx-auto">
          Ask me anything about maintenance, costs, or common issues.
        </Text>
      </Stack>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
        {prompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(prompt.query)}
            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
          >
            <Flex align="center" gap="sm">
              <span className="text-2xl">{prompt.icon}</span>
              <Text className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                {prompt.text}
              </Text>
            </Flex>
          </button>
        ))}
      </div>
    </Stack>
  )
}

// Utility
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
