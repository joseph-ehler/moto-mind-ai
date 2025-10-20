/**
 * Step Error Boundary
 * 
 * Catches errors in wizard steps and shows friendly fallback.
 * Keeps header/footer functional so users can exit or go back.
 */

'use client'

import { Component, type ReactNode } from 'react'
import { AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  children: ReactNode
  onRetry?: () => void
  onBack?: () => void
}

type State = {
  hasError: boolean
  error: Error | null
}

export class StepErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service (e.g., Sentry)
    console.error('Wizard step error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            
            <p className="text-sm text-gray-600 mb-6">
              We encountered an error on this screen. You can try again or go back to the previous step.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {this.props.onBack && (
                <Button
                  variant="outline"
                  onClick={this.props.onBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </Button>
              )}
              
              <Button
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
