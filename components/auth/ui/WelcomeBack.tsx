/**
 * WelcomeBack Component
 * 
 * Shows personalized welcome message with last login method
 * Improves UX with method recognition
 */

'use client'

import { motion } from 'framer-motion'
import { getMethodDisplayName, type LoginMethod } from '@/lib/auth/services/login-preferences'
import { Text } from '@/components/design-system'
import { CheckCircle } from 'lucide-react'

interface WelcomeBackProps {
  email?: string
  lastMethod?: LoginMethod | null
  className?: string
}

export function WelcomeBack({ email, lastMethod, className }: WelcomeBackProps) {
  if (!email || !lastMethod) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 border border-border">
        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Text className="text-sm text-foreground">
            Welcome back!{' '}
            <span className="font-medium">
              You last signed in with {getMethodDisplayName(lastMethod)}
            </span>
          </Text>
        </div>
      </div>
    </motion.div>
  )
}
