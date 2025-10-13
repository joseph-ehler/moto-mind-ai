/**
 * FileUpload Plugin Manager
 * 
 * Manages plugin lifecycle, hooks, and events
 */

import type {
  FileUploadPlugin,
  PluginContext,
  PluginHooks,
  FileState,
  PluginRegistration
} from './types'

// ============================================================================
// Plugin Manager
// ============================================================================

export class PluginManager {
  private plugins: Map<string, FileUploadPlugin> = new Map()
  private eventHandlers: Map<string, Set<Function>> = new Map()
  private initialized = false
  
  constructor(private context: PluginContext) {}
  
  /**
   * Initialize all plugins
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    
    this.initialized = true
  }
  
  /**
   * Register a plugin
   */
  async register(plugin: FileUploadPlugin): Promise<PluginRegistration> {
    // Validate plugin
    if (!plugin.id) {
      throw new Error('Plugin must have an id')
    }
    
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin ${plugin.id} is already registered`)
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
      console.error(`Failed to initialize plugin ${plugin.id}:`, error)
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
   */
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) return
    
    // Cleanup plugin
    try {
      await plugin.destroy?.()
    } catch (error) {
      console.error(`Failed to destroy plugin ${pluginId}:`, error)
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
  
  /**
   * Execute a transformation hook (returns transformed value)
   */
  async executeTransformHook<T>(
    hookName: string,
    initialValue: T
  ): Promise<T | null> {
    const handlers = this.eventHandlers.get(hookName)
    if (!handlers || handlers.size === 0) {
      return initialValue
    }
    
    let value: T | null = initialValue
    
    for (const handler of handlers) {
      try {
        const result = await handler(value)
        
        // If handler returns null, reject the value (stop processing)
        if (result === null) {
          return null
        }
        
        // If handler returns undefined, keep current value
        // If handler returns a value, use it
        if (result !== undefined) {
          value = result
        }
      } catch (error) {
        console.error(`Error in hook ${hookName}:`, error)
        // On error, keep current value and continue
        // (plugin error shouldn't block other plugins)
      }
    }
    
    return value
  }
  
  /**
   * Execute a boolean check hook (all must return true to proceed)
   */
  async executeCheckHook(hookName: string, data: any): Promise<boolean> {
    const handlers = this.eventHandlers.get(hookName)
    if (!handlers || handlers.size === 0) {
      return true
    }
    
    for (const handler of handlers) {
      try {
        const result = await handler(data)
        if (result === false) {
          return false
        }
      } catch (error) {
        console.error(`Error in hook ${hookName}:`, error)
        return false
      }
    }
    
    return true
  }
  
  /**
   * Execute a notification hook (fire and forget)
   */
  async executeNotifyHook(hookName: string, data: any): Promise<void> {
    const handlers = this.eventHandlers.get(hookName)
    if (!handlers || handlers.size === 0) {
      return
    }
    
    // Execute all handlers in parallel
    await Promise.all(
      Array.from(handlers).map(async (handler) => {
        try {
          await handler(data)
        } catch (error) {
          console.error(`Error in hook ${hookName}:`, error)
        }
      })
    )
  }
  
  /**
   * Execute a render hook (collect React nodes)
   */
  executeRenderHook(hookName: string, data?: any): React.ReactNode[] {
    const handlers = this.eventHandlers.get(hookName)
    if (!handlers || handlers.size === 0) {
      return []
    }
    
    const nodes: React.ReactNode[] = []
    
    for (const handler of handlers) {
      try {
        const result = handler(data)
        if (result !== null && result !== undefined) {
          nodes.push(result)
        }
      } catch (error) {
        console.error(`Error in render hook ${hookName}:`, error)
      }
    }
    
    return nodes
  }
  
  /**
   * Emit an event
   */
  emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (!handlers) return
    
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error)
      }
    })
  }
  
  /**
   * Listen to an event
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
   */
  off(event: string, handler: Function): void {
    this.eventHandlers.get(event)?.delete(handler)
  }
  
  /**
   * Get all registered plugins
   */
  getPlugins(): FileUploadPlugin[] {
    return Array.from(this.plugins.values())
  }
  
  /**
   * Get a specific plugin by ID
   */
  getPlugin(id: string): FileUploadPlugin | undefined {
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
  getPluginsByType(type: 'processor' | 'source' | 'uploader' | 'ui'): FileUploadPlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.type === type)
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a plugin context
 */
export function createPluginContext(
  addFiles: (files: File[]) => void,
  removeFile: (fileId: string) => void,
  updateFile: (fileId: string, updates: Partial<FileState>) => void,
  getFiles: () => FileState[],
  getFile: (fileId: string) => FileState | undefined,
  emit: (event: string, data: any) => void,
  on: (event: string, handler: (data: any) => void) => () => void,
  props: Record<string, any>
): PluginContext {
  return {
    addFiles,
    removeFile,
    updateFile,
    getFiles,
    getFile,
    emit,
    on,
    getOptions: <T = any>() => ({} as T),
    props
  }
}
