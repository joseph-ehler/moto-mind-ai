/**
 * Vision Plugin Manager
 * 
 * Manages Vision plugin lifecycle, hooks, and events
 * Orchestrates plugin execution during capture process
 * 
 * @module vision/plugins/plugin-manager
 */

import type {
  VisionPlugin,
  VisionPluginContext,
  VisionPluginHooks,
  VisionPluginRegistration,
  RetryDecision
} from './types'
import type { CaptureResult } from '../types'

// ============================================================================
// PLUGIN MANAGER
// ============================================================================

/**
 * Vision Plugin Manager
 * 
 * Manages the lifecycle and execution of Vision plugins
 * 
 * @example
 * ```tsx
 * const context = createVisionPluginContext(...)
 * const manager = new VisionPluginManager(context)
 * 
 * await manager.register(vinValidation())
 * await manager.register(vinDecoding())
 * 
 * const result = await manager.executeTransformHook('after-capture', captureResult)
 * ```
 */
export class VisionPluginManager<TData = any> {
  private plugins: Map<string, VisionPlugin<any, TData>> = new Map()
  private eventHandlers: Map<string, Set<Function>> = new Map()
  private initialized = false
  
  constructor(private context: VisionPluginContext<TData>) {}
  
  // ============================================================================
  // LIFECYCLE MANAGEMENT
  // ============================================================================
  
