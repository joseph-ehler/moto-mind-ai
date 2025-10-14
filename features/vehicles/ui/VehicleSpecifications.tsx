/**
 * VehicleSpecifications Component
 * 
 * Full detailed specifications view for a vehicle
 */

import React from 'react'
import { Stack, Flex, Card, Heading, Text } from '@/components/design-system'
import { Check } from 'lucide-react'

interface VehicleSpecificationsProps {
  vehicle: {
    year: number
    make: string
    model: string
    trim: string
    vin: string
    color: string
  }
}

export function VehicleSpecifications({ vehicle }: VehicleSpecificationsProps) {
  return (
    <Stack spacing="xl">
      {/* Basic Information */}
      <Stack spacing="md">
        <Heading level="title" className="text-lg font-semibold text-gray-900">
          Basic Information
        </Heading>
        <Card className="p-0 divide-y divide-gray-200">
          <SpecRow label="Make" value={vehicle.make} />
          <SpecRow label="Model" value={`${vehicle.model} ${vehicle.trim}`} />
          <SpecRow label="Year" value={vehicle.year.toString()} />
          <SpecRow label="VIN" value={vehicle.vin} copyable />
          <SpecRow label="Body Type" value="4-door Sedan" />
          <SpecRow label="Exterior Color" value={vehicle.color} />
        </Card>
      </Stack>

      {/* Engine & Performance */}
      <Stack spacing="md">
        <Heading level="title" className="text-lg font-semibold text-gray-900">
          Engine & Performance
        </Heading>
        <Card className="p-0 divide-y divide-gray-200">
          <SpecRow label="Engine Type" value="2.4L 4-Cylinder" />
          <SpecRow label="Horsepower" value="185 HP @ 6,400 RPM" />
          <SpecRow label="Torque" value="181 lb-ft @ 3,900 RPM" />
          <SpecRow label="Transmission" value="CVT Automatic" />
          <SpecRow label="Drivetrain" value="Front-Wheel Drive" />
        </Card>
      </Stack>

      {/* Fuel Economy */}
      <Stack spacing="md">
        <Heading level="title" className="text-lg font-semibold text-gray-900">
          Fuel Economy (EPA)
        </Heading>
        <Flex gap="md" className="flex-col sm:flex-row">
          <Card className="p-6 text-center flex-1">
            <Text className="text-3xl font-bold text-gray-900">27</Text>
            <Text className="text-sm text-gray-600 mt-1">City MPG</Text>
          </Card>
          <Card className="p-6 text-center flex-1">
            <Text className="text-3xl font-bold text-gray-900">36</Text>
            <Text className="text-sm text-gray-600 mt-1">Highway MPG</Text>
          </Card>
          <Card className="p-6 text-center flex-1">
            <Text className="text-3xl font-bold text-gray-900">30</Text>
            <Text className="text-sm text-gray-600 mt-1">Combined MPG</Text>
          </Card>
        </Flex>
      </Stack>

      {/* Dimensions */}
      <Stack spacing="md">
        <Heading level="title" className="text-lg font-semibold text-gray-900">
          Dimensions & Weight
        </Heading>
        <Card className="p-0 divide-y divide-gray-200">
          <SpecRow label="Length" value="191.4 in" />
          <SpecRow label="Width" value="72.8 in" />
          <SpecRow label="Height" value="57.7 in" />
          <SpecRow label="Wheelbase" value="109.3 in" />
          <SpecRow label="Curb Weight" value="3,190 lbs" />
        </Card>
      </Stack>

      {/* Features */}
      <Stack spacing="md">
        <Heading level="title" className="text-lg font-semibold text-gray-900">
          Features & Options
        </Heading>
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureItem label="Leather seats" />
            <FeatureItem label="Sunroof" />
            <FeatureItem label="Navigation system" />
            <FeatureItem label="Heated front seats" />
            <FeatureItem label="Backup camera" />
            <FeatureItem label="Bluetooth connectivity" />
            <FeatureItem label="Keyless entry" />
            <FeatureItem label="Dual-zone climate control" />
          </div>
        </Card>
      </Stack>
    </Stack>
  )
}

function SpecRow({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) {
  return (
    <Flex align="center" justify="between" className="p-4">
      <Text className="text-sm text-gray-600">{label}</Text>
      <Text className="text-sm font-medium text-gray-900 font-mono">{value}</Text>
    </Flex>
  )
}

function FeatureItem({ label }: { label: string }) {
  return (
    <Flex align="center" gap="xs">
      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
      <Text className="text-sm text-gray-900">{label}</Text>
    </Flex>
  )
}
