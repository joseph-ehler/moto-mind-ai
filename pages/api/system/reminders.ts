import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { createHash } from 'crypto'
import { handleApiError, ValidationError, DatabaseError } from '@/lib/utils/errors'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Validation schema for reminder creation (deterministic dedupe)
const CreateReminderSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.enum(['registration', 'inspection', 'emissions', 'maintenance', 'other']).default('maintenance'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  due_miles: z.number().int().min(0, 'Miles must be positive').optional(),
  allow_past: z.boolean().default(false)
})

const ListRemindersSchema = z.object({
  vehicle_id: z.string().uuid().optional(),
  status: z.enum(['open', 'scheduled', 'done', 'dismissed']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Mock tenant ID for development
    const tenantId = '550e8400-e29b-41d4-a716-446655440000'

    switch (req.method) {
      case 'POST':
        return handleCreateReminder(req, res, tenantId)
      case 'GET':
        return handleListReminders(req, res, tenantId)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

async function handleCreateReminder(req: NextApiRequest, res: NextApiResponse, tenantId: string) {
  try {
    // Validate request body
    const reminderData = CreateReminderSchema.parse(req.body)

    // Validate due_date is not absurdly old (unless allow_past=true)
    if (reminderData.due_date && !reminderData.allow_past) {
      const dueDate = new Date(reminderData.due_date)
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      
      if (dueDate < oneYearAgo) {
        throw new ValidationError('Due date cannot be more than 1 year in the past. Use allow_past=true if intentional.')
      }
    }

    // Verify vehicle exists and belongs to tenant
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', reminderData.vehicle_id)
      .single()

    if (vehicleError || !vehicle) {
      throw new ValidationError('Vehicle not found or access denied')
    }

    // Compute dedupe key in application
    const dedupeKey = computeDedupeKey(
      reminderData.vehicle_id,
      reminderData.title,
      reminderData.due_date,
      reminderData.category,
      reminderData.due_miles
    )

    // Attempt to insert reminder (will handle dedupe via unique constraint)
    const { data: reminder, error: insertError } = await supabase
      .from('reminders')
      .insert({
        vehicle_id: reminderData.vehicle_id,
        title: reminderData.title,
        description: reminderData.description,
        category: reminderData.category,
        priority: reminderData.priority,
        due_date: reminderData.due_date,
        due_miles: reminderData.due_miles,
        source: 'user',
        status: 'open',
        dedupe_key: dedupeKey
      })
      .select()
      .single()

    if (insertError) {
      // Handle unique constraint violation (dedupe)
      if (insertError.code === '23505' && insertError.message.includes('ux_reminders_dedupe_open')) {
        // Find existing reminder with same dedupe key
        const { data: existingReminder, error: findError } = await supabase
          .from('reminders')
          .select('*')
          .eq('vehicle_id', reminderData.vehicle_id)
          .eq('title', reminderData.title)
          .eq('category', reminderData.category)
          .in('status', ['open', 'scheduled'])
          .single()

        if (findError || !existingReminder) {
          throw new DatabaseError('Failed to find existing reminder after dedupe conflict')
        }

        return res.status(200).json({
          success: true,
          reminder: existingReminder,
          message: 'Reminder already exists',
          deduplicated: true
        })
      }

      throw new DatabaseError(`Failed to create reminder: ${insertError.message}`)
    }

    return res.status(201).json({
      success: true,
      reminder,
      message: 'Reminder created successfully'
    })
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

async function handleListReminders(req: NextApiRequest, res: NextApiResponse, tenantId: string) {
  try {
    // Validate query parameters
    const query = ListRemindersSchema.parse(req.query)

    // Build query
    let supabaseQuery = supabase
      .from('reminders')
      .select(`
        *,
        vehicle:vehicles!inner(id, year, make, model, nickname, tenant_id)
      `)
      .eq('vehicles.tenant_id', tenantId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(query.offset, query.offset + query.limit - 1)

    // Apply filters
    if (query.vehicle_id) {
      supabaseQuery = supabaseQuery.eq('vehicle_id', query.vehicle_id)
    }

    if (query.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status)
    } else {
      // Default to open/scheduled reminders
      supabaseQuery = supabaseQuery.in('status', ['open', 'scheduled'])
    }

    const { data: reminders, error } = await supabaseQuery

    if (error) {
      throw new DatabaseError(`Failed to fetch reminders: ${error.message}`)
    }

    return res.status(200).json({ reminders })
  } catch (error) {
    const { status, body } = handleApiError(error, req.url)
    return res.status(status).json(body)
  }
}

// Helper function to compute deterministic dedupe key
function computeDedupeKey(
  vehicleId: string,
  title: string,
  dueDate?: string,
  category?: string,
  dueMiles?: number
): string {
  const parts = [
    vehicleId,
    title,
    dueDate || '',
    category || '',
    dueMiles?.toString() || ''
  ]
  
  const combined = parts.join('|')
  return createHash('md5').update(combined).digest('hex')
}
