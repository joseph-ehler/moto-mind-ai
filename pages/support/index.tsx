import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, FileText, Car, MapPin, AlertTriangle, HelpCircle } from 'lucide-react'

const popularTopics = [
  {
    icon: FileText,
    title: 'Vehicle registration',
    description: 'How to renew registration and handle expired documents',
    href: '/support/registration'
  },
  {
    icon: Car,
    title: 'Maintenance tracking',
    description: 'Log maintenance, set intervals, and track service history',
    href: '/support/maintenance'
  },
  {
    icon: AlertTriangle,
    title: 'Safety recalls',
    description: 'Understanding recalls and finding authorized dealers',
    href: '/support/recalls'
  },
  {
    icon: MapPin,
    title: 'Garage management',
    description: 'Adding locations and moving vehicles between garages',
    href: '/support/vehicless'
  }
]

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <>
      <Head>
        <title>Help Center - MotoMind</title>
        <meta name="description" content="Get help with vehicle management, maintenance, and more" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Navigation */}
          <div className="mb-6">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to Home</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">
              How can we help?
            </h1>
            
            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder='Try "registration", "oil change", or "recall"'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-3 text-center"
              />
            </div>
          </div>

          {/* Popular Topics */}
          <div className="mb-12">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Popular topics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularTopics.map((topic) => {
                const Icon = topic.icon
                return (
                  <Link key={topic.title} href={topic.href}>
                    <Card className="h-full transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 p-2 rounded-full bg-gray-100">
                            <Icon className="h-4 w-4 text-gray-700" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 mb-1">
                              {topic.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {topic.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Browse Help Center */}
          <div className="text-center mb-8">
            <Button 
              variant="outline" 
              size="lg"
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              Browse the Help Center
            </Button>
          </div>

          {/* Contact Support */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HelpCircle className="h-5 w-5" />
                Can't find what you're looking for?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                We're here to help with your vehicle management, maintenance questions, and more. 
                Contact our support team.
              </p>
              <Button>
                Get support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
