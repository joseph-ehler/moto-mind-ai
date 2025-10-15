/**
 * Capture Entry Modal - Hybrid Approach (Option C)
 * 
 * Provides two paths:
 * 1. Quick Capture - Snap first, AI categorizes later
 * 2. Guided Capture - Choose event type, then progressive steps
 * 
 * This is the S-tier entry point for all capture flows
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Modal, Stack, Flex, Heading, Text, Button } from '@/components/design-system'
import { Camera, Target, Zap, Clock, Sparkles } from 'lucide-react'
import { CAPTURE_FLOWS } from '@/features/capture/domain/flow-config'
import { useRecentEventTypes } from '@/features/capture/hooks/useRecentEventTypes'
import { useSuggestedEventType } from '@/features/capture/hooks/useSuggestedEventType'
import { captureAnalytics } from '@/lib/analytics'

interface CaptureEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onQuickCapture: () => void
  onGuidedCapture: (eventType: string) => void
  vehicleId: string
}

export function CaptureEntryModal({
  isOpen,
  onClose,
  onQuickCapture,
  onGuidedCapture,
  vehicleId
}: CaptureEntryModalProps) {
  const [showingPath, setShowingPath] = useState<'choice' | 'guided'>('choice')
  const { recentTypes, isLoading: loadingRecent } = useRecentEventTypes(vehicleId, 3)
  const { suggestion, isLoading: loadingSuggestion } = useSuggestedEventType(vehicleId)

  // Track modal opened
  useEffect(() => {
    if (isOpen) {
      captureAnalytics.modalOpened(vehicleId)
    }
  }, [isOpen, vehicleId])

  // Track suggestion shown
  useEffect(() => {
    if (suggestion && suggestion.confidence > 0.7) {
      captureAnalytics.suggestionShown(vehicleId, suggestion.type, suggestion.confidence)
    }
  }, [suggestion, vehicleId])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if modal is showing choice screen
      if (showingPath !== 'choice') return

      if (e.key === '1') {
        e.preventDefault()
        captureAnalytics.keyboardShortcutUsed('1', 'quick_capture')
        handleQuickCapture()
      } else if (e.key === '2' && suggestion) {
        e.preventDefault()
        captureAnalytics.keyboardShortcutUsed('2', 'suggested_capture')
        handleGuidedSelect(suggestion.type)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, showingPath, suggestion])

  const handleQuickCapture = () => {
    captureAnalytics.quickCaptureSelected(vehicleId)
    onClose()
    onQuickCapture()
  }

  const handleGuidedSelect = (eventType: string, source?: 'suggestion' | 'recent' | 'manual') => {
    // Track based on source
    if (source === 'suggestion' && suggestion) {
      captureAnalytics.suggestionUsed(vehicleId, eventType, suggestion.confidence)
    } else if (source === 'recent') {
      const position = recentTypes.indexOf(eventType)
      captureAnalytics.recentTypeUsed(vehicleId, eventType, position)
    }
    
    captureAnalytics.guidedCaptureSelected(vehicleId, eventType)
    onClose()
    onGuidedCapture(eventType)
  }

  const handleClose = () => {
    captureAnalytics.modalClosed(vehicleId, 'user_action')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={showingPath === 'choice' ? 'Capture Vehicle Data' : 'Choose What to Capture'}
      size="md"
    >
      {showingPath === 'choice' ? (
        <Stack spacing="lg">
          {/* Smart Suggestion (if available) */}
          {loadingSuggestion ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 animate-pulse">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="w-4 h-4 bg-purple-200 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-purple-200 rounded" />
                    <div className="h-3 w-48 bg-purple-200 rounded" />
                  </div>
                </div>
                <div className="h-16 bg-white/50 rounded-lg" />
              </div>
            </div>
          ) : suggestion && suggestion.confidence > 0.7 ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
              <Flex align="start" gap="sm" className="mb-3">
                <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text className="text-sm font-semibold text-purple-900 mb-1">
                    Suggested for you
                  </Text>
                  <Text className="text-xs text-purple-700">
                    {suggestion.reason}
                  </Text>
                </div>
              </Flex>
              <button
                onClick={() => handleGuidedSelect(suggestion.type, 'suggestion')}
                className="w-full p-3 rounded-lg bg-white border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 text-left group"
              >
                <Flex align="center" justify="between">
                  <Flex align="center" gap="sm">
                    <span className="text-2xl">{CAPTURE_FLOWS[suggestion.type]?.icon}</span>
                    <div>
                      <Text className="text-sm font-semibold text-gray-900">
                        {CAPTURE_FLOWS[suggestion.type]?.name}
                      </Text>
                      <Text className="text-xs text-gray-600">
                        {CAPTURE_FLOWS[suggestion.type]?.estimatedTime}
                      </Text>
                    </div>
                  </Flex>
                  <div className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all">
                    →
                  </div>
                </Flex>
              </button>
            </div>
          ) : null}

          {/* Recently Used (if available) */}
          {loadingRecent ? (
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ) : recentTypes.length > 0 ? (
            <div>
              <Text className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                Recently Used
              </Text>
              <div className="grid grid-cols-3 gap-2">
                {recentTypes.slice(0, 3).map((type: string) => {
                  const config = CAPTURE_FLOWS[type]
                  if (!config) return null
                  return (
                    <button
                      key={type}
                      onClick={() => handleGuidedSelect(type, 'recent')}
                      className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 bg-white group"
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{config.icon}</div>
                        <Text className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                          {config.name.split('/')[0]}
                        </Text>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* Divider if we have suggestions or recent */}
          {(suggestion || recentTypes.length > 0) && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
            </div>
          )}

          {/* Quick Capture Path */}
          <div className="relative">
            <button
              onClick={handleQuickCapture}
              className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <Stack spacing="md" className="relative z-10">
                <Flex align="center" gap="sm">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <Heading level="subtitle" className="text-white font-bold">
                    Quick Capture
                  </Heading>
                </Flex>
                
                <Text className="text-white/90 text-base">
                  📸 Snap first, categorize later
                </Text>
                
                <Text className="text-white/70 text-sm">
                  AI will detect what you captured and ask if you want to add more photos.
                  Perfect for quick logs.
                </Text>

                <Flex align="center" gap="xs" className="mt-2">
                  <Clock className="w-4 h-4 text-white/60" />
                  <Text className="text-white/60 text-xs font-medium">
                    Fastest • 1 tap to camera
                  </Text>
                </Flex>
              </Stack>
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-500 font-medium">
                or
              </span>
            </div>
          </div>

          {/* Guided Capture Path */}
          <button
            onClick={() => setShowingPath('guided')}
            className="w-full group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-6 text-left transition-all duration-300 hover:border-gray-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
          >
            <Stack spacing="md">
              <Flex align="center" gap="sm">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Target className="w-6 h-6 text-gray-900" />
                </div>
                <Heading level="subtitle" className="text-gray-900 font-bold">
                  Guided Capture
                </Heading>
              </Flex>
              
              <Text className="text-gray-700 text-base">
                🎯 Choose what you're logging first
              </Text>
              
              <Text className="text-gray-600 text-sm">
                Get step-by-step guidance to capture complete documentation.
                Best for thorough records.
              </Text>

              <Flex align="center" gap="xs" className="mt-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <Text className="text-gray-500 text-xs font-medium">
                  Complete • 2-4 photos typical
                </Text>
              </Flex>
            </Stack>
          </button>

          {/* Help Text */}
          <div className="space-y-2">
            <Text className="text-center text-gray-500 text-xs">
              💡 Not sure? Try Quick Capture - you can always add more photos later
            </Text>
            <Text className="text-center text-gray-400 text-xs">
              ⌨️ Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">1</kbd> for Quick Capture
              {suggestion && ` • <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">2</kbd> for Suggested`}
            </Text>
          </div>
        </Stack>
      ) : (
        <Stack spacing="md">
          {/* Back Button */}
          <button
            onClick={() => setShowingPath('choice')}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 -mt-2"
          >
            ← Back to capture options
          </button>

          {/* Event Type Grid */}
          <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {Object.values(CAPTURE_FLOWS).map((flow) => (
              <button
                key={flow.id}
                onClick={() => handleGuidedSelect(flow.id, 'manual')}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 text-left transition-all duration-200 hover:border-gray-300 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                <Flex align="start" gap="md">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {flow.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Flex align="start" justify="between" className="mb-1">
                      <Text className="text-base text-gray-900 font-semibold">
                        {flow.name}
                      </Text>
                      {flow.quickMode && (
                        <span className="ml-2 flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Quick
                        </span>
                      )}
                    </Flex>
                    
                    <Text className="text-gray-600 text-sm mb-2">
                      {flow.description}
                    </Text>

                    <Flex align="center" gap="xs">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <Text className="text-gray-500 text-xs">
                        {flow.estimatedTime}
                      </Text>
                    </Flex>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all">
                    →
                  </div>
                </Flex>
              </button>
            ))}
          </div>

          {/* Manual Entry Option */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                // TODO: Implement manual entry
                console.log('Manual entry')
              }}
              className="w-full p-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors text-center"
            >
              <Text className="text-gray-700 text-sm font-medium">
                ✏️ Manual Entry (No Camera)
              </Text>
              <Text className="text-gray-500 text-xs mt-1">
                Type details manually - slower but always available
              </Text>
            </button>
          </div>
        </Stack>
      )}
    </Modal>
  )
}
