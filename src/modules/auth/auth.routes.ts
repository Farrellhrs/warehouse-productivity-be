import { Router } from 'express';
import { registerHandler, loginHandler, refreshTokenHandler, logoutHandler } from './auth.controller';
import { validate } from '../../middlewares/validation.middleware';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// Public routes - no authentication required
router.post('/register', validate(registerSchema), registerHandler);
router.post('/login', validate(loginSchema), loginHandler);
router.post('/refresh-token', validate(refreshTokenSchema), refreshTokenHandler);

// Protected routes - authentication required
router.post('/logout', authenticate, logoutHandler);

export default router; 