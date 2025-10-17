import React, { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X } from 'lucide-react'

interface InlineEditableFieldProps {
  label: string
  value: string | number | null
  unit?: string
  onSave: (newValue: string | number) => void
  type?: 'text' | 'number'
  placeholder?: string
  className?: string
  isCorrected?: boolean
}

export function InlineEditableField({
  label,
  value,
  unit,
  onSave,
  type = 'text',
  placeholder = 'Enter value',
  className = '',
  isCorrected = false
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value?.toString() || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEdit = () => {
    setEditValue(value?.toString() || '')
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editValue.trim() !== '') {
      const finalValue = type === 'number' ? parseFloat(editValue) : editValue
      onSave(finalValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value?.toString() || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const displayValue = value !== null && value !== undefined ? value : '—'

  return (
    <div className={`flex items-center justify-between py-3 ${className}`}>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      
      {!isEditing ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-base font-semibold text-black">
              {displayValue}
              {unit && value !== null && ` ${unit}`}
            </span>
            {isCorrected && (
              <span className="text-xs text-purple-600 font-medium ml-2">
                ✓ Edited
              </span>
            )}
          </div>
          <button
            onClick={handleEdit}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
            title="Edit value"
          >
            <Pencil className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="px-3 py-1.5 border-2 border-blue-500 rounded-lg text-base font-semibold text-black focus:outline-none focus:border-blue-600 w-32"
          />
          {unit && <span className="text-sm text-gray-600">{unit}</span>}
          <button
            onClick={handleSave}
            className="p-1.5 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
            title="Save"
          >
            <Check className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  )
}
