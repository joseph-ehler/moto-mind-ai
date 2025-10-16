'use client'

import * as React from 'react'
import {
  Container,
  Stack,
  Grid,
  Section,
  Flex,
  Input,
  Textarea,
  Checkbox,
  RadioGroup,
  Switch,
  Slider,
  DatePicker,
  DateRangePicker,
  TimePicker,
  FileUpload,
  ColorPicker,
  PasswordInput,
  PhoneInput,
  OTPInput,
  NumberInput,
  Rating,
  FormSection,
  FormSectionGroup,
  Button,
  Heading,
  Text,
  useIsMobile,
  useIsTablet,
  useIsTouch,
  Combobox
} from '@/components/design-system'

// Mobile-First Demo Component
function MobileFirstDemo() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isTouch = useIsTouch()

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
      <Stack spacing="lg">
        <div>
          <Heading level="title">1. Mobile-First & Responsive 📱</Heading>
          <Text className="text-black/60">All 14 components auto-adapt with touch-optimized sizing</Text>
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
              ✨ Mobile-First Features (All 14 Components)
            </Text>
            <Grid columns={2} gap="md">
              <Stack spacing="xs">
                <Text className="text-sm font-medium text-black">48px Touch Targets</Text>
                <Text className="text-xs text-black/60">
                  All inputs auto-upgrade to 48px height on mobile
                </Text>
              </Stack>
              <Stack spacing="xs">
                <Text className="text-sm font-medium text-black">iOS Zoom Prevention</Text>
                <Text className="text-xs text-black/60">
                  16px minimum font prevents Safari zoom
                </Text>
              </Stack>
              <Stack spacing="xs">
                <Text className="text-sm font-medium text-black">Larger Icons</Text>
                <Text className="text-xs text-black/60">
                  20px icons on mobile (vs 16px desktop)
                </Text>
              </Stack>
              <Stack spacing="xs">
                <Text className="text-sm font-medium text-black">Touch-Friendly</Text>
                <Text className="text-xs text-black/60">
                  44-48px minimum for all interactive elements
                </Text>
              </Stack>
              <Stack spacing="xs">
                <Text className="text-sm font-medium text-black">Generous Padding</Text>
                <Text className="text-xs text-black/60">
                  16-20px mobile padding for comfortable tapping
                </Text>
              </Stack>
              <Stack spacing="xs">
                <Text className="text-sm font-medium text-black">WCAG AAA</Text>
                <Text className="text-xs text-black/60">
                  Exceeds accessibility standards
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
              <Input
                label="Email Input"
                type="email"
                placeholder="your@email.com"
                helperText={isMobile ? "48px height on mobile" : "40px height on desktop"}
              />
              <PasswordInput
                label="Password"
                placeholder="Enter password"
                helperText={isMobile ? "44px toggle button" : "32px toggle button"}
              />
              <NumberInput
                label="Mileage"
                value={50000}
                showSteppers
                helperText={isMobile ? "48px stepper buttons" : "40px stepper buttons"}
              />
              <DatePicker
                label="Service Date"
                placeholder="Pick a date"
                helperText={isMobile ? "48px button, touch calendar" : "40px button"}
              />
            </Grid>
          </Stack>
        </div>

        <div className="p-4 bg-purple-100 rounded-lg">
          <Text className="text-sm text-purple-900">
            ✓ <strong>100% Mobile-First Coverage:</strong> All 14 components auto-adapt with zero configuration!
          </Text>
        </div>
      </Stack>
    </div>
  )
}

