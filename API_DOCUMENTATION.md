# Dastkar Rugs - Authentication API Documentation

**Base URL:** `http://localhost:5000` (Development)

## Overview

This API provides authentication and user management functionality for the Dastkar Rugs e-commerce platform. The system supports guest users, registered users, admin users, and Google OAuth login.

---

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [API Endpoints](#api-endpoints)
3. [Request/Response Examples](#requestresponse-examples)
4. [Error Handling](#error-handling)
5. [Session Management](#session-management)

---

## Authentication Flow

### Guest User Flow
1. User visits website → Session cookie automatically created
2. `POST /auth/session` → Create guest user record
3. User browses and adds items to cart
4. `POST /auth/guest-checkout` → Save email/address for purchase
5. Optionally: `POST /auth/register` → Create account with password

### Registered User Flow
1. `POST /auth/register` → Create account
2. `POST /auth/login` → Login with email/password
3. `GET /auth/me` → Get current user info
4. `PUT /auth/profile` → Update address/phone

### Google OAuth Flow
1. User clicks "Sign in with Google" → Get `idToken` from Google
2. `POST /auth/google` → Login/Register with Google token

---

## API Endpoints

### 1. Create Session User (Guest)
**Endpoint:** `POST /auth/session`  
**Auth:** Not required (session cookie needed)

**Request:**
```json
{} // Empty body
```

**Response (200):**
```json
{
  "success": true,
  "message": "Guest user created successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "sessionId": "abc-123-xyz-456",
    "verified": false,
    "isGoogleLogin": false,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Use Case:** Call this when user first visits to create a guest user record.

---

### 2. Register
**Endpoint:** `POST /auth/register`  
**Auth:** Not required (session cookie needed)

**Request:**
```json
{
  "username": "John Doe",
  "email": "john@example.com",
  "password": "mypassword123",
  "address": "123 Main St",
  "phoneNumber": "+1234567890"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "isAdmin": false,
    "verified": true
  }
}
```

**Validation:**
- `username`: 2-50 chars, alphanumeric + spaces
- `email`: Valid email format
- `password`: Min 6 characters
- `phoneNumber`: 10-15 digits, optional + prefix

---

### 3. Login
**Endpoint:** `POST /auth/login`  
**Auth:** Not required

**Request:**
```json
{
  "email": "john@example.com",
  "password": "mypassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "John Doe",
    "email": "john@example.com",
    "isAdmin": false,
    "verified": true
  }
}
```

**Note:** Same endpoint for admin and regular users. Check `isAdmin` field in response.

---

### 4. Google Login
**Endpoint:** `POST /auth/google`  
**Auth:** Not required (session cookie needed)

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Google login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "John Doe",
    "email": "john@gmail.com",
    "isAdmin": false,
    "verified": true,
    "isGoogleLogin": true
  }
}
```

**Frontend Implementation:**
```javascript
// After Google Sign-In
const idToken = googleUser.getAuthResponse().id_token;
const response = await fetch('/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken })
});
```

---

### 5. Get Current User
**Endpoint:** `GET /auth/me`  
**Auth:** Required (Bearer token)

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "John Doe",
    "email": "john@example.com",
    "address": "123 Main St",
    "phoneNumber": "+1234567890",
    "isAdmin": false,
    "verified": true,
    "isGoogleLogin": false,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 6. Guest Checkout
**Endpoint:** `POST /auth/guest-checkout`  
**Auth:** Not required (session cookie needed)

**Request:**
```json
{
  "email": "john@example.com",
  "username": "John Doe",
  "address": "123 Main St",
  "phoneNumber": "+1234567890"
}
```

**Response Scenarios:**

**Scenario 1: New Guest User (200)**
```json
{
  "success": true,
  "message": "Guest checkout information saved successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "username": "John Doe",
    "address": "123 Main St",
    "phoneNumber": "+1234567890",
    "sessionId": "abc-123-xyz-456",
    "verified": false
  }
}
```

**Scenario 2: Verified User Found - Auto Login (200)**
```json
{
  "success": true,
  "message": "Welcome back! You are now logged in.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "username": "John Doe",
    "address": "123 Main St",
    "phoneNumber": "+1234567890",
    "verified": true
  }
}
```

**Frontend Logic:**
```javascript
const response = await fetch('/auth/guest-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important for cookies
  body: JSON.stringify({ email, username, address, phoneNumber })
});

const data = await response.json();

if (data.token) {
  // User auto-logged in (verified user found)
  localStorage.setItem('token', data.token);
  // Proceed to payment
} else {
  // Guest user (unverified)
  // Proceed to payment
}
```

---

### 7. Update Profile
**Endpoint:** `PUT /auth/profile`  
**Auth:** Required (Bearer token)  
**Note:** Only for regular users, not admins

**Request:**
```json
{
  "address": "456 New Street",
  "phoneNumber": "+9876543210"
}
```
At least one field required.

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "John Doe",
    "email": "john@example.com",
    "address": "456 New Street",
    "phoneNumber": "+9876543210",
    "verified": true,
    "isGoogleLogin": false,
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Email already registered. Please login instead."
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to save guest checkout information"
}
```

### Frontend Error Handling Example

```javascript
try {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle error
    alert(data.message);
    return;
  }

  // Success
  if (data.token) {
    localStorage.setItem('token', data.token);
    // Redirect based on isAdmin
    if (data.user.isAdmin) {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = '/dashboard';
    }
  }
} catch (error) {
  console.error('Network error:', error);
  alert('Network error. Please try again.');
}
```

---

## Session Management

### Automatic Session Creation
- Backend automatically creates `session_id` cookie on first visit
- Cookie expires in 7 days
- HttpOnly, SameSite: Lax

### JWT Token Storage
- Store token in `localStorage` or `sessionStorage`
- Include in requests: `Authorization: Bearer <token>`
- Token expires in 7 days

### Example: Axios Setup

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true, // For cookies
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Complete User Flow Example

```javascript
// 1. User visits website - session auto-created
// 2. Create guest user
const sessionResponse = await fetch('/auth/session', {
  method: 'POST',
  credentials: 'include'
});
const sessionData = await sessionResponse.json();

// 3. User browses and adds to cart (local storage)

// 4. Checkout - guest checkout
const checkoutResponse = await fetch('/auth/guest-checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'john@example.com',
    username: 'John Doe',
    address: '123 Main St',
    phoneNumber: '+1234567890'
  })
});
const checkoutData = await checkoutResponse.json();

// 5. If token returned (verified user), save it
if (checkoutData.token) {
  localStorage.setItem('token', checkoutData.token);
}

// 6. Proceed to payment...

// 7. Later: User registers
const registerResponse = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    username: 'John Doe',
    email: 'john@example.com',
    password: 'mypassword123',
    address: '123 Main St',
    phoneNumber: '+1234567890'
  })
});
const registerData = await registerResponse.json();
localStorage.setItem('token', registerData.token);
```

---

## Quick Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/session` | POST | No | Create guest user |
| `/auth/register` | POST | No* | Register new user |
| `/auth/login` | POST | No | Login (admin/user) |
| `/auth/google` | POST | No* | Google OAuth login |
| `/auth/me` | GET | Yes | Get current user |
| `/auth/guest-checkout` | POST | No* | Save guest info |
| `/auth/profile` | PUT | Yes | Update profile |

*Session cookie needed (automatically managed)

---

**Note:** All endpoints support CORS. Always include `credentials: 'include'` in fetch requests to send/receive cookies.
