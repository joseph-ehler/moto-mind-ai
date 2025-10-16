import React, { useState } from 'react'
import { TimelineEvent } from './VehicleTimeline'

interface EventEditModalProps {
  event: TimelineEvent
  isOpen: boolean
  onClose: () => void
  onSave: (updates: Partial<TimelineEvent>) => void
}

export function EventEditModal({ event, isOpen, onClose, onSave }: EventEditModalProps) {
  const [editedEvent, setEditedEvent] = useState<Partial<TimelineEvent>>({
    display_vendor: event.display_vendor || '',
    display_amount: event.display_amount || event.total_amount || 0,
    display_summary: event.display_summary || '',
    user_notes: event.user_notes || ''
  })
  
  const [editReason, setEditReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  if (!isOpen) return null

  const handleSave = async () => {
    if (!editReason) {
      setError('Please select a reason for this edit')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Call the API endpoint to save changes
      const response = await fetch(`/api/vehicles/${event.vehicle_id || 'unknown'}/timeline/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_vendor: editedEvent.display_vendor || null,
          display_amount: editedEvent.display_amount || null,
          display_summary: editedEvent.display_summary || null,
          user_notes: editedEvent.user_notes || null,
          edit_reason: editReason
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      
      // Call the parent's onSave with the updated event
      onSave(result.event)
      onClose()
      
      // Reset form state
      setEditReason('')
      setRetryCount(0)
      
    } catch (error) {
      console.error('Failed to save event changes:', error)
      setError(error instanceof Error ? error.message : 'Failed to save changes')
      setRetryCount(prev => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleSave()
  }

  const handleClose = () => {
    if (!isLoading) {
      setError(null)
      setRetryCount(0)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Event Details</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800">Failed to save changes</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                {retryCount > 0 && (
                  <p className="text-xs text-red-600 mt-1">Attempt {retryCount + 1}</p>
                )}
                <button
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Warning for low confidence */}
        {event.confidence && event.confidence < 85 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium text-amber-800">
                Low extraction confidence ({event.confidence}%) - Please verify the details below
              </span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Vendor/Shop Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor/Shop Name
            </label>
            <input
              type="text"
              value={editedEvent.display_vendor || ''}
              onChange={(e) => setEditedEvent(prev => ({ ...prev, display_vendor: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter vendor or shop name"
            />
            {event.payload?.extracted_data?.shop_name && (
              <p className="mt-1 text-xs text-gray-500">
                Original extraction: "{event.payload.extracted_data.shop_name}"
              </p>
            )}
          </div>

          {/* Total Amount */}
          {(event.total_amount || editedEvent.display_amount) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={editedEvent.display_amount || ''}
                  onChange={(e) => setEditedEvent(prev => ({ ...prev, display_amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              {event.total_amount && (
                <p className="mt-1 text-xs text-gray-500">
                  Original extraction: ${event.total_amount}
                </p>
              )}
            </div>
          )}

          {/* Summary Override */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Summary (optional)
            </label>
            <input
              type="text"
              value={editedEvent.display_summary || ''}
              onChange={(e) => setEditedEvent(prev => ({ ...prev, display_summary: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Custom description for this event"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave blank to use auto-generated summary
            </p>
          </div>

          {/* User Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={editedEvent.user_notes || ''}
              onChange={(e) => setEditedEvent(prev => ({ ...prev, user_notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any additional notes or context..."
            />
          </div>

          {/* Edit Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Edit
            </label>
            <select
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select reason...</option>
              <option value="incorrect_vendor">Incorrect vendor name</option>
              <option value="incorrect_amount">Incorrect amount</option>
              <option value="missing_details">Missing details</option>
              <option value="ocr_error">OCR extraction error</option>
              <option value="additional_context">Adding additional context</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Original Data Reference */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Original Extraction Data</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Confidence:</strong> {event.confidence || 'Unknown'}%</p>
            <p><strong>Source:</strong> {event.payload?.source || 'Unknown'}</p>
            {event.payload?.validation?.issues && event.payload.validation.issues.length > 0 && (
              <p><strong>Issues:</strong> {event.payload.validation.issues.join(', ')}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editReason || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading && (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
