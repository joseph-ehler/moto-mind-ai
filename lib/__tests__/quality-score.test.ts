/**
 * Quality Score Tests
 */

import { calculateQualityScore, getQualityBadgeColor, getQualityImprovements } from '../quality-score'
import type { TimelineItem } from '@/types/timeline'
import type { EventCardData } from '@/components/timeline/event-types/types'

describe('Quality Score System', () => {
  describe('calculateQualityScore', () => {
    it('should calculate 100% for perfect event', () => {
      const item: Partial<TimelineItem> = {
        id: '1',
        photo_url: 'https://example.com/photo.jpg',
        mileage: 77000,
        notes: 'Full service completed',
      }

      const cardData: EventCardData = {
        data: [
          { label: 'Cost', value: '$42.50' },
          { label: 'Gallons', value: '13.2' },
          { label: 'Station', value: 'Shell' },
          { label: 'Type', value: 'Regular' },
        ],
        quality: {
          level: 'high',
        },
      }

      const result = calculateQualityScore(item as TimelineItem, cardData)

      expect(result.score).toBe(100)
      expect(result.level).toBe(5)
      expect(result.color).toBe('green')
      expect(result.label).toBe('Excellent')
      expect(result.breakdown.hasPhoto).toBe(true)
      expect(result.breakdown.photoScore).toBe(40)
      expect(result.breakdown.fieldsScore).toBe(30)
      expect(result.breakdown.odometerScore).toBe(15)
      expect(result.breakdown.confidenceScore).toBe(10)
      expect(result.breakdown.notesScore).toBe(5)
    })

    it('should calculate 50% for event without photo', () => {
      const item: Partial<TimelineItem> = {
        id: '1',
        mileage: 77000,
        notes: 'Manual entry',
      }

      const cardData: EventCardData = {
        data: [
          { label: 'Cost', value: '$42.50' },
          { label: 'Gallons', value: '13.2' },
          { label: 'Station', value: 'Shell' },
          { label: 'Type', value: 'Regular' },
        ],
      }

      const result = calculateQualityScore(item as TimelineItem, cardData)

      expect(result.score).toBe(50)
      expect(result.level).toBe(2)
      expect(result.color).toBe('red')
      expect(result.label).toBe('Needs Improvement')
      expect(result.breakdown.hasPhoto).toBe(false)
      expect(result.breakdown.photoScore).toBe(0)
    })

    it('should calculate 70% for event with photo but no odometer', () => {
      const item: Partial<TimelineItem> = {
        id: '1',
        photo_url: 'https://example.com/photo.jpg',
      }

      const cardData: EventCardData = {
        data: [
          { label: 'Cost', value: '$42.50' },
          { label: 'Gallons', value: '13.2' },
          { label: 'Station', value: 'Shell' },
          { label: 'Type', value: 'Regular' },
        ],
        quality: {
          level: 'high',
        },
      }

      const result = calculateQualityScore(item as TimelineItem, cardData)

      expect(result.score).toBe(80)
      expect(result.level).toBe(4)
      expect(result.color).toBe('yellow')
      expect(result.breakdown.odometerScore).toBe(0)
    })

    it('should cap score at 100%', () => {
      const item: Partial<TimelineItem> = {
        id: '1',
        photo_url: 'https://example.com/photo.jpg',
        mileage: 77000,
        notes: 'Test notes',
      }

      const cardData: EventCardData = {
        data: Array(10).fill(null).map((_, i) => ({ 
          label: `Field ${i}`, 
          value: `Value ${i}` 
        })),
        quality: {
          level: 'high',
        },
      }

      const result = calculateQualityScore(item as TimelineItem, cardData)

      expect(result.score).toBe(100)
      expect(result.score).toBeLessThanOrEqual(100)
    })
  })

  describe('getQualityBadgeColor', () => {
    it('should return green for high scores', () => {
      expect(getQualityBadgeColor(95)).toBe('green')
      expect(getQualityBadgeColor(85)).toBe('green')
    })

    it('should return yellow for medium scores', () => {
      expect(getQualityBadgeColor(70)).toBe('yellow')
      expect(getQualityBadgeColor(55)).toBe('yellow')
    })

    it('should return red for low scores', () => {
      expect(getQualityBadgeColor(50)).toBe('red')
      expect(getQualityBadgeColor(20)).toBe('red')
    })
  })

  describe('getQualityImprovements', () => {
    it('should suggest adding photo when missing', () => {
      const breakdown = {
        hasPhoto: false,
        photoScore: 0,
        fieldsScore: 30,
        fieldCount: 4,
        odometerScore: 15,
        confidenceScore: 10,
        notesScore: 5,
      }

      const improvements = getQualityImprovements(breakdown)

      expect(improvements).toContain('Add a photo for +40%')
    })

    it('should suggest adding odometer when missing', () => {
      const breakdown = {
        hasPhoto: true,
        photoScore: 40,
        fieldsScore: 30,
        fieldCount: 4,
        odometerScore: 0,
        confidenceScore: 10,
        notesScore: 5,
      }

      const improvements = getQualityImprovements(breakdown)

      expect(improvements).toContain('Add odometer reading for +15%')
    })

    it('should suggest multiple improvements', () => {
      const breakdown = {
        hasPhoto: false,
        photoScore: 0,
        fieldsScore: 10,
        fieldCount: 1,
        odometerScore: 0,
        confidenceScore: 0,
        notesScore: 0,
      }

      const improvements = getQualityImprovements(breakdown)

      expect(improvements.length).toBeGreaterThan(2)
      expect(improvements).toContain('Add a photo for +40%')
      expect(improvements).toContain('Add odometer reading for +15%')
      expect(improvements).toContain('Add notes for +5%')
    })
  })
})
