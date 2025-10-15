/**
 * Event Card Skeleton Component
 * 
 * Loading placeholder for smooth perceived performance.
 * Shows while AI is extracting data from images.
 */

export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Icon circle */}
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          
          {/* Title + subtitle */}
          <div className="space-y-2">
            <div className="h-3.5 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        </div>
        
        {/* Time */}
        <div className="h-3 w-12 bg-gray-200 rounded" />
      </div>
      
      {/* Divider */}
      <div className="border-t border-gray-100" />
      
      {/* Body Skeleton */}
      <div className="p-6 space-y-4">
        {/* Hero metric skeleton */}
        <div className="text-center py-6 bg-gray-50 rounded-lg space-y-2">
          <div className="h-10 w-32 bg-gray-200 rounded mx-auto" />
          <div className="h-3 w-48 bg-gray-100 rounded mx-auto" />
        </div>
        
        {/* Data rows skeleton */}
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        
        {/* Optional: Extraction status */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span>Extracting data...</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact skeleton for list views
 */
export function EventCardSkeletonCompact() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-3.5 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="h-3 w-12 bg-gray-200 rounded" />
      </div>
    </div>
  )
}
