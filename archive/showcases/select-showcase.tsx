'use client'

import * as React from 'react'
import {
  Container,
  Stack,
  Grid,
  Section,
  Flex,
  Combobox,
  ComboboxOption,
  Input,
  Button,
  Heading,
  Text,
  useIsMobile,
  useIsTablet,
  useIsTouch
} from '@/components/design-system'
import { CreditCard, DollarSign, Building2 } from 'lucide-react'

// Sample data
const vehicleMakes: ComboboxOption[] = [
  { value: 'honda', label: 'Honda' },
  { value: 'toyota', label: 'Toyota' },
  { value: 'ford', label: 'Ford' },
  { value: 'chevrolet', label: 'Chevrolet' },
  { value: 'bmw', label: 'BMW' },
  { value: 'mercedes', label: 'Mercedes-Benz' },
  { value: 'audi', label: 'Audi' },
  { value: 'volkswagen', label: 'Volkswagen' },
  { value: 'nissan', label: 'Nissan' },
  { value: 'mazda', label: 'Mazda' },
]

const countries: ComboboxOption[] = [
  { value: 'us', label: 'United States', description: 'North America' },
  { value: 'ca', label: 'Canada', description: 'North America' },
  { value: 'uk', label: 'United Kingdom', description: 'Europe' },
  { value: 'de', label: 'Germany', description: 'Europe' },
  { value: 'fr', label: 'France', description: 'Europe' },
  { value: 'jp', label: 'Japan', description: 'Asia' },
  { value: 'au', label: 'Australia', description: 'Oceania' },
  { value: 'br', label: 'Brazil', description: 'South America' },
]

const tags: ComboboxOption[] = [
  { value: 'sports', label: 'Sports Car' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'truck', label: 'Truck' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'economy', label: 'Economy' },
]

const paymentMethods: ComboboxOption[] = [
  {
    value: 'card',
    label: 'Credit Card',
    description: 'Visa, Mastercard, Amex',
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    value: 'paypal',
    label: 'PayPal',
    description: 'Fast & secure',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    value: 'bank',
    label: 'Bank Transfer',
    description: 'Direct transfer',
    icon: <Building2 className="h-4 w-4" />,
  },
]

