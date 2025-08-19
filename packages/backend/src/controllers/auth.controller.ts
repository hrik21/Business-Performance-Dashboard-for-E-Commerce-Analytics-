/**
 * Authentication controller for user management API endpoints
 */

import { Request, Response } from 'express';
import { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse, ApiResponse } from '@ecommerce-bi/shared';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AuthController {
  /**
   * User login endpoint
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_CREDENTIALS',
            message: 'Email and password are required'
          }
        } as LoginResponse);
        return;
      }

      // Find user by email
      const user = await userRepository.findByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        } as LoginResponse);
        return;
      }

      // Verify password
      const isValidPassword = await authService.comparePassword(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        } as LoginResponse);
        return;
      }

      // Generate tokens
      const { password: _, ...userWithoutPassword } = user;
      const tokens = authService.generateTokens(userWithoutPassword);

      // Store refresh token
      await userRepository.storeRefreshToken(user.id, tokens.refreshToken);

      // Update last login
      await userRepository.updateLastLogin(user.id);

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        },
        metadata: {
          timestamp: new Date(),
          requestId: req.headers['x-request-id'] as string || 'unknown'
        }
      } as LoginResponse);

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred during login'
        }
      } as LoginResponse);
    }
  }

  /**
   * Refresh access token endpoint
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenRequest = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token is required'
          }
        } as RefreshTokenResponse);
        return;
      }

      // Verify refresh token
      const payload = authService.verifyRefreshToken(refreshToken);
      
      // Validate and remove the used refresh token
      const userId = await userRepository.validateAndRemoveRefreshToken(refreshToken);
      if (!userId || userId !== payload.userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid or expired refresh token'
          }
        } as RefreshTokenResponse);
        return;
      }

      // Get user data
      const user = await userRepository.findById(userId);
      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        } as RefreshTokenResponse);
        return;
      }

      // Generate new tokens
      const tokens = authService.generateTokens(user);
      
      // Store new refresh token
      await userRepository.storeRefreshToken(user.id, tokens.refreshToken);

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn
        },
        metadata: {
          timestamp: new Date(),
          requestId: req.headers['x-request-id'] as string || 'unknown'
        }
      } as RefreshTokenResponse);

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      } as RefreshTokenResponse);
    }
  }

  /**
   * User logout endpoint
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Remove specific refresh token
        await userRepository.validateAndRemoveRefreshToken(refreshToken);
      } else {
        // Remove all refresh tokens for the user (logout from all devices)
        await userRepository.removeAllRefreshTokens(req.user.userId);
      }

      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
        metadata: {
          timestamp: new Date(),
          requestId: req.headers['x-request-id'] as string || 'unknown'
        }
      } as ApiResponse<{ message: string }>);

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred during logout'
        }
      } as ApiResponse<never>);
    }
  }

  /**
   * Get current user profile endpoint
   */
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await userRepository.findById(req.user.userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        } as ApiResponse<never>);
        return;
      }

      res.json({
        success: true,
        data: user,
        metadata: {
          timestamp: new Date(),
          requestId: req.headers['x-request-id'] as string || 'unknown'
        }
      } as ApiResponse<typeof user>);

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred while fetching profile'
        }
      } as ApiResponse<never>);
    }
  }

  /**
   * Update user profile endpoint
   */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { firstName, lastName } = req.body;

      // Validate input
      if (!firstName && !lastName) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DATA',
            message: 'At least one field (firstName or lastName) is required'
          }
        } as ApiResponse<never>);
        return;
      }

      const updates: { firstName?: string; lastName?: string } = {};
      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;

      const updatedUser = await userRepository.updateProfile(req.user.userId, updates);
      
      if (!updatedUser) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        } as ApiResponse<never>);
        return;
      }

      res.json({
        success: true,
        data: updatedUser,
        metadata: {
          timestamp: new Date(),
          requestId: req.headers['x-request-id'] as string || 'unknown'
        }
      } as ApiResponse<typeof updatedUser>);

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred while updating profile'
        }
      } as ApiResponse<never>);
    }
  }
}

export const authController = new AuthController();