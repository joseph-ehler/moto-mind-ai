import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VehicleRow } from '@/components/vehicle/VehicleRow'
import { EditVehicleModal } from '@/components/vehicle/EditVehicleModal'
import { DeleteVehicleDialog } from '@/components/vehicle/DeleteVehicleDialog'
import { useVehicles } from '@/hooks/useVehicles'
import { StandardCard, StandardCardContent } from '@/components/ui/StandardCard'
import { PageHeader } from '@/components/ui/PageHeader'
import { 
  Car, 
  Plus,
  Filter
} from 'lucide-react'

export default function Fleet() {
  const [selectedGarage, setSelectedGarage] = useState<string>('')
  const [needsAttention, setNeedsAttention] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<any>(null)
  const [deletingVehicle, setDeletingVehicle] = useState<any>(null)
  
  // Use optimistic hooks for vehicles
  const { vehicles, isLoading, actions } = useVehicles({
    garageId: selectedGarage || undefined,
    needsAttention
  })

  const handleVehicleAction = async (action: string, vehicleId: string) => {
    await actions.handleVehicleAction(action, vehicleId)
  }

  const handleEditVehicle = (vehicle: any) => {
    setEditingVehicle(vehicle)
  }

  const handleDeleteVehicle = (vehicle: any) => {
    setDeletingVehicle(vehicle)
  }

  const handleEditSuccess = (updatedVehicle: any) => {
    setEditingVehicle(null)
    actions.refresh() // Refresh the vehicle list
  }

  const handleDeleteSuccess = () => {
    setDeletingVehicle(null)
    actions.refresh() // Refresh the vehicle list
  }

  // Get unique garages from vehicles for filtering
  const garages = vehicles.reduce((acc: Array<{id: string, name: string}>, vehicle: any) => {
    if (vehicle.garage_id && !acc.find((g: {id: string}) => g.id === vehicle.garage_id)) {
      acc.push({ id: vehicle.garage_id, name: 'Garage' }) // Simplified since we don't have garage names
    }
    return acc
  }, [])

  return (
    <>
      <Head>
        <title>Fleet - MotoMind</title>
        <meta name="description" content="Manage your vehicle fleet" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Ro-style Header */}
          <PageHeader 
            title="Hi, Joseph"
            subtitle="Welcome back"
          />

            {/* Actual status updates like Ro */}
            <StandardCard className="mb-6">
              {vehicles.length > 0 ? (
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <h3 className="font-medium text-gray-900">Your fleet is up to date</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    All {vehicles.length} vehicle{vehicles.length !== 1 ? 's are' : ' is'} being monitored. 
                    Last updated today at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.
                  </p>
                  <div className="flex gap-3">
                    <Link href="/add-vehicle">
                      <Button size="sm" variant="outline">Add vehicle</Button>
                    </Link>
                    <Button size="sm" variant="outline">View maintenance</Button>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <h3 className="font-medium text-gray-900">Ready to add your first vehicle</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    Get started by adding a vehicle to track maintenance, mileage, and service history.
                  </p>
                  <Link href="/vehicles/onboard">
                    <Button size="sm">Add your first vehicle</Button>
                  </Link>
                </div>
              )}
            </StandardCard>
          </div>

          {/* Filters (Roman: Simple pills) */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Filter:</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setNeedsAttention(!needsAttention)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  needsAttention 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Needs attention
              </button>
              
              {garages.map(garage => (
                <button
                  key={garage.id}
                  onClick={() => setSelectedGarage(selectedGarage === garage.id ? '' : garage.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedGarage === garage.id
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {garage.name}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle List (Roman: Action-first rows) */}
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-200 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : vehicles.length > 0 ? (
              // Vehicle rows with optimistic actions
              vehicles.map((vehicle: any) => (
                <VehicleRow
                  key={vehicle.id}
                  vehicle={vehicle}
                  onAction={handleVehicleAction}
                  onEdit={handleEditVehicle}
                  onDelete={handleDeleteVehicle}
                  showGarage={!selectedGarage}
                />
              ))
            ) : (
              // Empty state
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedGarage || needsAttention ? 'No vehicles match your filters' : 'No vehicles yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedGarage || needsAttention 
                    ? 'Try adjusting your filters to see more vehicles.'
                    : 'Add your first vehicle to get started with vehicle management.'
                  }
                </p>
                {!selectedGarage && !needsAttention && (
                  <Link href="/vehicles/onboard">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add your first vehicle
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Roman-style Stats Footer */}
          {vehicles.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600 text-center">
                Showing {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
                {needsAttention && ' that need attention'}
                {selectedGarage && garages.find(g => g.id === selectedGarage) && 
                  ` at ${garages.find(g => g.id === selectedGarage)?.name}`
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <EditVehicleModal
          vehicle={editingVehicle}
          isOpen={!!editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Vehicle Dialog */}
      {deletingVehicle && (
        <DeleteVehicleDialog
          vehicle={deletingVehicle}
          isOpen={!!deletingVehicle}
          onClose={() => setDeletingVehicle(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </>
  )
}
