'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Camera, FileText, ChevronRight } from 'lucide-react'

interface ActionBarProps {
  onDashboardCapture: () => void
  onScanDocument: () => void
}

export function ActionBar({ onDashboardCapture, onScanDocument }: ActionBarProps) {
  return (
    <div className="bg-white rounded-3xl border border-black/5 p-8 shadow-sm">
      <div className="space-y-4">
        {/* Primary Action - Dashboard Snapshot */}
        <button
          onClick={onDashboardCapture}
          className="w-full flex items-center justify-between p-6 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Camera className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-lg">Capture Dashboard</div>
              <div className="text-sm text-blue-100 opacity-90">Odometer, fuel, warning lights</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 opacity-80" />
        </button>

        {/* Secondary Action - Scan Document */}
        <button
          onClick={onScanDocument}
          className="w-full flex items-center justify-between p-6 border border-black/10 rounded-2xl hover:bg-black/5 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black/5 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-black/70" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-lg text-black">Scan Document</div>
              <div className="text-sm text-black/60">Service receipts, fuel, insurance</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-black/40" />
        </button>
      </div>
    </div>
  )
}
