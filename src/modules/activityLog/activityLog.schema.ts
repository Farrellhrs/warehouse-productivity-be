import { z } from 'zod';

export const activityLogQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dataType: z.enum(['binning', 'picking', 'attendance', 'daily_log']).optional(),
  status: z.enum(['success', 'failure']).optional(),
  userId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
}); 