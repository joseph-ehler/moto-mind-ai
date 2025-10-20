/**
 * Ultra God-Tier Wizard: Data Sources
 * 
 * Barrel export for B-3 Data Source Registry.
 * 
 * Phase B-3: Data Source Registry
 */

export * from './types'
export * from './data-source-manager'
export * from './template-resolver'
export * from './cache'
export * from './circuit-breaker'
export * from './privacy-enforcer'

// Convenient exports
export { globalDataSourceManager as dataSourceManager } from './data-source-manager'
export { globalCache as dataSourceCache } from './cache'
