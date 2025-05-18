import { Request, Response } from 'express';
import {
  getPerformanceMetrics,
  getOperatorPerformance,
  getTeamPerformance,
  requestReport,
  getReportStatus,
} from './performanceMetrics.service';

export const getPerformanceMetricsController = async (req: Request, res: Response) => {
  const { startDate, endDate, userId, groupBy } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate are required' });
  }

  const metrics = await getPerformanceMetrics(
    new Date(startDate as string),
    new Date(endDate as string),
    userId ? Number(userId) : undefined,
    groupBy as 'day' | 'week' | 'month'
  );

  res.status(200).json(metrics);
};

export const getOperatorPerformanceController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate are required' });
  }

  const performance = await getOperatorPerformance(
    Number(userId),
    new Date(startDate as string),
    new Date(endDate as string)
  );

  res.status(200).json(performance);
};

export const getTeamPerformanceController = async (req: Request, res: Response) => {
  const { startDate, endDate, groupBy } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate are required' });
  }

  const performance = await getTeamPerformance(
    new Date(startDate as string),
    new Date(endDate as string),
    groupBy as 'day' | 'week' | 'month'
  );

  res.status(200).json(performance);
};

export const requestReportController = async (req: Request, res: Response) => {
  const { startDate, endDate, reportType, exportFormat, emailTo } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const report = await requestReport(
    userId,
    new Date(startDate),
    new Date(endDate),
    reportType,
    exportFormat,
    emailTo
  );

  res.status(201).json(report);
};

export const getReportStatusController = async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const status = await getReportStatus(Number(reportId));
  res.status(200).json(status);
}; 