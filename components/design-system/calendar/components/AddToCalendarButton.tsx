'use client'

/**
 * AddToCalendarButton Component
 * 
 * Dropdown button that allows users to add events to their preferred calendar app
 */

import * as React from 'react'
import { Calendar, ChevronDown, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Flex } from '../../primitives/Layout'
import { MaintenanceEvent } from '../types'
import { openCalendarLink, downloadICS } from '../utils/addToCalendar'

interface AddToCalendarButtonProps {
  event: MaintenanceEvent
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function AddToCalendarButton({ 
  event, 
  variant = 'outline',
  size = 'default',
  className 
}: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const handleAddToGoogle = () => {
    openCalendarLink(event, 'google')
    setIsOpen(false)
  }
  
  const handleAddToOutlook = () => {
    openCalendarLink(event, 'outlook')
    setIsOpen(false)
  }
  
  const handleDownloadICS = () => {
    downloadICS(event)
    setIsOpen(false)
  }
  
  return (
    <div className="relative inline-block">
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        className={className}
      >
        <Calendar className="h-4 w-4 mr-2" />
        Add to Calendar
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-20 overflow-hidden">
            <div className="py-1">
              <button
                onClick={handleAddToGoogle}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <GoogleCalendarIcon />
                <span>Google Calendar</span>
              </button>
              
              <button
                onClick={handleAddToOutlook}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <OutlookIcon />
                <span>Outlook</span>
              </button>
              
              <div className="border-t border-slate-200 my-1" />
              
              <button
                onClick={handleDownloadICS}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <Download className="h-4 w-4 text-slate-600" />
                <span>Download .ics</span>
                <span className="text-xs text-slate-400 ml-auto">Apple, other</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Calendar provider icons
function GoogleCalendarIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#4285F4"/>
      <path d="M19 8H17V5H15V8H13V10H15V13H17V10H19V8Z" fill="white"/>
      <path d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12H12V8H20V12C20 16.4183 16.4183 20 12 20Z" fill="white"/>
    </svg>
  )
}

function OutlookIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="2" fill="#0078D4"/>
      <path d="M12 7C9.79086 7 8 8.79086 8 11V13C8 15.2091 9.79086 17 12 17C14.2091 17 16 15.2091 16 13V11C16 8.79086 14.2091 7 12 7Z" fill="white"/>
      <path d="M12 9C10.8954 9 10 9.89543 10 11V13C10 14.1046 10.8954 15 12 15C13.1046 15 14 14.1046 14 13V11C14 9.89543 13.1046 9 12 9Z" fill="#0078D4"/>
    </svg>
  )
}
