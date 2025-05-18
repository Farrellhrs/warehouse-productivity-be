import { Router } from 'express';
import { validate } from '../../middlewares/validation.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  getPerformanceMetricsController,
  getOperatorPerformanceController,
  getTeamPerformanceController,
  requestReportController,
  getReportStatusController,
} from './performanceMetrics.controller';
import {
  getPerformanceMetricsSchema,
  getOperatorPerformanceSchema,
  getTeamPerformanceSchema,
  requestReportSchema,
  getReportStatusSchema,
} from './performanceMetrics.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get performance metrics
router.get(
  '/performance-metrics',
  validate(getPerformanceMetricsSchema),
  getPerformanceMetricsController
);

// Get operator performance
router.get(
  '/performance-metrics/operator/:userId',
  validate(getOperatorPerformanceSchema),
  getOperatorPerformanceController
);

// Get team performance
router.get(
  '/performance-metrics/team',
  validate(getTeamPerformanceSchema),
  getTeamPerformanceController
);

// Request report
router.post(
  '/reports',
  validate(requestReportSchema),
  requestReportController
);

// Get report status
router.get(
  '/reports/:reportId',
  validate(getReportStatusSchema),
  getReportStatusController
);

export default router; 