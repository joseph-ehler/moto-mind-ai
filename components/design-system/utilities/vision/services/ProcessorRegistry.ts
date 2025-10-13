/**
 * Document Processor Registry
 * 
 * Central registry for all document processors
 * Manages processor lifecycle and provides type-safe access
 */

import type { 
  DocumentType, 
  DocumentProcessor, 
  ProcessorRegistryEntry 
} from '../types/document'

/**
 * Singleton registry for document processors
 */
export class ProcessorRegistry {
  private static instance: ProcessorRegistry
  private processors = new Map<DocumentType, ProcessorRegistryEntry>()
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): ProcessorRegistry {
    if (!ProcessorRegistry.instance) {
      ProcessorRegistry.instance = new ProcessorRegistry()
    }
    return ProcessorRegistry.instance
  }
  
  /**
   * Register a document processor
   */
  register<TData = any, TEnriched = TData>(
    processor: DocumentProcessor<TData, TEnriched>,
    version: string = '1.0.0'
  ): void {
    if (this.processors.has(processor.type)) {
      console.warn(`[ProcessorRegistry] Overwriting processor for type: ${processor.type}`)
    }
    
    this.processors.set(processor.type, {
      processor,
      registered: new Date(),
      version
    })
    
    console.log(`[ProcessorRegistry] Registered processor: ${processor.type} (${processor.name})`)
  }
  
  /**
   * Get processor for document type
   */
  get<TData = any, TEnriched = TData>(
    type: DocumentType
  ): DocumentProcessor<TData, TEnriched> {
    const entry = this.processors.get(type)
    
    if (!entry) {
      throw new Error(
        `[ProcessorRegistry] No processor registered for type: ${type}\n` +
        `Available types: ${Array.from(this.processors.keys()).join(', ')}`
      )
    }
    
    return entry.processor as DocumentProcessor<TData, TEnriched>
  }
  
  /**
   * Check if processor exists for type
   */
  has(type: DocumentType): boolean {
    return this.processors.has(type)
  }
  
  /**
   * Get all registered processor types
   */
  getTypes(): DocumentType[] {
    return Array.from(this.processors.keys())
  }
  
  /**
   * Get all registered processors
   */
  getAll(): ProcessorRegistryEntry[] {
    return Array.from(this.processors.values())
  }
  
  /**
   * Unregister a processor
   */
  unregister(type: DocumentType): boolean {
    return this.processors.delete(type)
  }
  
  /**
   * Clear all processors (useful for testing)
   */
  clear(): void {
    this.processors.clear()
  }
  
  /**
   * Get processor info
   */
  getInfo(type: DocumentType): ProcessorRegistryEntry | undefined {
    return this.processors.get(type)
  }
}

/**
 * Convenience function to get registry instance
 */
export const getProcessorRegistry = () => ProcessorRegistry.getInstance()
