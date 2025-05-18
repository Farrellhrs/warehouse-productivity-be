import { Request, Response } from 'express';
import { getActivityLogs as getActivityLogsService } from './activityLog.service';

export const getActivityLogs = async (req: Request, res: Response) => {
  const { page, limit, startDate, endDate, dataType, status, userId } = req.query;
  
  const logs = await getActivityLogsService({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    dataType: dataType as 'binning' | 'picking' | 'attendance' | 'daily_log' | undefined,
    status: status as 'success' | 'failure' | undefined,
    userId: userId ? Number(userId) : undefined,
  });

  res.json({
    success: true,
    message: 'Activity logs retrieved successfully',
    data: logs,
  });
}; 