/**
 * Vision System Initialization
 * 
 * Ensures all processors are registered before use
 * Import this at the top of your app or page
 */

import { registerAllProcessors } from './processors'

// Auto-register all processors
if (typeof window !== 'undefined') {
  registerAllProcessors()
  console.log('✅ Vision system initialized')
}

export { registerAllProcessors }
