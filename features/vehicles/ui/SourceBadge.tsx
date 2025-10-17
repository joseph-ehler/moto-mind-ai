import React from 'react'
import { CheckCircle, Globe, Database, AlertCircle } from 'lucide-react'

interface SourceBadgeProps {
  sources?: string[]
  hasValue: boolean
  inline?: boolean
}

export function SourceBadge({ sources, hasValue, inline = false }: SourceBadgeProps) {
  if (!hasValue) {
    return (
      <div className={`flex items-center gap-1 text-gray-500 ${inline ? 'inline-flex' : ''}`}>
        <AlertCircle className="w-3 h-3" />
        <span className="text-xs">Not available</span>
      </div>
    )
  }
  
  if (!sources || sources.length === 0) {
    return (
      <div className={`flex items-center gap-1 text-blue-600 ${inline ? 'inline-flex' : ''}`}>
        <Globe className="w-3 h-3" />
        <span className="text-xs">Web research</span>
      </div>
    )
  }
  
  if (sources.includes('nhtsa')) {
    return (
      <div className={`flex items-center gap-1 text-green-600 ${inline ? 'inline-flex' : ''}`}>
        <CheckCircle className="w-3 h-3" />
        <span className="text-xs">NHTSA verified</span>
      </div>
    )
  }
  
  if (sources.includes('openai_web_search')) {
    return (
      <div className={`flex items-center gap-1 text-blue-600 ${inline ? 'inline-flex' : ''}`}>
        <Globe className="w-3 h-3" />
        <span className="text-xs">Web research</span>
      </div>
    )
  }
  
  if (sources.includes('user_override')) {
    return (
      <div className={`flex items-center gap-1 text-purple-600 ${inline ? 'inline-flex' : ''}`}>
        <Database className="w-3 h-3" />
        <span className="text-xs">Custom</span>
      </div>
    )
  }
  
  return (
      <div className={`flex items-center gap-1 text-gray-600 ${inline ? 'inline-flex' : ''}`}>
        <Database className="w-3 h-3" />
        <span className="text-xs">Manufacturer</span>
      </div>
    )
}

interface SourceLegendProps {
  className?: string
}

export function SourceLegend({ className = '' }: SourceLegendProps) {
  return (
    <div className={`text-xs text-gray-600 space-y-1 ${className}`}>
      <div className="font-medium mb-2">Data Sources:</div>
      <div className="flex items-center gap-2">
        <CheckCircle className="w-3 h-3 text-green-600" />
        <span><strong className="text-green-700">NHTSA verified</strong> - Official government database</span>
      </div>
      <div className="flex items-center gap-2">
        <Globe className="w-3 h-3 text-blue-600" />
        <span><strong className="text-blue-700">Web research</strong> - AI-sourced from manufacturer sites</span>
      </div>
      <div className="flex items-center gap-2">
        <Database className="w-3 h-3 text-purple-600" />
        <span><strong className="text-purple-700">Custom</strong> - Your customizations</span>
      </div>
      <div className="flex items-center gap-2">
        <AlertCircle className="w-3 h-3 text-gray-500" />
        <span><strong className="text-gray-700">Not available</strong> - Consult owner's manual</span>
      </div>
    </div>
  )
}
