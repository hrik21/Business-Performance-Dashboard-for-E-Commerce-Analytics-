/**
 * User repository for database operations
 */

import { User, UserRole, Permission } from '@ecommerce-bi/shared';

// Mock data for development - in production this would connect to PostgreSQL
const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    password: '$2a$12$kDhVmwHDK6BvwLDNlksIzO9/PFgIb3KXynIwBTWnF/dT8x3dFCzOi', // secret123
    role: {
      id: 'admin',
      name: 'admin',
      description: 'System Administrator',
      permissions: [
        { id: '1', resource: '*', action: 'admin' }
      ]
    },
    permissions: [
      { id: '1', resource: '*', action: 'admin' }
    ],
    createdAt: new Date('2024-01-01'),
    isActive: true
  },
  {
    id: '2',
    email: 'analyst@example.com',
    firstName: 'Business',
    lastName: 'Analyst',
    password: '$2a$12$kDhVmwHDK6BvwLDNlksIzO9/PFgIb3KXynIwBTWnF/dT8x3dFCzOi', // secret123
    role: {
      id: 'analyst',
      name: 'analyst',
      description: 'Business Analyst',
      permissions: [
        { id: '2', resource: 'dashboard', action: 'read' },
        { id: '3', resource: 'sales', action: 'read' },
        { id: '4', resource: 'customer', action: 'read' }
      ]
    },
    permissions: [
      { id: '2', resource: 'dashboard', action: 'read' },
      { id: '3', resource: 'sales', action: 'read' },
      { id: '4', resource: 'customer', action: 'read' }
    ],
    createdAt: new Date('2024-01-02'),
    isActive: true
  },
  {
    id: '3',
    email: 'manager@example.com',
    firstName: 'Supply Chain',
    lastName: 'Manager',
    password: '$2a$12$kDhVmwHDK6BvwLDNlksIzO9/PFgIb3KXynIwBTWnF/dT8x3dFCzOi', // secret123
    role: {
      id: 'manager',
      name: 'manager',
      description: 'Supply Chain Manager',
      permissions: [
        { id: '5', resource: 'dashboard', action: 'read' },
        { id: '6', resource: 'supply-chain', action: 'write' },
        { id: '7', resource: 'inventory', action: 'write' }
      ]
    },
    permissions: [
      { id: '5', resource: 'dashboard', action: 'read' },
      { id: '6', resource: 'supply-chain', action: 'write' },
      { id: '7', resource: 'inventory', action: 'write' }
    ],
    createdAt: new Date('2024-01-03'),
    isActive: true
  }
];

// Store for refresh tokens (in production, use Redis)
const refreshTokenStore = new Map<string, string>();

export class UserRepository {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<(User & { password: string }) | null> {
    const user = mockUsers.find(u => u.email === email && u.isActive);
    return user || null;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = mockUsers.find(u => u.id === id && u.isActive);
    if (!user) return null;

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.lastLogin = new Date();
    }
  }

  /**
   * Store refresh token
   */
  async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    refreshTokenStore.set(refreshToken, userId);
  }

  /**
   * Validate and remove refresh token
   */
  async validateAndRemoveRefreshToken(refreshToken: string): Promise<string | null> {
    const userId = refreshTokenStore.get(refreshToken);
    if (userId) {
      refreshTokenStore.delete(refreshToken);
      return userId;
    }
    return null;
  }

  /**
   * Remove all refresh tokens for a user (logout from all devices)
   */
  async removeAllRefreshTokens(userId: string): Promise<void> {
    for (const [token, id] of refreshTokenStore.entries()) {
      if (id === userId) {
        refreshTokenStore.delete(token);
      }
    }
  }

  /**
   * Create new user (for future implementation)
   */
  async create(userData: Omit<User & { password: string }, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User & { password: string } = {
      ...userData,
      id: (mockUsers.length + 1).toString(),
      createdAt: new Date()
    };
    
    mockUsers.push(newUser);
    
    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<Pick<User, 'firstName' | 'lastName'>>): Promise<User | null> {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    const user = mockUsers[userIndex];
    Object.assign(user, updates);

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const userRepository = new UserRepository();