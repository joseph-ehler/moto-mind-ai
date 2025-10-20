/**
 * InsightReveal Component
 * 
 * Shows AI insights between steps
 * Animated reveal with fade-in effect
 */

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Text, Heading } from '@/components/design-system'
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

export interface Insight {
  type: 'success' | 'warning' | 'info'
  title: string
  message: string
}

interface InsightRevealProps {
  insights: Insight[]
  onContinue: () => void
  title?: string
}

export function InsightReveal({ 
  insights, 
  onContinue,
  title = "Smart Insight"
}: InsightRevealProps) {
  // Skip if no insights to show (use effect to avoid setState during render)
  useEffect(() => {
    if (insights.length === 0) {
      onContinue()
    }
  }, [insights.length, onContinue])

  if (insights.length === 0) {
    return null
  }

  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getBgColor = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-orange-50 border-orange-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 md:py-12 animate-fade-in">
      {/* Sparkles Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center animate-pulse">
          <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
        </div>
      </div>

      {/* Title */}
      <Heading level="title" className="text-center mb-3">
        {title}
      </Heading>

      {/* Insights */}
      <div className="space-y-4 mb-8">
        {insights.map((insight, index) => (
          <Card 
            key={index} 
            className={`${getBgColor(insight.type)} border-2 animate-slide-up`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {getIcon(insight.type)}
                <div className="flex-1">
                  <Text className="font-semibold mb-1">
                    {insight.title}
                  </Text>
                  <Text className="text-sm text-gray-700">
                    {insight.message}
                  </Text>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Continue Button */}
      <Button
        size="lg"
        className="w-full h-12 md:h-14 text-base md:text-lg"
        onClick={onContinue}
      >
        Next: Tell Us More
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

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

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out both;
        }
      `}</style>
    </div>
  )
}
