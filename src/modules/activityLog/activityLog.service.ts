import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middlewares/error.middleware';

const prisma = new PrismaClient();

interface GetActivityLogsParams {
  page: number;
  limit: number;
  startDate?: Date;
  endDate?: Date;
  dataType?: 'binning' | 'picking' | 'attendance' | 'daily_log';
  status?: 'success' | 'failure';
  userId?: number;
}

export const getActivityLogs = async (params: GetActivityLogsParams) => {
  const { page, limit, startDate, endDate, dataType, status, userId } = params;

  const where = {
    ...(startDate && endDate && {
      activityTime: {
        gte: startDate,
        lte: endDate,
      },
    }),
    ...(dataType && { dataType }),
    ...(status && { status }),
    ...(userId && { userId }),
  };

  const [total, logs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { activityTime: 'desc' },
    }),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}; 