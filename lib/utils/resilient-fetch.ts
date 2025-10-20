/**
 * Resilient Fetch Utility
 * Handles retries, timeouts, rate limiting, and exponential backoff
 */

interface RetryOptions {
  maxRetries: number
  backoffMs: number
  timeout: number
  onRetry?: (attempt: number, error: Error) => void
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  backoffMs: 1000,
  timeout: 10000
}

export class ResilientFetch {
  /**
   * Fetch with automatic retry, timeout, and exponential backoff
   */
  static async fetch(
    url: string,
    options: RequestInit = {},
    retryOptions: Partial<RetryOptions> = {}
  ): Promise<Response> {
    const opts = { ...DEFAULT_OPTIONS, ...retryOptions }
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        // Add timeout using AbortController
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), opts.timeout)
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        // Handle rate limiting (429)
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after')
          const waitMs = retryAfter 
            ? parseInt(retryAfter) * 1000 
            : opts.backoffMs * Math.pow(2, attempt)
          
          console.warn(`[ResilientFetch] Rate limited, waiting ${waitMs}ms (attempt ${attempt + 1}/${opts.maxRetries + 1})`)
          
          if (attempt < opts.maxRetries) {
            await this.sleep(waitMs)
            continue
          }
          
          throw new Error(`Rate limit exceeded after ${opts.maxRetries + 1} attempts`)
        }
        
        // Success!
        if (response.ok) {
          if (attempt > 0) {
            console.log(`[ResilientFetch] Success on attempt ${attempt + 1}`)
          }
          return response
        }
        
        // Server error (5xx) - retry
        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`)
        }
        
        // Client error (4xx) - don't retry
        throw new Error(`Client error: ${response.status} ${response.statusText}`)
        
      } catch (error) {
        lastError = error as Error
        
        // Don't retry on timeout/abort or client errors
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = new Error(`Request timeout after ${opts.timeout}ms`)
          }
          
          if (error.message.includes('Client error')) {
            throw lastError
          }
        }
        
        // Last attempt - throw
        if (attempt === opts.maxRetries) {
          console.error(`[ResilientFetch] All ${opts.maxRetries + 1} attempts failed`)
          throw lastError
        }
        
        // Exponential backoff
        const waitMs = opts.backoffMs * Math.pow(2, attempt)
        console.warn(
          `[ResilientFetch] Attempt ${attempt + 1}/${opts.maxRetries + 1} failed: ${lastError.message}`,
          `Retrying in ${waitMs}ms...`
        )
        
        // Call retry callback if provided
        opts.onRetry?.(attempt + 1, lastError)
        
        await this.sleep(waitMs)
      }
    }
    
    throw lastError || new Error('Max retries exceeded')
  }
  
  /**
   * Fetch JSON with automatic parsing and validation
   */
  static async fetchJSON<T = any>(
    url: string,
    options: RequestInit = {},
    retryOptions: Partial<RetryOptions> = {}
  ): Promise<T> {
    const response = await this.fetch(
      url,
      {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      },
      retryOptions
    )
    
    const text = await response.text()
    
    try {
      return JSON.parse(text)
    } catch (error) {
      console.error('[ResilientFetch] Failed to parse JSON:', text.substring(0, 200))
      throw new Error('Invalid JSON response from API')
    }
  }
  
  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
