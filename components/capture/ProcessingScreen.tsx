/**
 * ProcessingScreen Component
 * Shows transparent processing with live updates and progress
 */

'use client'

import { useEffect, useState } from 'react'
import { Camera, Loader2, CheckCircle, Circle } from 'lucide-react'

interface LiveData {
  gallons?: number
  cost?: number
  station?: string
}

interface ProcessingScreenProps {
  liveData?: LiveData
}

interface ProcessStepProps {
  completed?: boolean
  active?: boolean
  pending?: boolean
  progress?: number
  children: React.ReactNode
}

function ProcessStep({ completed, active, pending, progress, children }: ProcessStepProps) {
  return (
    <div className="flex items-center gap-3">
      {completed && (
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 animate-scale-in" />
      )}
      {active && (
        <div className="relative w-5 h-5 flex-shrink-0">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        </div>
      )}
      {pending && <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />}

      <span
        className={`text-sm ${
          completed
            ? 'text-gray-900 font-medium'
            : active
            ? 'text-blue-600 font-medium'
            : 'text-gray-500'
        }`}
      >
        {children}
      </span>
    </div>
  )
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

export function ProcessingScreen({ liveData }: ProcessingScreenProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simulate realistic progress
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 15, 95))
    }, 400)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="max-w-md mx-auto text-center">
        {/* Animated icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse" />
          <div className="absolute inset-4 bg-blue-50 rounded-full animate-pulse delay-75" />
          <Camera className="absolute inset-0 m-auto w-16 h-16 text-blue-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Reading Your Receipt
        </h2>

        <p className="text-gray-600 mb-8">AI is extracting details...</p>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
        </div>

        {/* Processing Steps */}
        <div className="space-y-3 text-left mb-8">
          <ProcessStep completed={true}>📸 Photo uploaded</ProcessStep>
          <ProcessStep active={progress < 90} completed={progress >= 90} progress={progress}>
            🤖 AI analyzing receipt...
          </ProcessStep>
          <ProcessStep pending={progress < 60} completed={progress >= 60}>
            📍 Checking location...
          </ProcessStep>
          <ProcessStep pending={progress < 90} completed={progress >= 90}>
            ✓ Preparing review
          </ProcessStep>
        </div>

        {/* Live Updates */}
        {liveData && (Object.keys(liveData).length > 0) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-green-900 mb-2">💡 Found so far:</p>
            <div className="space-y-1 text-sm text-green-800">
              {liveData.gallons && <FadeIn>✓ {liveData.gallons} gallons</FadeIn>}
              {liveData.cost && <FadeIn delay={200}>✓ ${liveData.cost} total</FadeIn>}
              {liveData.station && (
                <FadeIn delay={400}>✓ At {liveData.station}</FadeIn>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }

        .delay-75 {
          animation-delay: 75ms;
        }
      `}</style>
    </div>
  )
}
