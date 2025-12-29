# Dastkar Rugs Backend API

Backend API for Dastkar Rugs e-commerce platform built with Fastify, TypeScript, and MongoDB.

## 🚀 Tech Stack

- **Fastify** - Fast web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - Database (Mongoose ODM)
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **AWS S3** - Image storage (optional - falls back to local storage)

## 📁 Project Structure

```
src/
├── config/          # Configuration files (database)
├── controllers/     # Request handlers
├── middlewares/     # Middleware functions
├── models/          # Mongoose models
├── routes/          # API routes
├── scripts/         # Utility scripts (seeders)
├── types/           # TypeScript types/interfaces
├── utils/           # Helper functions
└── index.ts         # Main server file
```

## 🔧 Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/
JWT_SECRET=your-super-secret-jwt-key
COOKIE_SECRET=your-cookie-secret-key
ADMIN_EMAIL=admin@dastkarrugs.com
ADMIN_PASSWORD=admin123
ADMIN_USERNAME=Admin

# AWS S3 Configuration (Optional - for image storage)
# Agar ye variables set nahi hain, to images locally save hongi
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET_NAME=dastkar-rugs
AWS_REGION=us-east-2
```

3. **Seed admin user:**
```bash
npm run seed:admin
```

4. **Build TypeScript:**
```bash
npm run build
```

5. **Start server:**
```bash
# Development (with ts-node)
npm run dev

# Production (from compiled dist)
npm start
```

## 📡 API Endpoints

### Authentication Routes

#### 1. Register
**POST** `/auth/register`

Register a new user (upgrades guest session to verified user).

**Request Body:**
```json
{
  "username": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "address": "123 Main St" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "John Doe",
    "email": "john@example.com",
    "isAdmin": false,
    "verified": true
  }
}
```

#### 2. Login
**POST** `/auth/login`

Login endpoint (works for both regular users and admins).

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "John Doe",
    "email": "john@example.com",
    "isAdmin": false,
    "verified": true
  }
}
```

**Note:** Same endpoint works for admin login. Check `isAdmin` flag in response to redirect to admin dashboard.

#### 3. Google Login
**POST** `/auth/google`

Login/Register with Google account.

**Request Body:**
```json
{
  "email": "user@gmail.com",
  "username": "User Name"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Google login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "User Name",
    "email": "user@gmail.com",
    "isAdmin": false,
    "verified": true,
    "isGoogleLogin": true
  }
}
```

#### 4. Get Current User
**GET** `/auth/me`

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "username": "John Doe",
    "email": "john@example.com",
    "address": "123 Main St",
    "isAdmin": false,
    "verified": true,
    "isGoogleLogin": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Health Check

#### Health Check
**GET** `/health`

Check server and database status.

**Response:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔐 Authentication Flow

### Guest User Flow
1. User visits website → Server creates session cookie and guest `LiteUser` record
2. Guest can browse and add items to cart (session-based)
3. When guest registers → Same record gets upgraded to verified user
4. Session cookie removed after verification

### Registered User Flow
1. User logs in → JWT token generated
2. Token sent in `Authorization: Bearer <token>` header
3. Protected routes use `authGuard` middleware
4. Admin routes use `adminGuard` middleware (requires `isAdmin: true`)

### Admin Flow
1. Admin logs in using same `/auth/login` endpoint
2. Response includes `isAdmin: true`
3. Frontend redirects to admin dashboard
4. Admin routes protected with `authGuard` + `adminGuard`

## 📝 User States

| Type | verified | isAdmin | sessionId |
|------|----------|---------|-----------|
| Guest | false | false | ✅ present |
| Registered User | true | false | ❌ null |
| Admin | true | true | ❌ null |

## 🛡️ Middleware

### Session Middleware
- Automatically runs on all routes
- Creates guest `LiteUser` if session cookie doesn't exist
- Attaches `sessionId` to request object

### Auth Guard
- Verifies JWT token from `Authorization` header
- Attaches `user` object to request with `id` and `isAdmin`

### Admin Guard
- Must be used after `authGuard`
- Checks if `user.isAdmin === true`
- Returns 403 if user is not admin

## 🗄️ Database Models

### LiteUser
```typescript
{
  sessionId?: string;          // Present only for guests
  username?: string;
  email?: string;              // Unique, sparse index
  password?: string;           // Hashed with bcrypt
  address?: string;
  verified: boolean;           // Default: false
  isGoogleLogin: boolean;      // Default: false
  isAdmin: boolean;            // Default: false
  createdAt: Date;
}
```

## 🔒 Security Features

- Password hashing with bcryptjs (10 rounds)
- JWT token authentication (7 days expiry)
- HTTP-only cookies for session management
- Admin role-based access control
- Input validation and error handling

## 📌 Notes

- **Same endpoint for admin and customer login** - Check `isAdmin` flag in response
- **Guest session automatically created** - No need to explicitly create guest user
- **Email merge handling** - If same email used again, existing user is updated
- **Session cleanup** - Session cookie removed after user verification
- **S3 Image Storage** - Agar AWS credentials set hain, to images S3 pe upload hongi. Warna locally `/uploads/rugs/` folder mein save hongi

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check MongoDB Atlas IP whitelist (allow `0.0.0.0/0` for development)
- Verify `MONGODB_URI` in `.env` file
- Check internet connection

### Port Already in Use
- Change `PORT` in `.env` file
- Or stop the process using that port

### Token Issues
- Ensure `JWT_SECRET` is set in `.env`
- Check token expiry (default: 7 days)
- Verify `Authorization` header format: `Bearer <token>`

## 📄 License

ISC

