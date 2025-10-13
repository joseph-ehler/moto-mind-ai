/**
 * Hook to use Web Worker for image compression
 * 
 * Provides non-blocking image compression using a Web Worker.
 * Falls back to main thread compression if workers are not supported.
 */

import { useCallback, useRef } from 'react'
import type { CompressionMessage, CompressionResult } from '../workers/compression.worker'

export function useCompressionWorker() {
  const workerRef = useRef<Worker | null>(null)

  // Initialize worker on first use
  const getWorker = useCallback(() => {
    if (!workerRef.current && typeof Worker !== 'undefined') {
      try {
        // Create worker from the compression.worker.ts file
        workerRef.current = new Worker(
          new URL('../workers/compression.worker.ts', import.meta.url),
          { type: 'module' }
        )
      } catch (error) {
        console.warn('Failed to create compression worker:', error)
      }
    }
    return workerRef.current
  }, [])

  // Compress image using Web Worker
  const compressImage = useCallback(
    async (
      file: File,
      quality: number,
      maxDimensions?: { width: number; height: number }
    ): Promise<File> => {
      // Skip compression for non-images
      if (!file.type.startsWith('image/')) {
        return file
      }

      const worker = getWorker()

      // Fall back to main thread if worker not available
      if (!worker) {
        return compressImageMainThread(file, quality, maxDimensions)
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Compression timeout'))
        }, 30000) // 30 second timeout

        const handleMessage = (e: MessageEvent) => {
          clearTimeout(timeout)
          worker.removeEventListener('message', handleMessage)

          if (e.data.error) {
            // Fall back to main thread on error
            console.warn('Worker compression failed, using main thread:', e.data.error)
            compressImageMainThread(file, quality, maxDimensions)
              .then(resolve)
              .catch(reject)
            return
          }

          const result: CompressionResult = e.data
          const compressedFile = new File([result.blob], result.fileName, {
            type: file.type,
            lastModified: Date.now()
          })

          resolve(compressedFile)
        }

        worker.addEventListener('message', handleMessage)

        const message: CompressionMessage = {
          file,
          quality,
          maxDimensions
        }

        worker.postMessage(message)
      })
    },
    [getWorker]
  )

  // Cleanup worker on unmount
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
  }, [])

  return { compressImage, cleanup }
}

/**
 * Fallback: Compress image on main thread
 * Used when Web Workers are not available
 */
async function compressImageMainThread(
  file: File,
  quality: number,
  maxDimensions?: { width: number; height: number }
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      let { width, height } = img

      // Apply maxDimensions if specified
      if (maxDimensions) {
        const aspectRatio = width / height
        if (width > maxDimensions.width) {
          width = maxDimensions.width
          height = width / aspectRatio
        }
        if (height > maxDimensions.height) {
          height = maxDimensions.height
          width = height * aspectRatio
        }
      }

      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}
