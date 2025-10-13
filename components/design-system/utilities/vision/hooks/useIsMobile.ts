/**
 * useIsMobile Hook
 * 
 * Detects if device is mobile based on screen width and user agent
 */

import { useState, useEffect } from 'react'

/**
 * Hook to detect mobile devices
 * Checks both screen width and user agent
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = 
        window.innerWidth <= 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      setIsMobile(mobile)
    }
    
    // Initial check
    checkMobile()
    
    // Listen for resize
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return isMobile
}
