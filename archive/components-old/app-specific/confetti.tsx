import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiProps {
  active: boolean
  duration?: number
  particleCount?: number
}

export function Confetti({ active, duration = 4000, particleCount = 100 }: ConfettiProps) {
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (active && !hasTriggered) {
      setHasTriggered(true)
      
      // Trigger multiple confetti bursts for a more spectacular effect
      const triggerConfettiBurst = () => {
        confetti({
          particleCount: particleCount / 3,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9']
        })
      }

      // Initial burst
      triggerConfettiBurst()

      // Additional bursts for sustained effect
      const burst1 = setTimeout(() => {
        confetti({
          particleCount: particleCount / 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
        })
      }, 200)

      const burst2 = setTimeout(() => {
        confetti({
          particleCount: particleCount / 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9']
        })
      }, 400)

      // Final center burst
      const finalBurst = setTimeout(() => {
        confetti({
          particleCount: particleCount / 3,
          spread: 360,
          startVelocity: 30,
          decay: 0.9,
          scalar: 1.2,
          origin: { y: 0.5 },
          colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a']
        })
      }, 800)

      // Cleanup timeouts if component unmounts
      return () => {
        clearTimeout(burst1)
        clearTimeout(burst2)
        clearTimeout(finalBurst)
      }
    }
  }, [active, hasTriggered, duration, particleCount])

  // Reset hasTriggered when active becomes false
  useEffect(() => {
    if (!active) {
      setHasTriggered(false)
    }
  }, [active])

  // This component doesn't render anything visible - confetti is rendered by canvas-confetti
  return null
}
