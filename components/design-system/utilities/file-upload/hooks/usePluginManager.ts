/**
 * usePluginManager Hook
 * 
 * Manages FileUpload plugin lifecycle
 * - Initializes PluginManager
 * - Registers/unregisters plugins
 * - Provides plugin execution API
 */

import { useRef, useEffect } from 'react'
import { PluginManager } from '../plugins/plugin-manager'
import type { FileUploadPlugin, PluginContext } from '../plugins/types'

export interface UsePluginManagerOptions {
  /** Plugins to register */
  plugins: FileUploadPlugin[]
  
  /** Plugin context */
  context: PluginContext
  
  /** Enable plugin system */
  enabled?: boolean
}

export interface UsePluginManagerReturn {
  /** Plugin manager instance */
  manager: PluginManager | null
  
  /** Execute a transform hook (returns transformed value or null to reject) */
  executeTransform: <T>(hookName: string, value: T) => Promise<T | null>
  
  /** Execute a check hook (returns boolean) */
  executeCheck: (hookName: string, data: any) => Promise<boolean>
  
  /** Execute a notify hook (no return value) */
  executeNotify: (hookName: string, data: any) => Promise<void>
  
  /** Execute a render hook (returns React nodes) */
  executeRender: (hookName: string, data?: any) => React.ReactNode[]
  
  /** Emit an event */
  emit: (event: string, data: any) => void
}

/**
 * Hook for managing FileUpload plugins
 */
export function usePluginManager(
  options: UsePluginManagerOptions
): UsePluginManagerReturn {
  const { plugins, context, enabled = true } = options
  
  const managerRef = useRef<PluginManager | null>(null)
  const registeredPluginsRef = useRef<Set<string>>(new Set())
  
  // Initialize plugin manager
  useEffect(() => {
    if (!enabled || plugins.length === 0) {
      return
    }
    
    // Create manager
    const manager = new PluginManager(context)
    managerRef.current = manager
    
    // Register plugins
    const registerPlugins = async () => {
      for (const plugin of plugins) {
        try {
          await manager.register(plugin)
          registeredPluginsRef.current.add(plugin.id)
          console.log(`✅ Plugin registered: ${plugin.id}`)
        } catch (error) {
          console.error(`❌ Failed to register plugin ${plugin.id}:`, error)
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
            console.log(`🧹 Plugin unregistered: ${pluginId}`)
          } catch (error) {
            console.error(`❌ Failed to unregister plugin ${pluginId}:`, error)
          }
        }
        registeredPluginsRef.current.clear()
        managerRef.current = null
      }
      
      cleanup()
    }
  }, [plugins, context, enabled])
  
  // Execute transform hook
  const executeTransform = async <T,>(hookName: string, value: T): Promise<T | null> => {
    if (!managerRef.current) return value
    
    try {
      return await managerRef.current.executeTransformHook(hookName, value)
    } catch (error) {
      console.error(`Plugin hook error (${hookName}):`, error)
      return value
    }
  }
  
  // Execute check hook
  const executeCheck = async (hookName: string, data: any): Promise<boolean> => {
    if (!managerRef.current) return true
    
    try {
      return await managerRef.current.executeCheckHook(hookName, data)
    } catch (error) {
      console.error(`Plugin hook error (${hookName}):`, error)
      return true
    }
  }
  
  // Execute notify hook
  const executeNotify = async (hookName: string, data: any): Promise<void> => {
    if (!managerRef.current) return
    
    try {
      await managerRef.current.executeNotifyHook(hookName, data)
    } catch (error) {
      console.error(`Plugin hook error (${hookName}):`, error)
    }
  }
  
  // Execute render hook
  const executeRender = (hookName: string, data?: any): React.ReactNode[] => {
    if (!managerRef.current) return []
    
    try {
      return managerRef.current.executeRenderHook(hookName, data)
    } catch (error) {
      console.error(`Plugin hook error (${hookName}):`, error)
      return []
    }
  }
  
  // Emit event
  const emit = (event: string, data: any) => {
    if (!managerRef.current) return
    
    try {
      managerRef.current.emit(event, data)
    } catch (error) {
      console.error(`Plugin event error (${event}):`, error)
    }
  }
  
  return {
    manager: managerRef.current,
    executeTransform,
    executeCheck,
    executeNotify,
    executeRender,
    emit
  }
}
