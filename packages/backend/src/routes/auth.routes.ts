/**
 * Authentication routes
 */

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));

// Protected routes
router.post('/logout', authenticate, (req, res) => authController.logout(req as any, res));
router.get('/profile', authenticate, (req, res) => authController.getProfile(req as any, res));
router.put('/profile', authenticate, (req, res) => authController.updateProfile(req as any, res));

export default router;