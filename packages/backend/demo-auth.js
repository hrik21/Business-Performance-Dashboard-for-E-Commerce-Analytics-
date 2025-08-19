/**
 * Demo script to show authentication system functionality
 * Run with: node demo-auth.js
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import the app
const app = require('./dist/index.js').default;

const PORT = process.env.PORT || 3001;

console.log('🚀 Starting E-commerce BI Dashboard Backend...');
console.log('📊 Authentication system is ready!');
console.log('');
console.log('Available endpoints:');
console.log('  POST /api/auth/login     - User login');
console.log('  POST /api/auth/refresh   - Refresh access token');
console.log('  POST /api/auth/logout    - User logout');
console.log('  GET  /api/auth/profile   - Get user profile (requires auth)');
console.log('  PUT  /api/auth/profile   - Update user profile (requires auth)');
console.log('  GET  /health             - Health check');
console.log('');
console.log('Test users:');
console.log('  admin@example.com    / secret123 (Admin)');
console.log('  analyst@example.com  / secret123 (Business Analyst)');
console.log('  manager@example.com  / secret123 (Supply Chain Manager)');
console.log('');
console.log('Example curl commands:');
console.log('');
console.log('# Login:');
console.log('curl -X POST http://localhost:3001/api/auth/login \\');
console.log('  -H "Content-Type: application/json" \\');
console.log('  -d \'{"email":"admin@example.com","password":"secret123"}\'');
console.log('');
console.log('# Get profile (replace TOKEN with access token from login):');
console.log('curl -X GET http://localhost:3001/api/auth/profile \\');
console.log('  -H "Authorization: Bearer TOKEN"');
console.log('');

// Start server
app.listen(PORT, () => {
  console.log(`🌟 Server running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});