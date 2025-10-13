/**
 * useBatchCapture Hook
 * 
 * Core state management for batch/multi-page document capture
 * Handles sequential camera captures and batch file uploads
 */

import { useState, useCallback } from 'react'

export interface CapturedPage {
  id: string
  base64: string
  thumbnail?: string
  pageNumber: number
  source: 'camera' | 'upload'
  timestamp: number
  fileName?: string
  preprocessed?: {
    originalSize: number
    processedSize: number
    compression: number
  }
}

export interface BatchCaptureOptions {
  maxPages?: number
  onPageAdded?: (page: CapturedPage) => void
  onPageRemoved?: (pageId: string) => void
  onPagesReordered?: (pages: CapturedPage[]) => void
}

export interface UseBatchCaptureReturn {
  pages: CapturedPage[]
  pageCount: number
  canAddMore: boolean
  addPage: (page: Omit<CapturedPage, 'id' | 'pageNumber'>) => void
  addPages: (pages: Omit<CapturedPage, 'id' | 'pageNumber'>[]) => void
  removePage: (pageId: string) => void
  reorderPages: (fromIndex: number, toIndex: number) => void
  clearAll: () => void
  updatePage: (pageId: string, updates: Partial<CapturedPage>) => void
}

/**
 * Hook for managing batch document capture state
 */
export function useBatchCapture(
  options: BatchCaptureOptions = {}
): UseBatchCaptureReturn {
  const { maxPages = 20, onPageAdded, onPageRemoved, onPagesReordered } = options
  
  const [pages, setPages] = useState<CapturedPage[]>([])
  
  /**
   * Generate unique ID for page
   */
  const generatePageId = useCallback(() => {
    return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])
  
  /**
   * Add a single page
   */
  const addPage = useCallback((pageData: Omit<CapturedPage, 'id' | 'pageNumber'>) => {
    setPages(prev => {
      if (prev.length >= maxPages) {
        console.warn(`Cannot add page: maximum of ${maxPages} pages reached`)
        return prev
      }
      
      const newPage: CapturedPage = {
        ...pageData,
        id: generatePageId(),
        pageNumber: prev.length + 1
      }
      
      onPageAdded?.(newPage)
      
      return [...prev, newPage]
    })
  }, [maxPages, generatePageId, onPageAdded])
  
  /**
   * Add multiple pages (batch upload)
   */
  const addPages = useCallback((pagesData: Omit<CapturedPage, 'id' | 'pageNumber'>[]) => {
    setPages(prev => {
      const availableSlots = maxPages - prev.length
      const pagesToAdd = pagesData.slice(0, availableSlots)
      
      if (pagesToAdd.length < pagesData.length) {
        console.warn(`Only ${availableSlots} slots available, adding ${pagesToAdd.length} of ${pagesData.length} pages`)
      }
      
      const newPages = pagesToAdd.map((pageData, index) => {
        const newPage: CapturedPage = {
          ...pageData,
          id: generatePageId(),
          pageNumber: prev.length + index + 1
        }
        onPageAdded?.(newPage)
        return newPage
      })
      
      return [...prev, ...newPages]
    })
  }, [maxPages, generatePageId, onPageAdded])
  
  /**
   * Remove a page by ID
   */
  const removePage = useCallback((pageId: string) => {
    setPages(prev => {
      const filtered = prev.filter(p => p.id !== pageId)
      
      // Renumber remaining pages
      const renumbered = filtered.map((page, index) => ({
        ...page,
        pageNumber: index + 1
      }))
      
      onPageRemoved?.(pageId)
      
      return renumbered
    })
  }, [onPageRemoved])
  
  /**
   * Reorder pages (drag & drop)
   */
  const reorderPages = useCallback((fromIndex: number, toIndex: number) => {
    setPages(prev => {
      const newPages = [...prev]
      const [movedPage] = newPages.splice(fromIndex, 1)
      newPages.splice(toIndex, 0, movedPage)
      
      // Renumber all pages
      const renumbered = newPages.map((page, index) => ({
        ...page,
        pageNumber: index + 1
      }))
      
      onPagesReordered?.(renumbered)
      
      return renumbered
    })
  }, [onPagesReordered])
  
  /**
   * Clear all pages
   */
  const clearAll = useCallback(() => {
    setPages([])
  }, [])
  
  /**
   * Update specific page
   */
  const updatePage = useCallback((pageId: string, updates: Partial<CapturedPage>) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, ...updates } : page
    ))
  }, [])
  
  return {
    pages,
    pageCount: pages.length,
    canAddMore: pages.length < maxPages,
    addPage,
    addPages,
    removePage,
    reorderPages,
    clearAll,
    updatePage
  }
}
