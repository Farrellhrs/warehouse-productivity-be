import { z } from 'zod';

export const getPerformanceMetricsSchema = z.object({
  query: z.object({
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
    userId: z.string().transform(Number).optional(),
    groupBy: z.enum(['day', 'week', 'month']).default('day'),
  }),
});

export const getOperatorPerformanceSchema = z.object({
  params: z.object({
    userId: z.string().transform(Number),
  }),
  query: z.object({
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
  }),
});

export const getTeamPerformanceSchema = z.object({
  query: z.object({
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
    groupBy: z.enum(['day', 'week', 'month']).default('day'),
  }),
});

export const requestReportSchema = z.object({
  body: z.object({
    startDate: z.string().transform((str) => new Date(str)),
    endDate: z.string().transform((str) => new Date(str)),
    reportType: z.enum(['daily', 'weekly', 'monthly']),
    exportFormat: z.enum(['excel', 'pdf']),
    emailTo: z.string().email().optional(),
  }),
});

export const getReportStatusSchema = z.object({
  params: z.object({
    reportId: z.string().transform(Number),
  }),
}); 