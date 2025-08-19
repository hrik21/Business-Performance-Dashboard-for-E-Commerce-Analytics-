/**
 * Unit tests for authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize, requirePermission, optionalAuth } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';
import { User } from '@ecommerce-bi/shared';

// Mock the auth service
jest.mock('../services/auth.service');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockAuthService: jest.Mocked<typeof authService>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
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
    mockRequest = {
      headers: {},
      user: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    mockAuthService = authService as jest.Mocked<typeof authService>;
  });

  describe('authenticate middleware', () => {
    it('should authenticate valid token', () => {
      const token = 'valid-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      
      const mockPayload = {
        userId: '1',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['*:admin']
      };

      mockAuthService.verifyAccessToken.mockReturnValue(mockPayload);

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject request without authorization header', () => {
      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization format', () => {
      mockRequest.headers = { authorization: 'InvalidFormat token' };

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired access token'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    it('should allow access for authorized role', () => {
      mockRequest.user = {
        userId: '1',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['*:admin']
      };

      const middleware = authorize(['admin', 'manager']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      mockRequest.user = {
        userId: '1',
        email: 'test@example.com',
        role: 'user',
        permissions: ['dashboard:read']
      };

      const middleware = authorize(['admin', 'manager']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to access this resource'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for unauthenticated user', () => {
      const middleware = authorize(['admin']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requirePermission middleware', () => {
    it('should allow access with correct permission', () => {
      mockRequest.user = {
        userId: '1',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['dashboard:read']
      };

      mockAuthService.hasPermission.mockReturnValue(true);

      const middleware = requirePermission('dashboard', 'read');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAuthService.hasPermission).toHaveBeenCalledWith(
        ['dashboard:read'],
        'dashboard',
        'read'
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access without correct permission', () => {
      mockRequest.user = {
        userId: '1',
        email: 'test@example.com',
        role: 'user',
        permissions: ['dashboard:read']
      };

      mockAuthService.hasPermission.mockReturnValue(false);

      const middleware = requirePermission('sales', 'write');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Permission required: sales:write'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for unauthenticated user', () => {
      const middleware = requirePermission('dashboard', 'read');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth middleware', () => {
    it('should set user for valid token', () => {
      const token = 'valid-token';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      
      const mockPayload = {
        userId: '1',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['*:admin']
      };

      mockAuthService.verifyAccessToken.mockReturnValue(mockPayload);

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user for invalid token', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };
      mockAuthService.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when no token provided', () => {
      optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});