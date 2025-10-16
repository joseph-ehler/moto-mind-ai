'use client'

/**
 * Assistant Page - AI Help & Support
 * 
 * Helpful resources and AI assistant for vehicle maintenance
 */

import React from 'react'
import { Container, Section, Stack, Card, Heading, Text, Flex } from '@/components/design-system'
import { 
  MessageSquare, 
  HelpCircle, 
  Book, 
  FileText,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { AppNavigation } from '@/components/app/AppNavigation'

export default function AssistantPage() {
  const commonQuestions = [
    "When should I change my oil?",
    "How often should I rotate tires?",
    "What does a check engine light mean?",
    "How do I check tire pressure?"
  ]

  const helpResources = [
    {
      icon: <Book className="w-5 h-5" />,
      title: "Maintenance guide",
      description: "Learn about regular vehicle maintenance"
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Document management",
      description: "How to organize your vehicle documents"
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      title: "FAQ",
      description: "Common questions and answers"
    }
  ]

  return (
    <>
      <AppNavigation />
      
      <Container size="md" useCase="articles">
        <Section spacing="lg">
          <Stack spacing="xl">
            {/* Header */}
            <Stack spacing="sm">
              <Heading level="hero">Assistant</Heading>
              <Text className="text-gray-600">
                Get help with your vehicle maintenance questions
              </Text>
            </Stack>

            {/* AI Chat Card */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <Section spacing="md">
                <Stack spacing="md">
                  <Flex align="center" gap="sm">
                    <Flex align="center" justify="center" className="w-10 h-10 rounded-full bg-blue-600">
                      <Sparkles className="w-5 h-5 text-white" />
                    </Flex>
                    <Heading level="subtitle" className="text-blue-900">AI Assistant</Heading>
                  </Flex>
                  
                  <Text className="text-blue-800">
                    Ask me anything about vehicle maintenance, and I'll help you keep your car in top shape.
                  </Text>

                  <button className="w-full p-4 bg-white rounded-lg text-left hover:shadow-md transition-shadow border border-blue-200">
                    <Flex align="center" gap="sm">
                      <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <Text className="text-gray-500">Ask a question...</Text>
                    </Flex>
                  </button>
                </Stack>
              </Section>
            </Card>

            {/* Common Questions */}
            <Stack spacing="sm">
              <Heading level="subtitle">Common questions</Heading>
              
              <Stack spacing="sm">
                {commonQuestions.map((question, index) => (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <Section spacing="sm">
                      <Flex align="center" justify="between">
                        <Text className="font-medium">{question}</Text>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </Flex>
                    </Section>
                  </Card>
                ))}
              </Stack>
            </Stack>

            {/* Help Resources */}
            <Stack spacing="sm">
              <Heading level="subtitle">Help & resources</Heading>
              
              <Stack spacing="sm">
                {helpResources.map((resource, index) => (
                  <Card 
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <Section spacing="sm">
                      <Flex align="start" gap="md">
                        <Flex align="center" justify="center" className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0">
                          <div className="text-gray-700">
                            {resource.icon}
                          </div>
                        </Flex>
                        <Stack spacing="xs" className="flex-1">
                          <Text className="font-medium">{resource.title}</Text>
                          <Text className="text-sm text-gray-600">{resource.description}</Text>
                        </Stack>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </Flex>
                    </Section>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Stack>
        </Section>
      </Container>

      <div className="h-20 md:h-0" />
    </>
  )
}
