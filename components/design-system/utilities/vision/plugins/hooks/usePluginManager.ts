/**
 * usePluginManager Hook
 * 
 * React hook for managing Vision plugins
 * Handles plugin lifecycle within React component lifecycle
 * 
 * @module vision/plugins/hooks/usePluginManager
 */

import { useRef, useEffect } from 'react'
import { VisionPluginManager } from '../plugin-manager'
import type {
  VisionPlugin,
  VisionPluginContext,
  RetryDecision
} from '../types'
import type { CaptureResult } from '../../types'

// ============================================================================
// HOOK OPTIONS
// ============================================================================

export interface UseVisionPluginManagerOptions<TData = any> {
  /** Plugins to register */
  plugins: VisionPlugin<any, TData>[]
  
  /** Plugin context */
  context: VisionPluginContext<TData>
  
  /** Enable plugin system */
  enabled?: boolean
}

// ============================================================================
// HOOK RETURN VALUE
// ============================================================================

export interface UseVisionPluginManagerReturn<TData = any> {
  /** Plugin manager instance */
  manager: VisionPluginManager<TData> | null
  
  /** Execute before-capture hook */
  executeBeforeCapture: (context: VisionPluginContext<TData>) => Promise<boolean>
  
  /** Execute after-capture hook */
  executeAfterCapture: (
    result: CaptureResult<TData>,
    context: VisionPluginContext<TData>
  ) => Promise<CaptureResult<TData>>
  
  /** Execute transform-result hook */
  executeTransformResult: (result: CaptureResult<TData>) => Promise<CaptureResult<TData>>
  
  /** Execute validate-result hook */
  executeValidateResult: (result: CaptureResult<TData>) => Promise<boolean>
  
  /** Execute enrich-result hook */
  executeEnrichResult: (result: CaptureResult<TData>) => Promise<CaptureResult<TData>>
  
  /** Execute on-error hook */
  executeOnError: (
    error: Error,
    context: VisionPluginContext<TData>
  ) => Promise<RetryDecision | null>
  
  /** Execute on-retry hook */
  executeOnRetry: (
    retryCount: number,
    context: VisionPluginContext<TData>
  ) => Promise<void>
  
  /** Execute on-success hook */
  executeOnSuccess: (
    result: CaptureResult<TData>,
    context: VisionPluginContext<TData>
  ) => Promise<void>
  
  /** Execute on-cancel hook */
  executeOnCancel: (context: VisionPluginContext<TData>) => Promise<void>
  
  /** Execute render-overlay hook */
  executeRenderOverlay: (context: VisionPluginContext<TData>) => React.ReactNode[]
  
  /** Execute render-toolbar hook */
  executeRenderToolbar: (
    result: CaptureResult<TData> | null,
    context: VisionPluginContext<TData>
  ) => React.ReactNode[]
  
  /** Execute render-result hook */
  executeRenderResult: (result: CaptureResult<TData>) => React.ReactNode[]
  
  /** Execute render-confidence hook */
  executeRenderConfidence: (result: CaptureResult<TData>) => React.ReactNode[]
  
