'use client'

/**
 * Profile Page - Clean & Minimal
 * 
 * User account settings and preferences
 */

import React from 'react'
import { useRouter } from 'next/navigation'
import { Container, Section, Stack, Card, Heading, Text, Button, Flex } from '@/components/design-system'
import { 
  User,
  ChevronRight,
  Settings,
  Bell,
  HelpCircle,
  Phone,
  LogOut,
  Car,
  FileText,
  Shield,
  CreditCard
} from 'lucide-react'
import { AppNavigation } from '@/components/app/AppNavigation'

export default function ProfilePage() {
  const router = useRouter()
  
  // Mock user data
  const user = {
    name: "Joseph Ehler",
    email: "joseph@example.com",
    phone: "+1 (555) 123-4567",
    joinDate: "January 2024"
  }

  const accountItems = [
    {
      icon: <User className="w-5 h-5" />,
      label: "Personal information",
      description: "Name, email, and phone number",
      onClick: () => router.push('/profile/settings')
    },
    {
      icon: <Car className="w-5 h-5" />,
      label: "My vehicles",
      description: "Manage your vehicles",
      onClick: () => router.push('/garage')
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: "Notifications",
      description: "Manage notification preferences",
      onClick: () => console.log('Notifications')
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      label: "Subscription",
      description: "Manage your subscription plan",
      onClick: () => console.log('Subscription')
    }
  ]

  const supportItems = [
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: "Help center",
      description: "Get help and support",
      onClick: () => router.push('/assistant')
    },
    {
      icon: <Phone className="w-5 h-5" />,
      label: "Contact support",
      description: "Get in touch with our team",
      onClick: () => console.log('Contact')
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: "Terms & Privacy",
      description: "Review our policies",
      onClick: () => console.log('Terms')
    }
  ]

  const handleLogout = () => {
    // Handle logout logic
    console.log('Logout')
    router.push('/')
  }

  return (
    <>
      <AppNavigation />
      
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="xl">
            {/* Header */}
            <Heading level="hero">Account</Heading>

            {/* User Info Card */}
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-0">
              <Section spacing="md">
                <Flex align="center" gap="md">
                  {/* Avatar */}
                  <Flex align="center" justify="center" className="w-16 h-16 rounded-full bg-blue-600 text-white font-semibold text-2xl flex-shrink-0">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </Flex>
                  
                  {/* User Info */}
                  <Stack spacing="xs" className="flex-1">
                    <Heading level="subtitle">{user.name}</Heading>
                    <Text className="text-sm text-gray-600">{user.email}</Text>
                    <Text className="text-xs text-gray-500">Member since {user.joinDate}</Text>
                  </Stack>
                </Flex>
              </Section>
            </Card>

            {/* Account Settings */}
            <Stack spacing="sm">
              <Heading level="subtitle">Account settings</Heading>
              
              <Stack spacing="sm">
                {accountItems.map((item, index) => (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={item.onClick}
                  >
                    <Section spacing="sm">
                      <Flex align="center" justify="between">
                        <Flex align="center" gap="md">
                          <Flex align="center" justify="center" className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0">
                            <div className="text-gray-700">
                              {item.icon}
                            </div>
                          </Flex>
                          <Stack spacing="xs" className="flex-1">
                            <Text className="font-medium">{item.label}</Text>
                            <Text className="text-sm text-gray-600">{item.description}</Text>
                          </Stack>
                        </Flex>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </Flex>
                    </Section>
                  </Card>
                ))}
              </Stack>
            </Stack>

            {/* Support & Legal */}
            <Stack spacing="sm">
              <Heading level="subtitle">Support & legal</Heading>
              
              <Stack spacing="sm">
                {supportItems.map((item, index) => (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={item.onClick}
                  >
                    <Section spacing="sm">
                      <Flex align="center" justify="between">
                        <Flex align="center" gap="md">
                          <Flex align="center" justify="center" className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0">
                            <div className="text-gray-700">
                              {item.icon}
                            </div>
                          </Flex>
                          <Stack spacing="xs" className="flex-1">
                            <Text className="font-medium">{item.label}</Text>
                            <Text className="text-sm text-gray-600">{item.description}</Text>
                          </Stack>
                        </Flex>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </Flex>
                    </Section>
                  </Card>
                ))}
              </Stack>
            </Stack>

            {/* Logout Button */}
            <Card className="border-red-200 bg-red-50">
              <button
                onClick={handleLogout}
                className="w-full"
              >
                <Section spacing="sm">
                  <Flex align="center" justify="center" gap="sm">
                    <LogOut className="w-5 h-5 text-red-600" />
                    <Text className="font-medium text-red-600">Log out</Text>
                  </Flex>
                </Section>
              </button>
            </Card>

            {/* App Version */}
            <Text className="text-xs text-gray-400 text-center">
              MotoMind v1.0.0
            </Text>
          </Stack>
        </Section>
      </Container>

      {/* Add bottom padding for mobile nav */}
      <div className="h-20 md:h-0" />
    </>
  )
}
