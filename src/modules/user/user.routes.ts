import { Router } from 'express';
import { getAllUsers } from './user.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { canView } from '../../middlewares/role.middleware';

const router = Router();

// Get all users - requires authentication and view permission
router.get('/', authenticate, canView, getAllUsers);

export default router; 