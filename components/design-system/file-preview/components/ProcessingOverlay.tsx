import { Loader2, Sparkles } from 'lucide-react'

export function ProcessingOverlay() {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30 pointer-events-none p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-xl text-center max-w-sm mx-4">
        <div className="relative mb-3 sm:mb-4">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-600 mx-auto" />
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 absolute top-0 right-1/3 animate-pulse" />
        </div>
        <h3 className="font-semibold text-base sm:text-lg mb-2">🤖 AI Processing</h3>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Analyzing image and extracting insights...
        </p>
        <div className="mt-3 sm:mt-4 flex items-center justify-center gap-1.5 sm:gap-2">
          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-600 rounded-full animate-bounce" />
          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  )
}