  /**
   * Initialize all plugins
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    
    this.initialized = true
  }
  
  /**
   * Register a plugin
   * 
   * @param plugin - Plugin to register
   * @returns Registration handle with unregister function
   * 
   * @throws Error if plugin.id is missing
   */
  async register(plugin: VisionPlugin<any, TData>): Promise<VisionPluginRegistration> {
    // Validate plugin
    if (!plugin.id) {
      throw new Error('Plugin must have an id')
    }
    
    if (this.plugins.has(plugin.id)) {
      console.warn(`[VisionPluginManager] Plugin ${plugin.id} is already registered`)
      return {
        id: plugin.id,
        unregister: () => this.unregister(plugin.id)
      }
    }
    
    // Register hooks
    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([event, handler]) => {
        if (handler) {
          this.on(event, handler)
        }
      })
    }
    
    // Store plugin
    this.plugins.set(plugin.id, plugin)
    
    // Initialize plugin
    try {
      await plugin.init?.(this.context)
    } catch (error) {
      console.error(`[VisionPluginManager] Failed to initialize plugin ${plugin.id}:`, error)
      this.plugins.delete(plugin.id)
      throw error
    }
    
    // Emit registration event
    this.emit('plugin-registered', { pluginId: plugin.id })
    
    return {
      id: plugin.id,
      unregister: () => this.unregister(plugin.id)
    }
  }
  
  /**
   * Unregister a plugin
   * 
   * @param pluginId - ID of plugin to unregister
   */
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return
    
    // Cleanup plugin
    try {
      await plugin.destroy?.()
    } catch (error) {
      console.error(`[VisionPluginManager] Failed to destroy plugin ${pluginId}:`, error)
    }
    
    // Remove hooks
    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([event, handler]) => {
        if (handler) {
          this.off(event, handler)
        }
      })
    }
    
    // Remove plugin
    this.plugins.delete(pluginId)
    
    // Emit unregistration event
    this.emit('plugin-unregistered', { pluginId })
  }
  
  /**
   * Unregister all plugins
   */
  async unregisterAll(): Promise<void> {
    const pluginIds = Array.from(this.plugins.keys())
    await Promise.all(pluginIds.map(id => this.unregister(id)))
  }
  
  // ============================================================================
  // HOOK EXECUTION
  // ============================================================================
  
  /**
   * Execute before-capture hook
   * 
   * All plugins must return true (or void) to proceed
   * Any plugin returning false or throwing error will block capture
   * 
   * @param context - Plugin context
   * @returns true if capture should proceed
   */
  async executeBeforeCapture(context: VisionPluginContext<TData>): Promise<boolean> {
    const handlers = this.eventHandlers.get('before-capture')
    if (!handlers || handlers.size === 0) {
      return true
    }
    
    for (const handler of handlers) {
      try {
        const result = await handler(context)
        if (result === false) {
          console.log('[VisionPluginManager] before-capture hook blocked capture')
          return false
        }
      } catch (error) {
        console.error('[VisionPluginManager] Error in before-capture hook:', error)
        return false
      }
    }
    
    return true
  }
  
  /**
   * Execute after-capture hook (transform)
   * 
   * Executes transform pipeline sequentially
   * Each plugin can transform the result
   * 
   * @param result - Capture result
   * @param context - Plugin context
   * @returns Transformed result
   * 
   * @throws Error from any plugin (triggers retry flow)
   */
  async executeAfterCapture(
    result: CaptureResult<TData>,
    context: VisionPluginContext<TData>
  ): Promise<CaptureResult<TData>> {
    const handlers = this.eventHandlers.get('after-capture')
    if (!handlers || handlers.size === 0) {
      return result
    }
    
    let transformedResult = result
    
    for (const handler of handlers) {
      try {
        const newResult = await handler(transformedResult, context)
        if (newResult) {
          transformedResult = newResult
        }
      } catch (error) {
        console.error('[VisionPluginManager] Error in after-capture hook:', error)
        throw error // Propagate to trigger retry
      }
    }
    
    return transformedResult
  }
  
  /**
   * Execute transform-result hook
   * 
   * Transform raw data format
   * 
   * @param result - Capture result
   * @returns Transformed result
   */
  async executeTransformResult(
    result: CaptureResult<TData>
  ): Promise<CaptureResult<TData>> {
    const handlers = this.eventHandlers.get('transform-result')
    if (!handlers || handlers.size === 0) {
      return result
    }
    
    let transformedResult = result
    
    for (const handler of handlers) {
      try {
        const newResult = await handler(transformedResult)
        if (newResult) {
          transformedResult = newResult
        }
      } catch (error) {
        console.error('[VisionPluginManager] Error in transform-result hook:', error)
        // Continue with current result on error
      }
    }
    
    return transformedResult
  }
  
  /**
   * Execute validate-result hook
   * 
   * All plugins must return true for validation to pass
   * 
   * @param result - Capture result to validate
   * @returns true if all validations pass
   * 
   * @throws Error from validation failure
   */
  async executeValidateResult(result: CaptureResult<TData>): Promise<boolean> {
    const handlers = this.eventHandlers.get('validate-result')
    if (!handlers || handlers.size === 0) {
      return true
    }
    
    for (const handler of handlers) {
      try {
        const isValid = await handler(result)
        if (isValid === false) {
          throw new Error('Validation failed')
        }
      } catch (error) {
        console.error('[VisionPluginManager] Validation failed:', error)
        throw error
      }
    }
    
    return true
  }
  
  /**
   * Execute enrich-result hook
   * 
   * Add additional data to result
   * 
   * @param result - Capture result to enrich
   * @returns Enriched result
   */
  async executeEnrichResult(
    result: CaptureResult<TData>
  ): Promise<CaptureResult<TData>> {
    const handlers = this.eventHandlers.get('enrich-result')
    if (!handlers || handlers.size === 0) {
      return result
    }
    
    let enrichedResult = result
    
    for (const handler of handlers) {
      try {
        const newResult = await handler(enrichedResult)
        if (newResult) {
          enrichedResult = newResult
        }
      } catch (error) {
        console.error('[VisionPluginManager] Error in enrich-result hook:', error)
        // Continue with current result on error
      }
    }
    
    return enrichedResult
  }
  
  /**
   * Execute on-error hook
   * 
   * First plugin to return a retry decision wins
   * 
   * @param error - Error that occurred
   * @param context - Plugin context
   * @returns Retry decision or null (use default)
   */
  async executeOnError(
    error: Error,
    context: VisionPluginContext<TData>
  ): Promise<RetryDecision | null> {
    const handlers = this.eventHandlers.get('on-error')
    if (!handlers || handlers.size === 0) {
      return null
    }
    
    for (const handler of handlers) {
      try {
        const decision = await handler(error, context)
        if (decision) {
          return decision
        }
      } catch (err) {
        console.error('[VisionPluginManager] Error in on-error hook:', err)
      }
    }
    
    return null
  }
  
  /**
   * Execute on-retry hook (notify)
   * 
   * Notifies all plugins of retry attempt
   * 
   * @param retryCount - Current retry number
   * @param context - Plugin context
   */
  async executeOnRetry(
    retryCount: number,
    context: VisionPluginContext<TData>
  ): Promise<void> {
    await this.executeNotifyHook('on-retry', retryCount, context)
  }
  
  /**
   * Execute on-success hook (notify)
   * 
   * Notifies all plugins of success
   * 
   * @param result - Successful capture result
   * @param context - Plugin context
   */
  async executeOnSuccess(
    result: CaptureResult<TData>,
    context: VisionPluginContext<TData>
  ): Promise<void> {
    await this.executeNotifyHook('on-success', result, context)
  }
  
  /**
   * Execute on-cancel hook (notify)
   * 
   * Notifies all plugins of cancellation
   * 
   * @param context - Plugin context
   */
  async executeOnCancel(context: VisionPluginContext<TData>): Promise<void> {
    await this.executeNotifyHook('on-cancel', context)
  }
  
  /**
   * Execute a notification hook (fire and forget)
   * 
   * Executes all handlers in parallel
   * Errors are logged but don't block
   * 
   * @param hookName - Hook name
   * @param args - Arguments to pass to handlers
   */
  private async executeNotifyHook(hookName: string, ...args: any[]): Promise<void> {
    const handlers = this.eventHandlers.get(hookName)
    if (!handlers || handlers.size === 0) {
      return
    }
    
    // Execute all handlers in parallel
    await Promise.all(
      Array.from(handlers).map(async (handler) => {
        try {
          await handler(...args)
        } catch (error) {
          console.error(`[VisionPluginManager] Error in ${hookName} hook:`, error)
        }
      })
    )
  }
  
  // ============================================================================
  // RENDER HOOKS
  // ============================================================================
  
  /**
   * Execute render-overlay hook
   * 
   * Collects React nodes from all plugins
   * 
   * @param context - Plugin context
   * @returns Array of React nodes
   */
  executeRenderOverlay(context: VisionPluginContext<TData>): React.ReactNode[] {
    return this.executeRenderHook('render-overlay', context)
  }
  
  /**
   * Execute render-toolbar hook
   * 
   * @param result - Capture result (if available)
   * @param context - Plugin context
   * @returns Array of React nodes
   */
  executeRenderToolbar(
    result: CaptureResult<TData> | null,
    context: VisionPluginContext<TData>
  ): React.ReactNode[] {
    return this.executeRenderHook('render-toolbar', result, context)
  }
  
  /**
   * Execute render-result hook
   * 
   * @param result - Capture result
   * @returns Array of React nodes
   */
  executeRenderResult(result: CaptureResult<TData>): React.ReactNode[] {
    return this.executeRenderHook('render-result', result)
  }
  
  /**
   * Execute render-confidence hook
   * 
   * @param result - Capture result with confidence
   * @returns Array of React nodes
   */
  executeRenderConfidence(result: CaptureResult<TData>): React.ReactNode[] {
    return this.executeRenderHook('render-confidence', result)
  }
  
  /**
   * Execute a render hook (collect React nodes)
   * 
   * @param hookName - Hook name
   * @param args - Arguments to pass to handlers
   * @returns Array of React nodes
   */
  private executeRenderHook(hookName: string, ...args: any[]): React.ReactNode[] {
    const handlers = this.eventHandlers.get(hookName)
    if (!handlers || handlers.size === 0) {
      return []
    }
    
    const nodes: React.ReactNode[] = []
    
    for (const handler of handlers) {
      try {
        const result = handler(...args)
        if (result !== null && result !== undefined) {
          nodes.push(result)
        }
      } catch (error) {
        console.error(`[VisionPluginManager] Error in ${hookName} hook:`, error)
      }
    }
    
    return nodes
  }
  
  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================
  
  /**
   * Emit an event
   * 
   * @param event - Event name
   * @param data - Event data
   */
  emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (!handlers) return
    
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error(`[VisionPluginManager] Error in event handler for ${event}:`, error)
      }
    })
  }
  
  /**
   * Listen to an event
   * 
   * @param event - Event name
   * @param handler - Event handler
   * @returns Unsubscribe function
   */
  on(event: string, handler: Function): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    
    this.eventHandlers.get(event)!.add(handler)
    
    // Return unsubscribe function
    return () => this.off(event, handler)
  }
  
  /**
   * Remove event listener
   * 
   * @param event - Event name
   * @param handler - Event handler to remove
   */
  off(event: string, handler: Function): void {
    this.eventHandlers.get(event)?.delete(handler)
  }
  
  // ============================================================================
  // INTROSPECTION
  // ============================================================================
  
  /**
   * Get all registered plugins
   */
  getPlugins(): VisionPlugin<any, TData>[] {
    return Array.from(this.plugins.values())
  }
  
  /**
   * Get a specific plugin by ID
   */
  getPlugin(id: string): VisionPlugin<any, TData> | undefined {
    return this.plugins.get(id)
  }
  
  /**
   * Check if a plugin is registered
   */
  hasPlugin(id: string): boolean {
    return this.plugins.has(id)
  }
  
  /**
   * Get plugins by type
   */
  getPluginsByType(
    type: 'validator' | 'enhancer' | 'decoder' | 'ui' | 'analytics'
  ): VisionPlugin<any, TData>[] {
    return Array.from(this.plugins.values()).filter(p => p.type === type)
  }
  
  /**
   * Get count of registered plugins
   */
  getPluginCount(): number {
    return this.plugins.size
  }
}
