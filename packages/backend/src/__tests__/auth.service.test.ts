/**
 * Unit tests for AuthService
 */

import { AuthService } from '../services/auth.service';
import { User } from '@ecommerce-bi/shared';

describe('AuthService', () => {
  let authService: AuthService;
  
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
    authService = new AuthService();
  });

  describe('generateTokens', () => {
    it('should generate valid access and refresh tokens', () => {
      const tokens = authService.generateTokens(mockUser);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBeGreaterThan(0);
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should include user information in access token payload', () => {
      const tokens = authService.generateTokens(mockUser);
      const payload = authService.verifyAccessToken(tokens.accessToken);

      expect(payload.userId).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role.name);
      expect(payload.permissions).toContain('*:admin');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const tokens = authService.generateTokens(mockUser);
      const payload = authService.verifyAccessToken(tokens.accessToken);

      expect(payload.userId).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        authService.verifyAccessToken('invalid-token');
      }).toThrow('Invalid or expired access token');
    });

    it('should throw error for malformed token', () => {
      expect(() => {
        authService.verifyAccessToken('malformed.token.here');
      }).toThrow('Invalid or expired access token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const tokens = authService.generateTokens(mockUser);
      const payload = authService.verifyRefreshToken(tokens.refreshToken);

      expect(payload.userId).toBe(mockUser.id);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        authService.verifyRefreshToken('invalid-refresh-token');
      }).toThrow('Invalid or expired refresh token');
    });
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testpassword123';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testpassword123';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testpassword123';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.comparePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hash = await authService.hashPassword(password);
      const isValid = await authService.comparePassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should return true for exact permission match', () => {
      const permissions = ['dashboard:read', 'sales:write'];
      const hasPermission = authService.hasPermission(permissions, 'dashboard', 'read');

      expect(hasPermission).toBe(true);
    });

    it('should return true for admin permission', () => {
      const permissions = ['dashboard:admin'];
      const hasPermission = authService.hasPermission(permissions, 'dashboard', 'read');

      expect(hasPermission).toBe(true);
    });

    it('should return true for global admin permission', () => {
      const permissions = ['*:admin'];
      const hasPermission = authService.hasPermission(permissions, 'dashboard', 'read');

      expect(hasPermission).toBe(true);
    });

    it('should return false for missing permission', () => {
      const permissions = ['dashboard:read'];
      const hasPermission = authService.hasPermission(permissions, 'sales', 'write');

      expect(hasPermission).toBe(false);
    });

    it('should return false for insufficient permission level', () => {
      const permissions = ['dashboard:read'];
      const hasPermission = authService.hasPermission(permissions, 'dashboard', 'write');

      expect(hasPermission).toBe(false);
    });
  });
});