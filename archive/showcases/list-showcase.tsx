import * as React from 'react'
import { 
  Container, 
  Section, 
  Stack, 
  Heading, 
  Text,
  List,
  ListItem,
  CheckList,
  SelectList,
  ActionList,
  DescriptionList,
  TimelineList,
  PropertyList,
  GroupedList,
  StepList,
  ContactList,
  MenuList,
  Grid,
  Card
} from '@/components/design-system'
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  CreditCard,
  LogOut,
  Trash2,
  Check,
  Clock,
  Package,
  Truck,
  MapPin,
  Inbox,
  ExternalLink,
  Smartphone,
  Mail,
  Home,
  Calendar as CalendarIcon,
  FileText,
  HelpCircle
} from 'lucide-react'

export default function ListShowcasePage() {
  // State for interactive examples
  const [checkedItems, setCheckedItems] = React.useState({
    '1': true,
    '2': false,
    '3': false,
    '4': true
  })

  const [selectedSetting, setSelectedSetting] = React.useState('email')
  const [isLoading, setIsLoading] = React.useState(false)
  const [showEmpty, setShowEmpty] = React.useState(false)

  // Check list items
  const checkListItems = [
    { id: '1', label: 'Oil change completed', checked: checkedItems['1'] },
    { id: '2', label: 'Tire rotation scheduled', checked: checkedItems['2'] },
    { id: '3', label: 'Brake inspection pending', checked: checkedItems['3'] },
    { id: '4', label: 'Air filter replaced', checked: checkedItems['4'] }
  ]

  const handleCheckChange = (id: string, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [id]: checked }))
  }

  // Select list items
  const settingsOptions = [
    { 
      id: 'email', 
      label: 'Email Notifications', 
      description: 'Receive email updates about your vehicles',
      icon: <Bell className="w-5 h-5" />
    },
    { 
      id: 'sms', 
      label: 'SMS Alerts', 
      description: 'Get text messages for urgent reminders',
      icon: <Bell className="w-5 h-5" />
    },
    { 
      id: 'push', 
      label: 'Push Notifications', 
      description: 'Mobile app notifications',
      icon: <Bell className="w-5 h-5" />
    }
  ]

  // Action list items
  const actions = [
    {
      id: 'profile',
      label: 'Edit Profile',
      description: 'Update your account information',
      icon: <User className="w-5 h-5" />,
      onClick: () => console.log('Edit profile')
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Manage app preferences',
      icon: <Settings className="w-5 h-5" />,
      onClick: () => console.log('Settings')
    },
    {
      id: 'security',
      label: 'Security',
      description: 'Change password and 2FA',
      icon: <Shield className="w-5 h-5" />,
      onClick: () => console.log('Security')
    },
    {
      id: 'billing',
      label: 'Billing',
      description: 'Manage subscription and payments',
      icon: <CreditCard className="w-5 h-5" />,
      onClick: () => console.log('Billing')
    },
    {
      id: 'logout',
      label: 'Log Out',
      icon: <LogOut className="w-5 h-5" />,
      onClick: () => console.log('Logout'),
      destructive: false
    },
    {
      id: 'delete',
      label: 'Delete Account',
      description: 'Permanently remove your account',
      icon: <Trash2 className="w-5 h-5" />,
      onClick: () => console.log('Delete'),
      destructive: true
    }
  ]

  // Description list
  const vehicleDetails = [
    { term: 'Make & Model', description: '2023 Honda Civic' },
    { term: 'VIN', description: '1HGCV1F3XLA123456' },
    { term: 'License Plate', description: 'ABC-1234' },
    { term: 'Current Mileage', description: '15,234 miles' },
    { term: 'Next Service', description: 'Oil Change in 765 miles' },
    { term: 'Insurance Expiry', description: 'December 31, 2025' }
  ]

  // Timeline data
  const maintenanceTimeline = [
    {
      id: '1',
      title: 'Oil Change Completed',
      description: 'Synthetic oil 5W-30, new filter installed',
      timestamp: '2 days ago',
      icon: <Check className="w-3 h-3" />,
      color: 'green' as const
    },
    {
      id: '2',
      title: 'Tire Rotation Scheduled',
      description: 'Appointment at Honda Service Center',
      timestamp: 'In 5 days',
      icon: <Clock className="w-3 h-3" />,
      color: 'blue' as const
    },
    {
      id: '3',
      title: 'Parts Ordered',
      description: 'Brake pads and rotors for upcoming service',
      timestamp: 'In 2 weeks',
      icon: <Package className="w-3 h-3" />,
      color: 'yellow' as const
    },
    {
      id: '4',
      title: 'Inspection Due',
      description: 'State safety and emissions inspection',
      timestamp: 'In 3 weeks',
      icon: <Truck className="w-3 h-3" />,
      color: 'red' as const
    }
  ]

  return (
    <Container size="lg">
      <Section spacing="xl">
        <Stack spacing="xl">
          {/* Header */}
          <Stack spacing="md">
            <Heading level="hero">List Components</Heading>
            <Text className="text-slate-600 text-lg">
              Beautiful, responsive, mobile-first lists with accessibility built-in
            </Text>
            
            {/* New Features Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                ✨ Loading States
              </span>
              <span className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                📱 Mobile-First
              </span>
              <span className="px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                ♿ Accessible
              </span>
              <span className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                🔗 Link Support
              </span>
              <span className="px-3 py-1.5 text-xs font-medium bg-pink-100 text-pink-700 rounded-full">
                👆 Touch Optimized
              </span>
            </div>

            {/* Interactive Controls */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setIsLoading(true)
                  setTimeout(() => setIsLoading(false), 2000)
                }}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Test Loading State
              </button>
              <button
                onClick={() => setShowEmpty(!showEmpty)}
                className="px-3 py-1.5 text-sm bg-slate-500 text-white rounded-md hover:bg-slate-600 transition-colors"
              >
                Toggle Empty State
              </button>
            </div>
          </Stack>

          {/* Basic Lists */}
          <Card className="p-6">
            <Stack spacing="lg">
              <div>
                <Heading level="title">Basic Lists</Heading>
                <Text className="text-slate-600">Simple lists with various styles and sizes</Text>
              </div>

              <Grid columns={3} gap="lg">
                {/* Default */}
                <div>
                  <Text className="font-semibold mb-3">Default</Text>
                  <List 
                    items={['Item 1', 'Item 2', 'Item 3', 'Item 4']} 
                    spacing="sm"
                  />
                </div>

                {/* Card Variant */}
                <div>
                  <Text className="font-semibold mb-3">Card Style</Text>
                  <List 
                    variant="card"
                    items={['Item 1', 'Item 2', 'Item 3', 'Item 4']} 
                    spacing="sm"
                  />
                </div>

                {/* Divided */}
                <div>
                  <Text className="font-semibold mb-3">Divided</Text>
                  <List 
                    variant="card"
                    divided
                    items={['Item 1', 'Item 2', 'Item 3', 'Item 4']}
                  />
                </div>
              </Grid>
            </Stack>
          </Card>

          {/* Loading & Empty States */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">Loading & Empty States</Heading>
                <Text className="text-slate-600">Built-in support for loading and empty states</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                {/* Loading State */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Loading</Text>
                  <List 
                    variant="card" 
                    loading={isLoading}
                    items={['Item 1', 'Item 2']}
                  />
                </Stack>

                {/* Empty State */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Empty</Text>
                  <List 
                    variant="card"
                    items={showEmpty ? [] : ['Item 1', 'Item 2']}
                    emptyMessage="No maintenance records found"
                    emptyIcon={<Inbox className="w-12 h-12" />}
                  />
                </Stack>
              </Grid>
            </Stack>
          </Card>

          {/* Link Support & Mobile-First */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">Links & Mobile Optimization</Heading>
                <Text className="text-slate-600">
                  Items can be links, and everything is optimized for mobile and touch
                </Text>
              </Stack>

              <Grid columns={2} gap="lg">
                {/* Links */}
                <Stack spacing="sm">
                  <Text className="font-semibold">As Links</Text>
                  <List variant="card" divided>
                    <ListItem 
                      href="/profile"
                      leading={<User className="w-5 h-5" />}
                      title="View Profile"
                      description="Internal link"
                      showArrow
                    />
                    <ListItem 
                      href="https://docs.motomind.ai"
                      target="_blank"
                      leading={<ExternalLink className="w-5 h-5" />}
                      title="Documentation"
                      description="External link (new tab)"
                      showArrow
                    />
                  </List>
                </Stack>

                {/* Mobile Features */}
                <Stack spacing="sm">
                  <Text className="font-semibold">Mobile Features</Text>
                  <List variant="card" divided>
                    <ListItem 
                      leading={<Smartphone className="w-5 h-5" />}
                      title="Touch Optimized"
                      description="Scale feedback on tap"
                      onClick={() => alert('Touch optimized!')}
                    />
                    <ListItem 
                      leading={<Smartphone className="w-5 h-5" />}
                      title="Responsive Text"
                      description="Automatically adjusts for mobile"
                    />
                    <ListItem 
                      leading={<Smartphone className="w-5 h-5" />}
                      title="Large Tap Targets"
                      description="44x44px minimum"
                    />
                  </List>
                </Stack>
              </Grid>
            </Stack>
          </Card>

          {/* List Items with Content */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">Rich List Items</Heading>
                <Text className="text-slate-600">Items with icons, descriptions, and interactive elements</Text>
              </Stack>

              <Grid columns={2} gap="lg">
                {/* With Icons */}
                <div>
                  <Text className="font-semibold mb-3">With Icons</Text>
                  <List variant="card" divided>
                    <ListItem 
                      leading={<User className="w-5 h-5" />}
                      title="Profile Settings"
                      description="Manage your personal information"
                    />
                    <ListItem 
                      leading={<Bell className="w-5 h-5" />}
                      title="Notifications"
                      description="Control what you get notified about"
                    />
                    <ListItem 
                      leading={<Shield className="w-5 h-5" />}
                      title="Privacy & Security"
                      description="Protect your account"
                    />
                  </List>
                </div>

                {/* Interactive with Arrows */}
                <div>
                  <Text className="font-semibold mb-3">Interactive</Text>
                  <List variant="card" divided>
                    <ListItem 
                      leading={<User className="w-5 h-5" />}
                      title="Account Details"
                      onClick={() => console.log('clicked')}
                      showArrow
                    />
                    <ListItem 
                      leading={<Settings className="w-5 h-5" />}
                      title="Preferences"
                      onClick={() => console.log('clicked')}
                      showArrow
                    />
                    <ListItem 
                      leading={<CreditCard className="w-5 h-5" />}
                      title="Billing"
                      description="Manage subscription"
                      onClick={() => console.log('clicked')}
                      showArrow
                    />
                  </List>
                </div>
              </Grid>
            </Stack>
          </Card>

          {/* CheckList */}
          <Card className="p-6">
            <Stack spacing="lg">
              <div>
                <Heading level="title">CheckList</Heading>
                <Text className="text-slate-600">Task lists with checkboxes</Text>
              </div>

              <CheckList 
                items={checkListItems}
                onChange={handleCheckChange}
              />
            </Stack>
          </Card>

          {/* SelectList */}
          <Card className="p-6">
            <Stack spacing="lg">
              <div>
                <Heading level="title">SelectList</Heading>
                <Text className="text-slate-600">Single-selection list (like radio buttons)</Text>
              </div>

              <SelectList 
                items={settingsOptions}
                value={selectedSetting}
                onChange={setSelectedSetting}
              />
            </Stack>
          </Card>

          {/* ActionList */}
          <Card className="p-6">
            <Stack spacing="lg">
              <div>
                <Heading level="title">ActionList</Heading>
                <Text className="text-slate-600">Clickable actions with descriptions</Text>
              </div>

              <ActionList items={actions} />
            </Stack>
          </Card>

          {/* DescriptionList */}
          <Card className="p-6">
            <Stack spacing="lg">
              <div>
                <Heading level="title">DescriptionList</Heading>
                <Text className="text-slate-600">Key-value pairs for displaying data</Text>
              </div>

              <Grid columns={2} gap="lg">
                {/* Vertical */}
                <div>
                  <Text className="font-semibold mb-4">Vertical Layout</Text>
                  <DescriptionList items={vehicleDetails} />
                </div>

                {/* Horizontal */}
                <div>
                  <Text className="font-semibold mb-4">Horizontal Layout</Text>
                  <DescriptionList items={vehicleDetails} horizontal />
                </div>
              </Grid>
            </Stack>
          </Card>

          {/* PropertyList */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">PropertyList</Heading>
                <Text className="text-slate-600">
                  Simple left/right key-value pairs (iOS Settings style)
                </Text>
              </Stack>

              <PropertyList 
                items={[
                  { key: '1', label: 'Make', value: 'Honda' },
                  { key: '2', label: 'Model', value: 'Civic' },
                  { key: '3', label: 'Year', value: '2023' },
                  { key: '4', label: 'VIN', value: '1HGCV1F3XLA123456' },
                  { key: '5', label: 'Mileage', value: '15,234 mi', href: '/edit-mileage' },
                  { key: '6', label: 'Next Service', value: 'Oil Change', onClick: () => alert('Navigate to service') }
                ]}
              />
            </Stack>
          </Card>

          {/* GroupedList */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">GroupedList</Heading>
                <Text className="text-slate-600">Lists organized into labeled sections</Text>
              </Stack>

              <GroupedList 
                sections={[
                  {
                    id: 'general',
                    title: 'General',
                    items: [
                      <ListItem 
                        key="profile"
                        leading={<User className="w-5 h-5" />}
                        title="Profile"
                        onClick={() => console.log('Profile')}
                        showArrow
                      />,
                      <ListItem 
                        key="notifications"
                        leading={<Bell className="w-5 h-5" />}
                        title="Notifications"
                        onClick={() => console.log('Notifications')}
                        showArrow
                      />
                    ]
                  },
                  {
                    id: 'security',
                    title: 'Security & Privacy',
                    items: [
                      <ListItem 
                        key="password"
                        leading={<Shield className="w-5 h-5" />}
                        title="Change Password"
                        onClick={() => console.log('Password')}
                        showArrow
                      />,
                      <ListItem 
                        key="2fa"
                        leading={<Shield className="w-5 h-5" />}
                        title="Two-Factor Authentication"
                        onClick={() => console.log('2FA')}
                        showArrow
                      />
                    ]
                  }
                ]}
              />
            </Stack>
          </Card>

          {/* StepList */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">StepList</Heading>
                <Text className="text-slate-600">Numbered steps with progress tracking</Text>
              </Stack>

              <StepList 
                items={[
                  {
                    id: '1',
                    title: 'Create Account',
                    description: 'Sign up with email and password',
                    completed: true
                  },
                  {
                    id: '2',
                    title: 'Add Vehicle',
                    description: 'Enter your vehicle information',
                    completed: true
                  },
                  {
                    id: '3',
                    title: 'Schedule Maintenance',
                    description: 'Set up your first maintenance reminder',
                    current: true
                  },
                  {
                    id: '4',
                    title: 'Connect Mechanics',
                    description: 'Find and connect with local service providers'
                  }
                ]}
              />
            </Stack>
          </Card>

          {/* ContactList */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">ContactList</Heading>
                <Text className="text-slate-600">Contacts with avatars and status indicators</Text>
              </Stack>

              <ContactList 
                items={[
                  {
                    id: '1',
                    name: 'John Mechanic',
                    subtitle: 'Honda Specialist',
                    initials: 'JM',
                    status: 'online',
                    onClick: () => console.log('Contact John')
                  },
                  {
                    id: '2',
                    name: 'Sarah Auto Shop',
                    subtitle: 'Full Service Repair',
                    initials: 'SA',
                    status: 'away',
                    onClick: () => console.log('Contact Sarah')
                  },
                  {
                    id: '3',
                    name: 'Mike\'s Garage',
                    subtitle: 'Brake Specialist',
                    initials: 'MG',
                    status: 'offline',
                    onClick: () => console.log('Contact Mike')
                  }
                ]}
              />
            </Stack>
          </Card>

          {/* MenuList */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">MenuList</Heading>
                <Text className="text-slate-600">Navigation menus with badges and icons</Text>
              </Stack>

              <MenuList 
                items={[
                  {
                    id: 'dashboard',
                    label: 'Dashboard',
                    icon: <Home className="w-5 h-5" />,
                    href: '/dashboard',
                    active: true
                  },
                  {
                    id: 'calendar',
                    label: 'Calendar',
                    icon: <CalendarIcon className="w-5 h-5" />,
                    href: '/calendar',
                    badge: 3
                  },
                  {
                    id: 'messages',
                    label: 'Messages',
                    icon: <Mail className="w-5 h-5" />,
                    href: '/messages',
                    badge: 12
                  },
                  {
                    id: 'documents',
                    label: 'Documents',
                    icon: <FileText className="w-5 h-5" />,
                    href: '/documents'
                  },
                  {
                    id: 'help',
                    label: 'Help & Support',
                    icon: <HelpCircle className="w-5 h-5" />,
                    href: '/help'
                  }
                ]}
              />
            </Stack>
          </Card>

          {/* TimelineList */}
          <Card className="p-6">
            <Stack spacing="lg">
              <Stack spacing="sm">
                <Heading level="title">TimelineList</Heading>
                <Text className="text-slate-600">Vertical timeline for chronological events</Text>
              </Stack>

              <TimelineList items={maintenanceTimeline} />
            </Stack>
          </Card>

          {/* Usage Code */}
          <Card className="bg-slate-900 text-white p-6">
            <Stack spacing="md">
              <Heading level="title" className="text-white">Usage Example</Heading>
              <pre className="text-xs bg-slate-800 p-4 rounded overflow-x-auto">
{`import { 
  List, 
  ListItem, 
  CheckList, 
  SelectList,
  ActionList,
  DescriptionList,
  TimelineList,
  PropertyList,      // ✨ NEW
  GroupedList,       // ✨ NEW
  StepList,          // ✨ NEW
  ContactList,       // ✨ NEW
  MenuList           // ✨ NEW
} from '@/components/design-system'

// ✨ NEW: Loading & Empty States
<List 
  loading={isLoading}
  emptyMessage="No items found"
  emptyIcon={<Icon />}
  items={data}
/>

// ✨ NEW: Links (renders as <a>)
<ListItem 
  href="/profile"
  target="_blank"
  title="View Profile"
  showArrow
/>

// ✨ NEW: Mobile-optimized with touch feedback
<ListItem 
  onClick={handleClick}
  title="Touch me!"
  description="Automatically optimized for mobile"
  // Auto-detects mobile/touch and adjusts:
  // - Tighter spacing
  // - Smaller text
  // - Touch feedback (scale animation)
  // - Larger tap targets (44x44px)
/>

// ✨ NEW: Accessibility built-in
<ListItem 
  aria-label="Settings button"
  data-testid="settings-item"
  loading={itemLoading}
/>

// Rich list items
<List variant="card" divided>
  <ListItem 
    leading={<Icon />}
    title="Title"
    description="Description"
    onClick={handleClick}
    showArrow
  />
</List>

// Checklist
<CheckList 
  items={items}
  onChange={(id, checked) => console.log(id, checked)}
/>

// Select list
<SelectList 
  items={options}
  value={selectedId}
  onChange={setSelectedId}
/>

// Actions
<ActionList items={actions} />

// Descriptions
<DescriptionList items={keyValuePairs} horizontal />

// Timeline
<TimelineList items={events} />

// ✨ NEW: PropertyList (iOS Settings style)
<PropertyList 
  items={[
    { key: '1', label: 'Make', value: 'Honda' },
    { key: '2', label: 'Model', value: 'Civic', href: '/edit' }
  ]}
/>

// ✨ NEW: GroupedList (sections with headers)
<GroupedList 
  sections={[
    { id: 'general', title: 'General', items: [...] },
    { id: 'security', title: 'Security', items: [...] }
  ]}
/>

// ✨ NEW: StepList (numbered steps)
<StepList 
  items={[
    { id: '1', title: 'Step 1', completed: true },
    { id: '2', title: 'Step 2', current: true },
    { id: '3', title: 'Step 3' }
  ]}
/>

// ✨ NEW: ContactList (with avatars)
<ContactList 
  items={[
    {
      id: '1',
      name: 'John Doe',
      subtitle: 'john@example.com',
      initials: 'JD',
      status: 'online'
    }
  ]}
/>

// ✨ NEW: MenuList (navigation with badges)
<MenuList 
  items={[
    {
      id: 'inbox',
      label: 'Inbox',
      icon: <Mail />,
      badge: 5,
      active: true
    }
  ]}
/>`}
              </pre>
            </Stack>
          </Card>
        </Stack>
      </Section>
    </Container>
  )
}
