import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter: Router = Router();

authRouter.post('/register', authRateLimiter, AuthController.register);
authRouter.post('/login', authRateLimiter, AuthController.login);
authRouter.post('/logout', requireAuth, AuthController.logout);
authRouter.get('/me', requireAuth, AuthController.me);
