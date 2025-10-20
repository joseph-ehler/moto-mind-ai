/**
 * Final Reveal Step
 * 
 * Step 7: The BIG reveal - all intelligence synthesized
 * Shows off complete analysis with staggered animations
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Text, Heading } from '@/components/design-system'
import { Sparkles, Shield, DollarSign, Zap, AlertTriangle, ArrowRight, FileText } from 'lucide-react'

interface IntelligenceSection {
  icon: typeof Shield
  title: string
  content: string
  visible: boolean
}

interface FinalRevealStepProps {
  vehicleName: string
  safetyInsight: string
  maintenanceInsight: string
  performanceInsight: string
  watchOut?: string
  ownerCount?: number
  onAddToGarage: () => void
  onViewReport: () => void
}

export function FinalRevealStep({
  vehicleName,
  safetyInsight,
  maintenanceInsight,
  performanceInsight,
  watchOut,
  ownerCount = 0,
  onAddToGarage,
  onViewReport
}: FinalRevealStepProps) {
  const [sections, setSections] = useState<IntelligenceSection[]>([
    { icon: Shield, title: 'Safety & Reliability', content: safetyInsight, visible: false },
    { icon: DollarSign, title: 'Maintenance Outlook', content: maintenanceInsight, visible: false },
    { icon: Zap, title: 'Performance Notes', content: performanceInsight, visible: false },
  ])

  const [showWatchOut, setShowWatchOut] = useState(false)
  const [showFooter, setShowFooter] = useState(false)

  // Staggered reveal animation
  useEffect(() => {
    const delays = [300, 600, 900] // Stagger by 300ms
    
    delays.forEach((delay, index) => {
      setTimeout(() => {
        setSections(prev => prev.map((section, i) => 
          i === index ? { ...section, visible: true } : section
        ))
      }, delay)
    })

    // Show watch out section
    if (watchOut) {
      setTimeout(() => setShowWatchOut(true), 1200)
    }

    // Show footer
    setTimeout(() => setShowFooter(true), watchOut ? 1500 : 1200)
  }, [watchOut])

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 md:py-12">
      {/* Success Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
            </div>
          </div>
        </div>

        <Heading level="title" className="mb-2">
          All Set! Here's What We Know
        </Heading>
        
        <Text className="text-gray-600">
          About Your {vehicleName}
        </Text>
      </div>

      {/* Intelligence Sections */}
      <div className="space-y-4 mb-6">
        {sections.map((section, index) => (
          <div
            key={index}
            className={`
              transition-all duration-500
              ${section.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <Card className="border-2 border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  
                  <div className="flex-1">
                    <Text className="font-semibold text-gray-900 mb-2">
                      {section.title}
                    </Text>
                    <Text className="text-sm text-gray-700 leading-relaxed">
                      {section.content}
                    </Text>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Watch Out Section */}
        {watchOut && showWatchOut && (
          <div
            className="transition-all duration-500 opacity-100 translate-y-0"
          >
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  
                  <div className="flex-1">
                    <Text className="font-semibold text-orange-900 mb-2">
                      Watch For
                    </Text>
                    <Text className="text-sm text-orange-800 leading-relaxed">
                      {watchOut}
                    </Text>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="animate-fade-in">
          {/* Analysis Count */}
          {ownerCount > 0 && (
            <div className="text-center mb-6">
              <Text className="text-sm text-gray-600">
                📊 Analyzed {ownerCount.toLocaleString()} owner experiences
              </Text>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full h-12 md:h-14 text-base md:text-lg"
              onClick={onAddToGarage}
            >
              Add to My Garage
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 text-base"
              onClick={onViewReport}
            >
              <FileText className="w-5 h-5 mr-2" />
              View Full Report
            </Button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
