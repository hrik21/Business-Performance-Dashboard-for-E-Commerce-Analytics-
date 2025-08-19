/**
 * Unit tests for AuthController
 */

import { Request, Response } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { User } from '@ecommerce-bi/shared';

// Mock dependencies
jest.mock('../services/auth.service');
jest.mock('../repositories/user.repository');

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockAuthService: jest.Mocked<typeof authService>;
  let mockUserRepository: jest.Mocked<typeof userRepository>;

  const mockUser: User & { password: string } = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedpassword',
    role: {
      id: 'admin',
      name: 'admin',
      description: 'Administrator',
      permissions: [{ id: '1', resource: '*', action: 'admin' }]
    },
    permissions: [{ id: '1', resource: '*', action: 'admin' }],
    createdAt: new Date(),
    isActive: true
  };

  beforeEach(() => {
    authController = new AuthController();
    mockRequest = {
      body: {},
      headers: { 'x-request-id': 'test-request-id' },
      user: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockAuthService = authService as jest.Mocked<typeof authService>;
    mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockAuthService.comparePassword.mockResolvedValue(true);
      mockAuthService.generateTokens.mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900
      });

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockAuthService.comparePassword).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(mockUserRepository.storeRefreshToken).toHaveBeenCalledWith('1', 'refresh-token');
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith('1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({
            id: '1',
            email: 'test@example.com'
          }),
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          expiresIn: 900
        },
        metadata: expect.any(Object)
      });
    });

    it('should reject login with missing credentials', async () => {
      mockRequest.body = { email: 'test@example.com' }; // missing password

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_CREDENTIALS',
          message: 'Email and password are required'
        }
      });
    });

    it('should reject login with invalid email', async () => {
      mockRequest.body = {
        email: 'invalid@example.com',
        password: 'password123'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    });

    it('should reject login with invalid password', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockAuthService.comparePassword.mockResolvedValue(false);

      await authController.login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      mockRequest.body = { refreshToken: 'valid-refresh-token' };

      mockAuthService.verifyRefreshToken.mockReturnValue({ userId: '1' });
      mockUserRepository.validateAndRemoveRefreshToken.mockResolvedValue('1');
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockAuthService.generateTokens.mockReturnValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900
      });

      await authController.refreshToken(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockUserRepository.validateAndRemoveRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockUserRepository.storeRefreshToken).toHaveBeenCalledWith('1', 'new-refresh-token');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: 'new-access-token',
          expiresIn: 900
        },
        metadata: expect.any(Object)
      });
    });

    it('should reject refresh with missing token', async () => {
      mockRequest.body = {};

      await authController.refreshToken(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_REFRESH_TOKEN',
          message: 'Refresh token is required'
        }
      });
    });

    it('should reject refresh with invalid token', async () => {
      mockRequest.body = { refreshToken: 'invalid-refresh-token' };

      mockAuthService.verifyRefreshToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authController.refreshToken(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully with refresh token', async () => {
      mockRequest.body = { refreshToken: 'refresh-token' };
      mockRequest.user = { userId: '1', email: 'test@example.com', role: 'admin', permissions: [] };

      await authController.logout(mockRequest as any, mockResponse as Response);

      expect(mockUserRepository.validateAndRemoveRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Logged out successfully' },
        metadata: expect.any(Object)
      });
    });

    it('should logout from all devices without refresh token', async () => {
      mockRequest.body = {};
      mockRequest.user = { userId: '1', email: 'test@example.com', role: 'admin', permissions: [] };

      await authController.logout(mockRequest as any, mockResponse as Response);

      expect(mockUserRepository.removeAllRefreshTokens).toHaveBeenCalledWith('1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Logged out successfully' },
        metadata: expect.any(Object)
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      mockRequest.user = { userId: '1', email: 'test@example.com', role: 'admin', permissions: [] };
      mockUserRepository.findById.mockResolvedValue(mockUser);

      await authController.getProfile(mockRequest as any, mockResponse as Response);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
        metadata: expect.any(Object)
      });
    });

    it('should return 404 for non-existent user', async () => {
      mockRequest.user = { userId: '999', email: 'test@example.com', role: 'admin', permissions: [] };
      mockUserRepository.findById.mockResolvedValue(null);

      await authController.getProfile(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      mockRequest.body = { firstName: 'Updated', lastName: 'Name' };
      mockRequest.user = { userId: '1', email: 'test@example.com', role: 'admin', permissions: [] };
      
      const updatedUser = { ...mockUser, firstName: 'Updated', lastName: 'Name' };
      mockUserRepository.updateProfile.mockResolvedValue(updatedUser);

      await authController.updateProfile(mockRequest as any, mockResponse as Response);

      expect(mockUserRepository.updateProfile).toHaveBeenCalledWith('1', {
        firstName: 'Updated',
        lastName: 'Name'
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: updatedUser,
        metadata: expect.any(Object)
      });
    });

    it('should reject update with no data', async () => {
      mockRequest.body = {};
      mockRequest.user = { userId: '1', email: 'test@example.com', role: 'admin', permissions: [] };

      await authController.updateProfile(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_DATA',
          message: 'At least one field (firstName or lastName) is required'
        }
      });
    });
  });
});