// Mobile-First Combobox Demo Component
function MobileFirstComboboxDemo() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isTouch = useIsTouch()

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
      <Stack spacing="lg">
        <div>
          <Heading level="title">1. Mobile-First Dropdown 📱</Heading>
          <Text className="text-black/60">Combobox auto-adapts with touch-optimized sizing</Text>
        </div>

        {/* Responsive Detection Demo */}
        <div className="bg-white rounded-lg border border-purple-200 p-5">
          <Stack spacing="md">
            <Text className="text-sm font-semibold text-purple-900">
              🎯 Real-Time Device Detection
            </Text>
            <Grid columns={3} gap="md">
              <div className={`p-4 rounded-lg text-center transition-all ${isMobile ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
                <div className="text-2xl mb-2">📱</div>
                <div className="text-xs font-medium">Mobile</div>
                <div className="text-xs text-black/60">&lt; 768px</div>
                {isMobile && <div className="text-xs font-bold text-green-700 mt-1">ACTIVE</div>}
              </div>
              <div className={`p-4 rounded-lg text-center transition-all ${isTablet ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
                <div className="text-2xl mb-2">💻</div>
                <div className="text-xs font-medium">Tablet</div>
                <div className="text-xs text-black/60">768-1023px</div>
                {isTablet && <div className="text-xs font-bold text-green-700 mt-1">ACTIVE</div>}
              </div>
              <div className={`p-4 rounded-lg text-center transition-all ${isTouch ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-100'}`}>
                <div className="text-2xl mb-2">👆</div>
                <div className="text-xs font-medium">Touch</div>
                <div className="text-xs text-black/60">Capable</div>
                {isTouch && <div className="text-xs font-bold text-green-700 mt-1">ACTIVE</div>}
              </div>
            </Grid>
          </Stack>
        </div>

        {/* Mobile-First Features Grid */}
        <div className="bg-white rounded-lg border border-purple-200 p-5">
          <Stack spacing="md">
            <Text className="text-sm font-semibold text-purple-900">
              ✨ Mobile-First Features
            </Text>
            <Grid columns={2} gap="md">
              <Stack spacing="xs">
                <Text className="text-sm font-medium text-black">48px Trigger Button</Text>
                <Text className="text-xs text-black/60">
                  Auto-upgrades to 48px height on mobile
                </Text>
              </Stack>
              <Stack spacing="xs">
                <Text className="text-sm font-medium text-black">48px Dropdown Items</Text>
                <Text className="text-xs text-black/60">
                  All options are touch-friendly
                </Text>
              </Stack>
              <Stack spacing="xs">
                <Text className="text-sm font-medium text-black">iOS Zoom Prevention</Text>
                <Text className="text-xs text-black/60">
                  16px font prevents Safari zoom
                </Text>
              </Stack>
              <Stack spacing="xs">
                <Text className="text-sm font-medium text-black">Larger Icons</Text>
                <Text className="text-xs text-black/60">
                  20px icons on mobile (vs 16px)
                </Text>
              </Stack>
              <Stack spacing="xs">
                <Text className="text-sm font-medium text-black">Touch-Friendly Chips</Text>
                <Text className="text-xs text-black/60">
                  Multi-select tags with 24px close buttons
                </Text>
              </Stack>
              <Stack spacing="xs">
                <Text className="text-sm font-medium text-black">60vh Max Height</Text>
                <Text className="text-xs text-black/60">
                  Dropdown uses more screen space on mobile
                </Text>
              </Stack>
            </Grid>
          </Stack>
        </div>

        {/* Live Demo */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-5">
          <Stack spacing="md">
            <Text className="text-sm font-semibold text-blue-900">
              🔴 LIVE DEMO - Try resizing your browser!
            </Text>
            <Grid columns={2} gap="md">
              <Combobox
                label="Single Select"
                options={vehicleMakes}
                placeholder="Select vehicle..."
                helperText={isMobile ? "48px button + items" : "40px button + items"}
              />
              <Combobox
                label="Multi-Select"
                options={tags}
                multiple
                placeholder="Select multiple..."
                helperText={isMobile ? "Touch-friendly chips" : "Standard chips"}
              />
            </Grid>
          </Stack>
        </div>

        <div className="p-4 bg-purple-100 rounded-lg">
          <Text className="text-sm text-purple-900">
            ✓ <strong>100% Mobile-First:</strong> All dropdown features auto-adapt with zero configuration!
          </Text>
        </div>
      </Stack>
    </div>
  )
}

export default function SelectShowcase() {
  // State
  const [selectedMake, setSelectedMake] = React.useState<string>('')
  const [selectedCountry, setSelectedCountry] = React.useState<string>('')
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [selectedPayment, setSelectedPayment] = React.useState<string>('')
  const [asyncOptions, setAsyncOptions] = React.useState<ComboboxOption[]>([])
  const [isLoadingAsync, setIsLoadingAsync] = React.useState(false)
  const [customTags, setCustomTags] = React.useState<ComboboxOption[]>(tags)

  // Simulate async loading
  const loadAsyncOptions = () => {
    setIsLoadingAsync(true)
    setTimeout(() => {
      setAsyncOptions([
        { value: '1', label: 'Option 1', description: 'Loaded from API' },
        { value: '2', label: 'Option 2', description: 'Loaded from API' },
        { value: '3', label: 'Option 3', description: 'Loaded from API' },
      ])
      setIsLoadingAsync(false)
    }, 2000)
  }

  // Handle create tag
  const handleCreateTag = (inputValue: string) => {
    const newTag: ComboboxOption = {
      value: inputValue.toLowerCase().replace(/\s+/g, '-'),
      label: inputValue,
    }
    setCustomTags([...customTags, newTag])
    setSelectedTags([...selectedTags, newTag.value])
  }

  return (
    <Container size="lg" useCase="articles">
      <Section spacing="xl">
        <Stack spacing="xl">
          {/* Header */}
          <Stack spacing="md" className="text-center">
            <Heading level="hero">Select & Autocomplete</Heading>
            <Text className="text-black/60">
              Mobile-first dropdown select with search, multi-select, keyboard navigation, and async support
            </Text>
            <Text className="text-sm text-black/40 mt-2">
              Touch-optimized • 48px targets • iOS compliant • WCAG AAA
            </Text>
          </Stack>

          {/* Quick Stats */}
          <Grid columns={4} gap="md">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">48px</div>
              <div className="text-sm text-blue-900">Touch Targets</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-sm text-green-900">Mobile-First</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">✓</div>
              <div className="text-sm text-purple-900">iOS Compliant</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-amber-600">15+</div>
              <div className="text-sm text-amber-900">Features</div>
            </div>
          </Grid>

          {/* Mobile-First Feature Showcase */}
          <MobileFirstComboboxDemo />

          {/* Section 1: Basic Select */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">2. Basic Select</Heading>
                <Text className="text-black/60">Simple dropdown with single selection</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <Combobox
                  label="Vehicle Make"
                  options={vehicleMakes}
                  value={selectedMake}
                  onChange={(value) => setSelectedMake(value as string)}
                  placeholder="Select make..."
                  helperText="Choose your vehicle make"
                />

                <Combobox
                  label="Vehicle Make (with clear)"
                  options={vehicleMakes}
                  value={selectedMake}
                  onChange={(value) => setSelectedMake(value as string)}
                  placeholder="Select make..."
                  clearable
                  helperText="Clearable selection"
                />

                <Combobox
                  label="Required Field"
                  options={vehicleMakes}
                  placeholder="Select make..."
                  required
                  helperText="This field is required"
                />

                <Combobox
                  label="Disabled State"
                  options={vehicleMakes}
                  value="honda"
                  disabled
                  helperText="Cannot be changed"
                />
              </Grid>
            </Stack>
          </div>

          {/* Section 2: Searchable Select */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">3. Searchable Select</Heading>
                <Text className="text-black/60">Filter options with real-time search</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <Combobox
                  label="Country"
                  options={countries}
                  value={selectedCountry}
                  onChange={(value) => setSelectedCountry(value as string)}
                  clearable
                  placeholder="Search countries..."
                  searchPlaceholder="Type to search..."
                  helperText="Try typing 'United' or 'Europe'"
                />

                <Combobox
                  label="Vehicle Make (Searchable)"
                  options={vehicleMakes}
                  placeholder="Search makes..."
                  helperText="Type to filter options"
                />
              </Grid>
            </Stack>
          </div>

          {/* Section 3: Multi-Select */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">4. Multi-Select</Heading>
                <Text className="text-black/60">Select multiple options with chips/tags</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <Combobox
                  label="Vehicle Tags"
                  options={tags}
                  value={selectedTags}
                  onChange={(value) => setSelectedTags(value as string[])}
                  multiple
                  placeholder="Select tags..."
                  helperText="Choose multiple categories"
                />

                <Combobox
                  label="Vehicle Tags (Clearable)"
                  options={tags}
                  value={selectedTags}
                  onChange={(value) => setSelectedTags(value as string[])}
                  multiple
                  clearable
                  placeholder="Select tags..."
                  helperText="Clear all with X button"
                />
              </Grid>

              {selectedTags.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Text className="font-medium text-blue-900">
                    Selected: {selectedTags.join(', ')}
                  </Text>
                </div>
              )}
            </Stack>
          </div>

          {/* Section 4: With Icons & Descriptions */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">5. Icons & Descriptions</Heading>
                <Text className="text-black/60">Rich options with icons and helper text</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <Combobox
                  label="Payment Method"
                  options={paymentMethods}
                  value={selectedPayment}
                  onChange={(value) => setSelectedPayment(value as string)}
                  placeholder="Select payment method..."
                  helperText="Choose your preferred payment option"
                />

                <Combobox
                  label="Country (with descriptions)"
                  options={countries}
                  placeholder="Select country..."
                  helperText="Options include descriptions"
                />
              </Grid>
            </Stack>
          </div>

          {/* Section 5: Validation States */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">6. Validation States</Heading>
                <Text className="text-black/60">Error, success, and warning states</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <Combobox
                  label="Error State"
                  options={vehicleMakes}
                  error="Please select a vehicle make"
                  placeholder="Select make..."
                />

                <Combobox
                  label="Success State"
                  options={vehicleMakes}
                  value="honda"
                  success="Great choice!"
                  placeholder="Select make..."
                />

                <Combobox
                  label="Warning State"
                  options={vehicleMakes}
                  value="bmw"
                  warning="This make may have limited inventory"
                  placeholder="Select make..."
                />

                <Combobox
                  label="Default State"
                  options={vehicleMakes}
                  placeholder="Select make..."
                  helperText="Helper text appears here"
                />
              </Grid>
            </Stack>
          </div>

          {/* Section 6: Async Loading */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">7. Async Loading</Heading>
                <Text className="text-black/60">Load options from API or database</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <Stack spacing="md">
                  <Combobox
                    label="Async Options"
                    options={asyncOptions}
                    loading={isLoadingAsync}
                    placeholder="Click button to load..."
                    loadingMessage="Loading options..."
                    helperText="Simulates API call"
                  />
                  
                  <Button onClick={loadAsyncOptions} disabled={isLoadingAsync}>
                    {isLoadingAsync ? 'Loading...' : 'Load Options'}
                  </Button>
                </Stack>

                <Combobox
                  label="Loading State"
                  options={[]}
                  loading={true}
                  placeholder="Loading..."
                  helperText="Shows loading indicator"
                />
              </Grid>
            </Stack>
          </div>

          {/* Section 7: Creatable */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">8. Creatable Options</Heading>
                <Text className="text-black/60">Allow users to create new options</Text>
              </Stack>

              <Stack spacing="lg">
                <Grid columns={2} gap="lg">
                  <Combobox
                    label="Custom Tags"
                    options={customTags}
                    value={selectedTags}
                    onChange={(value) => setSelectedTags(value as string[])}
                    multiple
                    creatable
                    onCreateOption={handleCreateTag}
                    placeholder="Select or create tags..."
                    helperText="Type a new tag and press Enter"
                  />

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <Stack spacing="sm">
                      <Text className="font-medium">💡 How to create:</Text>
                      <Text className="text-sm text-black/60">
                        1. Type a new tag name
                      </Text>
                      <Text className="text-sm text-black/60">
                        2. Look for "Create [tag]" option
                      </Text>
                      <Text className="text-sm text-black/60">
                        3. Click it - tag is added instantly!
                      </Text>
                    </Stack>
                  </div>
                </Grid>

                {/* Show created tags */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Stack spacing="sm">
                    <Text className="font-medium text-blue-900">
                      📝 Current Tags ({customTags.length} total)
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {customTags.map((tag) => (
                        <span
                          key={tag.value}
                          className="px-2 py-1 bg-white rounded text-xs font-medium text-blue-900 border border-blue-200"
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </Stack>
                </div>

                {selectedTags.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <Text className="font-medium text-green-900">
                      ✓ Selected: {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
                    </Text>
                  </div>
                )}
              </Stack>
            </Stack>
          </div>

          {/* Section 8: Keyboard Navigation */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">9. Keyboard Navigation</Heading>
                <Text className="text-black/60">Full keyboard support for accessibility</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <Combobox
                  label="Try Keyboard Controls"
                  options={vehicleMakes}
                  placeholder="Focus and press keys..."
                  helperText="Use arrow keys, Enter, Escape"
                />

                <div className="p-4 bg-slate-50 rounded-lg">
                  <Stack spacing="sm">
                    <Text className="font-medium">⌨️ Keyboard Shortcuts:</Text>
                    <Flex justify="between" className="text-sm">
                      <Text className="text-black/60">Open dropdown:</Text>
                      <code className="px-2 py-0.5 bg-white rounded border">Enter</code>
                    </Flex>
                    <Flex justify="between" className="text-sm">
                      <Text className="text-black/60">Navigate:</Text>
                      <code className="px-2 py-0.5 bg-white rounded border">↑ ↓</code>
                    </Flex>
                    <Flex justify="between" className="text-sm">
                      <Text className="text-black/60">Select:</Text>
                      <code className="px-2 py-0.5 bg-white rounded border">Enter</code>
                    </Flex>
                    <Flex justify="between" className="text-sm">
                      <Text className="text-black/60">Close:</Text>
                      <code className="px-2 py-0.5 bg-white rounded border">Esc</code>
                    </Flex>
                    <Flex justify="between" className="text-sm">
                      <Text className="text-black/60">Close & Tab:</Text>
                      <code className="px-2 py-0.5 bg-white rounded border">Tab</code>
                    </Flex>
                  </Stack>
                </div>
              </Grid>
            </Stack>
          </div>

          {/* Section 9: Complete Form Example */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">10. Complete Form Example</Heading>
                <Text className="text-black/60">Real-world form with selects and inputs</Text>
              </Stack>

              <div className="bg-white p-6 rounded-lg">
                <form onSubmit={(e) => e.preventDefault()}>
                  <Stack spacing="lg">
                    <Grid columns={2} gap="lg">
                      <Input
                        label="Owner Name"
                        required
                        placeholder="John Doe"
                      />

                      <Input
                        label="VIN"
                        placeholder="1HGBH41JXMN109186"
                      />
                    </Grid>

                    <Grid columns={2} gap="lg">
                      <Combobox
                        label="Vehicle Make"
                        options={vehicleMakes}
                        required
                              placeholder="Select make..."
                      />

                      <Input
                        label="Model"
                        required
                        placeholder="Civic"
                      />
                    </Grid>

                    <Grid columns={2} gap="lg">
                      <Combobox
                        label="Country"
                        options={countries}
                        required
                              placeholder="Select country..."
                      />

                      <Combobox
                        label="Tags"
                        options={tags}
                        multiple
                              placeholder="Select tags..."
                      />
                    </Grid>

                    <Input
                      label="Notes"
                      placeholder="Additional information..."
                    />

                    <Flex justify="end" gap="sm">
                      <Button type="button" variant="ghost">
                        Cancel
                      </Button>
                      <Button type="submit">
                        Save Vehicle
                      </Button>
                    </Flex>
                  </Stack>
                </form>
              </div>
            </Stack>
          </div>

          {/* Feature Matrix */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">Feature Matrix</Heading>
                <Text className="text-black/60">Complete overview of all Select features</Text>
              </Stack>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3 font-semibold">Feature</th>
                      <th className="text-center p-3 font-semibold">Supported</th>
                      <th className="text-left p-3 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-3">Single Select</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Choose one option</td>
                    </tr>
                    <tr>
                      <td className="p-3">Multi-Select</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Choose multiple with chips</td>
                    </tr>
                    <tr>
                      <td className="p-3">Searchable</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Filter options in real-time</td>
                    </tr>
                    <tr>
                      <td className="p-3">Clearable</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Clear selection with X button</td>
                    </tr>
                    <tr>
                      <td className="p-3">Keyboard Navigation</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Arrow keys, Enter, Escape</td>
                    </tr>
                    <tr>
                      <td className="p-3">Async Loading</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Load options from API</td>
                    </tr>
                    <tr>
                      <td className="p-3">Creatable</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Create new options on-the-fly</td>
                    </tr>
                    <tr>
                      <td className="p-3">Icons & Descriptions</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Rich option display</td>
                    </tr>
                    <tr>
                      <td className="p-3">Custom Rendering</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Custom option templates</td>
                    </tr>
                    <tr>
                      <td className="p-3">Portal Dropdown</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Smart positioning</td>
                    </tr>
                    <tr>
                      <td className="p-3">Validation States</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Error, success, warning</td>
                    </tr>
                    <tr>
                      <td className="p-3">Click Outside</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Auto-close on outside click</td>
                    </tr>
                    <tr>
                      <td className="p-3">Disabled State</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Disable selection</td>
                    </tr>
                    <tr>
                      <td className="p-3">Required Field</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Required indicator</td>
                    </tr>
                    <tr>
                      <td className="p-3">Accessible (ARIA)</td>
                      <td className="text-center p-3">✅</td>
                      <td className="p-3 text-black/60">Full screen reader support</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Stack>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-black/60 border-t border-black/10 pt-8">
            <Text className="font-semibold">Elite Select Component</Text>
            <Text className="mt-2">
              Production-ready dropdown with search, multi-select, and keyboard navigation
            </Text>
            <Text className="mt-2">
              Built with React, TypeScript, and Tailwind CSS
            </Text>
          </div>
        </Stack>
      </Section>
    </Container>
  )
}
