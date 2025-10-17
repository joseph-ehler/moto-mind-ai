/**
 * ChatThreadSidebar - Mobile-Responsive Thread Management
 * 
 * Features:
 * - Mobile drawer (slides from bottom)
 * - Desktop sidebar (slides from right)
 * - Delete threads
 * - Rename threads
 * - Search/filter
 */

'use client'

import React, { useState } from 'react'
import { Stack, Flex, Text, Button, Heading, Card } from '@/components/design-system'
import { Plus, X, Trash2, Edit3, Search, MessageSquare, Clock } from 'lucide-react'

interface Thread {
  id: string
  title: string | null
  messageCount: number
  updatedAt: Date
}

interface Props {
  isOpen: boolean
  onClose: () => void
  threads: Thread[]
  currentThreadId: string | null
  onSelectThread: (threadId: string) => void
  onCreateThread: () => void
  onDeleteThread: (threadId: string) => void
  onRenameThread?: (threadId: string, newTitle: string) => void
}

export function ChatThreadSidebar({
  isOpen,
  onClose,
  threads,
  currentThreadId,
  onSelectThread,
  onCreateThread,
  onDeleteThread,
  onRenameThread
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null)

  const filteredThreads = threads.filter(t =>
    (t.title || 'New conversation').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRename = (threadId: string) => {
    if (onRenameThread && editTitle.trim()) {
      onRenameThread(threadId, editTitle.trim())
    }
    setEditingThreadId(null)
    setEditTitle('')
  }

  const handleDelete = async (threadId: string) => {
    setDeletingThreadId(threadId)
    try {
      await onDeleteThread(threadId)
    } finally {
      setDeletingThreadId(null)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop - Click to close */}
      <div
        className="absolute inset-0 bg-black/30 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sidebar - Slides over modal content */}
      <div className={`
        absolute z-50
        bg-white shadow-2xl
        
        /* Mobile: Full screen slide from bottom */
        bottom-0 left-0 right-0
        h-[85vh] rounded-t-3xl
        
        /* Desktop: Slide from LEFT */
        md:top-0 md:left-0 md:bottom-0 md:right-auto
        md:w-80 md:h-full md:rounded-none md:rounded-r-2xl
        
        /* Animation */
        ${isOpen ? 'animate-in slide-in-from-bottom md:slide-in-from-left duration-300' : ''}
      `}>
        <Stack spacing="none" className="h-full">
          {/* Header */}
          <Flex align="center" justify="between" className="px-3 py-3 border-b border-gray-200 bg-gray-50">
            <Flex align="center" gap="xs">
              <MessageSquare className="w-4 h-4 text-gray-600" />
              <Text className="text-sm font-semibold text-gray-900">
                Conversations
              </Text>
              <div className="px-1.5 py-0.5 bg-gray-200 rounded-full">
                <Text className="text-[10px] font-medium text-gray-700">{threads.length}</Text>
              </div>
            </Flex>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </Flex>

          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
          </div>

          {/* New Conversation Button */}
          <div className="p-3">
            <button
              onClick={() => {
                onCreateThread()
                onClose()
              }}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5 text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              New Conversation
            </button>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto">
            <Stack spacing="none">
              {filteredThreads.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <Text className="text-xs text-gray-500">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </Text>
                </div>
              ) : (
                filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    className={`
                      border-b border-gray-100 last:border-b-0
                      ${thread.id === currentThreadId ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      transition-colors
                    `}
                  >
                    {editingThreadId === thread.id ? (
                      /* Edit Mode */
                      <div className="p-3">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(thread.id)
                            if (e.key === 'Escape') setEditingThreadId(null)
                          }}
                          className="w-full px-2 py-1.5 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs mb-2"
                          autoFocus
                          placeholder="Title..."
                        />
                        <Flex gap="xs">
                          <button
                            onClick={() => handleRename(thread.id)}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-medium hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingThreadId(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] font-medium hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </Flex>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="group">
                        <div
                          className="w-full p-3 cursor-pointer"
                          onClick={() => {
                            onSelectThread(thread.id)
                            onClose()
                          }}
                        >
                          <Flex justify="between" align="start" className="mb-1.5">
                            <Text className="text-xs font-medium text-gray-900 truncate flex-1 pr-2">
                              {thread.title || 'New conversation'}
                            </Text>
                            <Flex gap="xs" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {onRenameThread && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingThreadId(thread.id)
                                    setEditTitle(thread.title || '')
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  aria-label="Rename"
                                >
                                  <Edit3 className="w-3 h-3 text-gray-600" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (confirm('Delete this conversation? This cannot be undone.')) {
                                    handleDelete(thread.id)
                                  }
                                }}
                                disabled={deletingThreadId === thread.id}
                                className="p-1 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                                aria-label="Delete"
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </button>
                            </Flex>
                          </Flex>
                          <Flex align="center" gap="sm" className="text-[10px] text-gray-500">
                            <Flex align="center" gap="xs">
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>{thread.messageCount} msgs</span>
                            </Flex>
                            <span>•</span>
                            <Flex align="center" gap="xs">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{formatRelativeTime(thread.updatedAt)}</span>
                            </Flex>
                          </Flex>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </Stack>
          </div>
        </Stack>
      </div>
    </>
  )
}

// Helper: Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
