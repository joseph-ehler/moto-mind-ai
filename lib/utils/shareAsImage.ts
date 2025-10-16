/**
 * Share as Image Utility
 * 
 * Generates beautiful shareable images from event data
 */

import { toPng } from 'html-to-image'
import type { EventData } from '@/types/event'

/**
 * Generate and download image from event data
 */
export const generateShareableImage = async (
  elementId: string,
  event: EventData
): Promise<void> => {
  const element = document.getElementById(elementId)
  
  if (!element) {
    throw new Error('Element not found')
  }

  try {
    // Generate PNG image
    const dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2, // Retina quality
    })

    // Create download link
    const link = document.createElement('a')
    const dateStr = event.date.split('T')[0]
    const vendorSlug = (event.display_vendor || event.vendor || 'fuel-fillup')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
    
    link.download = `${dateStr}-${vendorSlug}-receipt.png`
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Error generating image:', error)
    throw error
  }
}

/**
 * Share image directly (if Web Share API supports it)
 */
export const shareImage = async (
  elementId: string, 
  event: EventData
): Promise<void> => {
  const element = document.getElementById(elementId)
  
  if (!element) {
    throw new Error('Element not found')
  }

  try {
    const dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2,
    })

    // Convert data URL to blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const file = new File([blob], 'fuel-receipt.png', { type: 'image/png' })

    // Try Web Share API first (mainly for mobile)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Fuel Fill-Up at ${event.display_vendor || event.vendor}`,
          text: `$${event.total_amount?.toFixed(2)} • ${event.gallons?.toFixed(1)} gallons`
        })
        return // Success!
      } catch (shareError: any) {
        // If share was actually canceled by user, throw it
        if (shareError.name === 'AbortError' && shareError.message?.includes('cancel')) {
          throw shareError
        }
        // Otherwise fall through to download
        console.log('Web Share failed, falling back to download')
      }
    }
    
    // Fallback: download the image directly
    const link = document.createElement('a')
    const dateStr = event.date.split('T')[0]
    const vendorSlug = (event.display_vendor || event.vendor || 'fuel-fillup')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
    
    link.download = `${dateStr}-${vendorSlug}-receipt.png`
    link.href = dataUrl
    link.click()
    
  } catch (error) {
    console.error('Error sharing image:', error)
    throw error
  }
}
