# Backend Detaylı Dokümantasyon

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Teknoloji Stack](#teknoloji-stack)
3. [Proje Yapısı](#proje-yapısı)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Authentication](#authentication)
7. [Middleware](#middleware)
8. [Services](#services)
9. [Error Handling](#error-handling)
10. [Logging](#logging)

---

## Genel Bakış

Backend, Node.js ve Express.js kullanılarak geliştirilmiş RESTful API servisidir.

### Temel Bilgiler
```
Framework:      Express.js 4.18.2
Runtime:        Node.js 18.x LTS
Port:           5001
Database:       PostgreSQL 15
Authentication: JWT
API Version:    v1
Base URL:       /api
```

### Özellikler
- ✅ RESTful API architecture
- ✅ JWT-based authentication
- ✅ Role-based authorization
- ✅ Input validation
- ✅ Error handling
- ✅ Logging system
- ✅ File upload support
- ✅ AI integration (Gemini)
- ✅ Background jobs
- ✅ Cron jobs
- ✅ i18n support

---

## Teknoloji Stack

### Core Dependencies
```json
{
  "express": "^4.18.2",           // Web framework
  "pg": "^8.11.3",                // PostgreSQL client
  "pg-pool": "^3.6.1",            // Connection pooling
  "dotenv": "^16.3.1",            // Environment variables
  "cors": "^2.8.5",               // CORS middleware
  "helmet": "^7.1.0"              // Security headers
}
```

### Authentication & Security
```json
{
  "jsonwebtoken": "^9.0.2",       // JWT tokens
  "bcryptjs": "^2.4.3",           // Password hashing
  "express-rate-limit": "^7.1.5", // Rate limiting
  "express-validator": "^7.0.1",  // Input validation
  "joi": "^18.0.1"                // Schema validation
}
```

### AI & Background Jobs
```json
{
  "@google/generative-ai": "^0.24.1", // Gemini AI
  "bull": "^4.12.2",                  // Job queue
  "redis": "^4.6.10",                 // Redis client
  "node-cron": "^3.0.3"               // Cron jobs
}
```

### File Handling & Logging
```json
{
  "multer": "^1.4.5-lts.1",      // File upload
  "winston": "^3.11.0",          // Logging
  "i18n": "^0.15.3"              // Internationalization
}
```

---

## Proje Yapısı

```
backend/
├── config/
│   ├── database.js              # Database configuration
│   ├── ai.js                    # AI configuration
│   └── redis.js                 # Redis configuration
│
├── controllers/
│   ├── authController.js        # Authentication logic
│   ├── userController.js        # User management
│   ├── accountController.js     # Account operations
│   ├── creditCardController.js  # Credit card operations
│   ├── transactionController.js # Transaction operations
│   ├── fixedPaymentController.js # Fixed payments
│   ├── budgetController.js      # Budget management
│   ├── reportController.js      # Reports & analytics
│   └── notificationController.js # Notifications
│
├── database/
│   ├── schema.sql               # Database schema
│   ├── migrate.js               # Migration script
│   └── pool.js                  # Connection pool
│
├── jobs/
│   ├── notificationJobs.js      # Notification jobs
│   ├── reportJobs.js            # Report generation
│   └── cleanupJobs.js           # Cleanup tasks
│
├── middleware/
│   ├── auth.js                  # Authentication middleware
│   ├── validation.js            # Validation middleware
│   ├── errorHandler.js          # Error handling
│   ├── rateLimiter.js           # Rate limiting
│   └── logger.js                # Request logging
│
├── models/
│   ├── User.js                  # User model
│   ├── Account.js               # Account model
│   ├── CreditCard.js            # Credit card model
│   ├── Transaction.js           # Transaction model
│   ├── FixedPayment.js          # Fixed payment model
│   └── Budget.js                # Budget model
│
├── routes/
│   ├── auth.js                  # Auth routes
│   ├── users.js                 # User routes
│   ├── accounts.js              # Account routes
│   ├── creditCards.js           # Credit card routes
│   ├── transactions.js          # Transaction routes
│   ├── fixedPayments.js         # Fixed payment routes
│   ├── budgets.js               # Budget routes
│   ├── reports.js               # Report routes
│   └── notifications.js         # Notification routes
│
├── services/
│   ├── aiService.js             # AI service (Gemini)
│   ├── emailService.js          # Email service
│   ├── notificationService.js   # Notification service
│   └── reportService.js         # Report generation
│
├── utils/
│   ├── logger.js                # Winston logger
│   ├── validators.js            # Custom validators
│   ├── helpers.js               # Helper functions
│   └── constants.js             # Constants
│
├── logs/                        # Log files
│   ├── app.log
│   ├── error.log
│   └── combined.log
│
├── uploads/                     # Uploaded files
│
├── .env                         # Environment variables
├── Dockerfile                   # Docker image
├── package.json                 # Dependencies
└── server.js                    # Entry point
```

---

## API Endpoints

### Base URL
```
Production:  https://budgetapp.site/api
Test:        http://108.141.152.224/api
Local:       http://localhost:5001/api
```

### Authentication Endpoints

#### POST /api/auth/register
Yeni kullanıcı kaydı
```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /api/auth/login
Kullanıcı girişi
```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET /api/auth/me
Mevcut kullanıcı bilgisi (requires auth)
```json
Headers:
{
  "Authorization": "Bearer <token>"
}

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
  }
}
```

### Account Endpoints

#### GET /api/accounts
Tüm hesapları listele (requires auth)
```json
Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ana Hesap",
      "type": "checking",
      "balance": 5000.00,
      "currency": "TRY",
      "is_active": true
    }
  ]
}
```

#### POST /api/accounts
Yeni hesap oluştur (requires auth)
```json
Request:
{
  "name": "Tasarruf Hesabı",
  "type": "savings",
  "balance": 10000.00,
  "currency": "TRY"
}

Response (201):
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": 2,
    "name": "Tasarruf Hesabı",
    "type": "savings",
    "balance": 10000.00,
    "currency": "TRY"
  }
}
```

#### PUT /api/accounts/:id
Hesap güncelle (requires auth)
```json
Request:
{
  "name": "Yeni Hesap Adı",
  "balance": 15000.00
}

Response (200):
{
  "success": true,
  "message": "Account updated successfully",
  "data": {
    "id": 2,
    "name": "Yeni Hesap Adı",
    "balance": 15000.00
  }
}
```

#### DELETE /api/accounts/:id
Hesap sil (requires auth)
```json
Response (200):
{
  "success": true,
  "message": "Account deleted successfully"
}
```

### Transaction Endpoints

#### GET /api/transactions
İşlemleri listele (requires auth)
```json
Query Parameters:
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD
- type: income|expense|transfer|payment
- category: string
- account_id: number
- limit: number (default: 50)
- offset: number (default: 0)

Response (200):
{
  "success": true,
  "data": {
    "transactions": [...],
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

#### POST /api/transactions
Yeni işlem oluştur (requires auth)
```json
Request:
{
  "type": "expense",
  "amount": 150.00,
  "description": "Market alışverişi",
  "category": "Gıda",
  "account_id": 1,
  "transaction_date": "2024-12-02"
}

Response (201):
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "id": 1,
    "type": "expense",
    "amount": 150.00,
    "description": "Market alışverişi",
    "category": "Gıda",
    "account_id": 1,
    "transaction_date": "2024-12-02"
  }
}
```

### Credit Card Endpoints

#### GET /api/credit-cards
Kredi kartlarını listele (requires auth)

#### POST /api/credit-cards
Yeni kredi kartı ekle (requires auth)

#### PUT /api/credit-cards/:id
Kredi kartı güncelle (requires auth)

#### DELETE /api/credit-cards/:id
Kredi kartı sil (requires auth)

### Report Endpoints

#### GET /api/reports/summary
Özet rapor (requires auth)
```json
Query Parameters:
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD

Response (200):
{
  "success": true,
  "data": {
    "total_income": 10000.00,
    "total_expense": 7500.00,
    "net_income": 2500.00,
    "by_category": {...},
    "by_account": {...}
  }
}
```

#### GET /api/reports/monthly
Aylık rapor (requires auth)

#### GET /api/reports/yearly
Yıllık rapor (requires auth)

---

## Database Schema

### users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### accounts
```sql
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'TRY',
    overdraft_limit DECIMAL(12,2) DEFAULT 0.00,
    overdraft_used DECIMAL(12,2) DEFAULT 0.00,
    overdraft_interest_rate DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### credit_cards
```sql
CREATE TABLE credit_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100),
    credit_limit DECIMAL(12,2) NOT NULL,
    current_balance DECIMAL(12,2) DEFAULT 0.00,
    interest_rate DECIMAL(5,2) NOT NULL,
    minimum_payment_rate DECIMAL(5,2) DEFAULT 5.00,
    payment_due_date INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### transactions
```sql
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    credit_card_id INTEGER REFERENCES credit_cards(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### fixed_payments
```sql
CREATE TABLE fixed_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(100),
    due_day INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### budgets
```sql
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    monthly_limit DECIMAL(12,2) NOT NULL,
    current_spent DECIMAL(12,2) DEFAULT 0.00,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category, month, year)
);
```

### smart_notifications
```sql
CREATE TABLE smart_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    related_entity_type VARCHAR(50),
    related_entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Authentication

### JWT Token Structure
```javascript
{
  "userId": 1,
  "email": "user@example.com",
  "role": "user",
  "iat": 1701518400,
  "exp": 1701604800
}
```

### Token Generation
```javascript
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};
```

### Token Verification
```javascript
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

### Password Hashing
```javascript
const bcrypt = require('bcryptjs');

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
```

---

## Middleware

### Authentication Middleware
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
};

module.exports = auth;
```

### Admin Middleware
```javascript
// middleware/admin.js
const admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

module.exports = admin;
```

### Rate Limiter
```javascript
// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

module.exports = apiLimiter;
```

### Error Handler
```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
```

---

## Services

### AI Service (Gemini)
```javascript
// services/aiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const categorizeTransaction = async (description) => {
  const model = genAI.getGenerativeModel({ 
    model: process.env.GEMINI_MODEL 
  });
  
  const prompt = `Categorize this transaction: "${description}"`;
  const result = await model.generateContent(prompt);
  
  return result.response.text();
};

module.exports = { categorizeTransaction };
```

### Notification Service
```javascript
// services/notificationService.js
const createNotification = async (userId, type, title, message) => {
  const query = `
    INSERT INTO smart_notifications 
    (user_id, notification_type, title, message)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  const result = await pool.query(query, [userId, type, title, message]);
  return result.rows[0];
};

module.exports = { createNotification };
```

---

## Error Handling

### Custom Error Classes
```javascript
// utils/errors.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError
};
```

---

## Logging

### Winston Logger Configuration
```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### Usage
```javascript
const logger = require('./utils/logger');

logger.info('User logged in', { userId: 1 });
logger.error('Database error', { error: err.message });
logger.warn('High memory usage', { usage: '85%' });
```

---

**Hazırlayan:** Kiro AI  
**Tarih:** 2 Aralık 2024  
**Versiyon:** 1.0
