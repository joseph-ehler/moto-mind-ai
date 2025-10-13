/**
 * VehicleAIChatModal - PROPERLY BUILT
 * 
 * No negative margins, no hacks, clean box model
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Stack, Flex, Text, Button, Heading } from '@/components/design-system'
import { Sparkles, Send, Loader, AlertCircle, ChevronDown, Plus, X, Bell, ExternalLink, FileDown, ArrowRight, Copy, Check, RotateCcw, Edit, Camera, PlusCircle, MessageSquare, FileText } from 'lucide-react'
import { BaseModalShell } from '@/components/design-system/feedback/ModalSystem'
import { ModalContent } from '@/components/design-system/feedback/ModalInternals'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { QuickOdometerModal } from './QuickOdometerModal'
import { EventCorrectionModal } from './EventCorrectionModal'
import { ProposedUpdateCard } from './ProposedUpdateCard'
import { ChatThreadSidebar } from './ChatThreadSidebar'
import { EventCard } from '@/components/chat/EventCard'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: MessageAction[]
  status?: 'sending' | 'sent' | 'failed'
  photoUrls?: string[]
  metadata?: {
    proposal_approved?: boolean
    approved_at?: string
    event_id?: string
  }
}

export interface MessageAction {
  type: 'reminder' | 'navigate' | 'export' | 'external' | 'correct_event' | 'add_event' | 'upload_photo' | 'view_event'
  label: string
  data?: any
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
  mileage?: number
  vin?: string // VIN for validation
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
  const [loadingMessage, setLoadingMessage] = useState('Thinking...')
  const [error, setError] = useState<string | null>(null)
  const [showThreadPanel, setShowThreadPanel] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false)
  const [correctionEventData, setCorrectionEventData] = useState<any>(null)
  const [addEventModalOpen, setAddEventModalOpen] = useState(false)
  const [addEventData, setAddEventData] = useState<any>(null)
  const [approvedProposals, setApprovedProposals] = useState<Set<string>>(new Set())
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Refresh messages after successful update
  const refreshMessages = async () => {
    if (!currentThreadId) return
    
    try {
      const res = await fetch(`/api/conversations/${currentThreadId}/messages`)
      const data = await res.json()
      
      if (data.messages) {
        setMessages(data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
          actions: m.actions || [],
          photoUrls: m.photoUrls || [],
          metadata: m.metadata || {}
        })))
        
        // Build approvedProposals set from metadata
        const approved = new Set<string>()
        data.messages.forEach((m: any) => {
          if (m.metadata?.proposal_approved) {
            approved.add(m.id)
          }
        })
        setApprovedProposals(approved)
      }
    } catch (error) {
      console.error('Failed to refresh messages:', error)
    }
  }

  const handleOdometerSuccess = async (mileage: number) => {
    console.log('✅ Odometer updated successfully:', mileage)
    
    // Send a confirmation message to the chat
    const confirmationMessage = `✅ **Mileage Updated!**\n\nYour odometer has been updated to **${mileage.toLocaleString()} miles**. This record has been added to your vehicle's timeline.`
    
    // Add confirmation to chat
    setMessages(prev => [...prev, {
      id: `confirm-${Date.now()}`,
      role: 'assistant',
      content: confirmationMessage,
      timestamp: new Date(),
      status: 'sent'
    }])
    
    // Refresh to get updated context
    await refreshMessages()
  }

  const handleProposalApprove = async (proposal: any, messageId: string) => {
    // Check if already approved
    if (approvedProposals.has(messageId)) {
      console.log('⚠️ Proposal already approved, ignoring')
      return
    }
    
    console.log('✅ Approving proposal:', proposal)
    
    // Immediately mark as approved in UI to prevent double-clicks
    setApprovedProposals(prev => new Set(prev).add(messageId))
    
    try {
      // Use smart-log API for all event types
      const response = await fetch(`/api/vehicles/${vehicleContext.id}/events/smart-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: proposal.data?.event_type || proposal.type,
          mileage: proposal.data?.suggested_miles,
          source: 'ai_chat_approved_proposal',
          // Service-specific
          service_type: proposal.data?.service_type,
          vendor_name: proposal.data?.vendor_name,
          cost: proposal.data?.cost,
          // Fuel-specific
          gallons: proposal.data?.gallons,
          station_name: proposal.data?.station_name,
          trip_miles: proposal.data?.trip_miles,
          // Damage-specific
          damage_type: proposal.data?.damage_type,
          severity: proposal.data?.severity,
          // Warning-specific
          warning_type: proposal.data?.warning_type,
          error_codes: proposal.data?.error_codes,
          // Photos
          photo_urls: proposal.data?.photo_urls,
          // Generic payload (includes dashboard data: fuel_level, engine_temp, warning_lights, etc.)
          payload: {
            ...(proposal.data?.fuel_level && { fuel_level: proposal.data.fuel_level }),
            ...(proposal.data?.engine_temp && { engine_temp: proposal.data.engine_temp }),
            ...(proposal.data?.outside_temp && { outside_temp: proposal.data.outside_temp }),
            ...(proposal.data?.warning_lights && { warning_lights: proposal.data.warning_lights }),
            ...proposal.data?.payload
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        console.log('✅ Event logged successfully:', data)
        
        // Mark this proposal as approved in database
        try {
          const approvalRes = await fetch(`/api/conversations/${currentThreadId}/messages/${messageId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              proposalType: proposal.type,
              eventId: data.event?.id 
            })
          })
          
          if (approvalRes.ok) {
            console.log('✅ Approval status saved to database')
          } else {
            console.warn('⚠️ Failed to save approval status (non-critical)')
          }
        } catch (approvalError) {
          console.warn('⚠️ Failed to mark as approved (non-critical):', approvalError)
        }
        
        // Show success message
        await handleOdometerSuccess(proposal.data?.suggested_miles || 0)
      } else {
        // Remove from approved set if failed
        setApprovedProposals(prev => {
          const newSet = new Set(prev)
          newSet.delete(messageId)
          return newSet
        })
        throw new Error(data.error || 'Failed to log event')
      }
    } catch (error: any) {
      console.error('❌ Failed to approve proposal:', error)
      // Remove from approved set on error
      setApprovedProposals(prev => {
        const newSet = new Set(prev)
        newSet.delete(messageId)
        return newSet
      })
      alert(`Failed to log event: ${error.message}`)
    }
  }

  const handleProposalEdit = (proposal: any) => {
    console.log('✏️  Editing proposal:', proposal)
    
    // Open modal for manual editing with all extracted data
    setAddEventData(proposal.data)
    setAddEventModalOpen(true)
  }

  const handleProposalReject = (proposal: any) => {
    console.log('❌ Rejecting proposal:', proposal)
    
    trackEvent('ai_chat_proposal_rejected', {
      vehicle_id: vehicleContext.id,
      proposal_type: proposal.type
    })
    
    // Add a message to the chat saying they rejected it
    setMessages(prev => [...prev, {
      id: `reject-${Date.now()}`,
      role: 'assistant',
      content: `**Proposal Rejected!**\n\nYou rejected the proposal to update your vehicle data.`,
      timestamp: new Date(),
      status: 'sent'
    }])
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to 3 photos
    const newFiles = files.slice(0, 3 - uploadedPhotos.length)
    
    // Create preview URLs
    const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file))
    
    setUploadedPhotos(prev => [...prev, ...newFiles])
    setPhotoPreviewUrls(prev => [...prev, ...newPreviewUrls])
    
    // Clear the input
    if (photoInputRef.current) {
      photoInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = (index: number) => {
    // Revoke the preview URL to free memory
    URL.revokeObjectURL(photoPreviewUrls[index])
    
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleCorrectionSuccess = async () => {
    console.log('✅ Event corrected successfully')
    
    // Add a message to the chat saying they corrected it
    // Send a confirmation message to the chat
    const confirmationMessage = `✅ **Data Corrected!**\n\nYour dashboard data has been updated. The correction has been logged in the audit trail, and the original data has been preserved for reference.`
    
    // Add confirmation to chat
    setMessages(prev => [...prev, {
      id: `confirm-${Date.now()}`,
      role: 'assistant',
      content: confirmationMessage,
      timestamp: new Date(),
      status: 'sent'
    }])
    
    // Refresh to get updated context
    await refreshMessages()
  }

  // Load threads when modal opens
  useEffect(() => {
    if (isOpen) {
      loadThreads()
    }
  }, [isOpen])

  // Load messages when thread changes
  useEffect(() => {
    if (isOpen && currentThreadId) {
      loadMessages(currentThreadId)
      // Track modal opened
      trackEvent('ai_chat_opened', {
        vehicle_id: vehicleContext.id,
        thread_id: currentThreadId
      })
    }
  }, [currentThreadId, isOpen])

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
          timestamp: new Date(m.timestamp),
          actions: m.actions || []
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
        headers: { 'Content-Type': 'application/json' }
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

  const deleteThread = async (threadId: string) => {
    try {
      const res = await fetch(`/api/conversations/${threadId}/delete`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        // Remove from list
        setThreads(prev => prev.filter(t => t.id !== threadId))
        
        // If deleting current thread, switch to another or create new
        if (threadId === currentThreadId) {
          const remaining = threads.filter(t => t.id !== threadId)
          if (remaining.length > 0) {
            setCurrentThreadId(remaining[0].id)
          } else {
            await createNewThread()
          }
        }
      }
    } catch (err) {
      console.error('Delete thread failed:', err)
    }
  }

  const renameThread = async (threadId: string, newTitle: string) => {
    try {
      const res = await fetch(`/api/conversations/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      })
      
      if (res.ok) {
        setThreads(prev => prev.map(t => 
          t.id === threadId ? { ...t, title: newTitle } : t
        ))
      }
    } catch (err) {
      console.error('Rename thread failed:', err)
    }
  }

  // Analytics tracking
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    try {
      // Console log for now - integrate with your analytics provider
      console.log('📊 Analytics Event:', eventName, properties)
    } catch (err) {
      // Fail silently for analytics
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Bell className="w-3.5 h-3.5" />
      case 'navigate':
        return <ArrowRight className="w-3.5 h-3.5" />
      case 'export':
        return <FileDown className="w-3.5 h-3.5" />
      case 'external':
        return <ExternalLink className="w-3.5 h-3.5" />
      case 'correct_event':
        return <Edit className="w-3.5 h-3.5" />
      case 'add_event':
        return <PlusCircle className="w-3.5 h-3.5" />
      case 'upload_photo':
        return <Camera className="w-3.5 h-3.5" />
      case 'view_event':
        return <FileText className="w-3.5 h-3.5" />
      default:
        return null
    }
  }

  const setReminder = (action: MessageAction) => {
    // Create a simple reminder using browser notification API
    if ('Notification' in window) {
      console.log('🔔 Current notification permission:', Notification.permission)
      
      if (Notification.permission === 'granted') {
        // Permission already granted
        scheduleNotification(action)
      } else if (Notification.permission !== 'denied') {
        // Request permission
        Notification.requestPermission().then(permission => {
          console.log('🔔 Permission result:', permission)
          if (permission === 'granted') {
            scheduleNotification(action)
          } else {
            alert('❌ Notification permission denied.\n\nPlease enable notifications in your browser settings to use reminders.')
          }
        })
      } else {
        alert('❌ Notifications are blocked.\n\nPlease enable notifications in your browser settings:\n\n1. Click the lock icon in the address bar\n2. Allow notifications for this site\n3. Reload the page')
      }
    } else {
      alert('❌ Your browser does not support notifications.')
    }
  }

  const scheduleNotification = (action: MessageAction) => {
    const delaySeconds = 10
    console.log(`⏰ Scheduling notification for ${delaySeconds} seconds from now...`)
    
    // Track reminder creation
    trackEvent('ai_chat_reminder_set', {
      vehicle_id: vehicleContext.id,
      reminder_label: action.label,
      delay_seconds: delaySeconds
    })
    
    // Schedule notification
    setTimeout(() => {
      console.log('🔔 Showing notification now!')
      
      try {
        const notification = new Notification('MotoMind Reminder 🔧', {
          body: action.label,
          tag: `reminder-${Date.now()}`,
          icon: 'https://em-content.zobj.net/thumbs/120/apple/354/wrench_1f527.png',
          requireInteraction: false // Don't require manual dismissal
        })
        
        notification.onclick = () => {
          console.log('🔔 Notification clicked - focusing window')
          window.focus()
          notification.close()
          
          // Track notification interaction
          trackEvent('ai_chat_reminder_clicked', {
            vehicle_id: vehicleContext.id,
            reminder_label: action.label
          })
        }
        
        console.log('✅ System notification created successfully')
        
        // Track successful notification
        trackEvent('ai_chat_reminder_shown', {
          vehicle_id: vehicleContext.id,
          reminder_label: action.label
        })
      } catch (err) {
        console.error('❌ Notification failed:', err)
        
        // Track failure
        trackEvent('ai_chat_reminder_failed', {
          vehicle_id: vehicleContext.id,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
        
        alert(`❌ Notification failed.\n\nPlease check your browser settings:\n1. Allow notifications for this site\n2. Check macOS System Settings → Notifications → ${navigator.userAgent.includes('Chrome') ? 'Chrome/Brave' : 'Your Browser'}`)
      }
    }, delaySeconds * 1000)
    
    alert(`✅ Reminder set!\n\nYou'll receive a system notification in ${delaySeconds} seconds:\n\n"${action.label}"\n\n💡 Look at the top-right corner of your screen.`)
  }

  const handleAction = (action: MessageAction) => {
    // Track action click
    trackEvent('ai_chat_action_clicked', {
      action_type: action.type,
      action_label: action.label,
      vehicle_id: vehicleContext.id
    })
    
    switch (action.type) {
      case 'reminder':
        setReminder(action)
        break
        
      case 'navigate':
        if (action.data?.path) {
          window.location.href = action.data.path
        }
        break
        
      case 'export':
        exportConversation()
        break
        
      case 'external':
        if (action.data?.url) {
          window.open(action.data.url, '_blank')
        }
        break
        
      case 'correct_event':
        // Open correction modal with event data
        setCorrectionEventData(action.data)
        setCorrectionModalOpen(true)
        break
        
      case 'add_event':
        // Open add event modal
        setAddEventData(action.data)
        setAddEventModalOpen(true)
        break
        
      case 'upload_photo':
        // Trigger file upload
        fileInputRef.current?.click()
        break
        
      case 'view_event':
        // Navigate to event details page
        if (action.data?.event_id) {
          window.location.href = `/events/${action.data.event_id}`
        }
        break
    }
  }

  const copyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
      
      trackEvent('ai_chat_message_copied', {
        vehicle_id: vehicleContext.id,
        message_id: messageId
      })
    }).catch((err) => {
      console.error('Copy failed:', err)
      alert('Failed to copy message')
    })
  }

  const regenerateResponse = async () => {
    if (isLoading || messages.length < 2) return
    
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMessage) return
    
    // Remove the last AI response
    const messagesBeforeLastAI = messages.slice(0, -1)
    setMessages(messagesBeforeLastAI)
    
    // Track regeneration
    trackEvent('ai_chat_response_regenerated', {
      vehicle_id: vehicleContext.id,
      thread_id: currentThreadId,
      original_message_id: messages[messages.length - 1].id
    })
    
    // Resend the last user message
    setInput(lastUserMessage.content)
    
    // Trigger send automatically after a brief delay
    setTimeout(() => {
      sendMessage()
    }, 100)
  }

  const exportConversation = () => {
    // Export feature temporarily disabled due to browser compatibility issues
    alert('⚠️ Export feature is temporarily unavailable.\n\nYou can manually copy the conversation text from the chat window.\n\nWe apologize for the inconvenience.')
    console.log('Export feature disabled - browser hanging issue')
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('📸 Photo selected for upload:', file.name)
    
    // Track photo upload from chat
    trackEvent('ai_chat_photo_uploaded', {
      vehicle_id: vehicleContext.id,
      file_size: file.size,
      file_type: file.type
    })

    // TODO: Implement actual upload to vision processing
    // For now, show confirmation
    alert(`📸 Photo Upload Ready!\n\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\n\n🚧 Vision processing integration coming soon!`)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isLoading || !currentThreadId) return

    // Track message sent
    trackEvent('ai_chat_message_sent', {
      vehicle_id: vehicleContext.id,
      thread_id: currentThreadId,
      message_length: text.length,
      has_photos: uploadedPhotos.length > 0
    })

    // Upload photos first if any
    let photoUrls: string[] = []
    let dashboardData: any = null
    
    if (uploadedPhotos.length > 0) {
      setIsUploadingPhoto(true)
      setLoadingMessage('Uploading photos...')
      
      try {
        const formData = new FormData()
        uploadedPhotos.forEach((photo, index) => {
          formData.append('photos', photo)
        })

        const uploadRes = await fetch(`/api/vehicles/${vehicleContext.id}/photos/upload-temp`, {
          method: 'POST',
          body: formData
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          photoUrls = uploadData.urls || []
          console.log('📸 Uploaded photos:', photoUrls)
          
          // Check if this might be a dashboard photo
          // Trigger if message contains keywords OR if user is asking to log/update/save
          const lowerText = text.toLowerCase()
          const isDashboardRequest = lowerText.includes('dashboard') || 
                                     lowerText.includes('capture') ||
                                     lowerText.includes('odometer') ||
                                     lowerText.includes('mileage') ||
                                     lowerText.includes('update') ||
                                     lowerText.includes('log') ||
                                     lowerText.includes('save') ||
                                     lowerText.includes('record') ||
                                     lowerText.includes('timeline')
          
          // Process first photo through vision API if it looks like a dashboard request
          if (isDashboardRequest && uploadedPhotos[0]) {
            setLoadingMessage('Analyzing dashboard...')
            console.log('🔍 Dashboard photo detected, processing through vision API...')
            
            try {
              const visionFormData = new FormData()
              visionFormData.append('image', uploadedPhotos[0])
              visionFormData.append('mode', 'dashboard')
              visionFormData.append('document_type', 'dashboard')
              visionFormData.append('vehicle_id', vehicleContext.id)
              
              const visionRes = await fetch('/api/vision/process', {
                method: 'POST',
                body: visionFormData
              })
              
              if (visionRes.ok) {
                const visionData = await visionRes.json()
                console.log('📊 Vision API response:', visionData)
                if (visionData.success && visionData.data) {
                  dashboardData = visionData.data
                  console.log('✅ Dashboard data extracted:', JSON.stringify(dashboardData, null, 2))
                } else {
                  console.warn('⚠️ Vision API succeeded but no data:', visionData)
                }
              } else {
                const errorData = await visionRes.json()
                console.error('❌ Vision API failed:', errorData)
              }
            } catch (visionError) {
              console.error('❌ Vision API error (non-critical):', visionError)
              // Continue without dashboard data
            }
          }
        }
      } catch (error) {
        console.error('Photo upload failed:', error)
        // Continue anyway, just without photos
      } finally {
        setIsUploadingPhoto(false)
        setLoadingMessage('Thinking...')
      }
    }

    const tempUserMsg: Message = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
      status: 'sending'
    }

    const tempAsstMsg: Message = {
      id: `temp-asst-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'sending'
    }

    setMessages(prev => [...prev, tempUserMsg, tempAsstMsg])
    setInput('')
    // Clear photos after sending
    setUploadedPhotos([])
    photoPreviewUrls.forEach(url => URL.revokeObjectURL(url))
    setPhotoPreviewUrls([])
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/conversations/${currentThreadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          vehicleContext,
          photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
          dashboardData: dashboardData || undefined
        })
      })

      if (!res.ok) throw new Error('Send failed')

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No reader')

      let buffer = ''
      let streamedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            
            if (data.type === 'chunk') {
              streamedContent += data.content
              // Update assistant message with streamed content
              setMessages(prev => prev.map(m => 
                m.id === tempAsstMsg.id
                  ? { ...m, content: streamedContent }
                  : m
              ))
            } else if (data.type === 'complete') {
              // Replace temp messages with real ones (including actions)
              setMessages(prev => [
                ...prev.filter(m => m.id !== tempUserMsg.id && m.id !== tempAsstMsg.id),
                {
                  id: data.userMessage.id,
                  role: 'user',
                  content: data.userMessage.content,
                  timestamp: new Date(data.userMessage.timestamp),
                  photoUrls: data.userMessage.photoUrls || [],
                  status: 'sent'
                },
                {
                  id: data.assistantMessage.id,
                  role: 'assistant',
                  content: data.assistantMessage.content,
                  timestamp: new Date(data.assistantMessage.timestamp),
                  actions: data.assistantMessage.actions || [],
                  status: 'sent'
                }
              ])
            }
          }
        }
      }
    } catch (err) {
      // Mark messages as failed instead of removing them
      setMessages(prev => prev.map(m => {
        if (m.id === tempUserMsg.id || m.id === tempAsstMsg.id) {
          return { ...m, status: 'failed' as const }
        }
        return m
      }))
      setError('Send failed. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Dynamic suggested questions based on vehicle
  const quickPrompts = [
    `What maintenance does my ${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model} need?`,
    `How much should I budget for annual maintenance?`,
    `When should I replace my tires?`,
    `What's the recommended oil change interval?`,
    `Any common issues with this model?`,
    `Show me my maintenance history`
  ]

  return (
    <>
      <BaseModalShell isOpen={isOpen} onClose={onClose} size="xl">
        {/* Hidden file input for photo upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
      
      <div className="flex flex-col h-[85vh] max-h-[800px]">
        {/* Header with vehicle info and close button */}
        <div className="px-6 py-4 border-b border-gray-200">
          <Flex align="center" justify="between">
            <Flex align="center" gap="sm">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <Text className="text-sm font-medium">
                {vehicleContext.year} {vehicleContext.make} {vehicleContext.model}
              </Text>
            </Flex>

            <Flex align="center" gap="xs">
              {/* Conversations button */}
              <button
                onClick={() => setShowThreadPanel(true)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-gray-600" />
                <Text className="text-xs font-medium text-gray-600">{threads.length}</Text>
              </button>

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </Flex>
          </Flex>
        </div>

        {/* Messages - Scrollable area */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 && !isLoading ? (
            <Stack spacing="lg" className="py-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <Heading level="subtitle" className="text-xl font-semibold mb-2">
                  How can I help?
                </Heading>
                <Text className="text-sm text-gray-600">
                  Ask me anything about your vehicle
                </Text>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mt-6">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      // Track suggested question click
                      trackEvent('ai_chat_suggested_question_clicked', {
                        vehicle_id: vehicleContext.id,
                        question: prompt,
                        position: i
                      })
                      
                      setInput(prompt)
                      inputRef.current?.focus()
                      // Auto-send after brief delay
                      setTimeout(() => {
                        sendMessage()
                      }, 100)
                    }}
                    className="group p-4 text-left text-sm bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all hover:shadow-md"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 group-hover:text-blue-600" />
                      <span className="text-gray-700 group-hover:text-gray-900 font-medium">{prompt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Stack>
          ) : (
            <Stack spacing="md">
              {messages.map((msg, msgIndex) => (
                <div key={msg.id}>
                  <Flex justify={msg.role === 'user' ? 'end' : 'start'} align="end" className="gap-2">
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    } ${msg.status === 'failed' ? 'opacity-50 border-2 border-red-500' : ''}`}>
                      <div className={`text-sm leading-relaxed markdown-content ${
                        msg.role === 'user' ? 'text-white' : 'text-gray-900'
                      }`}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="ml-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                            em: ({node, ...props}) => <em className="italic" {...props} />,
                            code: ({node, inline, ...props}: any) => 
                              inline 
                                ? <code className={`px-1.5 py-0.5 rounded text-xs ${
                                    msg.role === 'user' ? 'bg-blue-700' : 'bg-gray-200'
                                  }`} {...props} />
                                : <code className={`block p-2 rounded text-xs overflow-x-auto ${
                                    msg.role === 'user' ? 'bg-blue-700' : 'bg-gray-200'
                                  }`} {...props} />,
                            a: ({node, ...props}) => <a className="underline hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                        
                        {/* Photo Attachments */}
                        {msg.photoUrls && msg.photoUrls.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {msg.photoUrls.map((url, idx) => (
                              <a 
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block rounded-lg overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all"
                              >
                                <img 
                                  src={url} 
                                  alt={`Attachment ${idx + 1}`}
                                  className="w-32 h-32 object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Indicator */}
                    {msg.status && msg.role === 'user' && (
                      <div className="text-xs text-gray-400 mb-1">
                        {msg.status === 'sending' && <Loader className="w-3 h-3 animate-spin" />}
                        {msg.status === 'sent' && <Check className="w-3 h-3 text-green-500" />}
                        {msg.status === 'failed' && <AlertCircle className="w-3 h-3 text-red-500" />}
                      </div>
                    )}
                  </Flex>
                  
                  {/* Proposed Update Card - Shows for messages with proposals (hide if approved) */}
                  {msg.role === 'assistant' && msg.actions && msg.actions.some(a => a.data?.proposal) && !approvedProposals.has(msg.id) && (
                    <div className="mt-3 max-w-[85%]">
                      {msg.actions
                        .filter(action => action.data?.proposal)
                        .map((action, idx) => (
                          <ProposedUpdateCard
                            key={idx}
                            proposal={{
                              type: action.data.proposal.type,
                              data: action.data,
                              preview: action.data.proposal.preview
                            }}
                            vehicleName={`${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}`}
                            vehicleVin={vehicleContext.vin}
                            isApproved={approvedProposals.has(msg.id) || msg.metadata?.proposal_approved}
                            isApproving={false}
                            onApprove={() => handleProposalApprove({
                              type: action.data.proposal.type,
                              data: action.data
                            }, msg.id)}
                            onEdit={() => handleProposalEdit({
                              type: action.data.proposal.type,
                              data: action.data
                            })}
                            onReject={() => handleProposalReject({
                              type: action.data.proposal.type
                            })}
                          />
                        ))}
                    </div>
                  )}
                  
                  {/* Copy Button and Regenerate - Shows for all messages */}
                  <Flex justify={msg.role === 'user' ? 'end' : 'start'} className="mt-1 gap-2">
                    <button
                      onClick={() => copyMessage(msg.id, msg.content)}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                      title="Copy message"
                    >
                      {copiedMessageId === msg.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    
                    {/* Regenerate button - only on last AI message */}
                    {msg.role === 'assistant' && msgIndex === messages.length - 1 && !isLoading && (
                      <button
                        onClick={regenerateResponse}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center gap-1"
                        title="Regenerate response"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Regenerate</span>
                      </button>
                    )}
                  </Flex>
                  
                  {/* Event Cards - Rendered inline for view_event actions */}
                  {msg.role === 'assistant' && msg.actions && msg.actions.some(a => a.type === 'view_event') && (
                    <div className="mt-3 space-y-2">
                      {msg.actions
                        .filter(action => action.type === 'view_event')
                        .map((action, idx) => (
                          <EventCard key={idx} eventData={action.data} />
                        ))}
                    </div>
                  )}
                  
                  {/* Action Buttons for AI messages (excluding proposals and view_event which are shown as cards) */}
                  {msg.role === 'assistant' && msg.actions && msg.actions.filter(a => !a.data?.proposal && a.type !== 'view_event').length > 0 && (
                    <Flex justify="start" className="mt-2 ml-0">
                      <div className="flex flex-wrap gap-2">
                        {msg.actions
                          .filter(action => !action.data?.proposal && action.type !== 'view_event')
                          .map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleAction(action)}
                              className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-1.5"
                            >
                              {getActionIcon(action.type)}
                              {action.label}
                            </button>
                          ))}
                      </div>
                    </Flex>
                  )}
                </div>
              ))}

              {isLoading && (
                <Flex align="center" gap="sm">
                  <Loader className="w-4 h-4 animate-spin" />
                  <Text className="text-sm text-gray-500">{loadingMessage}</Text>
                </Flex>
              )}

              {error && (
                <div className="p-3 bg-red-50 rounded-lg">
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

        {/* Input - Clean footer with proper padding */}
        <div className="bg-white p-6 border-t border-gray-200">
          <Stack spacing="sm">
            {/* Photo Previews */}
            {photoPreviewUrls.length > 0 && (
              <Flex gap="sm" className="pb-2">
                {photoPreviewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </Flex>
            )}

            {/* Input Row */}
            <Flex gap="sm" className="w-full">
              {/* Hidden photo input */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
              
              {/* Camera button */}
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={isLoading || uploadedPhotos.length >= 3}
                className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center"
                title="Attach photo (max 3)"
              >
                <Camera className="w-5 h-5" />
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder={isUploadingPhoto ? "Uploading photos..." : "Ask anything..."}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={isLoading || isUploadingPhoto}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading || isUploadingPhoto}
                className="w-12 h-12 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isUploadingPhoto ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </Flex>
          </Stack>
        </div>
      </div>

      {/* Thread Sidebar - Inside modal */}
      <ChatThreadSidebar
        isOpen={showThreadPanel}
        onClose={() => setShowThreadPanel(false)}
        threads={threads}
        currentThreadId={currentThreadId}
        onSelectThread={(threadId) => setCurrentThreadId(threadId)}
        onCreateThread={createNewThread}
        onDeleteThread={deleteThread}
        onRenameThread={renameThread}
      />
    </BaseModalShell>

    {/* Odometer Update Modal */}
    <QuickOdometerModal
      isOpen={addEventModalOpen}
      onClose={() => {
        setAddEventModalOpen(false)
        setAddEventData(null)
      }}
      vehicleId={vehicleContext.id}
      vehicleName={`${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}`}
      suggestedMileage={addEventData?.suggested_miles}
      serviceType={addEventData?.service_type}
      eventType={addEventData?.event_type}
      extractedData={addEventData}
      onSuccess={handleOdometerSuccess}
    />

    {/* Event Correction Modal */}
    <EventCorrectionModal
      isOpen={correctionModalOpen}
      onClose={() => {
        setCorrectionModalOpen(false)
        setCorrectionEventData(null)
      }}
      vehicleId={vehicleContext.id}
      vehicleName={`${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}`}
      eventData={correctionEventData}
      onSuccess={handleCorrectionSuccess}
    />
  </>
  )
}
