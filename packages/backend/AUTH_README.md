# Authentication & Authorization System

This document describes the JWT-based authentication and role-based authorization system implemented for the E-commerce BI Dashboard backend.

## Features

- **JWT-based Authentication**: Secure token-based authentication with access and refresh tokens
- **Role-based Authorization**: Granular permission system with roles and resource-based access control
- **Password Security**: Bcrypt hashing with salt rounds for secure password storage
- **Token Management**: Automatic token refresh and secure logout functionality
- **Middleware Protection**: Express middleware for route protection and permission checking

## Architecture

### Core Components

1. **AuthService** (`src/services/auth.service.ts`)
   - JWT token generation and validation
   - Password hashing and comparison
   - Permission checking logic

2. **AuthController** (`src/controllers/auth.controller.ts`)
   - Login, logout, and profile management endpoints
   - Token refresh functionality
   - Error handling and response formatting

3. **AuthMiddleware** (`src/middleware/auth.middleware.ts`)
   - Request authentication
   - Role-based authorization
   - Permission-based access control

4. **UserRepository** (`src/repositories/user.repository.ts`)
   - User data management
   - Refresh token storage and validation

## API Endpoints

### Public Endpoints

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "secret123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": {
        "id": "admin",
        "name": "admin",
        "description": "System Administrator"
      },
      "permissions": [...]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

#### POST /api/auth/refresh
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900
  }
}
```

### Protected Endpoints

#### POST /api/auth/logout
Logout user and invalidate refresh tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..." // optional
}
```

#### GET /api/auth/profile
Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### PUT /api/auth/profile
Update user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "firstName": "Updated",
  "lastName": "Name"
}
```

## User Roles & Permissions

### Default Users

1. **Admin** (`admin@example.com`)
   - Role: `admin`
   - Permissions: `*:admin` (full system access)

2. **Business Analyst** (`analyst@example.com`)
   - Role: `analyst`
   - Permissions: 
     - `dashboard:read`
     - `sales:read`
     - `customer:read`

3. **Supply Chain Manager** (`manager@example.com`)
   - Role: `manager`
   - Permissions:
     - `dashboard:read`
     - `supply-chain:write`
     - `inventory:write`

### Permission Format

Permissions follow the format: `resource:action`

- **Resources**: `dashboard`, `sales`, `customer`, `supply-chain`, `inventory`, `*` (all)
- **Actions**: `read`, `write`, `delete`, `admin`

## Middleware Usage

### Authentication Middleware

```typescript
import { authenticate } from './middleware/auth.middleware';

// Protect route with authentication
router.get('/protected', authenticate, (req, res) => {
  // req.user contains JWT payload
  res.json({ user: req.user });
});
```

### Role-based Authorization

```typescript
import { authorize } from './middleware/auth.middleware';

// Allow only admin and manager roles
router.get('/admin-only', authenticate, authorize(['admin', 'manager']), handler);
```

### Permission-based Authorization

```typescript
import { requirePermission } from './middleware/auth.middleware';

// Require specific permission
router.get('/sales', authenticate, requirePermission('sales', 'read'), handler);
```

### Optional Authentication

```typescript
import { optionalAuth } from './middleware/auth.middleware';

// Optional authentication (doesn't fail if no token)
router.get('/public', optionalAuth, (req, res) => {
  if (req.user) {
    // User is authenticated
  } else {
    // Anonymous access
  }
});
```

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

## Security Features

1. **Password Hashing**: Bcrypt with 12 salt rounds
2. **Token Expiry**: Short-lived access tokens (15 minutes) with long-lived refresh tokens (7 days)
3. **Token Invalidation**: Refresh tokens are invalidated on use and logout
4. **CORS Protection**: Configured for cross-origin requests
5. **Helmet Security**: Security headers for Express
6. **Input Validation**: Request validation and sanitization

## Testing

The authentication system includes comprehensive tests:

- **Unit Tests**: Service, middleware, and controller logic
- **Integration Tests**: End-to-end API testing
- **Coverage**: 100% test coverage for authentication components

Run tests:
```bash
npm test -- --testPathPattern="auth"
```

## Demo

To see the authentication system in action:

```bash
# Build the project
npm run build

# Run the demo
node demo-auth.js
```

This will start the server with example curl commands to test the authentication endpoints.