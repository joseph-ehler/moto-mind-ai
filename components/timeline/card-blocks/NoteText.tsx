/**
 * Note Text Block
 * 
 * Standardized note/description display with truncation
 */

import { Text, Button, Stack } from '@/components/design-system'
import { useState } from 'react'

interface NoteTextProps {
  text: string
  maxLength?: number
}

export function NoteText({ text, maxLength = 200 }: NoteTextProps) {
  const [expanded, setExpanded] = useState(false)
  const truncated = text.length > maxLength
  const displayText = expanded || !truncated ? text : `${text.slice(0, maxLength)}...`

  return (
    <Stack spacing="sm" className="bg-gray-50 rounded-lg p-4 border border-gray-100">
      <Text size="sm" className="text-gray-700 leading-relaxed italic">
        "{displayText}"
      </Text>
      
      {truncated && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="self-start text-blue-600 hover:text-blue-700"
        >
          {expanded ? 'Show less' : 'Read more'}
        </Button>
      )}
    </Stack>
  )
}
