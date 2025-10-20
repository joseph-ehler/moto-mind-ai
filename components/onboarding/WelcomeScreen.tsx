/**
 * Welcome Screen
 * 
 * First screen users see in onboarding.
 * Sets context, builds excitement, clear expectations.
 * 
 * Features:
 * - Hero illustration/icon
 * - Clear value proposition
 * - Step preview (what to expect)
 * - Primary CTA
 * - Skip option (if applicable)
 * 
 * Usage:
 * ```tsx
 * <WelcomeScreen
 *   title="Welcome to MotoMind"
 *   subtitle="Your vehicle's digital home"
 *   description="Let's set up your first vehicle. It takes about 2 minutes."
 *   steps={['Add your VIN', 'Confirm details', 'You're done!']}
 *   onContinue={() => navigate('next')}
 *   illustration={<CarIcon />}
 * />
 * ```
 */

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WelcomeScreenProps {
  // Content
  title: string
  subtitle?: string
  description: string
  
  // Steps preview (optional)
  steps?: string[]
  
  // Visual
  illustration?: React.ReactNode
  
  // Actions
  onContinue: () => void
  onSkip?: () => void
  
  // Labels
  continueLabel?: string
  skipLabel?: string
  
  // State
  isProcessing?: boolean
  
  // Styling
  className?: string
}

export function WelcomeScreen({
  title,
  subtitle,
  description,
  steps,
  illustration,
  onContinue,
  onSkip,
  continueLabel = 'Get Started',
  skipLabel = 'Skip for now',
  isProcessing = false,
  className,
}: WelcomeScreenProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[400px] px-4 py-8 text-center', className)}>
      {/* Illustration */}
      {illustration && (
        <div className="mb-6">
          {illustration}
        </div>
      )}
      
      {/* Title + Subtitle */}
      <div className="space-y-2 mb-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg sm:text-xl text-gray-600 font-medium">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Description */}
      <p className="text-base text-gray-600 max-w-md mb-8">
        {description}
      </p>
      
      {/* Steps Preview */}
      {steps && steps.length > 0 && (
        <div className="w-full max-w-sm mb-8">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700 text-left">
              What to expect:
            </p>
            <ul className="space-y-2">
              {steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2 text-left">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <Button
          onClick={onContinue}
          disabled={isProcessing}
          size="lg"
          className="flex-1 touch-manipulation active:scale-95 transition-transform"
        >
          {continueLabel}
        </Button>
        
        {onSkip && (
          <Button
            onClick={onSkip}
            disabled={isProcessing}
            variant="ghost"
            size="lg"
            className="touch-manipulation active:scale-95 transition-transform"
          >
            {skipLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Chapter Intro Screen
 * 
 * Introduces a new chapter before diving into steps.
 * More focused than welcome screen.
 * 
 * Usage:
 * ```tsx
 * <ChapterIntro
 *   chapterNumber={1}
 *   title="Vehicle Basics"
 *   description="Let's start with your vehicle's VIN to pull accurate specs"
 *   icon={<Car />}
 *   onContinue={() => navigate('next')}
 * />
 * ```
 */

export interface ChapterIntroProps {
  // Chapter info
  chapterNumber?: number
  title: string
  description: string
  
  // Visual
  icon?: React.ReactNode
  
  // Actions
  onContinue: () => void
  continueLabel?: string
  
  // State
  isProcessing?: boolean
  
  // Styling
  className?: string
}

export function ChapterIntro({
  chapterNumber,
  title,
  description,
  icon,
  onContinue,
  continueLabel = 'Continue',
  isProcessing = false,
  className,
}: ChapterIntroProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[400px] px-4 py-8 text-center', className)}>
      {/* Icon */}
      {icon && (
        <div className="mb-6 text-blue-600">
          {icon}
        </div>
      )}
      
      {/* Chapter Number */}
      {chapterNumber && (
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
          Chapter {chapterNumber}
        </p>
      )}
      
      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
        {title}
      </h2>
      
      {/* Description */}
      <p className="text-base text-gray-600 max-w-md mb-8">
        {description}
      </p>
      
      {/* Action */}
      <Button
        onClick={onContinue}
        disabled={isProcessing}
        size="lg"
        className="min-w-[200px] touch-manipulation active:scale-95 transition-transform"
      >
        {continueLabel}
      </Button>
    </div>
  )
}
