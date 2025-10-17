/**
 * DocumentsView Component
 * 
 * Basic documents management view with categories and recent items
 */

import React from 'react'
import { Stack, Flex, Card, Heading, Text, Button, Grid } from '@/components/design-system'
import { FileText, Shield, FileCheck, Book, Upload } from 'lucide-react'

export function DocumentsView() {
  const categories = [
    { 
      id: 'receipts', 
      name: 'Service Receipts', 
      count: 12, 
      icon: FileText,
      colorClass: 'bg-green-50 text-green-600 border-green-200 hover:border-green-300'
    },
    { 
      id: 'insurance', 
      name: 'Insurance', 
      count: 4, 
      icon: Shield,
      colorClass: 'bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300'
    },
    { 
      id: 'registration', 
      name: 'Registration', 
      count: 3, 
      icon: FileCheck,
      colorClass: 'bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-300'
    },
    { 
      id: 'manuals', 
      name: 'Manuals', 
      count: 4, 
      icon: Book,
      colorClass: 'bg-orange-50 text-orange-600 border-orange-200 hover:border-orange-300'
    }
  ]

  const recentDocuments = [
    { id: '1', name: 'Oil Change Receipt', category: 'Service Receipts', date: 'Sep 15, 2024', size: '245 KB' },
    { id: '2', name: 'Insurance Card - 2024', category: 'Insurance', date: 'Jan 1, 2024', size: '180 KB' },
    { id: '3', name: 'Registration Renewal', category: 'Registration', date: 'Mar 15, 2024', size: '320 KB' },
  ]

  const totalCount = categories.reduce((sum, cat) => sum + cat.count, 0)

  return (
    <Stack spacing="xl">
      {/* Header */}
      <Flex align="start" justify="between" className="flex-col sm:flex-row gap-4">
        <Stack spacing="xs">
          <Heading level="title" className="text-2xl font-bold text-gray-900">
            Documents & Records
          </Heading>
          <Text className="text-gray-600">{totalCount} documents stored</Text>
        </Stack>
        <Button className="bg-black text-white hover:bg-gray-800 rounded-lg whitespace-nowrap">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </Flex>

      {/* Category Grid */}
      <Grid columns="auto" gap="md" className="grid-cols-2 md:grid-cols-4">
        {categories.map(category => {
          const Icon = category.icon
          return (
            <button
              key={category.id}
              className={`p-6 rounded-xl border-2 hover:shadow-md transition-all text-center ${category.colorClass}`}
            >
              <Icon className="w-8 h-8 mx-auto mb-3" />
              <Text className="font-semibold text-gray-900">{category.name}</Text>
              <Text className="text-sm mt-1">{category.count} documents</Text>
            </button>
          )
        })}
      </Grid>

      {/* Recent Documents */}
      <Stack spacing="md">
        <Heading level="title" className="text-lg font-semibold text-gray-900">
          Recent Documents
        </Heading>
        <Card className="p-0 divide-y divide-gray-200">
          {recentDocuments.map(doc => (
            <DocumentRow key={doc.id} {...doc} />
          ))}
        </Card>
      </Stack>
    </Stack>
  )
}

function DocumentRow({ 
  name, 
  category, 
  date, 
  size 
}: { 
  name: string
  category: string
  date: string
  size: string
}) {
  return (
    <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
      <Flex align="center" gap="sm">
        <Flex align="center" justify="center" className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0">
          <FileText className="w-5 h-5 text-gray-600" />
        </Flex>
        <Stack spacing="xs">
          <Text className="font-medium text-gray-900">{name}</Text>
          <Text className="text-sm text-gray-600">{category} • {size}</Text>
        </Stack>
      </Flex>
      <Text className="text-sm text-gray-500 hidden sm:block">{date}</Text>
    </button>
  )
}
