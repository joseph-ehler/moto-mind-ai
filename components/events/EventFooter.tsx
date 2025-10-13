'use client'

import { Sparkles, TrendingUp, Calendar, Zap, Lock, Database } from 'lucide-react'
import { Card, Stack, Text } from '@/components/design-system'

interface EventFooterProps {
  eventType: string
}

export function EventFooter({ eventType }: EventFooterProps) {
  return (
    <div className="pt-12 pb-16">
      <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 hover:border-blue-200 overflow-hidden relative group transition-all duration-300 hover:shadow-lg">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 -z-0" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-100 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 -z-0" />
        
        <div className="relative z-10 p-6 sm:p-8">
          <Stack spacing="lg" className="items-center text-center">
            {/* Header */}
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <Text className="text-xl font-bold text-gray-900">
                Your Data Unlocks
              </Text>
            </div>

            {/* Value props - Icon grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
              <div className="flex flex-col items-center gap-2 p-5 bg-white/70 hover:bg-white hover:shadow-md rounded-xl border border-white/50 hover:border-blue-200 transition-all duration-200 group/card">
                <div className="p-2 bg-blue-50 rounded-lg group-hover/card:bg-blue-100 transition-colors duration-200">
                  <TrendingUp className="w-6 h-6 text-blue-600 group-hover/card:scale-110 transition-transform duration-200" />
                </div>
                <Text className="text-sm font-semibold text-gray-900">Track Your Progress</Text>
                <Text className="text-xs text-gray-600 leading-relaxed">MPG trends & fuel efficiency patterns over time</Text>
              </div>
              <div className="flex flex-col items-center gap-2 p-5 bg-white/70 hover:bg-white hover:shadow-md rounded-xl border border-white/50 hover:border-purple-200 transition-all duration-200 group/card">
                <div className="p-2 bg-purple-50 rounded-lg group-hover/card:bg-purple-100 transition-colors duration-200">
                  <Zap className="w-6 h-6 text-purple-600 group-hover/card:scale-110 transition-transform duration-200" />
                </div>
                <Text className="text-sm font-semibold text-gray-900">AI-Powered Insights</Text>
                <Text className="text-xs text-gray-600 leading-relaxed">Predictive analysis & cost optimization</Text>
              </div>
              <div className="flex flex-col items-center gap-2 p-5 bg-white/70 hover:bg-white hover:shadow-md rounded-xl border border-white/50 hover:border-indigo-200 transition-all duration-200 group/card">
                <div className="p-2 bg-indigo-50 rounded-lg group-hover/card:bg-indigo-100 transition-colors duration-200">
                  <Calendar className="w-6 h-6 text-indigo-600 group-hover/card:scale-110 transition-transform duration-200" />
                </div>
                <Text className="text-sm font-semibold text-gray-900">Smart Reminders</Text>
                <Text className="text-xs text-gray-600 leading-relaxed">Never miss maintenance or fill-ups</Text>
              </div>
            </div>

            {/* Trust & transparency footer */}
            <div className="pt-4 border-t border-blue-200 w-full">
              <Stack spacing="sm" className="items-center">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <Text className="text-xs text-gray-600 font-medium">
                    Enhanced by AI • Always verify important details
                  </Text>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <Text className="text-xs text-gray-500">
                    Your data is private, secure, and powers smarter insights
                  </Text>
                </div>
              </Stack>
            </div>
          </Stack>
        </div>
      </Card>
    </div>
  )
}
