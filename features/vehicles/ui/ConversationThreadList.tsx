/**
 * ConversationThreadList Component
 * 
 * Displays conversation history for a vehicle with thread management
 * Can be used as sidebar or standalone view
 */

'use client'

import React, { useState } from 'react'
import { Stack, Flex, Text, Button, Heading } from '@/components/design-system'
import { Plus, Trash2, MoreVertical, MessageSquare, Clock } from 'lucide-react'

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

interface ConversationThreadListProps {
  threads: ConversationThread[]
  currentThreadId: string | null
  onSelectThread: (threadId: string) => void
  onNewThread: () => void
  onDeleteThread: (threadId: string) => void
  isLoading?: boolean
}

export function ConversationThreadList({
  threads,
  currentThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  isLoading = false
}: ConversationThreadListProps) {
  return (
    <Stack spacing="md" className="h-full">
      {/* Header */}
      <Flex justify="between" align="center">
        <Heading level="subtitle" className="text-lg font-semibold text-gray-900">
          Conversations
        </Heading>
        <Text className="text-xs text-gray-500">
          {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
        </Text>
      </Flex>

      {/* New Thread Button */}
      <Button
        onClick={onNewThread}
        className="w-full bg-black text-white hover:bg-gray-800 rounded-lg h-10 flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New Conversation
      </Button>

      {/* Thread List */}
      <Stack spacing="xs" className="flex-1 overflow-y-auto">
        {isLoading ? (
          <Stack spacing="sm" className="p-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </Stack>
        ) : threads.length === 0 ? (
          <Flex direction="col" align="center" justify="center" className="h-full py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
            <Text className="text-sm text-gray-600 text-center">
              No conversations yet
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-1">
              Start a new chat to begin
            </Text>
          </Flex>
        ) : (
          threads.map(thread => (
            <ThreadListItem
              key={thread.id}
              thread={thread}
              isActive={thread.id === currentThreadId}
              onClick={() => onSelectThread(thread.id)}
              onDelete={() => onDeleteThread(thread.id)}
            />
          ))
        )}
      </Stack>
    </Stack>
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
  const [timestamp, setTimestamp] = useState('')

  React.useEffect(() => {
    setTimestamp(formatRelativeTime(thread.updatedAt))
  }, [thread.updatedAt])

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg text-left transition-all relative group ${
        isActive
          ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
          : 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <Flex justify="between" align="start" gap="sm">
        <Stack spacing="xs" className="flex-1 min-w-0">
          {/* Thread Title */}
          <Text
            className={`text-sm font-medium truncate ${
              isActive ? 'text-blue-900' : 'text-gray-900'
            }`}
          >
            {thread.title || 'New conversation'}
          </Text>

          {/* Message Count & Timestamp */}
          <Flex align="center" gap="xs" className="text-xs text-gray-600">
            <MessageSquare className="w-3 h-3" />
            <Text className="text-xs">
              {thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}
            </Text>
            {timestamp && (
              <>
                <span className="text-gray-400">•</span>
                <Flex align="center" gap="xs">
                  <Clock className="w-3 h-3" />
                  <Text className="text-xs">{timestamp}</Text>
                </Flex>
              </>
            )}
          </Flex>
        </Stack>

        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                }}
              />

              {/* Menu */}
              <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
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
        </div>
      </Flex>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r" />
      )}
    </button>
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
