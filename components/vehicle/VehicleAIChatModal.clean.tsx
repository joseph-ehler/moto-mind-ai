/**
 * VehicleAIChatModal - Ultra Clean Design
 * 
 * Principles:
 * - Conversation first, everything else secondary
 * - Zero noise, zero clutter
 * - Simple thread access (dropdown)
 * - Single scroll container (no wonky scrolling)
 * - Works perfectly on mobile and desktop
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Stack, Flex, Text, Button, Modal } from '@/components/design-system'
import { Sparkles, Send, Loader, AlertCircle, ChevronDown, Plus, X } from 'lucide-react'

// Types
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Thread {
  id: string
  title: string | null
  messageCount: number
  updatedAt: Date
}

interface VehicleContext {
  id: string
  make: string
  model: string
  year: number
  mileage: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  vehicleContext: VehicleContext
}

export function VehicleAIChatModal({ isOpen, onClose, vehicleContext }: Props) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showThreadPanel, setShowThreadPanel] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load on open
  useEffect(() => {
    if (isOpen) {
      loadThreads()
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Load messages when thread changes
  useEffect(() => {
    if (currentThreadId) loadMessages(currentThreadId)
  }, [currentThreadId])

  const loadThreads = async () => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleContext.id}/conversations`)
      if (res.ok) {
        const data = await res.json()
        const formatted = (data.threads || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          messageCount: t.message_count || 0,
          updatedAt: new Date(t.updated_at)
        }))
        setThreads(formatted)
        if (formatted.length > 0) {
          setCurrentThreadId(formatted[0].id)
        } else {
          createNewThread()
        }
      }
    } catch (err) {
      createNewThread()
    }
  }

  const loadMessages = async (threadId: string) => {
    try {
      const res = await fetch(`/api/conversations/${threadId}/messages`)
      if (res.ok) {
        const data = await res.json()
        setMessages((data.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp)
        })))
      }
    } catch (err) {
      console.error('Load messages failed:', err)
    }
  }

  const createNewThread = async () => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleContext.id}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleContext })
      })
      if (res.ok) {
        const data = await res.json()
        const newThread = {
          id: data.thread.id,
          title: null,
          messageCount: 0,
          updatedAt: new Date()
        }
        setThreads(prev => [newThread, ...prev])
        setCurrentThreadId(newThread.id)
        setMessages([])
        setShowThreadPanel(false)
      }
    } catch (err) {
      console.error('Create thread failed:', err)
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading || !currentThreadId) return

    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, tempMsg])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/conversations/${currentThreadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, vehicleContext })
      })

      if (!res.ok) throw new Error('Send failed')

      const data = await res.json()
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempMsg.id),
        {
          id: data.userMessage.id,
          role: 'user',
          content: data.userMessage.content,
          timestamp: new Date(data.userMessage.timestamp)
        },
        {
          id: data.assistantMessage.id,
          role: 'assistant',
          content: data.assistantMessage.content,
          timestamp: new Date(data.assistantMessage.timestamp)
        }
      ])
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      setError('Send failed. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const quickPrompts = [
    '🔧 When is my next service due?',
    '💰 Estimate annual maintenance costs',
    '📊 Check vehicle health',
    '⚠️ Common issues for this model'
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Assistant" size="xl">
      <div className="flex flex-col h-[90vh] max-h-[800px] -mx-6 -my-4 sm:-mx-8 sm:-my-6">
        
        {/* Vehicle & Thread Header - FIXED at top */}
        <div className="sticky top-0 z-20 flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="px-6 py-4">
            <Flex align="center" justify="between">
              <Flex align="center" gap="sm" className="flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <Text className="text-sm font-medium text-gray-900 truncate">
                  {vehicleContext.year} {vehicleContext.make} {vehicleContext.model}
                </Text>
              </Flex>

            {/* Thread History Button - Always show if loaded */}
            <div className="relative">
              <button
                onClick={() => setShowThreadPanel(!showThreadPanel)}
                className="flex items-center gap-1 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Text className="text-xs font-medium text-gray-600">{threads.length}</Text>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>

                {showThreadPanel && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowThreadPanel(false)}
                    />
                    <div className="absolute right-0 top-12 z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 max-h-96 overflow-y-auto">
                      <button
                        onClick={() => {
                          createNewThread()
                          setShowThreadPanel(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        New conversation
                      </button>
                      <div className="h-px bg-gray-200 my-1" />
                      {threads.map(thread => (
                        <button
                          key={thread.id}
                          onClick={() => {
                            setCurrentThreadId(thread.id)
                            setShowThreadPanel(false)
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                            thread.id === currentThreadId ? 'bg-blue-50 text-blue-900' : ''
                          }`}
                        >
                          <div className="truncate font-medium">
                            {thread.title || 'New conversation'}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {thread.messageCount} messages
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
            </div>
            </Flex>
          </div>
        </div>

        {/* Messages - Single Scroll Container */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 && !isLoading ? (
            <Stack spacing="lg" className="py-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <Text className="text-xl font-semibold text-gray-900 mb-2">
                  How can I help?
                </Text>
                <Text className="text-sm text-gray-600">
                  Ask me anything about your vehicle
                </Text>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto mt-6">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(prompt.replace(/^[^\s]+\s/, ''))
                      inputRef.current?.focus()
                    }}
                    className="p-3 text-left text-sm bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </Stack>
          ) : (
            <Stack spacing="md">
              {messages.map(msg => (
                <Flex key={msg.id} justify={msg.role === 'user' ? 'end' : 'start'}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}>
                    <Text className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </Text>
                  </div>
                </Flex>
              ))}

              {isLoading && (
                <Flex align="center" gap="sm" className="text-gray-500">
                  <Loader className="w-4 h-4 animate-spin" />
                  <Text className="text-sm">Thinking...</Text>
                </Flex>
              )}

              {error && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <Flex align="center" gap="sm">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <Text className="text-sm text-red-700">{error}</Text>
                  </Flex>
                </div>
              )}

              <div ref={messagesEndRef} />
            </Stack>
          )}
        </div>

        {/* Sticky Input - Full Width with Internal Padding */}
        <div className="sticky bottom-0 flex-shrink-0 border-t border-gray-200 bg-white z-10">
          <div className="px-6 py-4">
            <Flex gap="sm">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-colors"
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
