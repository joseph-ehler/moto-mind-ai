/**
 * Proposed Update Card
 * 
 * Shows AI-proposed data updates inline in chat
 * User can approve, edit, or reject
 */

'use client'

import React from 'react'
import { Stack, Flex, Text, Button } from '@/components/design-system'
import { 
  Check, Edit, X, Gauge, AlertTriangle, Wrench, Fuel, 
  Car, AlertCircle, DollarSign, MapPin, LayoutDashboard, Loader 
} from 'lucide-react'

interface ProposedUpdate {
  type: 'odometer' | 'correction' | 'service' | 'fuel' | 'damage' | 'warning' | 'dashboard_snapshot'
  data: any
  preview: {
    title: string
    description: string
    fields: Array<{ label: string; value: string; change?: string }>
  }
}

interface Props {
  proposal: ProposedUpdate
  vehicleName?: string
  vehicleVin?: string
  isApproved?: boolean
  isApproving?: boolean
  onApprove: () => void
  onEdit: () => void
  onReject: () => void
}

export function ProposedUpdateCard({ proposal, vehicleName, vehicleVin, isApproved, isApproving, onApprove, onEdit, onReject }: Props) {
  // Get icon and colors based on event type
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'service':
        return {
          icon: <Wrench className="w-5 h-5 text-indigo-600" />,
          bgColor: 'bg-indigo-50 border-indigo-200',
          iconBg: 'bg-indigo-100'
        }
      case 'fuel':
        return {
          icon: <Fuel className="w-5 h-5 text-green-600" />,
          bgColor: 'bg-green-50 border-green-200',
          iconBg: 'bg-green-100'
        }
      case 'damage':
        return {
          icon: <Car className="w-5 h-5 text-red-600" />,
          bgColor: 'bg-red-50 border-red-200',
          iconBg: 'bg-red-100'
        }
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
          bgColor: 'bg-amber-50 border-amber-200',
          iconBg: 'bg-amber-100'
        }
      case 'correction':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          bgColor: 'bg-amber-50 border-amber-200',
          iconBg: 'bg-amber-100'
        }
      case 'dashboard_snapshot':
        return {
          icon: <LayoutDashboard className="w-5 h-5 text-purple-600" />,
          bgColor: 'bg-purple-50 border-purple-200',
          iconBg: 'bg-purple-100'
        }
      default: // odometer
        return {
          icon: <Gauge className="w-5 h-5 text-blue-600" />,
          bgColor: 'bg-blue-50 border-blue-200',
          iconBg: 'bg-blue-100'
        }
    }
  }

  const config = getTypeConfig(proposal.type)
  const { icon, bgColor, iconBg } = config

  return (
    <div className={`border-2 rounded-xl p-4 ${bgColor}`}>
      <Stack spacing="md">
        {/* Header */}
        <Flex align="start" gap="sm">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
          <div className="flex-1">
            <Text className="font-semibold text-gray-900">
              {proposal.preview.title}
            </Text>
            <Text className="text-sm text-gray-600 mt-0.5">
              {proposal.preview.description}
            </Text>
            {vehicleName && (
              <div className="mt-1 inline-flex flex-col gap-1">
                <div className="px-2 py-0.5 inline-block bg-white border border-gray-300 rounded text-xs font-medium text-gray-700">
                  🚗 {vehicleName}
                </div>
                {vehicleVin && (
                  <div className="px-2 py-0.5 inline-block bg-white border border-gray-300 rounded text-xs font-mono text-gray-600">
                    VIN: ...{vehicleVin.slice(-6)}
                  </div>
                )}
              </div>
            )}
          </div>
        </Flex>

        {/* Fields Preview */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <Stack spacing="xs">
            {proposal.preview.fields.map((field, idx) => (
              <Flex key={idx} justify="between" align="center">
                <Text className="text-sm text-gray-600">{field.label}</Text>
                <Flex align="center" gap="xs">
                  {field.change && (
                    <>
                      <Text className="text-sm text-gray-400 line-through">
                        {field.change}
                      </Text>
                      <Text className="text-sm text-gray-400">→</Text>
                    </>
                  )}
                  <Text className="text-sm font-semibold text-gray-900">
                    {field.value}
                  </Text>
                </Flex>
              </Flex>
            ))}
          </Stack>
        </div>

        {/* Info Message */}
        {isApproved ? (
          <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded-lg p-2 border border-green-200">
            <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>✅ <strong>Approved and Saved</strong> - This event has been added to your timeline.</span>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-xs text-gray-600 bg-white/50 rounded-lg p-2">
            <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Review the changes above. Click Approve to save, or Edit to make adjustments.</span>
          </div>
        )}

        {/* Actions */}
        {isApproved ? (
          <div className="flex items-center justify-center gap-2 py-2 text-green-600 font-medium text-sm">
            <Check className="w-5 h-5" />
            <span>Approved</span>
          </div>
        ) : (
          <Flex gap="sm">
            <Button
              onClick={onReject}
              variant="outline"
              className="flex-1"
            >
              <X className="w-4 h-4" />
              <span>Reject</span>
            </Button>
            <Button
              onClick={onEdit}
              variant="outline"
              className="flex-1"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </Button>
            <Button
              onClick={onApprove}
              disabled={isApproving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApproving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Approve</span>
                </>
              )}
            </Button>
          </Flex>
        )}
      </Stack>
    </div>
  )
}
