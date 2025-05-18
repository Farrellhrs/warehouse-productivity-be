import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middlewares/error.middleware';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export const getPerformanceMetrics = async (
  startDate: Date,
  endDate: Date,
  userId?: number,
  groupBy: 'day' | 'week' | 'month' = 'day'
) => {
  const where = {
    logDate: {
      gte: startDate,
      lte: endDate,
    },
    ...(userId && { userId }),
  };

  const logs = await prisma.dailyLog.findMany({
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
    orderBy: { logDate: 'asc' },
  });

  // Group logs by time period
  const groupedLogs = logs.reduce((acc, log) => {
    let key: string;
    switch (groupBy) {
      case 'week':
        key = startOfWeek(log.logDate).toISOString();
        break;
      case 'month':
        key = startOfMonth(log.logDate).toISOString();
        break;
      default:
        key = startOfDay(log.logDate).toISOString();
    }

    if (!acc[key]) {
      acc[key] = {
        period: key,
        totalItems: 0,
        totalBinning: 0,
        totalPicking: 0,
        presentCount: 0,
        totalCount: 0,
        operators: new Set(),
      };
    }

    acc[key].totalItems += log.totalItems;
    acc[key].totalBinning += log.binningCount;
    acc[key].totalPicking += log.pickingCount;
    acc[key].presentCount += log.isPresent ? 1 : 0;
    acc[key].totalCount += 1;
    acc[key].operators.add(log.userId);

    return acc;
  }, {} as Record<string, any>);

  // Calculate averages and format data
  return Object.values(groupedLogs).map((group) => ({
    period: group.period,
    totalItems: group.totalItems,
    averageItemsPerOperator: group.totalItems / group.operators.size,
    binningPercentage: (group.totalBinning / group.totalItems) * 100,
    pickingPercentage: (group.totalPicking / group.totalItems) * 100,
    attendanceRate: (group.presentCount / group.totalCount) * 100,
    activeOperators: group.operators.size,
  }));
};

export const getOperatorPerformance = async (userId: number, startDate: Date, endDate: Date) => {
  const logs = await prisma.dailyLog.findMany({
    where: {
      userId,
      logDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { logDate: 'asc' },
  });

  if (logs.length === 0) {
    throw new AppError(404, 'No performance data found for this operator');
  }

  const totalItems = logs.reduce((sum, log) => sum + log.totalItems, 0);
  const totalBinning = logs.reduce((sum, log) => sum + log.binningCount, 0);
  const totalPicking = logs.reduce((sum, log) => sum + log.pickingCount, 0);
  const presentDays = logs.filter((log) => log.isPresent).length;

  // Get current target
  const currentTarget = await prisma.target.findFirst({
    where: {
      effectiveFrom: { lte: new Date() },
      OR: [
        { effectiveTo: { gt: new Date() } },
        { effectiveTo: null },
      ],
    },
    orderBy: { effectiveFrom: 'desc' },
  });

  return {
    totalItems,
    averageItemsPerDay: totalItems / logs.length,
    binningPercentage: (totalBinning / totalItems) * 100,
    pickingPercentage: (totalPicking / totalItems) * 100,
    attendanceRate: (presentDays / logs.length) * 100,
    targetAchievement: currentTarget
      ? (totalItems / (currentTarget.dailyTarget * logs.length)) * 100
      : null,
    dailyBreakdown: logs.map((log) => ({
      date: log.logDate,
      totalItems: log.totalItems,
      binningCount: log.binningCount,
      pickingCount: log.pickingCount,
      isPresent: log.isPresent,
    })),
  };
};

export const getTeamPerformance = async (
  startDate: Date,
  endDate: Date,
  groupBy: 'day' | 'week' | 'month' = 'day'
) => {
  const logs = await prisma.dailyLog.findMany({
    where: {
      logDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    },
    orderBy: { logDate: 'asc' },
  });

  // Group logs by time period
  const groupedLogs = logs.reduce((acc, log) => {
    let key: string;
    switch (groupBy) {
      case 'week':
        key = startOfWeek(log.logDate).toISOString();
        break;
      case 'month':
        key = startOfMonth(log.logDate).toISOString();
        break;
      default:
        key = startOfDay(log.logDate).toISOString();
    }

    if (!acc[key]) {
      acc[key] = {
        period: key,
        totalItems: 0,
        totalBinning: 0,
        totalPicking: 0,
        presentCount: 0,
        totalCount: 0,
        operators: new Set(),
        operatorPerformance: {},
      };
    }

    acc[key].totalItems += log.totalItems;
    acc[key].totalBinning += log.binningCount;
    acc[key].totalPicking += log.pickingCount;
    acc[key].presentCount += log.isPresent ? 1 : 0;
    acc[key].totalCount += 1;
    acc[key].operators.add(log.userId);

    // Track individual operator performance
    if (!acc[key].operatorPerformance[log.userId]) {
      acc[key].operatorPerformance[log.userId] = {
        userId: log.userId,
        username: log.user.username,
        fullName: log.user.fullName,
        totalItems: 0,
        presentDays: 0,
      };
    }
    acc[key].operatorPerformance[log.userId].totalItems += log.totalItems;
    acc[key].operatorPerformance[log.userId].presentDays += log.isPresent ? 1 : 0;

    return acc;
  }, {} as Record<string, any>);

  // Get current target
  const currentTarget = await prisma.target.findFirst({
    where: {
      effectiveFrom: { lte: new Date() },
      OR: [
        { effectiveTo: { gt: new Date() } },
        { effectiveTo: null },
      ],
    },
    orderBy: { effectiveFrom: 'desc' },
  });

  // Format and return data
  return Object.values(groupedLogs).map((group) => ({
    period: group.period,
    totalItems: group.totalItems,
    averageItemsPerOperator: group.totalItems / group.operators.size,
    binningPercentage: (group.totalBinning / group.totalItems) * 100,
    pickingPercentage: (group.totalPicking / group.totalItems) * 100,
    attendanceRate: (group.presentCount / group.totalCount) * 100,
    activeOperators: group.operators.size,
    targetAchievement: currentTarget
      ? (group.totalItems / (currentTarget.dailyTarget * group.totalCount)) * 100
      : null,
    operatorPerformance: Object.values(group.operatorPerformance).map((op: any) => ({
      userId: op.userId,
      username: op.username,
      fullName: op.fullName,
      totalItems: op.totalItems,
      averageItemsPerDay: op.totalItems / group.totalCount,
      attendanceRate: (op.presentDays / group.totalCount) * 100,
    })),
  }));
};

export const requestReport = async (
  userId: number,
  startDate: Date,
  endDate: Date,
  reportType: 'daily' | 'weekly' | 'monthly',
  exportFormat: 'excel' | 'pdf',
  emailTo?: string
) => {
  const reportRequest = await prisma.reportRequest.create({
    data: {
      userId,
      startDate,
      endDate,
      reportType,
      exportFormat,
      emailTo,
      status: 'pending',
    },
  });

  // TODO: Implement report generation and email sending logic
  // This would typically be handled by a background job

  return reportRequest;
};

export const getReportStatus = async (reportId: number) => {
  const report = await prisma.reportRequest.findUnique({
    where: { id: reportId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  if (!report) {
    throw new AppError(404, 'Report request not found');
  }

  return report;
}; 