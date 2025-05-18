import { z } from 'zod';

// TODO: Implement createOrUpdateDailyLogSchema
// - logDate: required date
// - isPresent: required boolean
// - binningCount: optional number, min 0
// - pickingCount: optional number, min 0

// TODO: Implement getDailyLogsSchema
// - page: optional number, min 1, default 1
// - limit: optional number, min 1, max 100, default 10
// - startDate: optional date
// - endDate: optional date
// - userId: optional number

// TODO: Implement getDailyLogByIdSchema
// - id: required number

// TODO: Implement deleteDailyLogSchema
// - id: required number

// TODO: Implement getUserDailyLogsSchema
// - userId: required number
// - page: optional number, min 1, default 1
// - limit: optional number, min 1, max 100, default 10
// - startDate: optional date
// - endDate: optional date 

export const createOrUpdateDailyLogSchema = z.object({
  body: z.object({
    logDate: z.string({
      required_error: 'logDate is required',
      invalid_type_error: 'logDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid date format. Please use YYYY-MM-DD',
      }),
    isPresent: z.boolean({
      required_error: 'isPresent is required',
      invalid_type_error: 'isPresent must be a boolean',
    }),
    binningCount: z.number({
      invalid_type_error: 'binningCount must be a number',
    })
      .min(0, 'binningCount must be a non-negative number')
      .optional(),
    pickingCount: z.number({
      invalid_type_error: 'pickingCount must be a number',
    })
      .min(0, 'pickingCount must be a non-negative number')
      .optional(),
  }),
});

export const getDailyLogsSchema = z.object({
  query: z.object({
    page: z.string({
      invalid_type_error: 'page must be a number',
    })
      .transform(Number)
      .pipe(z.number().min(1, 'page must be at least 1'))
      .default('1'),
    limit: z.string({
      invalid_type_error: 'limit must be a number',
    })
      .transform(Number)
      .pipe(z.number().min(1, 'limit must be at least 1').max(100, 'limit cannot exceed 100'))
      .default('10'),
    startDate: z.string({
      invalid_type_error: 'startDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid startDate format. Please use YYYY-MM-DD',
      })
      .optional(),
    endDate: z.string({
      invalid_type_error: 'endDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid endDate format. Please use YYYY-MM-DD',
      })
      .optional(),
    userId: z.string({
      invalid_type_error: 'userId must be a number',
    })
      .transform(Number)
      .pipe(z.number().int('userId must be an integer'))
      .optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  const startDate = data.query?.startDate;
  const endDate = data.query?.endDate;
  if (startDate && endDate && startDate > endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'startDate must be before or equal to endDate',
      path: ['query', 'startDate'],
    });
  }
});

export const getDailyLogByIdSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: 'id is required',
      invalid_type_error: 'id must be a number',
    })
      .transform(Number)
      .pipe(z.number().int('id must be an integer').positive('id must be a positive number')),
  }),
});

export const deleteDailyLogSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: 'id is required',
      invalid_type_error: 'id must be a number',
    })
      .transform(Number)
      .pipe(z.number().int('id must be an integer').positive('id must be a positive number')),
  }),
});

export const getUserDailyLogsSchema = z.object({
  params: z.object({
    userId: z.string({
      required_error: 'userId is required',
      invalid_type_error: 'userId must be a number',
    })
      .transform(Number)
      .pipe(z.number().int('userId must be an integer').positive('userId must be a positive number')),
  }),
  query: z.object({
    page: z.string({
      invalid_type_error: 'page must be a number',
    })
      .transform(Number)
      .pipe(z.number().min(1, 'page must be at least 1'))
      .default('1'),
    limit: z.string({
      invalid_type_error: 'limit must be a number',
    })
      .transform(Number)
      .pipe(z.number().min(1, 'limit must be at least 1').max(100, 'limit cannot exceed 100'))
      .default('10'),
    startDate: z.string({
      invalid_type_error: 'startDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid startDate format. Please use YYYY-MM-DD',
      })
      .optional(),
    endDate: z.string({
      invalid_type_error: 'endDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid endDate format. Please use YYYY-MM-DD',
      })
      .optional(),
  }).refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: 'startDate must be before or equal to endDate',
      path: ['startDate'],
    }
  ),
});

export const getDailyLogStatsSchema = z.object({
  query: z.object({
    startDate: z.string({
      required_error: 'startDate is required',
      invalid_type_error: 'startDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid startDate format. Please use YYYY-MM-DD',
      }),
    endDate: z.string({
      required_error: 'endDate is required',
      invalid_type_error: 'endDate must be a valid date string (YYYY-MM-DD)',
    })
      .transform((str) => new Date(str))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Invalid endDate format. Please use YYYY-MM-DD',
      }),
    userId: z.string({
      required_error: 'userId is required',
      invalid_type_error: 'userId must be a number',
    })
      .transform(Number)
      .pipe(z.number().int('userId must be an integer').positive('userId must be a positive number')),
  }).refine(
    (data) => data.startDate <= data.endDate,
    {
      message: 'startDate must be before or equal to endDate',
      path: ['startDate'],
    }
  ),
}); 