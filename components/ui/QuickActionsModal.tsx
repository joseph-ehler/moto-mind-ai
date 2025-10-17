/**
 * Quick Actions Modal
 * 
 * Comprehensive grid of all vehicle actions, organized by category
 * Features:
 * - Search/filter functionality
 * - Keyboard shortcuts (ESC to close)
 * - 5 categories with 3 actions each (15 total)
 * - Responsive grid layout
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Camera, Droplet, Wrench, MessageSquare, TrendingUp, Lightbulb,
  Calendar, Clock, Bell, FileText, Upload, Share2,
  Edit3, Image, Trash2, Search, X
} from 'lucide-react'
import { Modal } from '@/components/design-system'

interface QuickAction {
  id: string
  icon: React.ReactNode
  label: string
  description: string
  category: string
  onClick: () => void
}

interface QuickActionsModalProps {
  isOpen: boolean
  onClose: () => void
  actions: {
    onCapture: () => void
    onFuel: () => void
    onService: () => void
    onAskAI: () => void
    onInsights: () => void
    onPredictCosts: () => void
    onScheduleService: () => void
    onBookAppointment: () => void
    onSetReminder: () => void
    onUploadFiles: () => void
    onExportData: () => void
    onShareVehicle: () => void
    onEditDetails: () => void
    onChangePhoto: () => void
    onDeleteVehicle: () => void
  }
}

export function QuickActionsModal({ isOpen, onClose, actions }: QuickActionsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Clear search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  // Define all actions
  const allActions: QuickAction[] = [
    // Category 1: Capture & Track
    {
      id: 'capture',
      icon: <Camera className="w-6 h-6" />,
      label: 'Scan Receipt',
      description: 'Capture fuel or service receipt',
      category: '📸 Capture & Track',
      onClick: () => { actions.onCapture(); onClose(); }
    },
    {
      id: 'fuel',
      icon: <Droplet className="w-6 h-6" />,
      label: 'Fuel Fill-Up',
      description: 'Log a fuel fill-up manually',
      category: '📸 Capture & Track',
      onClick: () => { actions.onFuel(); onClose(); }
    },
    {
      id: 'service',
      icon: <Wrench className="w-6 h-6" />,
      label: 'Service Record',
      description: 'Add maintenance or repair',
      category: '📸 Capture & Track',
      onClick: () => { actions.onService(); onClose(); }
    },

    // Category 2: AI Assistant
    {
      id: 'ask-ai',
      icon: <MessageSquare className="w-6 h-6" />,
      label: 'Ask Question',
      description: 'Get AI help about your vehicle',
      category: '🤖 AI Assistant',
      onClick: () => { actions.onAskAI(); onClose(); }
    },
    {
      id: 'insights',
      icon: <TrendingUp className="w-6 h-6" />,
      label: 'Insights Report',
      description: 'View trends and analytics',
      category: '🤖 AI Assistant',
      onClick: () => { actions.onInsights(); onClose(); }
    },
    {
      id: 'predict',
      icon: <Lightbulb className="w-6 h-6" />,
      label: 'Predict Costs',
      description: 'AI forecast of upcoming expenses',
      category: '🤖 AI Assistant',
      onClick: () => { actions.onPredictCosts(); onClose(); }
    },

    // Category 3: Schedule & Plan
    {
      id: 'schedule',
      icon: <Calendar className="w-6 h-6" />,
      label: 'Schedule Service',
      description: 'Plan upcoming maintenance',
      category: '📅 Schedule & Plan',
      onClick: () => { actions.onScheduleService(); onClose(); }
    },
    {
      id: 'book',
      icon: <Clock className="w-6 h-6" />,
      label: 'Book Appointment',
      description: 'Reserve time at a shop',
      category: '📅 Schedule & Plan',
      onClick: () => { actions.onBookAppointment(); onClose(); }
    },
    {
      id: 'reminder',
      icon: <Bell className="w-6 h-6" />,
      label: 'Set Reminder',
      description: 'Get notified for tasks',
      category: '📅 Schedule & Plan',
      onClick: () => { actions.onSetReminder(); onClose(); }
    },

    // Category 4: Documents & Data
    {
      id: 'upload',
      icon: <Upload className="w-6 h-6" />,
      label: 'Upload Files',
      description: 'Add documents or photos',
      category: '📄 Documents & Data',
      onClick: () => { actions.onUploadFiles(); onClose(); }
    },
    {
      id: 'export',
      icon: <FileText className="w-6 h-6" />,
      label: 'Export Data',
      description: 'Download your records',
      category: '📄 Documents & Data',
      onClick: () => { actions.onExportData(); onClose(); }
    },
    {
      id: 'share',
      icon: <Share2 className="w-6 h-6" />,
      label: 'Share Vehicle',
      description: 'Give access to others',
      category: '📄 Documents & Data',
      onClick: () => { actions.onShareVehicle(); onClose(); }
    },

    // Category 5: Vehicle Settings
    {
      id: 'edit',
      icon: <Edit3 className="w-6 h-6" />,
      label: 'Edit Details',
      description: 'Update vehicle information',
      category: '⚙️ Vehicle Settings',
      onClick: () => { actions.onEditDetails(); onClose(); }
    },
    {
      id: 'photo',
      icon: <Image className="w-6 h-6" />,
      label: 'Change Photo',
      description: 'Update vehicle picture',
      category: '⚙️ Vehicle Settings',
      onClick: () => { actions.onChangePhoto(); onClose(); }
    },
    {
      id: 'delete',
      icon: <Trash2 className="w-6 h-6" />,
      label: 'Delete Vehicle',
      description: 'Remove from your garage',
      category: '⚙️ Vehicle Settings',
      onClick: () => { actions.onDeleteVehicle(); onClose(); }
    }
  ]

  // Filter actions based on search
  const filteredActions = searchQuery.trim() === ''
    ? allActions
    : allActions.filter(action => 
        action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(searchQuery.toLowerCase())
      )

  // Group by category
  const categories = Array.from(new Set(filteredActions.map(a => a.category)))

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Actions"
      size="lg"
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actions..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Actions Grid - Organized by Category */}
        <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2">
          {categories.map(category => {
            const categoryActions = filteredActions.filter(a => a.category === category)
            
            return (
              <div key={category}>
                {/* Category Header */}
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {category}
                </h3>

                {/* Action Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryActions.map(action => (
                    <button
                      key={action.id}
                      onClick={action.onClick}
                      className="flex flex-col items-start gap-2 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-150 text-left group"
                    >
                      <div className="text-blue-600 group-hover:text-blue-700">
                        {action.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {action.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {action.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {/* No Results */}
          {filteredActions.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No actions found for "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">ESC</kbd> to close
          </p>
        </div>
      </div>
    </Modal>
  )
}
