import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface ActionTileProps {
  title: string
  description: string
  href: string
  icon: LucideIcon
  className?: string
}

export function ActionTile({ title, description, href, icon: Icon, className = '' }: ActionTileProps) {
  return (
    <Link href={href} className="block">
      <Card className={`h-full transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer bg-white border-gray-200 ${className}`}>
        <CardContent className="p-6 flex flex-col items-center text-center h-full">
          {/* Icon */}
          <div className="flex-shrink-0 p-3 rounded-full bg-gray-100 mb-4">
            <Icon className="h-6 w-6 text-gray-700" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
