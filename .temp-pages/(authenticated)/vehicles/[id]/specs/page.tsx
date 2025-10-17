'use client'

/**
 * Vehicle Specifications Page - Clean & Minimal
 * 
 * Complete technical specifications and details
 */

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Container, Section, Stack, Card, Heading, Text, Flex, Button } from '@/components/design-system'
import { 
  ArrowLeft,
  Car,
  Gauge,
  Fuel,
  Zap,
  Settings,
  Ruler,
  Weight,
  Circle,
  Calendar,
  Hash,
  Award,
  Edit2,
  X,
  Check
} from 'lucide-react'
import { AppNavigation } from '@/components/app/AppNavigation'

export default function VehicleSpecsPage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = (params?.id as string) || '123'

  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

  // Mock vehicle data - replace with real data from API
  const vehicle = {
    id: vehicleId,
    year: 2015,
    make: 'Honda',
    model: 'Accord',
    trim: 'EX-L',
    vin: '1HGCR2F3XFA123456'
  }

  const displayName = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`

  // Mock specifications data - in production, this would come from state/API
  const [specs, setSpecs] = useState({
    engine: [
      { label: "Engine type", value: "2.4L I-4" },
      { label: "Displacement", value: "2,356 cc" },
      { label: "Horsepower", value: "185 hp @ 6,400 rpm" },
      { label: "Torque", value: "181 lb-ft @ 3,900 rpm" },
      { label: "Valvetrain", value: "16-valve DOHC i-VTEC" },
      { label: "Fuel type", value: "Regular unleaded" },
      { label: "Fuel system", value: "Direct injection" }
    ],
    transmission: [
      { label: "Transmission", value: "CVT Automatic" },
      { label: "Drive type", value: "Front-wheel drive" },
      { label: "Gears", value: "Continuously variable" }
    ],
    performance: [
      { label: "0-60 mph", value: "7.5 seconds" },
      { label: "Top speed", value: "130 mph" },
      { label: "Quarter mile", value: "15.8 seconds" }
    ],
    fuel: [
      { label: "City MPG", value: "27 mpg" },
      { label: "Highway MPG", value: "36 mpg" },
      { label: "Combined MPG", value: "31 mpg" },
      { label: "Fuel tank capacity", value: "17.2 gallons" },
      { label: "Range (city)", value: "464 miles" },
      { label: "Range (highway)", value: "619 miles" }
    ],
    dimensions: [
      { label: "Length", value: "191.4 in" },
      { label: "Width", value: "72.8 in" },
      { label: "Height", value: "57.7 in" },
      { label: "Wheelbase", value: "109.3 in" },
      { label: "Ground clearance", value: "5.9 in" },
      { label: "Curb weight", value: "3,230 lbs" },
      { label: "Cargo volume", value: "15.8 cu ft" },
      { label: "Passenger volume", value: "103.2 cu ft" }
    ],
    wheels: [
      { label: "Wheel size", value: "17 x 7.5 inches" },
      { label: "Tire size", value: "225/50R17" },
      { label: "Wheel material", value: "Aluminum alloy" },
      { label: "Spare tire", value: "Compact" }
    ],
    safety: [
      { label: "Airbags", value: "6 (front, side, curtain)" },
      { label: "ABS", value: "4-wheel antilock" },
      { label: "Stability control", value: "Electronic (VSA)" },
      { label: "Traction control", value: "Standard" },
      { label: "Backup camera", value: "Standard" },
      { label: "Blind spot monitor", value: "Available" }
    ],
    features: [
      { label: "Infotainment", value: "7-inch touchscreen" },
      { label: "Audio system", value: "7-speaker premium" },
      { label: "Bluetooth", value: "Standard" },
      { label: "USB ports", value: "2" },
      { label: "Climate control", value: "Dual-zone automatic" },
      { label: "Keyless entry", value: "Smart entry system" },
      { label: "Push button start", value: "Standard" },
      { label: "Sunroof", value: "Power moonroof" }
    ]
  })

  // Handlers for editing
  const handleOpenEdit = (sectionId: string, sectionData: Array<{ label: string; value: string }>) => {
    setEditingSection(sectionId)
    const initialValues: Record<string, string> = {}
    sectionData.forEach(item => {
      initialValues[item.label] = item.value
    })
    setEditedValues(initialValues)
  }

  const handleCloseEdit = () => {
    setEditingSection(null)
    setEditedValues({})
  }

  const handleSaveEdit = () => {
    if (!editingSection) return
    
    setSpecs(prev => ({
      ...prev,
      [editingSection]: prev[editingSection as keyof typeof prev].map(item => ({
        ...item,
        value: editedValues[item.label] || item.value
      }))
    }))
    
    handleCloseEdit()
  }

  const handleValueChange = (label: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [label]: value
    }))
  }

  const specSections = [
    { id: 'engine', title: 'Engine', icon: <Zap className="w-5 h-5" />, data: specs.engine },
    { id: 'transmission', title: 'Transmission & Drivetrain', icon: <Settings className="w-5 h-5" />, data: specs.transmission },
    { id: 'performance', title: 'Performance', icon: <Gauge className="w-5 h-5" />, data: specs.performance },
    { id: 'fuel', title: 'Fuel Economy', icon: <Fuel className="w-5 h-5" />, data: specs.fuel },
    { id: 'dimensions', title: 'Dimensions & Weight', icon: <Ruler className="w-5 h-5" />, data: specs.dimensions },
    { id: 'wheels', title: 'Wheels & Tires', icon: <Circle className="w-5 h-5" />, data: specs.wheels },
    { id: 'safety', title: 'Safety Features', icon: <Car className="w-5 h-5" />, data: specs.safety },
    { id: 'features', title: 'Interior & Features', icon: <Settings className="w-5 h-5" />, data: specs.features }
  ]

  return (
    <>
      <AppNavigation />
      
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="xl">
            {/* Back Button */}
            <button
              onClick={() => router.push(`/vehicles/${vehicleId}`)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors self-start"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to vehicle</span>
            </button>

            {/* Hero Section */}
            <Card className="bg-purple-50 border-purple-100">
              <Section spacing="lg">
                <Stack spacing="sm">
                  <Heading level="hero">{displayName}</Heading>
                  <Text className="text-gray-600">VIN: {vehicle.vin}</Text>
                </Stack>
              </Section>
            </Card>

            {/* Specifications Sections */}
            {specSections.map((section) => (
              <Stack key={section.id} spacing="sm">
                <Flex align="center" justify="between">
                  <Flex align="center" gap="sm">
                    <div className="text-gray-700">
                      {section.icon}
                    </div>
                    <Heading level="subtitle">{section.title}</Heading>
                  </Flex>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(section.id, section.data)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </Flex>
                
                <Card>
                  <Section spacing="sm">
                    <Stack spacing="sm">
                      {section.data.map((spec, index) => (
                        <Flex 
                          key={index} 
                          justify="between" 
                          align="center"
                          className={`py-2 ${index !== section.data.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                          <Text className="text-sm text-gray-600">{spec.label}</Text>
                          <Text className="text-sm font-medium text-gray-900 text-right">{spec.value}</Text>
                        </Flex>
                      ))}
                    </Stack>
                  </Section>
                </Card>
              </Stack>
            ))}

            {/* Source Note */}
            <Card className="bg-gray-50 border-gray-200">
              <Section spacing="sm">
                <Text className="text-xs text-gray-500 text-center">
                  Specifications sourced from manufacturer data and may vary by configuration.
                  Always verify critical specifications with your vehicle's documentation.
                </Text>
              </Section>
            </Card>
          </Stack>
        </Section>
      </Container>

      {/* Edit Modal */}
      {editingSection && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 99999 }}
          onClick={handleCloseEdit}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <Flex align="center" justify="between">
                <Heading level="subtitle">
                  Edit {specSections.find(s => s.id === editingSection)?.title}
                </Heading>
                <button
                  onClick={handleCloseEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </Flex>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-140px)]">
              <Stack spacing="md">
                {specSections
                  .find(s => s.id === editingSection)
                  ?.data.map((spec, index) => (
                    <Stack key={index} spacing="xs">
                      <Text className="text-sm font-medium text-gray-700">
                        {spec.label}
                      </Text>
                      <input
                        type="text"
                        value={editedValues[spec.label] || spec.value}
                        onChange={(e) => handleValueChange(spec.label, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder={spec.label}
                      />
                    </Stack>
                  ))}
              </Stack>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <Flex justify="end" gap="sm">
                <Button
                  variant="ghost"
                  onClick={handleCloseEdit}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveEdit}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </Flex>
            </div>
          </div>
        </div>
      )}

      {/* Add bottom padding for mobile nav */}
      <div className="h-20 md:h-0" />
    </>
  )
}
