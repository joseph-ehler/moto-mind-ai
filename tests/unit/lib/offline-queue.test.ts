/**
 * UNIT TESTS: Offline Queue
 * 
 * Tests for the offline queue manager
 */

import { OfflineQueue } from '@/lib/memory/offline-queue'
import { mockIndexedDB } from '@/tests/helpers/setup'

describe('OfflineQueue', () => {
  let queue: OfflineQueue

  beforeEach(() => {
    queue = new OfflineQueue()
    // Mock IndexedDB
    global.indexedDB = mockIndexedDB as any
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('queuePhoto', () => {
    it('should add photo to queue', async () => {
      const photo = {
        blob: new Blob(['test'], { type: 'image/jpeg' }),
        filename: 'test.jpg',
        metadata: {
          vehicleId: 'test-vehicle',
          eventType: 'fuel',
          capturedAt: new Date().toISOString()
        }
      }

      // Mock successful add
      const mockAdd = jest.fn().mockResolvedValue(1)
      mockIndexedDB.open.mockReturnValue({
        result: {
          transaction: jest.fn(() => ({
            objectStore: jest.fn(() => ({
              add: mockAdd
            }))
          }))
        },
        onsuccess: null
      })

      await queue.init()
      const id = await queue.queuePhoto(photo)

      expect(typeof id).toBe('number')
    })
  })

  describe('queueEvent', () => {
    it('should add event to queue', async () => {
      const event = {
        data: {
          vehicleId: 'test-vehicle',
          type: 'fuel',
          date: new Date().toISOString(),
          totalAmount: 50.00
        }
      }

      const mockAdd = jest.fn().mockResolvedValue(1)
      mockIndexedDB.open.mockReturnValue({
        result: {
          transaction: jest.fn(() => ({
            objectStore: jest.fn(() => ({
              add: mockAdd
            }))
          }))
        },
        onsuccess: null
      })

      await queue.init()
      const id = await queue.queueEvent(event)

      expect(typeof id).toBe('number')
    })
  })

  describe('getStats', () => {
    it('should return queue statistics', async () => {
      const stats = await queue.getStats()

      expect(stats).toHaveProperty('photos')
      expect(stats).toHaveProperty('events')
      expect(stats).toHaveProperty('totalSize')
    })
  })
})
