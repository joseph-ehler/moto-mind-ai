import { useState } from 'react'

interface SetMaintenanceIntervalModalProps {
  isOpen: boolean
  onClose: () => void
  intervalType: string
  intervalLabel: string
  vehicleId: string
  currentValue?: number
  onSave: (value: number, unit: string, source?: string) => Promise<void>
}

export default function SetMaintenanceIntervalModal({
  isOpen,
  onClose,
  intervalType,
  intervalLabel,
  vehicleId,
  currentValue,
  onSave
}: SetMaintenanceIntervalModalProps) {
  const [value, setValue] = useState(currentValue?.toString() || '')
  const [unit, setUnit] = useState<'miles' | 'months' | 'years'>('miles')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const numValue = parseInt(value)
    if (isNaN(numValue) || numValue <= 0) {
      setError('Please enter a valid number')
      return
    }

    setLoading(true)
    try {
      await onSave(numValue, unit, source || undefined)
      onClose()
    } catch (err) {
      setError('Failed to save interval. Please try again.')
      console.error('Error saving interval:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black">Set Custom Interval</h3>
          <button
            onClick={onClose}
            className="text-black/40 hover:text-black/60 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-black/60 mb-4">
          Set your custom maintenance interval for <strong>{intervalLabel}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-black/70 mb-2">
              Interval Value
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter interval"
                className="flex-1 px-4 py-2 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="px-4 py-2 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="miles">miles</option>
                <option value="months">months</option>
                <option value="years">years</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-black/70 mb-2">
              Source (Optional)
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., My mechanic's recommendation"
              className="w-full px-4 py-2 border border-black/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-black/10 rounded-xl text-black/60 hover:bg-black/5"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
