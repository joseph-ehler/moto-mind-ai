import { z } from 'zod'

// Common UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format')

// Common pagination
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

// Common date validation
export const dateSchema = z.string().datetime('Invalid date format')

// File upload validation
export const imageUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  file_size: z.number().int().min(1).max(10 * 1024 * 1024), // 10MB max
  mime_type: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'Invalid image type'),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).optional(),
})

// Reminder validation
export const createReminderSchema = z.object({
  vehicle_id: uuidSchema,
  garage_id: uuidSchema,
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  due_date: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().max(50).optional(),
  metadata: z.record(z.any()).optional(),
})

// Export types
export type Pagination = z.infer<typeof paginationSchema>
export type ImageUpload = z.infer<typeof imageUploadSchema>
export type CreateReminder = z.infer<typeof createReminderSchema>
