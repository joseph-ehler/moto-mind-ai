import { 
  ArrowLeft, 
  Share2, 
  Download, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Droplet,
  Gauge,
  FileText,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  StickyNote
} from 'lucide-react'
import { Flex, Text } from '@/components/design-system'
import { calculateCompletionScore } from './CompletionScoreTooltip'

interface EventHeaderProps {
  event: any
  onBack: () => void
  onShare?: () => void
  onExport?: () => void
}

export function EventHeader({ event, onBack, onShare, onExport }: EventHeaderProps) {
  // Calculate completion score with breakdown
  const { score: completionScore, breakdown } = calculateCompletionScore({
    receipt_image_url: event.payload?.receipt_image_url,
    total_amount: event.total_amount,
    gallons: event.gallons,
    vendor: event.vendor,
    geocoded_lat: event.geocoded_lat,
    date: event.date,
    miles: event.miles,
    notes: event.notes
  })

  // Determine completion status
  const completionStatus = completionScore === 100 
    ? { label: 'Complete', color: 'bg-green-500', icon: CheckCircle2 }
    : completionScore >= 80 
    ? { label: 'Nearly Complete', color: 'bg-blue-500', icon: CheckCircle2 }
    : completionScore >= 60
    ? { label: 'Partial Data', color: 'bg-amber-500', icon: AlertCircle }
    : { label: 'Incomplete', color: 'bg-gray-500', icon: AlertCircle }

  const StatusIcon = completionStatus.icon

  // Format date
  const eventDate = new Date(event.date)
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
  const time = event.payload?.time || eventDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })

  // Get event type details
  const eventTypeConfig = {
    fuel: { 
      icon: '⛽', 
      title: 'Fuel Fill-Up',
      gradient: 'from-blue-600 via-blue-700 to-indigo-800',
      accentColor: 'blue'
    },
    maintenance: { 
      icon: '🔧', 
      title: 'Maintenance',
      gradient: 'from-orange-600 via-orange-700 to-red-800',
      accentColor: 'orange'
    },
    odometer: { 
      icon: '📊', 
      title: 'Odometer Reading',
      gradient: 'from-green-600 via-green-700 to-emerald-800',
      accentColor: 'green'
    }
  }

  const config = eventTypeConfig[event.type as keyof typeof eventTypeConfig] || eventTypeConfig.fuel

  // Count data quality indicators
  const dataQuality = {
    hasPhoto: !!event.payload?.receipt_image_url,
    hasLocation: !!(event.vendor && event.geocoded_lat),
    hasOdometer: !!event.miles,
    hasNotes: !!(event.notes && event.notes.trim().length > 0),
    hasFinancials: !!(event.total_amount && event.gallons)
  }

  const completedCount = Object.values(dataQuality).filter(Boolean).length
  const totalCount = Object.keys(dataQuality).length

  return (
    <div 
      className={`w-full bg-gradient-to-br ${config.gradient} py-8 shadow-lg`}
      style={{ 
        minHeight: '280px',
        width: '100%',
        display: 'block'
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Back Button & Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-all duration-200 bg-transparent hover:bg-white/10 px-3 py-2 rounded-xl group"
            >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Timeline</span>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onShare && (
            <button
              onClick={onShare}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Share event"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export as PDF"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Event Title & Badge */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">
              {event.type === 'fuel' ? '💧 Fuel Fill-Up' : 
               event.type === 'maintenance' ? '🔧 Maintenance' :
               event.type === 'odometer' ? '📊 Odometer Reading' :
               '📄 Event'}
            </h1>
            <CompletionScoreTooltip score={qualityScore} breakdown={breakdown} />
          </div>
          
          <div className="mt-2 space-y-1">
            <Text className="text-lg text-gray-700">
              {event.display_vendor || event.vendor || 'Event Details'}
            </Text>
            <Text className="text-sm text-gray-500">
              {formattedDate} • {time}
            </Text>
          </div>
        </div>
      </div>

      {/* Event Summary */}
      {event.display_summary && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Text className="text-sm text-blue-900">
            {event.display_summary}
          </Text>
        </div>
      )}
    </div>
  )
}
