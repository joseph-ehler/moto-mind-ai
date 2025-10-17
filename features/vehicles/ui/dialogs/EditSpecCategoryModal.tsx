import React, { useState } from 'react'
import { X } from 'lucide-react'

interface Field {
  key: string
  label: string
  type: 'text' | 'number'
  unit?: string
  placeholder?: string
}

interface EditSpecCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  category: string
  categoryLabel: string
  fields: Field[]
  currentData: Record<string, any>
  onSave: (data: Record<string, any>) => Promise<void>
}

export function EditSpecCategoryModal({
  isOpen,
  onClose,
  category,
  categoryLabel,
  fields,
  currentData,
  onSave
}: EditSpecCategoryModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>(currentData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value === '' ? null : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-black">Edit {categoryLabel}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Fill in any missing data. Leave fields blank if unknown.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {fields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.unit && <span className="text-gray-500 ml-1">({field.unit})</span>}
                </label>
                <input
                  type={field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> Your edits will override AI-generated data and be marked as 
                "Custom" throughout the app. You can always revert by clearing the fields.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-black/5 flex items-center justify-between bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {error && (
            <div className="px-6 py-3 bg-red-50 border-t border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
