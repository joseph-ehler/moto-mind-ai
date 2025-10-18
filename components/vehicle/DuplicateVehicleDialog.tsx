/**
 * Duplicate Vehicle Detection Dialog
 * Shows when user tries to add a vehicle already in their garage
 */

'use client'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, Users } from 'lucide-react'
import type { DuplicateVehicleDetection } from '@/lib/vehicles/canonical-types'

interface DuplicateVehicleDialogProps {
  open: boolean
  onClose: () => void
  duplicate: DuplicateVehicleDetection
  onRequestAccess: () => void
  onViewExisting: () => void
}

export function DuplicateVehicleDialog({
  open,
  onClose,
  duplicate,
  onRequestAccess,
  onViewExisting
}: DuplicateVehicleDialogProps) {
  if (!duplicate.existingVehicle || !duplicate.canonicalVehicle) {
    return null
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-yellow-100 p-3">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <AlertDialogTitle>Vehicle Already in Garage</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4 space-y-4">
            <p>
              This {duplicate.canonicalVehicle.displayName} is already added to your garage.
            </p>
            
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Users className="h-4 w-4" />
                Vehicle Details
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Nickname: </span>
                  {duplicate.existingVehicle.nickname || 'No nickname'}
                </div>
                <div>
                  <span className="font-medium">Added: </span>
                  {new Date(duplicate.existingVehicle.createdAt).toLocaleDateString()}
                </div>
                {duplicate.existingVehicle.currentMileage && (
                  <div>
                    <span className="font-medium">Current Mileage: </span>
                    {duplicate.existingVehicle.currentMileage.toLocaleString()} miles
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              If this is a shared household vehicle, you can request access to view
              and manage it together. Or you can view the existing vehicle in your garage.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="secondary" onClick={onViewExisting} className="w-full sm:w-auto">
            View in Garage
          </Button>
          <Button onClick={onRequestAccess} className="w-full sm:w-auto">
            Request Shared Access
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
