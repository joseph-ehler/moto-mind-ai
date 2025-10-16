/**
 * ConfidenceSection
 * Groups fields by confidence level with descriptive header
 */

import { ReactNode } from 'react'

interface ConfidenceSectionProps {
  title: string
  icon: ReactNode
  description: string
  children: ReactNode
}

export function ConfidenceSection({
  title,
  icon,
  description,
  children,
}: ConfidenceSectionProps) {
  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      {/* Fields */}
      <div className="space-y-3">{children}</div>
    </div>
  )
}
