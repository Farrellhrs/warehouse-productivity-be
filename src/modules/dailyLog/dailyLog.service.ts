import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middlewares/error.middleware';

const prisma = new PrismaClient();

// TODO: Implement createOrUpdateDailyLog function
// - Accept userId, logDate, isPresent, binningCount, pickingCount
// - Check if user exists and has operator role
// - Create or update daily log using upsert
// - Calculate totalItems (binningCount + pickingCount)
// - Create activity log entry
// - Return created/updated daily log

// TODO: Implement getDailyLogs function
// - Accept pagination params (page, limit)
// - Accept filter params (startDate, endDate, userId)
// - Query daily logs with user details
// - Return paginated results with total count

// TODO: Implement getDailyLogById function
// - Accept log ID
// - Query daily log with user details
// - Throw AppError if not found
// - Return daily log

// TODO: Implement deleteDailyLog function
// - Accept log ID
// - Check if log exists
// - Check user permissions
// - Delete log
// - Create activity log entry
// - Return success message

// TODO: Implement getUserDailyLogs function
// - Accept userId and pagination params
// - Accept date range params
// - Query user's daily logs
// - Return paginated results with total count

// TODO: Implement getDailyLogStats function
// - Accept date range params
// - Calculate total items processed
// - Calculate average items per day
// - Calculate attendance rate
// - Return statistics object 

export const createOrUpdateDailyLog = async (
  userId: number,
  logDate: Date,
  isPresent: boolean,
  binningCount?: number,
  pickingCount?: number
) => {
  // Validate date is not in the future
  if (logDate > new Date()) {
    throw new AppError(400, 'Cannot create log for future dates');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Allow both operators and editors to create daily logs
  if (user.role.name !== 'operator' && user.role.name !== 'editor') {
    throw new AppError(403, 'Only operators and editors can create daily logs');
  }

  // Validate counts if present
  if (binningCount !== undefined && binningCount < 0) {
    throw new AppError(400, 'binningCount must be a non-negative number');
  }
  if (pickingCount !== undefined && pickingCount < 0) {
    throw new AppError(400, 'pickingCount must be a non-negative number');
  }

  const totalItems = (binningCount || 0) + (pickingCount || 0);

  const dailyLog = await prisma.dailyLog.upsert({
    where: {
      userId_logDate: {
        userId,
        logDate,
      },
    },
    update: {
      isPresent,
      binningCount,
      pickingCount,
      totalItems,
    },
    create: {
      userId,
      logDate,
      isPresent,
      binningCount,
      pickingCount,
      totalItems,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      dataType: 'daily_log',
      status: 'success',
      changeHistory: { 
        details: `Updated daily log for ${logDate.toISOString()}`,
        changes: {
          isPresent,
          binningCount,
          pickingCount,
          totalItems,
        }
      },
    },
  });

  return dailyLog;
};

export const getDailyLogs = async (
  page: number,
  limit: number,
  startDate?: Date,
  endDate?: Date,
  userId?: number
) => {
  // Validate date range
  if (startDate && endDate && startDate > endDate) {
    throw new AppError(400, 'startDate must be before or equal to endDate');
  }

  // Validate pagination
  if (page < 1) {
    throw new AppError(400, 'page must be at least 1');
  }
  if (limit < 1 || limit > 100) {
    throw new AppError(400, 'limit must be between 1 and 100');
  }

  const where = {
    ...(startDate && endDate && {
      logDate: {
        gte: startDate,
        lte: endDate,
      },
    }),
    ...(userId && { userId }),
  };

  const [total, logs] = await Promise.all([
    prisma.dailyLog.count({ where }),
    prisma.dailyLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { logDate: 'desc' },
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

export const getDailyLogById = async (id: number) => {
  if (!id || id < 1) {
    throw new AppError(400, 'Invalid log ID');
  }

  const log = await prisma.dailyLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!log) {
    throw new AppError(404, 'Daily log not found');
  }

  return log;
};

export const deleteDailyLog = async (id: number, userId: number) => {
  if (!id || id < 1) {
    throw new AppError(400, 'Invalid log ID');
  }

  const log = await prisma.dailyLog.findUnique({
    where: { id },
    include: { 
      user: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!log) {
    throw new AppError(404, 'Daily log not found');
  }

  // Only allow deletion by the log owner or admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (log.userId !== userId && user.role.name !== 'admin') {
    throw new AppError(403, 'Not authorized to delete this log');
  }

  await prisma.dailyLog.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      userId,
      dataType: 'daily_log',
      status: 'success',
      changeHistory: { 
        details: `Deleted daily log ${id}`,
        deletedLog: {
          id: log.id,
          userId: log.userId,
          logDate: log.logDate,
          isPresent: log.isPresent,
          binningCount: log.binningCount,
          pickingCount: log.pickingCount,
          totalItems: log.totalItems,
        }
      },
    },
  });

  return { message: 'Daily log deleted successfully' };
};

export const getUserDailyLogs = async (
  userId: number,
  page: number,
  limit: number,
  startDate?: Date,
  endDate?: Date
) => {
  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Validate date range
  if (startDate && endDate && startDate > endDate) {
    throw new AppError(400, 'startDate must be before or equal to endDate');
  }

  // Validate pagination
  if (page < 1) {
    throw new AppError(400, 'page must be at least 1');
  }
  if (limit < 1 || limit > 100) {
    throw new AppError(400, 'limit must be between 1 and 100');
  }

  const where = {
    userId,
    ...(startDate && endDate && {
      logDate: {
        gte: startDate,
        lte: endDate,
      },
    }),
  };

  const [total, logs] = await Promise.all([
    prisma.dailyLog.count({ where }),
    prisma.dailyLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { logDate: 'desc' },
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

export const getDailyLogStats = async (startDate: Date, endDate: Date, userId: number) => {
  // Validate date range
  if (!startDate || !endDate) {
    throw new AppError(400, 'startDate and endDate are required');
  }

  if (startDate > endDate) {
    throw new AppError(400, 'startDate must be before or equal to endDate');
  }

  // Validate user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const logs = await prisma.dailyLog.findMany({
    where: {
      userId,
      logDate: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const presentDays = logs.filter(log => log.isPresent).length;
  const totalBinning = logs.reduce((sum, log) => sum + (log.binningCount || 0), 0);
  const totalPicking = logs.reduce((sum, log) => sum + (log.pickingCount || 0), 0);
  const totalItems = totalBinning + totalPicking;

  return {
    totalBinning,
    totalPicking,
    totalItems,
    averageItemsPerDay: presentDays > 0 ? totalItems / presentDays : 0,
    presentDays,
    totalDays,
    attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
  };
}; 