import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { QuickGarageAssignment } from '@/components/vehicles/QuickGarageAssignment'
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  ArrowRightLeft, 
  Copy, 
  Camera,
  FileText,
  MapPin,
  Star,
  StarOff,
  ChevronRight
} from 'lucide-react'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  nickname?: string
  garage_id?: string
  garage?: {
    id: string
    name: string
    address: string
  }
}

interface VehicleContextMenuProps {
  vehicle: Vehicle
  onEdit: () => void
  onDelete: () => void
  onMove: () => void
  onQuickMove?: (garageId: string) => Promise<void>
  onDuplicate?: () => void
  onToggleFavorite?: () => void
  onViewPhotos?: () => void
  onViewDocuments?: () => void
  isFavorite?: boolean
  className?: string
}

export function VehicleContextMenu({
  vehicle,
  onEdit,
  onDelete,
  onMove,
  onQuickMove,
  onDuplicate,
  onToggleFavorite,
  onViewPhotos,
  onViewDocuments,
  isFavorite = false,
  className = ""
}: VehicleContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showQuickMove, setShowQuickMove] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  const menuItems = [
    {
      icon: Edit,
      label: 'Edit Vehicle',
      action: () => handleAction(onEdit),
      className: 'text-gray-700 hover:text-gray-900'
    },
    ...(onQuickMove ? [{
      icon: MapPin,
      label: 'Quick Move',
      action: () => setShowQuickMove(true),
      className: 'text-blue-700 hover:text-blue-900',
      hasSubmenu: true
    }] : []),
    {
      icon: ArrowRightLeft,
      label: `Move from ${vehicle.garage?.name || 'No Garage'}`,
      action: () => handleAction(onMove),
      className: 'text-blue-700 hover:text-blue-900'
    },
    ...(onViewPhotos ? [{
      icon: Camera,
      label: 'View Photos',
      action: () => handleAction(onViewPhotos),
      className: 'text-gray-700 hover:text-gray-900'
    }] : []),
    ...(onViewDocuments ? [{
      icon: FileText,
      label: 'View Documents',
      action: () => handleAction(onViewDocuments),
      className: 'text-gray-700 hover:text-gray-900'
    }] : []),
    ...(onToggleFavorite ? [{
      icon: isFavorite ? StarOff : Star,
      label: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
      action: () => handleAction(onToggleFavorite),
      className: 'text-yellow-700 hover:text-yellow-900'
    }] : []),
    ...(onDuplicate ? [{
      icon: Copy,
      label: 'Duplicate Vehicle',
      action: () => handleAction(onDuplicate),
      className: 'text-gray-700 hover:text-gray-900'
    }] : []),
    {
      icon: Trash2,
      label: 'Delete Vehicle',
      action: () => handleAction(onDelete),
      className: 'text-red-700 hover:text-red-900',
      separator: true
    }
  ]

  return (
    <div className={`relative ${className}`}>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
        title="More actions"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
        >
          {showQuickMove && onQuickMove ? (
            <QuickGarageAssignment
              vehicle={vehicle}
              onAssign={async (garageId) => {
                await onQuickMove(garageId)
                setShowQuickMove(false)
                setIsOpen(false)
              }}
              onCancel={() => setShowQuickMove(false)}
            />
          ) : (
            <>
              {/* Vehicle Info Header */}
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {vehicle.display_name || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                </p>
                {vehicle.garage && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500 truncate">{vehicle.garage.name}</span>
                  </div>
                )}
              </div>

              {/* Menu Items */}
              {menuItems.map((item, index) => (
                <React.Fragment key={index}>
                  {item.separator && <div className="border-t border-gray-100 my-1" />}
                  <button
                    onClick={item.action}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${item.className}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.hasSubmenu && <ChevronRight className="h-3 w-3 ml-auto" />}
                  </button>
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