export default function FormsShowcase() {
  // State for inputs
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [bio, setBio] = React.useState('')
  const [search, setSearch] = React.useState('')
  
  // State for checkboxes
  const [agreed, setAgreed] = React.useState(false)
  const [subscribed, setSubscribed] = React.useState(false)
  const [notifications, setNotifications] = React.useState({
    email: true,
    sms: false,
    push: true
  })
  const [selectAll, setSelectAll] = React.useState(false)
  
  // State for radio
  const [privacy, setPrivacy] = React.useState('public')
  const [notificationPref, setNotificationPref] = React.useState('all')
  const [condition, setCondition] = React.useState('')
  
  // State for switches
  const [darkMode, setDarkMode] = React.useState(false)
  const [emailNotifs, setEmailNotifs] = React.useState(true)
  const [autoSave, setAutoSave] = React.useState(false)
  
  // State for sliders
  const [volume, setVolume] = React.useState([50])
  const [priceRange, setPriceRange] = React.useState([25, 75])
  const [brightness, setBrightness] = React.useState([80])
  
  // State for date pickers
  const [maintenanceDate, setMaintenanceDate] = React.useState<Date | undefined>(undefined)
  const [registrationDate, setRegistrationDate] = React.useState<Date | undefined>(new Date())
  const [servicePeriod, setServicePeriod] = React.useState<{ from?: Date; to?: Date } | undefined>(undefined)
  
  // State for file upload
  const [vehiclePhotos, setVehiclePhotos] = React.useState<File[]>([])
  const [documents, setDocuments] = React.useState<File[]>([])
  
  // State for color picker
  const [vehicleColor, setVehicleColor] = React.useState('#FF0000')
  const [interiorColor, setInteriorColor] = React.useState('#000000')
  
  // State for new components
  const [serviceTime, setServiceTime] = React.useState('09:00')
  const [vehicleRating, setVehicleRating] = React.useState(4.5)
  const [serviceRating, setServiceRating] = React.useState(0)
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [otpCode, setOtpCode] = React.useState('')
  const [mileage, setMileage] = React.useState(50000)
  const [price, setPrice] = React.useState(25000)
  
  // Loading states
  const [isLoading, setIsLoading] = React.useState(false)
  const [emailValidating, setEmailValidating] = React.useState(false)

  // Validation states
  const [emailError, setEmailError] = React.useState('')
  const [passwordError, setPasswordError] = React.useState('')

  // Simulate email validation
  const validateEmail = (value: string) => {
    setEmailValidating(true)
    setTimeout(() => {
      if (value === 'taken@example.com') {
        setEmailError('This email is already taken')
      } else if (value && !value.includes('@')) {
        setEmailError('Please enter a valid email')
      } else {
        setEmailError('')
      }
      setEmailValidating(false)
    }, 1000)
  }

  return (
    <Container size="lg" useCase="articles">
      <Section spacing="xl">
        <Stack spacing="xl">
          {/* Header */}
          <div className="text-center">
            <Heading level="hero">Form Components Showcase</Heading>
            <Text className="mt-4 text-black/60">
              Complete mobile-first form library with 14 components: inputs, pickers, ratings, and specialized fields
            </Text>
            <Text className="text-sm text-black/40 mt-2">
              Touch-optimized • iOS compliant • WCAG AAA • 100% Mobile-First
            </Text>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">14</div>
              <div className="text-sm text-blue-900">Form Components</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-sm text-green-900">Mobile-First</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">48px</div>
              <div className="text-sm text-purple-900">Touch Targets</div>
            </div>
            <div className="p-4 bg-pink-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-pink-600">✓</div>
              <div className="text-sm text-pink-900">iOS Compliant</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-amber-600">AAA</div>
              <div className="text-sm text-amber-900">WCAG</div>
            </div>
          </div>

          {/* Mobile-First Feature Showcase */}
          <MobileFirstDemo />

          {/* Section 1: Input Types */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <div>
                <Heading level="title">2. Basic Input Types</Heading>
                <Text className="text-black/60">Text-based inputs - Use specialized components for password, phone, and numbers</Text>
              </div>

              <Grid columns={2} gap="lg">
                <Input
                  label="Text"
                  type="text"
                  placeholder="Enter text..."
                  helperText="Standard text input"
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  helperText="Email validation"
                />

                <Input
                  label="Search"
                  type="search"
                  placeholder="Search..."
                  helperText="Search field with clear button"
                />

                <Input
                  label="URL"
                  type="url"
                  placeholder="https://example.com"
                  helperText="Website URL"
                />
              </Grid>

              <div className="p-4 bg-blue-50 rounded-lg mt-4">
                <Text className="text-sm text-blue-900">
                  💡 <strong>Use Specialized Components:</strong> For passwords use <code className="px-1 py-0.5 bg-blue-100 rounded text-xs">PasswordInput</code>, 
                  for phone numbers use <code className="px-1 py-0.5 bg-blue-100 rounded text-xs">PhoneInput</code>, 
                  and for numeric values use <code className="px-1 py-0.5 bg-blue-100 rounded text-xs">NumberInput</code>
                </Text>
              </div>
            </Stack>
          </div>

          {/* Section 2: Validation States */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <div>
                <Heading level="title">3. Validation States</Heading>
                <Text className="text-black/60">Error, success, warning, and default states</Text>
              </div>

              <Grid columns={2} gap="lg">
                <Input
                  label="Error State"
                  value="invalid@email"
                  error="Invalid email format"
                />

                <Input
                  label="Success State"
                  value="valid@email.com"
                  success="Email is available!"
                />

                <Input
                  label="Warning State"
                  value="admin"
                  warning="This username is similar to existing ones"
                />

                <Input
                  label="Default State"
                  placeholder="Enter value..."
                  helperText="Helper text appears here"
                />
              </Grid>
            </Stack>
          </div>

          {/* Section 3: Sizes */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <div>
                <Heading level="title">4. Input Sizes</Heading>
                <Text className="text-black/60">Small, medium, and large sizes (auto-upgrade on mobile)</Text>
              </div>

              <Stack spacing="md">
                <Input
                  label="Small"
                  size="sm"
                  placeholder="Small input..."
                />

                <Input
                  label="Medium (Default)"
                  size="md"
                  placeholder="Medium input..."
                />

                <Input
                  label="Large"
                  size="lg"
                  placeholder="Large input..."
                />
              </Stack>
            </Stack>
          </div>

          {/* Section 4: Icons & Loading */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <div>
                <Heading level="title">4. Icons & Loading States</Heading>
                <Text className="text-black/60">Enhance inputs with icons and loading indicators</Text>
              </div>

              <Grid columns={2} gap="lg">
                <Input
                  label="Search with Icon"
                  placeholder="Search..."
                  startIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />

                <Input
                  label="Email with Validation"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    validateEmail(e.target.value)
                  }}
                  loading={emailValidating}
                  error={emailError}
                  success={email && !emailError && !emailValidating ? 'Email is available' : ''}
                  endIcon={
                    !emailValidating && email && !emailError ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : undefined
                  }
                  helperText="Try: taken@example.com"
                />

                <Input
                  label="Loading State"
                  loading={true}
                  disabled
                  placeholder="Validating..."
                />

                <Input
                  label="Clear Button"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type to search..."
                  endIcon={
                    search ? (
                      <button onClick={() => setSearch('')} className="hover:text-black transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ) : undefined
                  }
                />
              </Grid>
            </Stack>
          </div>

          {/* Section 5: Character Counter */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <div>
                <Heading level="title">5. Character Counter</Heading>
                <Text className="text-black/60">Track input length with visual feedback</Text>
              </div>

              <Grid columns={2} gap="lg">
                <Input
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                  showCounter
                  helperText="Max 20 characters"
                />

                <Input
                  label="Tweet"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={280}
                  showCounter
                  helperText="Standard tweet length"
                />
              </Grid>
            </Stack>
          </div>

          {/* Section 6: Textarea */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <div>
                <Heading level="title">6. Textarea with Auto-Resize</Heading>
                <Text className="text-black/60">Multi-line text input that grows with content</Text>
              </div>

              <Grid columns={2} gap="lg">
                <Textarea
                  label="Standard Textarea"
                  placeholder="Enter description..."
                  rows={4}
                  helperText="Fixed height (4 rows)"
                />

                <Textarea
                  label="Auto-Resize Textarea"
                  placeholder="Start typing and watch it grow..."
                  autoResize
                  minRows={3}
                  maxRows={10}
                  helperText="Grows from 3 to 10 rows"
                />

                <Textarea
                  label="With Character Counter"
                  placeholder="Write your bio..."
                  maxLength={500}
                  showCounter
                  autoResize
                  minRows={4}
                />

                <Textarea
                  label="With Validation"
                  error="Description must be at least 50 characters"
                  autoResize
                  minRows={4}
                />
              </Grid>
            </Stack>
          </div>

          {/* Section 7: Inline Layout */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <div>
                <Heading level="title">7. Inline Layout</Heading>
                <Text className="text-black/60">Horizontal label and input alignment for forms</Text>
              </div>

              <Stack spacing="md">
                <Input
                  label="First Name"
                  placeholder="John"
                  inline
                />

                <Input
                  label="Last Name"
                  placeholder="Doe"
                  inline
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  inline
                />

                <Input
                  label="Website"
                  type="url"
                  placeholder="https://example.com"
                />
              </Stack>
            </Stack>
          </div>

          {/* Section 8: Required Fields */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <div>
                <Heading level="title">8. Required Fields</Heading>
                <Text className="text-black/60">Visual indicators for required inputs</Text>
              </div>

              <Grid columns={2} gap="lg">
                <Input
                  label="Email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  helperText="Required field marked with *"
                />

                <PasswordInput
                  label="Password"
                  required
                  placeholder="Enter password"
                  helperText="Minimum 8 characters"
                />

                <Input
                  label="Optional Field"
                  placeholder="Not required"
                  helperText="This field is optional"
                />

                <Input
                  label="Username"
                  required
                  disabled
                  value="johndoe"
                  helperText="Cannot be changed"
                />
              </Grid>
            </Stack>
          </div>

          {/* Section 9: Checkboxes */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">9. Checkboxes</Heading>
                <Text className="text-black/60">Single and multiple selection checkboxes</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <Stack spacing="md">
                  <Checkbox
                    label="I agree to the terms"
                    checked={agreed}
                    onCheckedChange={setAgreed}
                  />

                  <Checkbox
                    label="Subscribe to newsletter"
                    description="Get weekly updates about new features"
                    checked={subscribed}
                    onCheckedChange={setSubscribed}
                    helperText="You can unsubscribe anytime"
                  />

                  <Checkbox
                    label="Required checkbox"
                    required
                    error={!agreed ? "You must agree to continue" : undefined}
                    checked={agreed}
                    onCheckedChange={setAgreed}
                  />
                </Stack>

                <Stack spacing="md">
                  <Text className="font-medium">Notification Preferences:</Text>
                  
                  <Checkbox
                    label="Email notifications"
                    description="Receive updates via email"
                    checked={notifications.email}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, email: checked})
                    }
                  />

                  <Checkbox
                    label="SMS notifications"
                    description="Receive updates via text"
                    checked={notifications.sms}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, sms: checked})
                    }
                  />

                  <Checkbox
                    label="Push notifications"
                    description="Receive browser notifications"
                    checked={notifications.push}
                    onCheckedChange={(checked) => 
                      setNotifications({...notifications, push: checked})
                    }
                  />
                </Stack>
              </Grid>

              <div className="p-4 bg-blue-50 rounded-lg">
                <Text className="text-sm text-blue-900">
                  ✓ Features: Labels, descriptions, validation states, helper text, required indicators
                </Text>
              </div>
            </Stack>
          </div>

          {/* Section 10: Radio Groups */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">10. Radio Groups</Heading>
                <Text className="text-black/60">Single choice from multiple options</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <RadioGroup
                  label="Privacy level"
                  description="Choose who can see your profile"
                  options={[
                    { value: 'public', label: 'Public', description: 'Anyone can view' },
                    { value: 'friends', label: 'Friends only', description: 'Only connections' },
                    { value: 'private', label: 'Private', description: 'Only you' }
                  ]}
                  value={privacy}
                  onValueChange={setPrivacy}
                />

                <RadioGroup
                  label="Notification preference"
                  options={[
                    { value: 'all', label: 'All notifications' },
                    { value: 'important', label: 'Important only' },
                    { value: 'none', label: 'None' }
                  ]}
                  value={notificationPref}
                  onValueChange={setNotificationPref}
                  orientation="vertical"
                />
              </Grid>

              <Grid columns={2} gap="lg">
                <RadioGroup
                  label="Vehicle Condition"
                  required
                  error={!condition ? "Please select a condition" : undefined}
                  options={[
                    { value: 'excellent', label: 'Excellent', description: 'Like new' },
                    { value: 'good', label: 'Good', description: 'Well maintained' },
                    { value: 'fair', label: 'Fair', description: 'Some wear' },
                    { value: 'poor', label: 'Poor', description: 'Needs work' }
                  ]}
                  value={condition}
                  onValueChange={setCondition}
                />

                <RadioGroup
                  label="Gender"
                  orientation="horizontal"
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' }
                  ]}
                  helperText="Horizontal layout example"
                />
              </Grid>

              <div className="p-4 bg-green-50 rounded-lg">
                <Text className="text-sm text-green-900">
                  ✓ Features: Vertical/horizontal layouts, descriptions, validation, required fields
                </Text>
              </div>
            </Stack>
          </div>

          {/* Section 11: Switches */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">11. Switches</Heading>
                <Text className="text-black/60">Toggle switches for on/off states</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <Stack spacing="md">
                  <Switch
                    label="Dark mode"
                    description="Enable dark theme"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />

                  <Switch
                    label="Email notifications"
                    description="Receive updates via email"
                    checked={emailNotifs}
                    onCheckedChange={setEmailNotifs}
                    helperText="You can change this anytime"
                  />

                  <Switch
                    label="Auto-save"
                    description="Automatically save changes"
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                    required
                    error={!autoSave ? "Auto-save is recommended" : undefined}
                  />
                </Stack>

                <div className="p-4 bg-slate-50 rounded-lg space-y-4">
                  <Text className="font-medium">Switch States:</Text>
                  <div className="space-y-2 text-sm">
                    <Flex justify="between">
                      <Text className="text-black/60">Dark Mode:</Text>
                      <Text className="font-medium">{darkMode ? 'ON' : 'OFF'}</Text>
                    </Flex>
                    <Flex justify="between">
                      <Text className="text-black/60">Email Notifs:</Text>
                      <Text className="font-medium">{emailNotifs ? 'ON' : 'OFF'}</Text>
                    </Flex>
                    <Flex justify="between">
                      <Text className="text-black/60">Auto-save:</Text>
                      <Text className="font-medium">{autoSave ? 'ON' : 'OFF'}</Text>
                    </Flex>
                  </div>
                </div>
              </Grid>

              <div className="p-4 bg-purple-50 rounded-lg">
                <Text className="text-sm text-purple-900">
                  ✓ Features: iOS-style toggles, descriptions, validation, required indicators
                </Text>
              </div>
            </Stack>
          </div>

          {/* Section 12: Sliders */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">12. Sliders</Heading>
                <Text className="text-black/60">Range sliders for numeric values with live feedback</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <Stack spacing="xl">
                  {/* Volume Slider with Visual Feedback */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <Stack spacing="md">
                      <Slider
                        label="Volume"
                        value={volume}
                        onValueChange={setVolume}
                        min={0}
                        max={100}
                        step={1}
                        showValue
                        formatValue={(v) => `${v}%`}
                        showMinMax
                        helperText="Drag to adjust volume"
                      />
                      
                      {/* Visual Volume Bars */}
                      <div className="flex gap-1 h-12 items-end">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-t transition-all ${
                              i < (volume[0] / 100) * 20
                                ? 'bg-blue-500'
                                : 'bg-slate-200'
                            }`}
                            style={{ height: `${((i + 1) / 20) * 100}%` }}
                          />
                        ))}
                      </div>
                    </Stack>
                  </div>

                  {/* Brightness Slider */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <Stack spacing="md">
                      <Slider
                        label="Brightness"
                        value={brightness}
                        onValueChange={setBrightness}
                        min={0}
                        max={100}
                        step={5}
                        showValue
                        formatValue={(v) => `${v}%`}
                        showMinMax
                        helperText="Step size: 5%"
                      />
                      
                      {/* Visual Brightness Preview */}
                      <div 
                        className="h-20 rounded-lg transition-all flex items-center justify-center"
                        style={{ 
                          backgroundColor: `rgba(251, 191, 36, ${brightness[0] / 100})`,
                          border: '2px solid #94a3b8'
                        }}
                      >
                        <Text className="font-bold text-slate-700">
                          Preview
                        </Text>
                      </div>
                    </Stack>
                  </div>
                </Stack>

                <Stack spacing="xl">
                  {/* Price Range Slider */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <Stack spacing="md">
                      <Slider
                        label="Price Range"
                        description="Dual-handle range slider"
                        value={priceRange}
                        onValueChange={setPriceRange}
                        min={0}
                        max={100}
                        step={5}
                        showValue
                        formatValue={(v) => `$${v}k`}
                        showMinMax
                        helperText="Drag both handles to set min/max"
                      />
                      
                      {/* Price Range Visual */}
                      <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                        <Flex justify="between" className="mb-2">
                          <div>
                            <Text className="text-xs text-black/60">Minimum</Text>
                            <Text className="text-lg font-bold text-blue-600">
                              ${priceRange[0]}k
                            </Text>
                          </div>
                          <div className="text-right">
                            <Text className="text-xs text-black/60">Maximum</Text>
                            <Text className="text-lg font-bold text-blue-600">
                              ${priceRange[1]}k
                            </Text>
                          </div>
                        </Flex>
                        <Text className="text-sm text-center text-black/60">
                          Range: ${priceRange[1] - priceRange[0]}k
                        </Text>
                      </div>
                    </Stack>
                  </div>

                  {/* Required Slider with Validation */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <Slider
                      label="Temperature"
                      description="Must be above 0°C"
                      value={brightness}
                      onValueChange={setBrightness}
                      min={-20}
                      max={40}
                      step={1}
                      showValue
                      formatValue={(v) => `${v}°C`}
                      showMinMax
                      required
                      success={brightness[0] > 0 ? "Temperature is valid" : undefined}
                      error={brightness[0] <= 0 ? "Temperature must be above freezing" : undefined}
                      helperText="Adjust temperature setting"
                    />
                  </div>
                </Stack>
              </Grid>

              <div className="p-4 bg-indigo-50 rounded-lg">
                <Stack spacing="sm">
                  <Text className="text-sm font-medium text-indigo-900">
                    ✓ Features: Single/range sliders, live visual feedback, min/max labels, custom formatting, validation
                  </Text>
                  <Text className="text-xs text-indigo-700">
                    Try dragging the sliders to see live updates in the visual previews!
                  </Text>
                </Stack>
              </div>
            </Stack>
          </div>

          {/* Section 14: Date Pickers */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">14. Date Pickers</Heading>
                <Text className="text-black/60">Calendar-based date selection for schedules and records</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <Stack spacing="lg">
                  <DatePicker
                    label="Next Maintenance Date"
                    description="Schedule your next service"
                    value={maintenanceDate}
                    onChange={setMaintenanceDate}
                    minDate={new Date()}
                    placeholder="Select a date"
                    helperText="Must be a future date"
                  />

                  <DatePicker
                    label="Registration Date"
                    value={registrationDate}
                    onChange={setRegistrationDate}
                    maxDate={new Date()}
                    success={registrationDate ? "Date recorded" : undefined}
                    helperText="When did you register this vehicle?"
                  />
                </Stack>

                <Stack spacing="lg">
                  <DateRangePicker
                    label="Service Period"
                    description="Select warranty or service coverage dates"
                    value={servicePeriod}
                    onChange={setServicePeriod}
                    placeholder="Pick date range"
                    helperText="Start and end dates"
                  />

                  <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                    <Text className="font-medium text-blue-900">Selected Dates:</Text>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>
                        <span className="font-medium">Maintenance:</span>{' '}
                        {maintenanceDate ? maintenanceDate.toLocaleDateString() : 'Not set'}
                      </div>
                      <div>
                        <span className="font-medium">Registration:</span>{' '}
                        {registrationDate ? registrationDate.toLocaleDateString() : 'Not set'}
                      </div>
                      <div>
                        <span className="font-medium">Service Period:</span>{' '}
                        {servicePeriod?.from && servicePeriod?.to
                          ? `${servicePeriod.from.toLocaleDateString()} - ${servicePeriod.to.toLocaleDateString()}`
                          : 'Not set'}
                      </div>
                    </div>
                  </div>
                </Stack>
              </Grid>

              <div className="p-4 bg-indigo-50 rounded-lg">
                <Stack spacing="sm">
                  <Text className="text-sm font-medium text-indigo-900">
                    ✓ Features: Single date, date range, calendar popup, min/max constraints, validation
                  </Text>
                  <Text className="text-xs text-indigo-700">
                    Perfect for maintenance schedules, registration dates, warranty periods, and service history!
                  </Text>
                </Stack>
              </div>
            </Stack>
          </div>

          {/* Section 15: File Upload */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">15. File Upload</Heading>
                <Text className="text-black/60">Drag & drop file upload with image previews</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <FileUpload
                  label="Vehicle Photos"
                  description="Upload images of your vehicle"
                  accept="image/*"
                  multiple
                  maxSize={5242880} // 5MB
                  maxFiles={10}
                  value={vehiclePhotos}
                  onChange={setVehiclePhotos}
                  showPreview
                  variant="auto"
                  helperText="JPG, PNG up to 5MB each"
                />

                <FileUpload
                  label="Vehicle Documents"
                  description="Registration, insurance, etc."
                  accept=".pdf,.doc,.docx"
                  multiple
                  maxSize={10485760} // 10MB
                  maxFiles={5}
                  value={documents}
                  onChange={setDocuments}
                  showPreview
                  variant="auto"
                  helperText="PDF, DOC up to 10MB each"
                />
              </Grid>

              <div className="p-4 bg-purple-50 rounded-lg">
                <Stack spacing="sm">
                  <Flex justify="between">
                    <Text className="font-medium text-purple-900">Upload Summary:</Text>
                    <Text className="text-sm text-purple-700">
                      Photos: {vehiclePhotos.length} | Documents: {documents.length}
                    </Text>
                  </Flex>
                  <Text className="text-sm text-purple-900">
                    ✓ Features: Drag & drop, image preview, file validation, multiple files, remove files
                  </Text>
                  <Text className="text-xs text-purple-700">
                    Perfect for vehicle photos, registration documents, insurance cards, and service records!
                  </Text>
                </Stack>
              </div>
            </Stack>
          </div>

          {/* Section 16: Color Picker */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">16. Color Picker</Heading>
                <Text className="text-black/60">Color selection with common vehicle colors</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <ColorPicker
                  label="Exterior Color"
                  description="Select your vehicle's exterior color"
                  value={vehicleColor}
                  onChange={setVehicleColor}
                  showInput
                  helperText="Choose from presets or enter hex code"
                />

                <ColorPicker
                  label="Interior Color"
                  description="Select your vehicle's interior color"
                  value={interiorColor}
                  onChange={setInteriorColor}
                  showInput
                  helperText="Common interior color options"
                />
              </Grid>

              {/* Live Preview */}
              <div className="p-6 bg-slate-50 rounded-lg">
                <Stack spacing="md">
                  <Text className="font-medium">Live Vehicle Preview:</Text>
                  <Flex gap="lg" align="center">
                    {/* Exterior Preview */}
                    <div className="flex-1">
                      <Text className="text-xs text-black/60 mb-2">Exterior</Text>
                      <div
                        className="h-32 rounded-lg border-4 border-black/20 shadow-lg"
                        style={{ backgroundColor: vehicleColor }}
                      >
                        <div className="h-full flex items-center justify-center">
                          <span 
                            className="font-bold text-sm drop-shadow-lg"
                            style={{ color: vehicleColor === '#FFFFFF' ? '#000' : '#FFF' }}>
                            VEHICLE
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interior Preview */}
                    <div className="flex-1">
                      <Text className="text-xs text-black/60 mb-2">Interior</Text>
                      <div
                        className="h-32 rounded-lg border-4 border-black/20 shadow-inner"
                        style={{ backgroundColor: interiorColor }}
                      >
                        <div className="h-full flex items-center justify-center">
                          <span 
                            className="font-bold text-sm"
                            style={{ color: interiorColor === '#FFFFFF' ? '#000' : '#FFF' }}>
                            INTERIOR
                          </span>
                        </div>
                      </div>
                    </div>
                  </Flex>
                </Stack>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <Stack spacing="sm">
                  <Text className="text-sm font-medium text-green-900">
                    ✓ Features: Color swatches, hex input, color names, live preview, 16 common vehicle colors
                  </Text>
                  <Text className="text-xs text-green-700">
                    Perfect for vehicle registration, customization options, and color matching!
                  </Text>
                </Stack>
              </div>
            </Stack>
          </div>

          {/* Section 17: Time Picker */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">17. Time Picker</Heading>
                <Text className="text-black/60">Time selection with 12h/24h formats</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <TimePicker
                  label="Service Appointment"
                  description="Choose your preferred service time"
                  value={serviceTime}
                  onChange={setServiceTime}
                  use12Hour
                  minuteStep={30}
                  helperText="12-hour format with 30-min intervals"
                />

                <TimePicker
                  label="Opening Time"
                  value="09:00"
                  onChange={(time) => console.log(time)}
                  minuteStep={15}
                  helperText="24-hour format with 15-min intervals"
                />

                <TimePicker
                  label="Required Time"
                  value={serviceTime}
                  onChange={setServiceTime}
                  required
                  success={serviceTime ? "Time confirmed" : undefined}
                  helperText="This field is required"
                />

                <div className="p-4 bg-blue-50 rounded-lg">
                  <Stack spacing="sm">
                    <Text className="font-medium text-blue-900">Selected Time:</Text>
                    <Text className="text-2xl font-bold text-blue-600">
                      {serviceTime}
                    </Text>
                    <Text className="text-xs text-blue-700">
                      Perfect for scheduling service appointments and reminders
                    </Text>
                  </Stack>
                </div>
              </Grid>

              <div className="p-4 bg-purple-50 rounded-lg">
                <Text className="text-sm text-purple-900">
                  ✓ Features: 12h/24h formats, scrollable selectors, minute steps, AM/PM toggle, validation
                </Text>
              </div>
            </Stack>
          </div>

          {/* Section 18: Rating */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">18. Rating</Heading>
                <Text className="text-black/60">Star rating for reviews and condition assessment</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <Stack spacing="lg">
                  <Rating
                    label="Vehicle Condition"
                    description="Rate the overall condition"
                    value={vehicleRating}
                    onChange={setVehicleRating}
                    max={5}
                    showValue
                    helperText="Click to rate"
                  />

                  <Rating
                    label="Service Experience"
                    description="How was your service?"
                    value={serviceRating}
                    onChange={setServiceRating}
                    max={5}
                    size="lg"
                    showValue
                    success={serviceRating >= 4 ? "Great rating!" : undefined}
                    helperText="Help others by rating your experience"
                  />

                  <Rating
                    label="Half-Star Rating"
                    value={vehicleRating}
                    onChange={setVehicleRating}
                    max={5}
                    allowHalf
                    showValue
                    helperText="Supports half-star precision"
                  />
                </Stack>

                <Stack spacing="lg">
                  <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
                    <Stack spacing="md">
                      <Text className="font-bold text-amber-900">Rating Summary</Text>
                      <Flex justify="between" align="center">
                        <Text className="text-sm text-amber-800">Vehicle Condition:</Text>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < Math.floor(vehicleRating) ? "text-amber-400" : "text-gray-300"}>
                              ★
                            </span>
                          ))}
                          <Text className="ml-2 font-bold text-amber-900">{vehicleRating.toFixed(1)}</Text>
                        </div>
                      </Flex>
                      <Flex justify="between" align="center">
                        <Text className="text-sm text-amber-800">Service Experience:</Text>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < serviceRating ? "text-amber-400" : "text-gray-300"}>
                              ★
                            </span>
                          ))}
                          <Text className="ml-2 font-bold text-amber-900">{serviceRating.toFixed(1)}</Text>
                        </div>
                      </Flex>
                    </Stack>
                  </div>

                  <Rating
                    label="Read-Only Display"
                    value={4.5}
                    readOnly
                    size="md"
                    showValue
                    helperText="Display mode for showing existing ratings"
                  />
                </Stack>
              </Grid>

              <div className="p-4 bg-amber-50 rounded-lg">
                <Text className="text-sm text-amber-900">
                  ✓ Features: Full/half stars, 3 sizes, read-only mode, hover preview, value display, validation
                </Text>
              </div>
            </Stack>
          </div>

          {/* Section 19: Password Input */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">19. Password Input</Heading>
                <Text className="text-black/60">Secure password entry with strength meter</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <PasswordInput
                  label="New Password"
                  description="Create a secure password"
                  value={password}
                  onChange={setPassword}
                  showStrength
                  required
                  helperText="At least 8 characters with mixed case, numbers, and symbols"
                />

                <PasswordInput
                  label="Confirm Password"
                  value=""
                  error={password && "Passwords must match"}
                  helperText="Re-enter your password"
                />

                <PasswordInput
                  label="Current Password"
                  placeholder="Enter current password"
                  helperText="For security verification"
                />

                <div className="p-4 bg-green-50 rounded-lg">
                  <Stack spacing="sm">
                    <Text className="font-medium text-green-900">Password Strength Tips:</Text>
                    <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                      <li>Use at least 8 characters</li>
                      <li>Mix uppercase and lowercase</li>
                      <li>Include numbers and symbols</li>
                      <li>Avoid common words</li>
                    </ul>
                  </Stack>
                </div>
              </Grid>

              <div className="p-4 bg-blue-50 rounded-lg">
                <Text className="text-sm text-blue-900">
                  ✓ Features: Show/hide toggle, strength meter (Weak/Fair/Strong), lock icon, validation
                </Text>
              </div>
            </Stack>
          </div>

          {/* Section 20: Phone Input */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">20. Phone Input</Heading>
                <Text className="text-black/60">Phone number with country code selector and auto-formatting</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <PhoneInput
                  label="Contact Number"
                  description="Your primary phone number"
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  defaultCountryCode="+1"
                  autoFormat
                  required
                  helperText="Format: (XXX) XXX-XXXX"
                />

                <PhoneInput
                  label="Emergency Contact"
                  value="+1 (555) 123-4567"
                  onChange={(value) => console.log(value)}
                  defaultCountryCode="+1"
                  autoFormat
                  helperText="Auto-formats as you type"
                />

                <PhoneInput
                  label="International Number"
                  defaultCountryCode="+44"
                  autoFormat
                  helperText="Supports multiple country codes"
                />

                <div className="p-4 bg-indigo-50 rounded-lg">
                  <Stack spacing="sm">
                    <Text className="font-medium text-indigo-900">Current Number:</Text>
                    <Text className="text-lg font-mono text-indigo-700">
                      {phoneNumber || "Not set"}
                    </Text>
                    <Text className="text-xs text-indigo-700">
                      Country codes: US, CA, UK, AU, DE, FR, JP, CN
                    </Text>
                  </Stack>
                </div>
              </Grid>

              <div className="p-4 bg-indigo-50 rounded-lg">
                <Text className="text-sm text-indigo-900">
                  ✓ Features: Country code dropdown, auto-formatting, phone icon, 8 country codes, validation
                </Text>
              </div>
            </Stack>
          </div>

          {/* Section 21: OTP Input */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">21. OTP / PIN Input</Heading>
                <Text className="text-black/60">One-time password and verification codes</Text>
              </Stack>

              <Stack spacing="lg">
                <div className="max-w-md mx-auto">
                  <OTPInput
                    label="Verification Code"
                    description="Enter the 6-digit code sent to your phone"
                    value={otpCode}
                    onChange={setOtpCode}
                    length={6}
                    helperText="Code expires in 5 minutes"
                  />
                </div>

                <Grid columns={2} gap="lg">
                  <div className="max-w-sm">
                    <OTPInput
                      label="PIN Code"
                      value=""
                      length={4}
                      mask
                      helperText="4-digit PIN (masked)"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <Stack spacing="sm">
                      <Text className="font-medium">💡 OTP Features:</Text>
                      <ul className="text-sm text-black/60 space-y-1 list-disc list-inside">
                        <li>Auto-focus next field</li>
                        <li>Paste support (auto-fills all)</li>
                        <li>Arrow key navigation</li>
                        <li>Backspace navigation</li>
                        <li>Optional masking</li>
                      </ul>
                    </Stack>
                  </div>
                </Grid>

                {otpCode.length === 6 && (
                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200 text-center">
                    <Text className="font-bold text-green-900">
                      ✓ Code Complete: {otpCode}
                    </Text>
                  </div>
                )}
              </Stack>

              <div className="p-4 bg-green-50 rounded-lg">
                <Text className="text-sm text-green-900">
                  ✓ Features: Auto-focus, paste support, keyboard navigation, masking, configurable length
                </Text>
              </div>
            </Stack>
          </div>

          {/* Section 22: Number Input */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">22. Number Input</Heading>
                <Text className="text-black/60">Numeric input with stepper buttons and constraints</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                <Stack spacing="lg">
                  <NumberInput
                    label="Vehicle Mileage"
                    description="Current odometer reading"
                    value={mileage}
                    onChange={setMileage}
                    min={0}
                    step={1000}
                    showSteppers
                    formatValue={(v) => `${v.toLocaleString()} mi`}
                    helperText="Increments by 1,000 miles"
                  />

                  <NumberInput
                    label="Vehicle Price"
                    description="Listing or sale price"
                    value={price}
                    onChange={setPrice}
                    min={0}
                    max={100000}
                    step={500}
                    showSteppers
                    formatValue={(v) => `$${v.toLocaleString()}`}
                    success={price >= 20000 ? "Within market range" : undefined}
                    helperText="Price range: $0 - $100,000"
                  />
                </Stack>

                <Stack spacing="lg">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                    <Stack spacing="md">
                      <Text className="font-bold text-blue-900">Vehicle Details</Text>
                      <Flex justify="between">
                        <Text className="text-sm text-blue-800">Mileage:</Text>
                        <Text className="font-bold text-blue-900">
                          {mileage.toLocaleString()} mi
                        </Text>
                      </Flex>
                      <Flex justify="between">
                        <Text className="text-sm text-blue-800">Price:</Text>
                        <Text className="font-bold text-blue-900">
                          ${price.toLocaleString()}
                        </Text>
                      </Flex>
                      <Flex justify="between">
                        <Text className="text-sm text-blue-800">Price per Mile:</Text>
                        <Text className="font-bold text-blue-900">
                          ${(price / mileage).toFixed(2)}
                        </Text>
                      </Flex>
                    </Stack>
                  </div>

                  <NumberInput
                    label="Quantity"
                    value={5}
                    onChange={(v) => console.log(v)}
                    min={1}
                    max={100}
                    step={1}
                    showSteppers
                    helperText="Without formatter for simple numbers"
                  />
                </Stack>
              </Grid>

              <div className="p-4 bg-cyan-50 rounded-lg">
                <Text className="text-sm text-cyan-900">
                  ✓ Features: Stepper buttons (+/-), min/max constraints, step control, custom formatters, validation
                </Text>
              </div>
            </Stack>
          </div>

          {/* Section 23: Form Sections */}
          <div className="p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-indigo-200">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">23. Form Sections - Organize Complex Forms</Heading>
                <Text className="text-black/60">
                  Group related fields with collapsible sections, progress tracking, and visual hierarchy
                </Text>
              </Stack>

              <Stack spacing="lg">
                {/* Example 1: Outlined Variant (Always Open) */}
                <div>
                  <Text className="text-sm font-semibold text-indigo-900 mb-3">✨ Outlined Variant - Always Visible</Text>
                  <FormSection
                    title="Vehicle Information"
                    description="Essential details about your vehicle"
                    variant="outlined"
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    }
                  >
                    <Grid columns={2} gap="lg">
                      <Input label="VIN" placeholder="1HGBH41JXMN109186" required />
                      <Input label="License Plate" placeholder="ABC123" />
                      <Input label="Make" placeholder="Honda" required />
                      <Input label="Model" placeholder="Civic" required />
                    </Grid>
                  </FormSection>
                </div>

                {/* Example 2: Collapsible with Status */}
                <div>
                  <Text className="text-sm font-semibold text-indigo-900 mb-3">🎯 Collapsible Section - Click to Expand/Collapse</Text>
                  <FormSection
                    title="Owner Details"
                    description="Contact information for the vehicle owner"
                    collapsible
                    defaultOpen={true}
                    status="complete"
                    variant="filled"
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                  >
                    <Grid columns={2} gap="lg">
                      <Input label="Owner Name" placeholder="John Doe" />
                      <PhoneInput label="Phone" defaultCountryCode="+1" autoFormat />
                      <Input label="Email" type="email" placeholder="john@example.com" />
                      <Input label="Address" placeholder="123 Main St" />
                    </Grid>
                  </FormSection>
                </div>

                {/* Example 3: With Progress Indicator */}
                <div>
                  <Text className="text-sm font-semibold text-indigo-900 mb-3">📊 Progress Tracking - Visual Completion Status</Text>
                  <FormSection
                    title="Documents & Photos"
                    description="Upload required documentation"
                    collapsible
                    defaultOpen={false}
                    progress={{ current: 2, total: 4, showPercentage: true }}
                    variant="outlined"
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    }
                  >
                    <Stack spacing="md">
                      <Checkbox label="✓ Registration document uploaded" checked />
                      <Checkbox label="✓ Insurance card uploaded" checked />
                      <Checkbox label="⏳ Vehicle photos (pending)" />
                      <Checkbox label="⏳ Maintenance records (pending)" />
                      <div className="pt-2">
                        <Button variant="outline" size="sm">Upload Files</Button>
                      </div>
                    </Stack>
                  </FormSection>
                </div>

                {/* Example 4: Multi-Step Wizard */}
                <div>
                  <Text className="text-sm font-semibold text-indigo-900 mb-3">🧙‍♂️ Multi-Step Wizard - Form Section Group</Text>
                  <div className="bg-white rounded-lg border-2 border-indigo-300 shadow-sm p-6">
                    <FormSectionGroup
                      title="Vehicle Onboarding Wizard"
                      description="Complete all steps to add your vehicle to the fleet"
                      progress={{ completed: 2, total: 3 }}
                    >
                      <FormSection
                        title="Step 1: Basic Information"
                        status="complete"
                        collapsible
                        defaultOpen={false}
                        variant="outlined"
                        icon={
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        }
                      >
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <Flex align="center" gap="sm">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <Text className="text-sm font-medium text-green-900">
                              Completed: VIN, Make, Model, Year
                            </Text>
                          </Flex>
                        </div>
                      </FormSection>

                      <FormSection
                        title="Step 2: Owner & Contact"
                        status="complete"
                        collapsible
                        defaultOpen={false}
                        variant="outlined"
                        icon={
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        }
                      >
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <Flex align="center" gap="sm">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <Text className="text-sm font-medium text-green-900">
                              Completed: Name, Email, Phone, Address
                            </Text>
                          </Flex>
                        </div>
                      </FormSection>

                      <FormSection
                        title="Step 3: Review & Submit"
                        status="incomplete"
                        collapsible
                        defaultOpen={true}
                        required
                        variant="outlined"
                        icon={
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        }
                        actions={
                          <Button size="sm" variant="primary">Submit</Button>
                        }
                      >
                        <Stack spacing="md">
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <Text className="text-sm font-medium text-blue-900 mb-2">
                              📋 Ready to submit?
                            </Text>
                            <Text className="text-xs text-blue-700">
                              Please review all information before finalizing your submission.
                            </Text>
                          </div>
                          <Checkbox label="I confirm all information is accurate and complete" />
                          <Checkbox label="I agree to the terms and conditions" />
                        </Stack>
                      </FormSection>
                    </FormSectionGroup>
                  </div>
                </div>
              </Stack>

              {/* Feature Summary */}
              <div className="bg-white rounded-lg border-2 border-purple-200 p-5 shadow-sm">
                <Stack spacing="md">
                  <Text className="text-lg font-bold text-purple-900">✨ All Features Demonstrated</Text>
                  <Grid columns={2} gap="md">
                    <Stack spacing="xs">
                      <Text className="text-sm font-semibold text-black">🎨 Variants</Text>
                      <Text className="text-xs text-black/60">Default, Outlined, Filled</Text>
                    </Stack>
                    <Stack spacing="xs">
                      <Text className="text-sm font-semibold text-black">🎯 Collapsible</Text>
                      <Text className="text-xs text-black/60">Smooth accordion animations</Text>
                    </Stack>
                    <Stack spacing="xs">
                      <Text className="text-sm font-semibold text-black">📊 Progress</Text>
                      <Text className="text-xs text-black/60">Visual completion tracking</Text>
                    </Stack>
                    <Stack spacing="xs">
                      <Text className="text-sm font-semibold text-black">✅ Status</Text>
                      <Text className="text-xs text-black/60">Complete, Incomplete, Error</Text>
                    </Stack>
                    <Stack spacing="xs">
                      <Text className="text-sm font-semibold text-black">🎬 Icons</Text>
                      <Text className="text-xs text-black/60">Custom section icons</Text>
                    </Stack>
                    <Stack spacing="xs">
                      <Text className="text-sm font-semibold text-black">⚡ Actions</Text>
                      <Text className="text-xs text-black/60">Header action buttons</Text>
                    </Stack>
                  </Grid>
                  <div className="pt-2 border-t border-purple-100">
                    <Text className="text-xs text-purple-700">
                      💡 <strong>Pro Tip:</strong> Click on any collapsible section header to expand/collapse it. 
                      Perfect for multi-step forms, settings pages, and complex data entry!
                    </Text>
                  </div>
                </Stack>
              </div>
            </Stack>
          </div>

          {/* Section 24: Complete Form Example */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">24. Complete Form Example</Heading>
                <Text className="text-black/60">Real-world form with validation and submission</Text>
              </Stack>

              <div className="bg-white p-6 rounded-lg">
                <form onSubmit={(e) => {
                  e.preventDefault()
                  setIsLoading(true)
                  setTimeout(() => setIsLoading(false), 2000)
                }}>
                  <Stack spacing="lg">
                    <Grid columns={2} gap="lg">
                      <Input
                        label="First Name"
                        required
                        placeholder="John"
                      />

                      <Input
                        label="Last Name"
                        required
                        placeholder="Doe"
                      />
                    </Grid>

                    <Input
                      label="Email"
                      type="email"
                      required
                      placeholder="john.doe@example.com"
                      helperText="We'll never share your email"
                    />

                    <PhoneInput
                      label="Phone"
                      placeholder="(555) 123-4567"
                      defaultCountryCode="+1"
                      autoFormat
                    />

                    <Textarea
                      label="Message"
                      required
                      placeholder="Tell us about yourself..."
                      autoResize
                      minRows={4}
                      maxRows={8}
                      maxLength={500}
                      showCounter
                    />

                    <Flex justify="end" gap="sm">
                      <Button type="button" variant="ghost">
                        Cancel
                      </Button>
                      <Button type="submit" loading={isLoading}>
                        {isLoading ? 'Submitting...' : 'Submit Form'}
                      </Button>
                    </Flex>
                  </Stack>
                </form>
              </div>
            </Stack>
          </div>

          {/* Feature Comparison Table */}
          <div className="p-6 bg-white rounded-xl border border-black/10">
            <Stack spacing="lg">
              <div>
                <Heading level="title">Feature Matrix</Heading>
                <Text className="text-black/60">Complete overview of all Input & Textarea features</Text>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-3 font-semibold">Feature</th>
                      <th className="text-center p-3 font-semibold">Input</th>
                      <th className="text-center p-3 font-semibold">Textarea</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-3">Multiple types</td>
                      <td className="text-center p-3">✅ (6 types)</td>
                      <td className="text-center p-3">-</td>
                    </tr>
                    <tr>
                      <td className="p-3">Validation states</td>
                      <td className="text-center p-3">✅</td>
                      <td className="text-center p-3">✅</td>
                    </tr>
                    <tr>
                      <td className="p-3">Helper text</td>
                      <td className="text-center p-3">✅</td>
                      <td className="text-center p-3">✅</td>
                    </tr>
                    <tr>
                      <td className="p-3">Icons (start/end)</td>
                      <td className="text-center p-3">✅</td>
                      <td className="text-center p-3">-</td>
                    </tr>
                    <tr>
                      <td className="p-3">Loading state</td>
                      <td className="text-center p-3">✅</td>
                      <td className="text-center p-3">-</td>
                    </tr>
                    <tr>
                      <td className="p-3">Character counter</td>
                      <td className="text-center p-3">✅</td>
                      <td className="text-center p-3">✅</td>
                    </tr>
                    <tr>
                      <td className="p-3">Auto-resize</td>
                      <td className="text-center p-3">-</td>
                      <td className="text-center p-3">✅</td>
                    </tr>
                    <tr>
                      <td className="p-3">Inline layout</td>
                      <td className="text-center p-3">✅</td>
                      <td className="text-center p-3">-</td>
                    </tr>
                    <tr>
                      <td className="p-3">Sizes (sm/md/lg)</td>
                      <td className="text-center p-3">✅</td>
                      <td className="text-center p-3">✅</td>
                    </tr>
                    <tr>
                      <td className="p-3">Required indicator</td>
                      <td className="text-center p-3">✅</td>
                      <td className="text-center p-3">✅</td>
                    </tr>
                    <tr>
                      <td className="p-3">Disabled state</td>
                      <td className="text-center p-3">✅</td>
                      <td className="text-center p-3">✅</td>
                    </tr>
                    <tr>
                      <td className="p-3">Accessibility (ARIA)</td>
                      <td className="text-center p-3">✅</td>
                      <td className="text-center p-3">✅</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Stack>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-black/60 border-t border-black/10 pt-8">
            <p>
              <strong>Elite Form Components</strong> - Production-ready inputs with validation, icons, and accessibility
            </p>
            <p className="mt-2">
              Built with React, TypeScript, and Tailwind CSS
            </p>
          </div>
        </Stack>
      </Section>
    </Container>
  )
}
