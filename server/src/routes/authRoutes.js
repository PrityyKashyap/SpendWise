import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/protect.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '@spendwise/shared/validators/auth.js';

const router = Router();

// Public. Rate-limited because these are the endpoints worth brute-forcing.
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);

// Authenticated by the refresh cookie rather than a Bearer token.
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Requires a valid access token.
router.get('/me', protect, authController.me);
router.patch('/me', protect, validate(updateProfileSchema), authController.updateProfile);
router.patch(
  '/change-password',
  protect,
  authLimiter,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;
