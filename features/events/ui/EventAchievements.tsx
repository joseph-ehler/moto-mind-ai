/**
 * Event Achievements Component
 * 
 * Displays gamification elements: XP, streaks, achievements
 */

'use client'

import { Trophy, Flame, Star, Zap, Award, Target } from 'lucide-react'
import { Card, Stack, Flex, Text, Heading } from '@/components/design-system'

interface EventAchievementsProps {
  // User stats
  totalEvents: number
  consecutiveDays?: number
  currentXP?: number
  level?: number
  
  // Event-specific
  isNewAchievement?: boolean
  achievementTitle?: string
}

export function EventAchievements({
  totalEvents,
  consecutiveDays = 0,
  currentXP = 0,
  level = 1,
  isNewAchievement = false,
  achievementTitle
}: EventAchievementsProps) {
  
  // Calculate XP for next level (simple formula)
  const xpForNextLevel = level * 100
  const xpProgress = (currentXP / xpForNextLevel) * 100
  
  // Calculate XP earned for this event
  const xpEarned = 10 + (consecutiveDays > 0 ? 5 : 0) // Base XP + streak bonus
  
  // Determine level badge
  const getLevelBadge = () => {
    if (level >= 10) return { emoji: '💎', name: 'Diamond', color: 'from-cyan-500 to-blue-600' }
    if (level >= 7) return { emoji: '🥇', name: 'Platinum', color: 'from-gray-400 to-gray-600' }
    if (level >= 5) return { emoji: '🥈', name: 'Gold', color: 'from-yellow-500 to-yellow-600' }
    if (level >= 3) return { emoji: '🥉', name: 'Silver', color: 'from-gray-300 to-gray-400' }
    return { emoji: '🌟', name: 'Bronze', color: 'from-amber-600 to-amber-700' }
  }
  
  const badge = getLevelBadge()
  
  // Check for achievements
  const achievements = [
    { id: 'first', unlocked: totalEvents >= 1, title: 'First Fill-Up', icon: Star, desc: 'Log your first fuel event' },
    { id: 'streak3', unlocked: consecutiveDays >= 3, title: '3-Day Streak', icon: Flame, desc: 'Log fuel 3 days in a row' },
    { id: 'streak7', unlocked: consecutiveDays >= 7, title: 'Week Warrior', icon: Flame, desc: '7-day logging streak' },
    { id: 'events10', unlocked: totalEvents >= 10, title: 'Fuel Pro', icon: Trophy, desc: 'Log 10 fill-ups' },
    { id: 'events50', unlocked: totalEvents >= 50, title: 'Fuel Master', icon: Award, desc: 'Log 50 fill-ups' },
    { id: 'level5', unlocked: level >= 5, title: 'Level 5', icon: Target, desc: 'Reach level 5' },
  ]
  
  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const latestAchievement = unlockedAchievements[unlockedAchievements.length - 1]

  return (
    <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border border-amber-100 hover:border-amber-200 hover:shadow-lg transition-all duration-300 overflow-hidden relative group">
      {/* Subtle decorative gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-100/20 via-transparent to-orange-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <Stack spacing="md" className="p-6 relative">
        {/* Header with Level Badge */}
        <Flex align="center" justify="between">
          <Flex align="center" gap="sm">
            <div className="p-1.5 bg-amber-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <Heading level="subtitle" className="text-lg font-bold text-gray-900">
              Your Progress
            </Heading>
          </Flex>
          
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${badge.color} text-white text-sm font-bold shadow-sm hover:shadow-md transition-shadow duration-200`}>
            {badge.emoji} Level {level}
          </div>
        </Flex>

        {/* XP Progress Bar */}
        <Stack spacing="xs">
          <Flex justify="between" align="center">
            <Text className="text-sm font-medium text-gray-700">
              {currentXP} / {xpForNextLevel} XP
            </Text>
            <Flex align="center" gap="xs">
              <Zap className="w-3 h-3 text-amber-500" />
              <Text className="text-xs font-bold text-amber-600">
                +{xpEarned} XP
              </Text>
            </Flex>
          </Flex>
          
          {/* Progress bar */}
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 relative overflow-hidden"
              style={{ width: `${Math.min(xpProgress, 100)}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ animationDuration: '2s' }} />
            </div>
          </div>
          
          <Text className="text-xs text-gray-500">
            {xpForNextLevel - currentXP} XP until Level {level + 1}
          </Text>
        </Stack>

        {/* Streak Counter */}
        {consecutiveDays > 0 && (
          <Flex align="center" gap="sm" className="p-3 bg-white hover:bg-amber-50/50 rounded-lg border border-amber-100 hover:border-amber-200 hover:shadow-sm transition-all duration-200">
            <Flame className={`w-5 h-5 ${consecutiveDays >= 7 ? 'text-red-500' : 'text-orange-500'}`} />
            <Stack spacing="xs" className="flex-1">
              <Text className="font-semibold text-gray-900 text-sm">
                {consecutiveDays}-Day Streak! 🔥
              </Text>
              <Text className="text-xs text-gray-600">
                You're on fire! Keep logging to maintain your streak.
              </Text>
            </Stack>
          </Flex>
        )}

        {/* Latest Achievement */}
        {isNewAchievement && latestAchievement && (
          <div className="p-3 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg border-2 border-yellow-400 shadow-lg animate-bounce">
            <Flex align="center" gap="sm">
              <div className="p-2 bg-yellow-400 rounded-full">
                <latestAchievement.icon className="w-4 h-4 text-yellow-900" />
              </div>
              <Stack spacing="xs" className="flex-1">
                <Text className="font-bold text-yellow-900 text-sm">
                  🎉 Achievement Unlocked!
                </Text>
                <Text className="text-xs text-yellow-800">
                  {latestAchievement.title} — {latestAchievement.desc}
                </Text>
              </Stack>
            </Flex>
          </div>
        )}

        {/* Achievement Count */}
        <div className="pt-3 mt-1 border-t border-amber-100">
          <Text className="text-xs text-amber-600 font-medium text-center">
            🏆 {unlockedAchievements.length} of {achievements.length} achievements unlocked
          </Text>
        </div>
      </Stack>
    </Card>
  )
}
