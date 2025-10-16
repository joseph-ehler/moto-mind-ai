import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react'

interface CreateReminderModalProps {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  garageId: string
  jurisdictionRule?: {
    kind: string
    cadence: string
    notes?: string
  }
  onSuccess?: () => void
}

export function CreateReminderModal({
  isOpen,
  onClose,
  vehicleId,
  garageId,
  jurisdictionRule,
  onSuccess
}: CreateReminderModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: jurisdictionRule ? `${jurisdictionRule.kind.charAt(0).toUpperCase() + jurisdictionRule.kind.slice(1)} Due` : '',
    description: jurisdictionRule?.notes || '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: jurisdictionRule?.kind || 'maintenance'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        vehicle_id: vehicleId,
        garage_id_at_creation: garageId,
        title: formData.title,
        description: formData.description,
        ...(formData.dueDate && { due_date: formData.dueDate }),
        priority: formData.priority,
        category: formData.category,
        source: jurisdictionRule ? 'jurisdiction' : 'user'
      }
      
      console.log('🔔 Sending reminder payload:', payload)
      
      const response = await fetch('/api/reminders-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        onSuccess?.()
        onClose()
        // Reset form
        setFormData({
          title: '',
          description: '',
          dueDate: '',
          priority: 'medium',
          category: 'maintenance'
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to create reminder')
      }
    } catch (error) {
      console.error('Error creating reminder:', error)
      alert(`Failed to create reminder: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const suggestedDueDate = () => {
    if (jurisdictionRule?.kind === 'registration') {
      // Suggest next year for registration
      const nextYear = new Date()
      nextYear.setFullYear(nextYear.getFullYear() + 1)
      return nextYear.toISOString().split('T')[0]
    }
    
    // Default to 30 days from now
    const thirtyDays = new Date()
    thirtyDays.setDate(thirtyDays.getDate() + 30)
    return thirtyDays.toISOString().split('T')[0]
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-orange-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create Reminder
            {jurisdictionRule && (
              <span className="text-sm font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">
                From jurisdiction rules
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Vehicle Registration Due"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional details about this reminder..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate || suggestedDueDate()}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              required
            />
            {jurisdictionRule?.kind === 'registration' && (
              <p className="text-xs text-gray-500 mt-1">
                💡 Registration typically due in your birth month
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: 'low' | 'medium' | 'high') => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Low Priority
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    Medium Priority
                  </span>
                </SelectItem>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    High Priority
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {jurisdictionRule && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Jurisdiction Requirement</p>
                  <p className="text-blue-700">
                    This reminder is based on Florida state requirements for {jurisdictionRule.cadence} {jurisdictionRule.kind}.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Create Reminder
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
