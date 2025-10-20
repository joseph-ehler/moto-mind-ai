/**
 * Nickname Step
 * 
 * Step 5: Optional vehicle nickname
 * Fun, personalizing step - builds emotional connection
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Text, Heading } from '@/components/design-system'
import { Heart } from 'lucide-react'

interface NicknameStepProps {
  defaultName: string // Year Make Model
  onContinue: (nickname: string) => void
  onSkip: () => void
}

export function NicknameStep({ defaultName, onContinue, onSkip }: NicknameStepProps) {
  const [nickname, setNickname] = useState('')

  const suggestions = [
    'The Daily Driver',
    'Old Faithful',
    'My Ride',
    'Silver Bullet',
    'Road Warrior',
    'The Beast'
  ]

  const handleContinue = () => {
    onContinue(nickname.trim() || defaultName)
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 md:py-12">
      {/* Progress */}
      <Text className="text-sm text-gray-600 text-center mb-6">
        Step 3 of 5
      </Text>

      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-pink-100 flex items-center justify-center">
          <Heart className="w-8 h-8 md:w-10 md:h-10 text-pink-600" />
        </div>
      </div>

      {/* Title */}
      <Heading level="title" className="text-center mb-3">
        Give Your Vehicle a Nickname?
      </Heading>
      
      <Text className="text-center text-gray-600 mb-2">
        Make it personal! We'll use this name throughout the app.
      </Text>
      
      <Text className="text-center text-sm text-gray-500 mb-8">
        (Optional - you can always skip this)
      </Text>

      {/* Nickname Input */}
      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="nickname" className="text-base">
            Vehicle Nickname
          </Label>
          <Input
            id="nickname"
            type="text"
            placeholder={defaultName}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={30}
            className="mt-2 text-lg h-12 md:h-14"
          />
          
          <div className="flex justify-between items-center mt-2">
            <Text className="text-xs text-gray-500">
              {nickname.length}/30 characters
            </Text>
            {!nickname && (
              <Text className="text-xs text-gray-500">
                Leave empty to use "{defaultName}"
              </Text>
            )}
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <Text className="text-sm text-gray-600 mb-2">
            Popular nicknames:
          </Text>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => setNickname(suggestion)}
                className="text-xs md:text-sm justify-start"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Fun fact */}
      <div className="bg-pink-50 rounded-lg p-4 mb-6">
        <Text className="text-sm text-pink-900">
          💡 <strong>Fun fact:</strong> Studies show that people who name their vehicles take better care of them!
        </Text>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full h-12 md:h-14 text-base md:text-lg"
          onClick={handleContinue}
        >
          {nickname ? `Continue with "${nickname}"` : 'Continue'}
        </Button>

        <Button
          variant="ghost"
          size="lg"
          className="w-full h-12 text-gray-600"
          onClick={onSkip}
        >
          Skip This Step
        </Button>
      </div>
    </div>
  )
}
