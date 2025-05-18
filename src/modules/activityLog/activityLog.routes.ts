import { Router } from 'express';
import { validate } from '../../middlewares/validation.middleware';
import { authenticate } from '../../middlewares/auth.middleware';
import { checkRole } from '../../middlewares/rbac.middleware';
import { getActivityLogs } from './activityLog.controller';
import { activityLogQuerySchema } from './activityLog.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get activity logs (admin only)
router.get('/', 
  checkRole(['admin']), 
  validate(activityLogQuerySchema), 
  getActivityLogs
);

export default router; 