'use client'

/**
 * Quick Add FAB (Floating Action Button)
 * 
 * Provides quick access to common document scanning actions
 * Appears as a floating button with an expandable menu
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Flex, Stack, Text } from '@/components/design-system'
import { 
  Plus, 
  X,
  Car, 
  Camera,
  FileText,
  Droplet,
  Wrench,
  CreditCard,
  Gauge,
  Shield
} from 'lucide-react'

interface QuickAction {
  id: string
  icon: React.ReactNode
  label: string
  description: string
  path: string
  documentType?: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'scan-vin',
    icon: <Car className="w-5 h-5" />,
    label: 'Scan VIN',
    description: 'Add new vehicle',
    path: '/test/document-scanner',
    documentType: 'vin'
  },
  {
    id: 'scan-insurance',
    icon: <Shield className="w-5 h-5" />,
    label: 'Insurance Card',
    description: 'Update coverage',
    path: '/test/document-scanner',
    documentType: 'insurance'
  },
  {
    id: 'scan-license',
    icon: <CreditCard className="w-5 h-5" />,
    label: "Driver's License",
    description: 'Update license',
    path: '/test/document-scanner',
    documentType: 'drivers-license'
  },
  {
    id: 'scan-odometer',
    icon: <Gauge className="w-5 h-5" />,
    label: 'Odometer',
    description: 'Log mileage',
    path: '/test/document-scanner',
    documentType: 'odometer'
  },
  {
    id: 'scan-receipt',
    icon: <FileText className="w-5 h-5" />,
    label: 'Service Receipt',
    description: 'Oil change, repairs',
    path: '/test/document-scanner'
  },
  {
    id: 'fuel-up',
    icon: <Droplet className="w-5 h-5" />,
    label: 'Fuel Receipt',
    description: 'Track fuel costs',
    path: '/test/document-scanner'
  }
]

export function QuickAddFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleActionClick = (action: QuickAction) => {
    setIsOpen(false)
    
    // Navigate with document type if specified
    if (action.documentType) {
      router.push(`${action.path}?type=${action.documentType}`)
    } else {
      router.push(action.path)
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action Menu */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden min-w-[280px]">
            <div className="p-3">
              <Stack spacing="xs">
                {QUICK_ACTIONS.map((action) => (
                  <QuickActionItem
                    key={action.id}
                    action={action}
                    onClick={() => handleActionClick(action)}
                  />
                ))}
              </Stack>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full shadow-2xl
          flex items-center justify-center
          transition-all duration-300 ease-out
          ${isOpen 
            ? 'bg-gray-900 rotate-45 scale-110' 
            : 'bg-gradient-to-br from-blue-600 to-blue-700 hover:scale-110 hover:shadow-blue-500/50'
          }
        `}
        aria-label={isOpen ? 'Close menu' : 'Quick actions'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Tooltip when closed */}
      {!isOpen && (
        <div className="fixed bottom-6 right-24 z-40 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
            Quick add
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Individual Quick Action Item
 */
function QuickActionItem({ 
  action, 
  onClick 
}: { 
  action: QuickAction
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
    >
      <Flex align="center" gap="md">
        <div className="w-10 h-10 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center flex-shrink-0 transition-colors">
          <div className="text-blue-600">
            {action.icon}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <Text className="font-medium text-gray-900 text-sm">
            {action.label}
          </Text>
          <Text className="text-xs text-gray-500">
            {action.description}
          </Text>
        </div>
      </Flex>
    </button>
  )
}

/**
 * Compact FAB version (for smaller screens or different contexts)
 */
export function CompactQuickAddFAB() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/test/document-scanner')}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 shadow-2xl flex items-center justify-center hover:scale-110 hover:shadow-blue-500/50 transition-all"
      aria-label="Scan document"
    >
      <Camera className="w-6 h-6 text-white" />
    </button>
  )
}
