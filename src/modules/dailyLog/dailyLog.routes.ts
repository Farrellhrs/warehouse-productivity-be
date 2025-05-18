import { Router } from 'express';
import { validate } from '../../middlewares/validation.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import {
  createOrUpdateDailyLogController,
  getDailyLogsController,
  getDailyLogByIdController,
  deleteDailyLogController,
  getUserDailyLogsController,
  getDailyLogStatsController,
} from './dailyLog.controller';
import {
  createOrUpdateDailyLogSchema,
  getDailyLogsSchema,
  getDailyLogByIdSchema,
  deleteDailyLogSchema,
  getUserDailyLogsSchema,
  getDailyLogStatsSchema,
} from './dailyLog.schema';

const router = Router();

// TODO: Add validation schemas for:
// - createOrUpdateDailyLog
// - getDailyLogs (with pagination and filters)
// - getDailyLogById
// - deleteDailyLog
// - getUserDailyLogs

// All routes require authentication
router.use(authenticate);

// TODO: Implement routes:
// POST /daily-logs - Create or update daily log
// GET /daily-logs - List daily logs with pagination and filters
// GET /daily-logs/:id - Get specific daily log
// DELETE /daily-logs/:id - Delete daily log
// GET /daily-logs/user/:userId - Get user's daily logs

// Create or update daily log
router.post(
  '/',
  validate(createOrUpdateDailyLogSchema),
  createOrUpdateDailyLogController
);

// Get all daily logs with pagination and filters
router.get('/', validate(getDailyLogsSchema), getDailyLogsController);

// Get daily log statistics
router.get('/stats', validate(getDailyLogStatsSchema), getDailyLogStatsController);

// Get user's daily logs
router.get(
  '/user/:userId',
  validate(getUserDailyLogsSchema),
  getUserDailyLogsController
);

// Get specific daily log
router.get(
  '/:id',
  validate(getDailyLogByIdSchema),
  getDailyLogByIdController
);

// Delete daily log
router.delete(
  '/:id',
  validate(deleteDailyLogSchema),
  deleteDailyLogController
);

export default router; 