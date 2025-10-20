/**
 * Welcome & Chapter Intro Screens
 * 
 * Beautiful intro screens that use footer navigation (no custom buttons).
 * Can be driven by JSON configuration.
 * 
 * Usage:
 * ```tsx
 * <WelcomeScreen
 *   title="Welcome to MotoMind"
 *   subtitle="Your vehicle's digital home"
 *   description="Let's set up your first vehicle..."
 *   steps={['Enter VIN', 'Confirm details', 'Done!']}
 *   illustration={<CarIcon />}
 * />
 * ```
 */

'use client'

import * as React from 'react'
import { CheckCircle2, Sparkles, Shield, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WelcomeScreenProps {
  // Content
  title: string
  subtitle?: string
  description: string
  
  // Steps preview (optional)
  steps?: string[]
  
  // Benefits (optional)
  benefits?: Array<{
    icon?: React.ReactNode
    label: string
  }>
  
  // Visual
  illustration?: React.ReactNode
  
  // Styling
  className?: string
}

export function WelcomeScreen({
  title,
  subtitle,
  description,
  steps,
  benefits,
  illustration,
  className,
}: WelcomeScreenProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[500px] px-6 py-12', className)}>
      {/* Illustration with gradient backdrop */}
      {illustration && (
        <div className="relative mb-8">
          {/* Gradient backdrop */}
          <div className="absolute inset-0 -m-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-full blur-3xl opacity-60" />
          
          {/* Icon */}
          <div className="relative">
            {illustration}
          </div>
        </div>
      )}
      
      {/* Title + Subtitle */}
      <div className="space-y-3 mb-6 text-center max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xl sm:text-2xl text-gray-600 font-medium">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Description */}
      <p className="text-lg text-gray-600 text-center max-w-xl mb-10 leading-relaxed">
        {description}
      </p>
      
      {/* Benefits (if provided) */}
      {benefits && benefits.length > 0 && (
        <div className="w-full max-w-lg mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm"
              >
                {benefit.icon && (
                  <div className="text-blue-600">
                    {benefit.icon}
                  </div>
                )}
                <p className="text-sm font-medium text-gray-700 text-center">
                  {benefit.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Steps Preview */}
      {steps && steps.length > 0 && (
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <p className="text-sm font-semibold text-gray-900">
                What to expect:
              </p>
            </div>
            <ul className="space-y-3">
              {steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {index + 1}
                  </div>
                  <span className="text-base text-gray-700 leading-relaxed pt-0.5">
                    {step}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Footer hint */}
      <p className="text-sm text-gray-400 mt-8">
        Click Continue below to get started
      </p>
    </div>
  )
}

/**
 * Chapter Intro Screen
 * 
 * Beautiful chapter intro that uses footer navigation.
 * 
 * Usage:
 * ```tsx
 * <ChapterIntro
 *   chapterNumber={1}
 *   title="Vehicle Basics"
 *   description="Let's start with your VIN..."
 *   icon={<Car />}
 *   highlights={['Accurate specs', 'Recall info', 'Service history']}
 * />
 * ```
 */

export interface ChapterIntroProps {
  // Chapter info
  chapterNumber?: number
  title: string
  description: string
  
  // Highlights (what they'll learn/get)
  highlights?: string[]
  
  // Visual
  icon?: React.ReactNode
  
  // Styling
  className?: string
}

export function ChapterIntro({
  chapterNumber,
  title,
  description,
  highlights,
  icon,
  className,
}: ChapterIntroProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[500px] px-6 py-12', className)}>
      {/* Icon with gradient backdrop */}
      {icon && (
        <div className="relative mb-8">
          {/* Gradient backdrop */}
          <div className="absolute inset-0 -m-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-full blur-3xl opacity-60" />
          
          {/* Icon */}
          <div className="relative text-blue-600">
            {icon}
          </div>
        </div>
      )}
      
      {/* Chapter Number */}
      {chapterNumber && (
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold shadow-md">
            <span>Chapter {chapterNumber}</span>
          </div>
        </div>
      )}
      
      {/* Title */}
      <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center max-w-2xl">
        {title}
      </h2>
      
      {/* Description */}
      <p className="text-lg text-gray-600 text-center max-w-xl mb-10 leading-relaxed">
        {description}
      </p>
      
      {/* Highlights */}
      {highlights && highlights.length > 0 && (
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-gray-900 mb-4">
              What you'll get:
            </p>
            <ul className="space-y-2.5">
              {highlights.map((highlight, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-base text-gray-700">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Footer hint */}
      <p className="text-sm text-gray-400 mt-8">
        Click Continue below when ready
      </p>
    </div>
  )
}
