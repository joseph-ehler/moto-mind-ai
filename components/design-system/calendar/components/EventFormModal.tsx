/**
 * EventFormModal Component
 * 
 * Form for creating and editing maintenance events
 * Uses design system FormModal for consistency
 */

import * as React from 'react'
import { Stack, Flex } from '../../primitives/Layout'
import { FormModal } from '../../feedback/Overlays'
import { Button } from '../../primitives/Button'
import { Input, Textarea } from '../../forms/FormFields'
import { NumberInput } from '../../forms/NumberInput'
import { Combobox } from '../../forms/Combobox'
import { DatePicker } from '../../forms/DatePicker'
import { Text } from '../../primitives/Typography'
import { Trash2 } from 'lucide-react'
import { MaintenanceEvent, MaintenanceType, MAINTENANCE_TYPES } from '../types'

export interface EventFormData {
  title: string
  description?: string
  type: MaintenanceType
  startDate: Date
  endDate?: Date
  allDay: boolean
  vehicleId?: string
  vehicleName?: string
  serviceProvider?: string
  location?: string
  estimatedCost?: number
  mileage?: number
  reminderEnabled: boolean
  reminderDays?: number
  notes?: string
}

interface EventFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EventFormData) => void
  onDelete?: () => void
  initialData?: Partial<MaintenanceEvent>
  mode: 'create' | 'edit'
  vehicles?: Array<{ id: string; name: string }>
}

export function EventFormModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  mode,
  vehicles = []
}: EventFormModalProps) {
  const [formData, setFormData] = React.useState<EventFormData>(() => ({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'general_maintenance',
    startDate: initialData?.startDate || new Date(),
    endDate: initialData?.endDate,
    allDay: initialData?.allDay ?? true,
    vehicleId: initialData?.vehicleId,
    vehicleName: initialData?.vehicleName || '',
    serviceProvider: initialData?.serviceProvider || '',
    location: initialData?.location || '',
    estimatedCost: initialData?.estimatedCost,
    mileage: initialData?.mileage,
    reminderEnabled: initialData?.reminderEnabled ?? true,
    reminderDays: initialData?.reminderDays || 3,
    notes: initialData?.notes || ''
  }))
  
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  
  // Update form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        type: initialData.type || 'general_maintenance',
        startDate: initialData.startDate || new Date(),
        endDate: initialData.endDate,
        allDay: initialData.allDay ?? true,
        vehicleId: initialData.vehicleId,
        vehicleName: initialData.vehicleName || '',
        serviceProvider: initialData.serviceProvider || '',
        location: initialData.location || '',
        estimatedCost: initialData.estimatedCost,
        mileage: initialData.mileage,
        reminderEnabled: initialData.reminderEnabled ?? true,
        reminderDays: initialData.reminderDays || 3,
        notes: initialData.notes || ''
      })
    }
  }, [initialData])
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Date is required'
    }
    
    if (formData.estimatedCost && formData.estimatedCost < 0) {
      newErrors.estimatedCost = 'Cost must be positive'
    }
    
    if (formData.mileage && formData.mileage < 0) {
      newErrors.mileage = 'Mileage must be positive'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validate()) {
      onSubmit(formData)
      onClose()
    }
  }
  
  const handleFieldChange = <K extends keyof EventFormData>(
    field: K,
    value: EventFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }
  
  const selectedType = MAINTENANCE_TYPES[formData.type]
  
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={mode === 'create' ? '📅 Schedule Maintenance' : '✏️ Edit Maintenance'}
      submitLabel={mode === 'create' ? 'Schedule' : 'Save Changes'}
      cancelLabel="Cancel"
      size="lg"
    >
      <Stack spacing="md">
        {/* Maintenance Type Selector */}
        <Stack spacing="sm">
          <Text className="text-sm font-semibold">Maintenance Type</Text>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(MAINTENANCE_TYPES) as MaintenanceType[]).map(type => {
              const config = MAINTENANCE_TYPES[type]
              const isSelected = formData.type === type
              const IconComponent = config.icon
              
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleFieldChange('type', type)}
                  className={`p-3 rounded-lg border-2 transition-all text-left hover:border-blue-300 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-5 h-5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{config.label}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </Stack>
        
        {/* Title */}
        <Input
          id="title"
          label="Title"
          required
          value={formData.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder={selectedType.label}
          error={errors.title}
        />
        
        {/* Date */}
        <DatePicker
          label="Date"
          required
          value={formData.startDate}
          onChange={(date) => handleFieldChange('startDate', date || new Date())}
          error={errors.startDate}
        />
        
        {/* Vehicle Selection */}
        {vehicles.length > 0 && (
          <Combobox
            label="Vehicle"
            placeholder="Select vehicle (optional)"
            value={formData.vehicleId || ''}
            onChange={(value) => {
              const vehicleId = value as string
              const vehicle = vehicles.find(v => v.id === vehicleId)
              handleFieldChange('vehicleId', vehicleId)
              handleFieldChange('vehicleName', vehicle?.name || '')
            }}
            options={vehicles.map(v => ({ value: v.id, label: v.name }))}
            clearable
          />
        )}
        
        {/* Service Provider & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="serviceProvider"
            label="Service Provider"
            value={formData.serviceProvider}
            onChange={(e) => handleFieldChange('serviceProvider', e.target.value)}
            placeholder="e.g., Honda Service Center"
          />
          
          <Input
            id="location"
            label="Location"
            value={formData.location}
            onChange={(e) => handleFieldChange('location', e.target.value)}
            placeholder="e.g., 123 Main St"
          />
        </div>
        
        {/* Cost & Mileage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberInput
            id="cost"
            label="Estimated Cost"
            min={0}
            step={0.01}
            value={formData.estimatedCost || 0}
            onChange={(value) => handleFieldChange('estimatedCost', value)}
            placeholder="$0.00"
            error={errors.estimatedCost}
          />
          
          <NumberInput
            id="mileage"
            label="Current Mileage"
            min={0}
            step={1}
            value={formData.mileage || 0}
            onChange={(value) => handleFieldChange('mileage', value ? Math.floor(value) : undefined)}
            placeholder="e.g., 35000"
            error={errors.mileage}
          />
        </div>
        
        {/* Delete Button (Edit mode only) */}
        {mode === 'edit' && onDelete && (
          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="danger"
              onClick={onDelete}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Event
            </Button>
          </div>
        )}
      </Stack>
    </FormModal>
  )
}