  /** Emit custom event */
  emit: (event: string, data: any) => void
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * usePluginManager Hook
 * 
 * Manages Vision plugins within React component lifecycle
 * 
 * @example
 * ```tsx
 * const pluginManager = useVisionPluginManager({
 *   plugins: [vinValidation(), vinDecoding()],
 *   context: pluginContext,
 *   enabled: true
 * })
 * 
 * // Before capture
 * const canProceed = await pluginManager.executeBeforeCapture(context)
 * 
 * // After capture
 * const result = await pluginManager.executeAfterCapture(rawResult, context)
 * ```
 */
export function useVisionPluginManager<TData = any>(
  options: UseVisionPluginManagerOptions<TData>
): UseVisionPluginManagerReturn<TData> {
  const { plugins, context, enabled = true } = options
  
  const managerRef = useRef<VisionPluginManager<TData> | null>(null)
  const registeredPluginsRef = useRef<Set<string>>(new Set())
  
  // ============================================================================
  // PLUGIN REGISTRATION
  // ============================================================================
  
  // Initialize plugin manager and register plugins
  useEffect(() => {
    if (!enabled || plugins.length === 0) {
      return
    }
    
    // Create manager
    const manager = new VisionPluginManager<TData>(context)
    managerRef.current = manager
    
    // Register plugins
    const registerPlugins = async () => {
      for (const plugin of plugins) {
        try {
          await manager.register(plugin)
          registeredPluginsRef.current.add(plugin.id)
          console.log(`✅ [Vision] Plugin registered: ${plugin.id}`)
        } catch (error) {
          console.error(`❌ [Vision] Failed to register plugin ${plugin.id}:`, error)
        }
      }
    }
    
    registerPlugins()
    
    // Cleanup on unmount
    return () => {
      const cleanup = async () => {
        const pluginIds = Array.from(registeredPluginsRef.current)
        for (const pluginId of pluginIds) {
          try {
            await manager.unregister(pluginId)
            console.log(`🧹 [Vision] Plugin unregistered: ${pluginId}`)
          } catch (error) {
            console.error(`❌ [Vision] Failed to unregister plugin ${pluginId}:`, error)
          }
        }
        registeredPluginsRef.current.clear()
        managerRef.current = null
      }
      
      cleanup()
    }
  }, [plugins, context, enabled])
  
  // ============================================================================
  // HOOK EXECUTION METHODS
  // ============================================================================
  
  /**
   * Execute before-capture hook
   */
  const executeBeforeCapture = async (
    context: VisionPluginContext<TData>
  ): Promise<boolean> => {
    if (!managerRef.current) return true
    
    try {
      return await managerRef.current.executeBeforeCapture(context)
    } catch (error) {
      console.error('[Vision] Error in before-capture hook:', error)
      return false
    }
  }
  
  /**
   * Execute after-capture hook
   */
  const executeAfterCapture = async (
    result: CaptureResult<TData>,
    context: VisionPluginContext<TData>
  ): Promise<CaptureResult<TData>> => {
    if (!managerRef.current) return result
    
    try {
      return await managerRef.current.executeAfterCapture(result, context)
    } catch (error) {
      console.error('[Vision] Error in after-capture hook:', error)
      throw error // Propagate to trigger retry
    }
  }
  
  /**
   * Execute transform-result hook
   */
  const executeTransformResult = async (
    result: CaptureResult<TData>
  ): Promise<CaptureResult<TData>> => {
    if (!managerRef.current) return result
    
    try {
      return await managerRef.current.executeTransformResult(result)
    } catch (error) {
      console.error('[Vision] Error in transform-result hook:', error)
      return result
    }
  }
  
  /**
   * Execute validate-result hook
   */
  const executeValidateResult = async (
    result: CaptureResult<TData>
  ): Promise<boolean> => {
    if (!managerRef.current) return true
    
    try {
      return await managerRef.current.executeValidateResult(result)
    } catch (error) {
      console.error('[Vision] Error in validate-result hook:', error)
      throw error // Propagate validation failure
    }
  }
  
  /**
   * Execute enrich-result hook
   */
  const executeEnrichResult = async (
    result: CaptureResult<TData>
  ): Promise<CaptureResult<TData>> => {
    if (!managerRef.current) return result
    
    try {
      return await managerRef.current.executeEnrichResult(result)
    } catch (error) {
      console.error('[Vision] Error in enrich-result hook:', error)
      return result
    }
  }
  
  /**
   * Execute on-error hook
   */
  const executeOnError = async (
    error: Error,
    context: VisionPluginContext<TData>
  ): Promise<RetryDecision | null> => {
    if (!managerRef.current) return null
    
    try {
      return await managerRef.current.executeOnError(error, context)
    } catch (err) {
      console.error('[Vision] Error in on-error hook:', err)
      return null
    }
  }
  
  /**
   * Execute on-retry hook
   */
  const executeOnRetry = async (
    retryCount: number,
    context: VisionPluginContext<TData>
  ): Promise<void> => {
    if (!managerRef.current) return
    
    try {
      await managerRef.current.executeOnRetry(retryCount, context)
    } catch (error) {
      console.error('[Vision] Error in on-retry hook:', error)
    }
  }
  
  /**
   * Execute on-success hook
   */
  const executeOnSuccess = async (
    result: CaptureResult<TData>,
    context: VisionPluginContext<TData>
  ): Promise<void> => {
    if (!managerRef.current) return
    
    try {
      await managerRef.current.executeOnSuccess(result, context)
    } catch (error) {
      console.error('[Vision] Error in on-success hook:', error)
    }
  }
  
  /**
   * Execute on-cancel hook
   */
  const executeOnCancel = async (
    context: VisionPluginContext<TData>
  ): Promise<void> => {
    if (!managerRef.current) return
    
    try {
      await managerRef.current.executeOnCancel(context)
    } catch (error) {
      console.error('[Vision] Error in on-cancel hook:', error)
    }
  }
  
  // ============================================================================
  // RENDER HOOKS
  // ============================================================================
  
  /**
   * Execute render-overlay hook
   */
  const executeRenderOverlay = (
    context: VisionPluginContext<TData>
  ): React.ReactNode[] => {
    if (!managerRef.current) return []
    
    try {
      return managerRef.current.executeRenderOverlay(context)
    } catch (error) {
      console.error('[Vision] Error in render-overlay hook:', error)
      return []
    }
  }
  
  /**
   * Execute render-toolbar hook
   */
  const executeRenderToolbar = (
    result: CaptureResult<TData> | null,
    context: VisionPluginContext<TData>
  ): React.ReactNode[] => {
    if (!managerRef.current) return []
    
    try {
      return managerRef.current.executeRenderToolbar(result, context)
    } catch (error) {
      console.error('[Vision] Error in render-toolbar hook:', error)
      return []
    }
  }
  
  /**
   * Execute render-result hook
   */
  const executeRenderResult = (
    result: CaptureResult<TData>
  ): React.ReactNode[] => {
    if (!managerRef.current) return []
    
    try {
      return managerRef.current.executeRenderResult(result)
    } catch (error) {
      console.error('[Vision] Error in render-result hook:', error)
      return []
    }
  }
  
  /**
   * Execute render-confidence hook
   */
  const executeRenderConfidence = (
    result: CaptureResult<TData>
  ): React.ReactNode[] => {
    if (!managerRef.current) return []
    
    try {
      return managerRef.current.executeRenderConfidence(result)
    } catch (error) {
      console.error('[Vision] Error in render-confidence hook:', error)
      return []
    }
  }
  
  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================
  
  /**
   * Emit custom event
   */
  const emit = (event: string, data: any): void => {
    if (!managerRef.current) return
    
    try {
      managerRef.current.emit(event, data)
    } catch (error) {
      console.error(`[Vision] Error emitting event ${event}:`, error)
    }
  }
  
  // ============================================================================
  // RETURN VALUE
  // ============================================================================
  
  return {
    manager: managerRef.current,
    executeBeforeCapture,
    executeAfterCapture,
    executeTransformResult,
    executeValidateResult,
    executeEnrichResult,
    executeOnError,
    executeOnRetry,
    executeOnSuccess,
    executeOnCancel,
    executeRenderOverlay,
    executeRenderToolbar,
    executeRenderResult,
    executeRenderConfidence,
    emit
  }
}
