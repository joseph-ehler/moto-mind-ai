import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  vin?: string | null // VIN should be required but making optional for compatibility
  nickname?: string | null
  display_name?: string | null
}

interface DeleteVehicleDialogProps {
  vehicle: Vehicle
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeleteVehicleDialog({ vehicle, isOpen, onClose, onSuccess }: DeleteVehicleDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Create display name with smart fallback logic
  const displayName = (() => {
    const baseVehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    
    // If nickname exists and is different from the base vehicle name
    if (vehicle.nickname && vehicle.nickname.trim() && vehicle.nickname.trim() !== baseVehicleName) {
      return `${vehicle.nickname} (${baseVehicleName})`
    }
    
    // If display_name exists and is different from base vehicle name
    if (vehicle.display_name && vehicle.display_name.trim() && vehicle.display_name.trim() !== baseVehicleName) {
      return vehicle.display_name
    }
    
    // Default to base vehicle name
    return baseVehicleName
  })()

  const handleClose = () => {
    if (!isLoading) {
      setError('')
      onClose()
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}/delete`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete vehicle')
      }

      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Delete Vehicle
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              This will permanently remove all vehicle data
            </DialogDescription>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-gray-900">
            Are you sure you want to delete <span className="font-semibold">{displayName}</span>?
          </p>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>This will permanently delete:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Vehicle information and settings</li>
              <li>Service history and maintenance records</li>
              <li>All uploaded documents and receipts</li>
              <li>Event timeline and notifications</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose} 
            disabled={isLoading}
            className="flex-1"
          >
            Keep Vehicle
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Forever
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
