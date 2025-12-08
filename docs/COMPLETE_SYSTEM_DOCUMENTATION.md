# Budget Management Application - Complete System Documentation

**Version:** 2.0.0  
**Last Updated:** December 2, 2024  
**Author:** System Documentation  
**Purpose:** Complete technical reference for developers and system administrators

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Infrastructure](#4-infrastructure)
5. [Database Design](#5-database-design)
6. [Backend API](#6-backend-api)
7. [Frontend Application](#7-frontend-application)
8. [Deployment](#8-deployment)
9. [Environment Configuration](#9-environment-configuration)
10. [Security](#10-security)
11. [Monitoring & Logging](#11-monitoring--logging)
12. [Troubleshooting](#12-troubleshooting)
13. [Development Workflow](#13-development-workflow)
14. [Testing](#14-testing)
15. [Maintenance](#15-maintenance)

---

## 1. System Overview

### 1.1 Application Purpose
Budget Management Application is a comprehensive personal finance management system that allows users to:
- Track bank accounts, credit cards, and cash
- Manage income and expenses
- Handle fixed payments and installment payments
- Monitor overdraft accounts
- Generate financial reports
- Receive smart notifications
- Use AI-powered features for categorization and insights

### 1.2 Key Features
- **Multi-Account Management**: Support for checking, savings, investment, and overdraft accounts
- **Credit Card Tracking**: Monitor credit card balances, limits, and payment due dates
- **Transaction Management**: Record income, expenses, transfers, and payments
- **Fixed Payments**: Manage recurring monthly payments
- **Installment Payments**: Track installment purchases and payment schedules
- **Smart Notifications**: Automated payment reminders and budget alerts
- **AI Features**: Transaction categorization, financial insights, and recommendations
- **Multi-language Support**: Turkish and English (i18n ready)
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### 1.3 User Roles
- **User**: Standard user with access to personal financial data
- **Admin**: Administrative access to user management and system statistics

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
│                     (Cloudflare CDN)                         │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS (443)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Azure VM (Ubuntu)                         │
│                  98.71.149.168                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Docker Network                           │  │
│  │          (172.20.0.0/16)                             │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │  │
│  │  │   Nginx     │  │   Frontend   │  │  Backend   │ │  │
│  │  │  (Reverse   │◄─┤   (React)    │◄─┤  (Node.js) │ │  │
│  │  │   Proxy)    │  │   Port 3000  │  │  Port 5001 │ │  │
│  │  └──────┬──────┘  └──────────────┘  └─────┬──────┘ │  │
│  │         │                                   │        │  │
│  │         │                                   │        │  │
│  │         │                            ┌──────▼──────┐ │  │
│  │         │                            │  PostgreSQL │ │  │
│  │         │                            │  Port 5432  │ │  │
│  │         │                            └─────────────┘ │  │
│  └─────────┼───────────────────────────────────────────┘  │
│            │                                               │
│  ┌─────────▼───────────────────────────────────────────┐  │
│  │  Ports: 80 (HTTP), 443 (HTTPS)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

#### 2.2.1 Frontend (React)
- **Framework**: React 18.2.0
- **UI Library**: Material-UI (MUI) 5.14.20
- **State Management**: React Context API + Hooks
- **Routing**: React Router DOM 6.20.1
- **HTTP Client**: Axios 1.6.2
- **Charts**: Chart.js 4.5.1 + React-Chartjs-2 5.3.0
- **Forms**: React Hook Form 7.48.2 + Yup 1.3.3
- **Internationalization**: i18next 25.6.2 + react-i18next 16.3.3

#### 2.2.2 Backend (Node.js/Express)
- **Runtime**: Node.js 18 (Alpine Linux)
- **Framework**: Express 4.18.2
- **Database**: PostgreSQL 15 (Alpine Linux)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **Validation**: express-validator 7.0.1 + Joi 18.0.1
- **Logging**: Winston 3.11.0
- **Security**: Helmet 7.1.0
- **Rate Limiting**: express-rate-limit 7.1.5
- **AI Integration**: Google Generative AI 0.24.1

#### 2.2.3 Database (PostgreSQL)
- **Version**: PostgreSQL 15 (Alpine Linux)
- **Connection Pooling**: pg-pool 3.6.1
- **Max Connections**: 20
- **Idle Timeout**: 30 seconds

#### 2.2.4 Reverse Proxy (Nginx)
- **Version**: Nginx (Alpine Linux)
- **SSL/TLS**: Managed by Cloudflare
- **Rate Limiting**: Configured per endpoint
- **Compression**: Gzip enabled

### 2.3 Data Flow

```
User Request Flow:
1. User → Cloudflare CDN (HTTPS)
2. Cloudflare → Nginx (HTTP, port 80)
3. Nginx → Frontend (port 3000) OR Backend API (port 5001)
4. Backend → PostgreSQL (port 5432)
5. Response flows back through the same chain
```

---


## 3. Technology Stack

### 3.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| Material-UI | 5.14.20 | Component library |
| React Router | 6.20.1 | Client-side routing |
| Axios | 1.6.2 | HTTP client |
| Chart.js | 4.5.1 | Data visualization |
| React Hook Form | 7.48.2 | Form management |
| Yup | 1.3.3 | Schema validation |
| i18next | 25.6.2 | Internationalization |
| date-fns | 2.30.0 | Date manipulation |
| ExcelJS | 4.4.0 | Excel export |
| jsPDF | 3.0.3 | PDF export |

### 3.2 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18 | Runtime environment |
| Express | 4.18.2 | Web framework |
| PostgreSQL | 15 | Database |
| pg | 8.11.3 | PostgreSQL client |
| jsonwebtoken | 9.0.2 | JWT authentication |
| bcryptjs | 2.4.3 | Password hashing |
| Winston | 3.11.0 | Logging |
| Helmet | 7.1.0 | Security headers |
| CORS | 2.8.5 | Cross-origin resource sharing |
| express-rate-limit | 7.1.5 | Rate limiting |
| @google/generative-ai | 0.24.1 | AI features |
| node-cron | 3.0.3 | Scheduled tasks |
| Multer | 1.4.5-lts.1 | File uploads |

### 3.3 Infrastructure Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Docker | Latest | Containerization |
| Docker Compose | 3.8 | Multi-container orchestration |
| Nginx | Alpine | Reverse proxy |
| Ubuntu | 22.04 LTS | Server OS |
| GitHub Actions | - | CI/CD |
| Cloudflare | - | CDN & SSL |

### 3.4 Development Tools

| Tool | Purpose |
|------|---------|
| Git | Version control |
| GitHub | Code repository |
| VS Code | IDE |
| Postman | API testing |
| pgAdmin | Database management |
| Chrome DevTools | Frontend debugging |

---

## 4. Infrastructure

### 4.1 Production Environment

#### 4.1.1 Server Specifications
- **Provider**: Microsoft Azure
- **VM Type**: Standard B2s (2 vCPUs, 4 GB RAM)
- **OS**: Ubuntu 22.04 LTS
- **Public IP**: 98.71.149.168
- **Domain**: budgetapp.site (managed by Cloudflare)
- **Location**: East US

#### 4.1.2 Network Configuration
- **Inbound Ports**:
  - 22 (SSH) - Restricted to specific IPs
  - 80 (HTTP) - Open to internet
  - 443 (HTTPS) - Open to internet
- **Outbound**: All traffic allowed
- **Firewall**: Azure Network Security Group + UFW

#### 4.1.3 Docker Network
- **Network Name**: budget_network
- **Driver**: bridge
- **Subnet**: 172.20.0.0/16
- **Containers**:
  - budget_nginx (Nginx reverse proxy)
  - budget_frontend (React app)
  - budget_backend (Node.js API)
  - budget_database (PostgreSQL)

### 4.2 Container Configuration

#### 4.2.1 Nginx Container
```yaml
Image: nginx:alpine
Container Name: budget_nginx
Ports: 80:80, 443:443
Volumes:
  - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
  - ./nginx/ssl:/etc/nginx/ssl:ro
  - ./nginx/logs:/var/log/nginx
Health Check: nginx -t (every 30s)
Restart Policy: always
```

#### 4.2.2 Frontend Container
```yaml
Image: budgetapp-frontend (custom build)
Container Name: budget_frontend
Internal Port: 3000
Build Context: ./frontend
Build Args: REACT_APP_API_URL
Health Check: wget http://localhost:3000/ (every 30s)
Restart Policy: always
Depends On: backend (healthy)
```

#### 4.2.3 Backend Container
```yaml
Image: budgetapp-backend (custom build)
Container Name: budget_backend
Internal Port: 5001
Build Context: ./backend
Environment: See section 9.2
Volumes:
  - ./backend/logs:/app/logs
  - ./backend/uploads:/app/uploads
Health Check: curl http://localhost:5001/health (every 30s)
Restart Policy: always
Depends On: database (healthy)
```

#### 4.2.4 Database Container
```yaml
Image: postgres:15-alpine
Container Name: budget_database
Internal Port: 5432
Environment:
  - POSTGRES_DB: budget_app_prod
  - POSTGRES_USER: budget_admin
  - POSTGRES_PASSWORD: (from .env)
Volumes:
  - postgres_data:/var/lib/postgresql/data
  - ./backend/database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
Health Check: pg_isready (every 10s)
Restart Policy: always
```

### 4.3 Volume Management

#### 4.3.1 Named Volumes
- **postgres_data**: Database persistent storage
- **certbot_webroot**: SSL certificate validation (if using Let's Encrypt)

#### 4.3.2 Bind Mounts
- **Backend logs**: `./backend/logs` → `/app/logs`
- **Backend uploads**: `./backend/uploads` → `/app/uploads`
- **Nginx config**: `./nginx/nginx.conf` → `/etc/nginx/nginx.conf`
- **Nginx logs**: `./nginx/logs` → `/var/log/nginx`

### 4.4 Resource Limits

```yaml
Backend:
  Memory: 512MB (soft limit)
  CPU: 0.5 cores
  
Frontend:
  Memory: 256MB (soft limit)
  CPU: 0.25 cores
  
Database:
  Memory: 1GB (soft limit)
  CPU: 1 core
  
Nginx:
  Memory: 128MB (soft limit)
  CPU: 0.25 cores
```

### 4.5 Cloudflare Configuration

#### 4.5.1 DNS Settings
```
Type: A
Name: @
Content: 98.71.149.168
Proxy: Enabled (Orange cloud)
TTL: Auto

Type: A
Name: www
Content: 98.71.149.168
Proxy: Enabled (Orange cloud)
TTL: Auto
```

#### 4.5.2 SSL/TLS Settings
- **Mode**: Full (strict)
- **Edge Certificates**: Universal SSL (Active)
- **Always Use HTTPS**: Enabled
- **Minimum TLS Version**: 1.2
- **Opportunistic Encryption**: Enabled
- **TLS 1.3**: Enabled

#### 4.5.3 Security Settings
- **Security Level**: Medium
- **Challenge Passage**: 30 minutes
- **Browser Integrity Check**: Enabled
- **Privacy Pass Support**: Enabled

#### 4.5.4 Performance Settings
- **Auto Minify**: JavaScript, CSS, HTML
- **Brotli**: Enabled
- **Early Hints**: Enabled
- **HTTP/2**: Enabled
- **HTTP/3 (with QUIC)**: Enabled

---


## 5. Database Design

### 5.1 Database Schema Overview

The application uses PostgreSQL 15 with the following main tables:

```
users (authentication & user management)
  ├── accounts (bank accounts, cash, overdrafts)
  ├── credit_cards (credit card management)
  ├── transactions (all financial transactions)
  ├── fixed_payments (recurring monthly payments)
  │   └── fixed_payment_history (payment tracking)
  ├── installment_payments (installment purchases)
  │   └── installment_payment_transactions (payment history)
  ├── budgets (monthly budget limits)
  ├── notifications (system notifications)
  └── smart_notifications (advanced notification system)
```

### 5.2 Core Tables

#### 5.2.1 users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_users_email` on `email`

**Purpose**: Store user authentication and profile information

#### 5.2.2 accounts
```sql
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('checking', 'savings', 'cash', 'investment', 'overdraft')),
    balance DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'TRY',
    overdraft_limit DECIMAL(12,2) DEFAULT 0.00 CHECK (overdraft_limit >= 0),
    overdraft_used DECIMAL(12,2) DEFAULT 0.00 CHECK (overdraft_used >= 0),
    overdraft_interest_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (overdraft_interest_rate >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_accounts_user_id` on `user_id`

**Purpose**: Store bank accounts, cash accounts, and overdraft facilities

**Account Types**:
- `checking`: Regular checking account
- `savings`: Savings account
- `cash`: Physical cash
- `investment`: Investment account
- `overdraft`: Overdraft/credit line account

#### 5.2.3 credit_cards
```sql
CREATE TABLE credit_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100),
    credit_limit DECIMAL(12,2) NOT NULL CHECK (credit_limit > 0),
    current_balance DECIMAL(12,2) DEFAULT 0.00 CHECK (current_balance >= 0),
    interest_rate DECIMAL(5,2) NOT NULL CHECK (interest_rate >= 0 AND interest_rate <= 100),
    minimum_payment_rate DECIMAL(5,2) DEFAULT 5.00 CHECK (minimum_payment_rate > 0 AND minimum_payment_rate <= 100),
    payment_due_date INTEGER CHECK (payment_due_date >= 1 AND payment_due_date <= 31),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_credit_cards_user_id` on `user_id`

**Purpose**: Track credit card information, limits, and payment schedules

#### 5.2.4 transactions
```sql
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
    credit_card_id INTEGER REFERENCES credit_cards(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'payment')),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    category VARCHAR(100),
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transaction_account_check CHECK (
        (account_id IS NOT NULL AND credit_card_id IS NULL) OR
        (account_id IS NULL AND credit_card_id IS NOT NULL) OR
        (type = 'transfer' AND account_id IS NOT NULL)
    )
);
```

**Indexes**:
- `idx_transactions_user_id` on `user_id`
- `idx_transactions_date` on `transaction_date`
- `idx_transactions_category` on `category`

**Purpose**: Record all financial transactions

**Transaction Types**:
- `income`: Money received
- `expense`: Money spent
- `transfer`: Transfer between accounts
- `payment`: Credit card payment

#### 5.2.5 fixed_payments
```sql
CREATE TABLE fixed_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    category VARCHAR(100),
    due_day INTEGER NOT NULL CHECK (due_day >= 1 AND due_day <= 31),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_fixed_payments_user_id` on `user_id`

**Purpose**: Manage recurring monthly payments (rent, subscriptions, etc.)

#### 5.2.6 fixed_payment_history
```sql
CREATE TABLE fixed_payment_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fixed_payment_id INTEGER NOT NULL REFERENCES fixed_payments(id) ON DELETE CASCADE,
    payment_month INTEGER NOT NULL CHECK (payment_month >= 1 AND payment_month <= 12),
    payment_year INTEGER NOT NULL CHECK (payment_year >= 2020),
    is_paid BOOLEAN DEFAULT false,
    paid_date DATE,
    paid_amount DECIMAL(12,2),
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_payment_month_year UNIQUE(fixed_payment_id, payment_month, payment_year)
);
```

**Indexes**:
- `idx_fixed_payment_history_user_id` on `user_id`
- `idx_fixed_payment_history_fixed_payment_id` on `fixed_payment_id`
- `idx_fixed_payment_history_month_year` on `(payment_month, payment_year)`
- `idx_fixed_payment_history_is_paid` on `is_paid`

**Purpose**: Track payment history for fixed payments

#### 5.2.7 installment_payments
```sql
CREATE TABLE installment_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
    paid_amount DECIMAL(12,2) DEFAULT 0.00 CHECK (paid_amount >= 0),
    remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    installment_amount DECIMAL(12,2) NOT NULL CHECK (installment_amount > 0),
    total_installments INTEGER NOT NULL CHECK (total_installments > 0),
    paid_installments INTEGER DEFAULT 0 CHECK (paid_installments >= 0),
    remaining_installments INTEGER GENERATED ALWAYS AS (total_installments - paid_installments) STORED,
    interest_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (interest_rate >= 0),
    start_date DATE NOT NULL,
    next_payment_date DATE,
    vendor VARCHAR(200),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_installment_payments_user_id` on `user_id`
- `idx_installment_payments_next_payment` on `next_payment_date`
- `idx_installment_payments_category` on `category`

**Purpose**: Track installment purchases and payment schedules

#### 5.2.8 smart_notifications
```sql
CREATE TABLE smart_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    dismissed_at TIMESTAMP,
    related_entity_id UUID,
    related_entity_type VARCHAR(50),
    scheduled_for TIMESTAMP
);
```

**Indexes**:
- `idx_smart_notifications_user_id` on `user_id`
- `idx_smart_notifications_type` on `notification_type`
- `idx_smart_notifications_priority` on `priority`
- `idx_smart_notifications_created_at` on `created_at DESC`
- `idx_smart_notifications_is_read` on `is_read` WHERE `is_read = false`
- `idx_smart_notifications_is_dismissed` on `is_dismissed` WHERE `is_dismissed = false`

**Purpose**: Advanced notification system with rich metadata

### 5.3 Database Triggers

All tables with `updated_at` column have automatic update triggers:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_[table_name]_updated_at 
    BEFORE UPDATE ON [table_name]
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 5.4 Database Connection Configuration

```javascript
// backend/config/database.js
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'budget_app',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // Maximum pool size
  min: 2,  // Minimum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 60000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};
```

### 5.5 Database Backup Strategy

**Automated Backups**:
- Daily backups at 2:00 AM UTC
- Retention: 7 days
- Location: `/home/obiwan/budgetapp/backups/`

**Manual Backup Command**:
```bash
docker exec budget_database pg_dump -U budget_admin budget_app_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Restore Command**:
```bash
docker exec -i budget_database psql -U budget_admin budget_app_prod < backup_file.sql
```

---


## 6. Backend API

### 6.1 API Structure

Base URL: `https://budgetapp.site/api`

#### 6.1.1 Authentication Endpoints
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
POST   /api/auth/logout            - User logout
GET    /api/auth/me                - Get current user info
PUT    /api/auth/profile           - Update user profile
PUT    /api/auth/password          - Change password
```

#### 6.1.2 Account Endpoints
```
GET    /api/accounts               - Get all user accounts
GET    /api/accounts/:id           - Get specific account
POST   /api/accounts               - Create new account
PUT    /api/accounts/:id           - Update account
DELETE /api/accounts/:id           - Delete account
GET    /api/accounts/summary       - Get accounts summary
```

#### 6.1.3 Credit Card Endpoints
```
GET    /api/credit-cards           - Get all credit cards
GET    /api/credit-cards/:id       - Get specific credit card
POST   /api/credit-cards           - Create new credit card
PUT    /api/credit-cards/:id       - Update credit card
DELETE /api/credit-cards/:id       - Delete credit card
POST   /api/credit-cards/:id/payment - Make payment
```

#### 6.1.4 Transaction Endpoints
```
GET    /api/transactions           - Get all transactions (with filters)
GET    /api/transactions/:id       - Get specific transaction
POST   /api/transactions           - Create new transaction
PUT    /api/transactions/:id       - Update transaction
DELETE /api/transactions/:id       - Delete transaction
GET    /api/transactions/summary   - Get transaction summary
GET    /api/transactions/by-category - Get transactions by category
```

#### 6.1.5 Fixed Payment Endpoints
```
GET    /api/fixed-payments         - Get all fixed payments
GET    /api/fixed-payments/:id     - Get specific fixed payment
POST   /api/fixed-payments         - Create new fixed payment
PUT    /api/fixed-payments/:id     - Update fixed payment
DELETE /api/fixed-payments/:id     - Delete fixed payment
GET    /api/fixed-payments/upcoming - Get upcoming payments
POST   /api/fixed-payments/:id/mark-paid - Mark payment as paid
GET    /api/fixed-payments/:id/history - Get payment history
```

#### 6.1.6 Installment Payment Endpoints
```
GET    /api/installment-payments   - Get all installment payments
GET    /api/installment-payments/:id - Get specific installment
POST   /api/installment-payments   - Create new installment
PUT    /api/installment-payments/:id - Update installment
DELETE /api/installment-payments/:id - Delete installment
POST   /api/installment-payments/:id/pay - Record payment
```

#### 6.1.7 Report Endpoints
```
GET    /api/reports/income-expense - Income vs expense report
GET    /api/reports/category-analysis - Category analysis
GET    /api/reports/monthly-trend  - Monthly trend analysis
GET    /api/reports/enhanced       - Enhanced reports with AI
POST   /api/reports/export/excel   - Export to Excel
POST   /api/reports/export/pdf     - Export to PDF
```

#### 6.1.8 Notification Endpoints
```
GET    /api/notifications          - Get all notifications
GET    /api/notifications/unread   - Get unread notifications
PUT    /api/notifications/:id/read - Mark as read
PUT    /api/notifications/read-all - Mark all as read
DELETE /api/notifications/:id      - Delete notification
```

#### 6.1.9 AI Endpoints
```
POST   /api/ai/categorize          - AI transaction categorization
POST   /api/ai/insights            - Get AI financial insights
POST   /api/ai/recommendations     - Get AI recommendations
POST   /api/ai/query               - Natural language query
```

#### 6.1.10 Admin Endpoints
```
GET    /api/admin/users            - Get all users (admin only)
GET    /api/admin/statistics       - Get system statistics
PUT    /api/admin/users/:id        - Update user (admin only)
DELETE /api/admin/users/:id        - Delete user (admin only)
```

### 6.2 Authentication & Authorization

#### 6.2.1 JWT Token Structure
```javascript
{
  "userId": 123,
  "email": "user@example.com",
  "role": "user",
  "iat": 1701234567,
  "exp": 1701320967
}
```

**Token Expiration**: 24 hours  
**Storage**: localStorage (client-side)  
**Header**: `Authorization: Bearer <token>`

#### 6.2.2 Middleware Chain
```javascript
Request → CORS → Helmet → Rate Limit → Body Parser → Auth Middleware → Route Handler
```

#### 6.2.3 Rate Limiting
```javascript
// General API: 100 requests/minute
// Auth endpoints: 20 requests/minute
// AI endpoints: 60 requests/hour
```

### 6.3 Error Handling

#### 6.3.1 Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "timestamp": "2024-12-02T10:30:00.000Z"
}
```

#### 6.3.2 HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### 6.4 Request/Response Examples

#### 6.4.1 User Login
**Request**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

#### 6.4.2 Create Transaction
**Request**:
```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "expense",
  "amount": 150.50,
  "description": "Grocery shopping",
  "category": "Food",
  "accountId": 1,
  "transactionDate": "2024-12-02"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "transaction": {
    "id": 123,
    "type": "expense",
    "amount": 150.50,
    "description": "Grocery shopping",
    "category": "Food",
    "accountId": 1,
    "transactionDate": "2024-12-02",
    "createdAt": "2024-12-02T10:30:00.000Z"
  }
}
```

### 6.5 Logging

#### 6.5.1 Log Levels
- **error**: Critical errors requiring immediate attention
- **warn**: Warning messages
- **info**: General information
- **debug**: Detailed debugging information

#### 6.5.2 Log Files
- **Location**: `/app/logs/` (inside container), `./backend/logs/` (host)
- **Files**:
  - `combined.log`: All logs
  - `error.log`: Error logs only
  - `performance.log`: Performance metrics

#### 6.5.3 Log Format
```
2024-12-02 10:30:00 [INFO] Server started on port 5001
2024-12-02 10:30:15 [INFO] POST /api/auth/login - 200 - 45ms
2024-12-02 10:30:20 [ERROR] Database connection failed: Connection timeout
```

### 6.6 Security Features

#### 6.6.1 Helmet Security Headers
```javascript
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

#### 6.6.2 CORS Configuration
```javascript
Allowed Origins:
- https://budgetapp.site
- http://localhost:3000 (development)
- http://98.71.149.168 (production IP)

Allowed Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Credentials: true
```

#### 6.6.3 Password Security
- **Hashing**: bcrypt with 10 salt rounds
- **Minimum Length**: 6 characters
- **Requirements**: At least one uppercase, one lowercase, one digit

---


## 7. Frontend Application

### 7.1 Application Structure

```
frontend/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/          # Reusable components
│   │   ├── accounts/
│   │   ├── auth/
│   │   ├── charts/
│   │   ├── common/
│   │   ├── creditCards/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   ├── notifications/
│   │   ├── reports/
│   │   └── transactions/
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.js
│   │   └── ThemeContext.js
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   └── useNotifications.js
│   ├── i18n/                # Internationalization
│   │   ├── config.js
│   │   └── locales/
│   │       ├── en.json
│   │       └── tr.json
│   ├── pages/               # Page components
│   │   ├── Dashboard.js
│   │   ├── accounts/
│   │   ├── auth/
│   │   ├── calendar/
│   │   ├── creditCards/
│   │   ├── fixedPayments/
│   │   ├── installmentPayments/
│   │   ├── overdrafts/
│   │   ├── profile/
│   │   ├── reports/
│   │   └── transactions/
│   ├── services/            # API services
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── accountService.js
│   │   └── ...
│   ├── utils/               # Utility functions
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── helpers.js
│   ├── App.js               # Main app component
│   ├── index.js             # Entry point
│   └── index.css            # Global styles
├── package.json
└── Dockerfile
```

### 7.2 Key Features

#### 7.2.1 Routing
```javascript
// React Router v6 configuration
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/accounts" element={<AccountsDashboard />} />
    <Route path="/credit-cards" element={<CreditCardsDashboard />} />
    <Route path="/transactions" element={<TransactionsDashboard />} />
    <Route path="/fixed-payments" element={<FixedPaymentsDashboard />} />
    <Route path="/installment-payments" element={<InstallmentPaymentsDashboard />} />
    <Route path="/overdrafts" element={<OverdraftsDashboard />} />
    <Route path="/calendar" element={<PaymentCalendar />} />
    <Route path="/reports" element={<ReportsDashboard />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/admin" element={<AdminDashboard />} />
  </Route>
</Routes>
```

#### 7.2.2 State Management
```javascript
// AuthContext example
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Verify token and load user
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 7.2.3 API Integration
```javascript
// services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### 7.2.4 Internationalization (i18n)
```javascript
// i18n/config.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import tr from './locales/tr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr }
    },
    fallbackLng: 'tr',
    debug: false,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

**Usage in components**:
```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('pages.dashboard.title')}</h1>
      <button onClick={() => i18n.changeLanguage('en')}>
        English
      </button>
      <button onClick={() => i18n.changeLanguage('tr')}>
        Türkçe
      </button>
    </div>
  );
}
```

#### 7.2.5 Form Handling
```javascript
// Using React Hook Form + Yup
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  amount: yup.number().positive().required('Amount is required'),
  date: yup.date().required('Date is required')
});

function TransactionForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    await transactionService.create(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      
      <input type="number" {...register('amount')} />
      {errors.amount && <span>{errors.amount.message}</span>}
      
      <input type="date" {...register('date')} />
      {errors.date && <span>{errors.date.message}</span>}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

#### 7.2.6 Charts & Visualization
```javascript
// Using Chart.js with React
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function IncomeExpenseChart({ data }) {
  const chartData = {
    labels: data.months,
    datasets: [
      {
        label: 'Income',
        data: data.income,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
      {
        label: 'Expense',
        data: data.expense,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
      }
    ]
  };

  return <Line data={chartData} />;
}
```

### 7.3 Material-UI Theme

```javascript
// Custom theme configuration
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});
```

### 7.4 Build & Deployment

#### 7.4.1 Development Build
```bash
npm start
# Runs on http://localhost:3000
# Hot reload enabled
# Proxy to backend: http://localhost:5001
```

#### 7.4.2 Production Build
```bash
npm run build
# Creates optimized production build in /build directory
# Minified and optimized
# Ready for deployment
```

#### 7.4.3 Docker Build
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
```

### 7.5 Performance Optimization

#### 7.5.1 Code Splitting
```javascript
// Lazy loading routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Accounts = lazy(() => import('./pages/accounts/AccountsDashboard'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/accounts" element={<Accounts />} />
  </Routes>
</Suspense>
```

#### 7.5.2 Memoization
```javascript
// Using React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Using useMemo for expensive calculations
const sortedData = useMemo(() => {
  return data.sort((a, b) => b.amount - a.amount);
}, [data]);

// Using useCallback for functions
const handleClick = useCallback(() => {
  // Handle click
}, [dependency]);
```

#### 7.5.3 Image Optimization
- Lazy loading images
- WebP format support
- Responsive images
- CDN delivery (via Cloudflare)

---


## 8. Deployment

### 8.1 Deployment Architecture

```
GitHub Repository (main branch)
        ↓
GitHub Actions CI/CD
        ↓
    [Build & Test]
        ↓
SSH to Azure VM (98.71.149.168)
        ↓
Pull latest code
        ↓
Create .env file with secrets
        ↓
Docker Compose build
        ↓
Docker Compose up -d
        ↓
Health checks
        ↓
Production Live ✅
```

### 8.2 GitHub Actions Workflow

**File**: `.github/workflows/deploy-production.yml`

#### 8.2.1 Workflow Triggers
- Push to `main` branch
- Manual trigger via `workflow_dispatch`

#### 8.2.2 Workflow Steps

**1. Test Job**:
```yaml
- Checkout code
- Setup Node.js 18
- Install backend dependencies
- Run backend tests
- Install frontend dependencies
- Run frontend tests
```

**2. Deploy Job** (runs after tests pass):
```yaml
- Checkout code
- Install sshpass
- Setup VM directory structure
- Copy environment creation script
- Create .env file with GitHub Secrets
- Copy deploy script
- Execute deployment
- Initialize/fix database
- Notify on success/failure
```

### 8.3 Deployment Scripts

#### 8.3.1 Main Deployment Script
**File**: `scripts/deploy-production.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Starting production deployment..."

# Pull latest code
git fetch origin
git reset --hard origin/main

# Stop existing containers
docker-compose down

# Build new images
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check container status
docker-compose ps

# Show logs
docker-compose logs --tail=50

echo "✅ Deployment complete!"
```

#### 8.3.2 Environment File Creation
**File**: `scripts/create-env-file.sh`

```bash
#!/bin/bash
set -e

echo "📝 Creating .env file..."

cat > .env << EOF
# Database Configuration
DB_HOST=database
DB_PORT=5432
DB_NAME=budget_app_prod
DB_USER=budget_admin
DB_PASSWORD=${DB_PASSWORD}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}

# AI Configuration
GEMINI_API_KEY=${GEMINI_API_KEY}
GEMINI_MODEL=gemini-1.5-pro
AI_CATEGORIZATION_ENABLED=true
AI_INSIGHTS_ENABLED=true
AI_RECOMMENDATIONS_ENABLED=true
AI_NL_QUERIES_ENABLED=true

# Frontend Configuration
FRONTEND_URL=${FRONTEND_URL}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
REACT_APP_API_URL=${REACT_APP_API_URL}

# Node Environment
NODE_ENV=production
EOF

echo "✅ .env file created successfully"
```

#### 8.3.3 Database Fix Script
**File**: `scripts/fix-production-db-auth.sh`

```bash
#!/bin/bash
set -e

echo "🔧 Fixing database authentication..."

# Recreate database user with correct password
docker exec budget_database psql -U postgres -c "DROP USER IF EXISTS budget_admin;"
docker exec budget_database psql -U postgres -c "CREATE USER budget_admin WITH PASSWORD '${DB_PASSWORD}';"
docker exec budget_database psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE budget_app_prod TO budget_admin;"
docker exec budget_database psql -U postgres -c "ALTER DATABASE budget_app_prod OWNER TO budget_admin;"

echo "✅ Database authentication fixed"
```

### 8.4 Manual Deployment Steps

If you need to deploy manually:

```bash
# 1. SSH to the server
ssh obiwan@98.71.149.168

# 2. Navigate to project directory
cd ~/budgetapp

# 3. Pull latest code
git pull origin main

# 4. Stop containers
docker-compose down

# 5. Build images
docker-compose build --no-cache

# 6. Start containers
docker-compose up -d

# 7. Check status
docker-compose ps
docker-compose logs -f
```

### 8.5 Rollback Procedure

#### 8.5.1 Rollback to Previous Commit
```bash
# 1. SSH to server
ssh obiwan@98.71.149.168

# 2. Navigate to project
cd ~/budgetapp

# 3. View commit history
git log --oneline -10

# 4. Stop containers
docker-compose down

# 5. Rollback to specific commit
git reset --hard <commit-hash>

# 6. Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

#### 8.5.2 Rollback to TAG
```bash
# Rollback to TAG01 (stable version)
cd ~/budgetapp
docker-compose down
git reset --hard TAG01
docker-compose build --no-cache
docker-compose up -d
```

### 8.6 Health Checks

#### 8.6.1 Container Health
```bash
# Check all containers
docker-compose ps

# Expected output:
# NAME                STATUS
# budget_nginx        Up (healthy)
# budget_frontend     Up (healthy)
# budget_backend      Up (healthy)
# budget_database     Up (healthy)
```

#### 8.6.2 Application Health
```bash
# Backend health check
curl http://localhost:5001/health

# Expected response:
# {"status":"OK","message":"Budget App Backend is running","timestamp":"..."}

# Frontend health check
curl http://localhost:3000/

# Should return HTML
```

#### 8.6.3 Database Health
```bash
# Check database connection
docker exec budget_backend node -e "
const pool = require('./config/database');
pool.query('SELECT NOW()').then(() => {
  console.log('✅ Database connection OK');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
"
```

### 8.7 Monitoring Deployment

#### 8.7.1 Real-time Logs
```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
docker-compose logs -f nginx
```

#### 8.7.2 Resource Usage
```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

### 8.8 Post-Deployment Verification

**Checklist**:
- [ ] All containers are running and healthy
- [ ] Backend API responds to /health endpoint
- [ ] Frontend loads successfully
- [ ] User can login
- [ ] Database queries work
- [ ] No errors in logs
- [ ] SSL certificate is valid (Cloudflare)
- [ ] Domain resolves correctly

**Test URLs**:
- https://budgetapp.site (should load frontend)
- https://budgetapp.site/api/health (should return OK)
- https://budgetapp.site/login (should load login page)

---

## 9. Environment Configuration

### 9.1 Environment Variables

#### 9.1.1 Production Environment (.env)
```bash
# Database Configuration
DB_HOST=database
DB_PORT=5432
DB_NAME=budget_app_prod
DB_USER=budget_admin
DB_PASSWORD=<secure-password>

# JWT Configuration
JWT_SECRET=<secure-random-string>

# AI Configuration (Google Gemini)
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-1.5-pro
AI_CATEGORIZATION_ENABLED=true
AI_INSIGHTS_ENABLED=true
AI_RECOMMENDATIONS_ENABLED=true
AI_NL_QUERIES_ENABLED=true
AI_USE_MOCK_DATA=false
AI_RATE_LIMIT=60
AI_CACHE_ENABLED=true
AI_CACHE_TTL=3600
AI_ENABLE_LOGGING=true
AI_CATEGORIZATION_MIN_CONFIDENCE=70
AI_INSIGHT_MIN_CONFIDENCE=60
AI_RECOMMENDATION_MIN_CONFIDENCE=75

# Frontend Configuration
FRONTEND_URL=https://budgetapp.site
ALLOWED_ORIGINS=https://budgetapp.site,https://www.budgetapp.site
REACT_APP_API_URL=https://budgetapp.site/api

# Node Environment
NODE_ENV=production
PORT=5001
```

#### 9.1.2 Development Environment (.env.development)
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_app_dev
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production

# AI Configuration
GEMINI_API_KEY=<your-dev-api-key>
GEMINI_MODEL=gemini-1.5-pro
AI_CATEGORIZATION_ENABLED=true
AI_USE_MOCK_DATA=true

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
REACT_APP_API_URL=http://localhost:5001/api

# Node Environment
NODE_ENV=development
PORT=5001
```

### 9.2 GitHub Secrets

Required secrets in GitHub repository settings:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| VM_USER | SSH username | obiwan |
| VM_HOST | Server IP address | 98.71.149.168 |
| VM_PASSWORD | SSH password | <secure-password> |
| DB_PASSWORD | Database password | <secure-db-password> |
| JWT_SECRET | JWT signing secret | <random-256-bit-string> |
| GEMINI_API_KEY | Google Gemini API key | AIza... |
| FRONTEND_URL | Frontend URL | https://budgetapp.site |
| ALLOWED_ORIGINS | CORS allowed origins | https://budgetapp.site |
| REACT_APP_API_URL | API URL for frontend | https://budgetapp.site/api |

### 9.3 Configuration Files

#### 9.3.1 Nginx Configuration
**File**: `nginx/nginx.conf`

Key settings:
- Rate limiting: 10 req/s for API, 5 req/m for auth
- Gzip compression enabled
- Cloudflare real IP configuration
- Security headers
- Proxy timeouts: 300s for API, 60s for auth

#### 9.3.2 Docker Compose Configuration
**File**: `docker-compose.yml`

Key settings:
- Network: bridge (172.20.0.0/16)
- Health checks for all services
- Volume mounts for persistence
- Environment variable injection
- Restart policy: always
- Log rotation: 10MB max, 3 files

#### 9.3.3 Database Configuration
**File**: `backend/config/database.js`

Key settings:
- Connection pool: 20 max, 2 min
- Idle timeout: 30s
- Connection timeout: 5s
- Acquire timeout: 60s
- Retry logic with exponential backoff

---


## 10. Security

### 10.1 Authentication & Authorization

#### 10.1.1 Password Security
- **Hashing Algorithm**: bcrypt with 10 salt rounds
- **Minimum Requirements**:
  - Length: 6 characters minimum
  - Complexity: At least one uppercase, one lowercase, one digit
- **Storage**: Never stored in plain text
- **Transmission**: Always over HTTPS

#### 10.1.2 JWT Token Security
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 24 hours
- **Secret**: 256-bit random string (stored in environment variable)
- **Storage**: localStorage (client-side)
- **Transmission**: Authorization header: `Bearer <token>`

#### 10.1.3 Session Management
- Automatic logout after token expiration
- Manual logout clears token from localStorage
- Token refresh not implemented (user must re-login)

### 10.2 Network Security

#### 10.2.1 SSL/TLS
- **Provider**: Cloudflare Universal SSL
- **Certificate Type**: Flexible SSL
- **TLS Version**: 1.2 minimum, 1.3 preferred
- **HTTPS Enforcement**: Always Use HTTPS enabled
- **HSTS**: Enabled via Cloudflare

#### 10.2.2 Firewall Rules
**Azure Network Security Group**:
```
Inbound Rules:
- Port 22 (SSH): Allow from specific IPs only
- Port 80 (HTTP): Allow from any
- Port 443 (HTTPS): Allow from any
- All other ports: Deny

Outbound Rules:
- All traffic: Allow
```

**UFW (Ubuntu Firewall)**:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### 10.2.3 DDoS Protection
- Cloudflare DDoS protection (automatic)
- Rate limiting at Nginx level
- Rate limiting at application level (express-rate-limit)

### 10.3 Application Security

#### 10.3.1 Security Headers (Helmet.js)
```javascript
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

#### 10.3.2 CORS Policy
```javascript
Allowed Origins:
- https://budgetapp.site
- https://www.budgetapp.site
- http://localhost:3000 (development only)

Allowed Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Credentials: true
Max Age: 86400 seconds
```

#### 10.3.3 Input Validation
- **Backend**: express-validator + Joi
- **Frontend**: Yup schema validation
- **SQL Injection Prevention**: Parameterized queries (pg library)
- **XSS Prevention**: React automatic escaping + DOMPurify

#### 10.3.4 Rate Limiting
```javascript
General API: 100 requests/minute per IP
Auth endpoints: 20 requests/minute per IP
AI endpoints: 60 requests/hour per IP
```

### 10.4 Database Security

#### 10.4.1 Access Control
- Database user: `budget_admin` (not root/postgres)
- Password: Strong random password (stored in .env)
- Network: Accessible only from Docker network (not exposed to internet)
- Port 5432: Not exposed to host machine

#### 10.4.2 Data Protection
- Passwords: bcrypt hashed
- Sensitive data: Encrypted at rest (PostgreSQL encryption)
- Backups: Encrypted and stored securely
- Connection: SSL/TLS for production (if needed)

#### 10.4.3 SQL Injection Prevention
```javascript
// Always use parameterized queries
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// NEVER use string concatenation
// BAD: `SELECT * FROM users WHERE email = '${email}'`
```

### 10.5 Container Security

#### 10.5.1 Non-Root Users
All containers run as non-root users:
```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
```

#### 10.5.2 Image Security
- Base images: Official Alpine Linux (minimal attack surface)
- Regular updates: `docker-compose pull` to get latest images
- No unnecessary packages installed
- Multi-stage builds to reduce final image size

#### 10.5.3 Network Isolation
- Containers communicate via internal Docker network
- Only Nginx exposed to internet (ports 80, 443)
- Database not accessible from outside Docker network

### 10.6 Secrets Management

#### 10.6.1 Environment Variables
- Never commit .env files to Git
- .env files in .gitignore
- Secrets stored in GitHub Secrets
- Production secrets never in code

#### 10.6.2 API Keys
- Gemini API key stored in environment variable
- JWT secret generated randomly and stored securely
- Database password strong and unique

### 10.7 Security Best Practices

#### 10.7.1 Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d

# Update Node.js dependencies
npm audit fix
```

#### 10.7.2 Monitoring & Logging
- All authentication attempts logged
- Failed login attempts tracked
- Suspicious activity alerts
- Regular log review

#### 10.7.3 Backup & Recovery
- Daily database backups
- Backup retention: 7 days
- Backup encryption enabled
- Regular restore testing

---

## 11. Monitoring & Logging

### 11.1 Application Logging

#### 11.1.1 Backend Logging (Winston)
**Log Levels**:
- `error`: Critical errors
- `warn`: Warning messages
- `info`: General information
- `debug`: Detailed debugging

**Log Files**:
```
backend/logs/
├── combined.log      # All logs
├── error.log         # Errors only
└── performance.log   # Performance metrics
```

**Log Format**:
```
2024-12-02 10:30:00 [INFO] Server started on port 5001
2024-12-02 10:30:15 [INFO] POST /api/auth/login - 200 - 45ms - user@example.com
2024-12-02 10:30:20 [ERROR] Database connection failed: Connection timeout
```

#### 11.1.2 Nginx Logging
**Access Log**:
```
nginx/logs/access.log
Format: detailed (includes response time, upstream time)
```

**Error Log**:
```
nginx/logs/error.log
Level: warn
```

#### 11.1.3 Docker Logging
```bash
# View logs
docker-compose logs -f [service_name]

# Log rotation
Max size: 10MB per file
Max files: 3
Driver: json-file
```

### 11.2 Health Monitoring

#### 11.2.1 Container Health Checks
```yaml
Backend:
  Test: curl -f http://localhost:5001/health
  Interval: 30s
  Timeout: 10s
  Retries: 3
  Start Period: 40s

Frontend:
  Test: wget --spider http://localhost:3000/
  Interval: 30s
  Timeout: 10s
  Retries: 3
  Start Period: 30s

Database:
  Test: pg_isready -U budget_admin -d budget_app_prod
  Interval: 10s
  Timeout: 5s
  Retries: 5
  Start Period: 10s

Nginx:
  Test: nginx -t
  Interval: 30s
  Timeout: 10s
  Retries: 3
```

#### 11.2.2 Application Health Endpoint
```javascript
GET /health

Response:
{
  "status": "OK",
  "message": "Budget App Backend is running",
  "timestamp": "2024-12-02T10:30:00.000Z",
  "memory": {
    "rss": 123456789,
    "heapTotal": 98765432,
    "heapUsed": 87654321,
    "external": 1234567
  },
  "uptime": 3600.5
}
```

#### 11.2.3 Database Health Check
```javascript
const healthCheck = async () => {
  const result = await pool.query('SELECT NOW(), version()');
  return {
    status: 'healthy',
    timestamp: result.rows[0].now,
    version: result.rows[0].version,
    pool: {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    }
  };
};
```

### 11.3 Performance Monitoring

#### 11.3.1 Response Time Tracking
```javascript
// Middleware to track response time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});
```

#### 11.3.2 Database Query Performance
```javascript
// Log slow queries (> 1000ms)
pool.on('query', (query) => {
  const start = Date.now();
  query.on('end', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Slow query (${duration}ms): ${query.text}`);
    }
  });
});
```

#### 11.3.3 Resource Usage
```bash
# Monitor container resources
docker stats

# Expected usage:
# Backend: ~200-300MB RAM, 5-10% CPU
# Frontend: ~100-150MB RAM, 2-5% CPU
# Database: ~500-800MB RAM, 10-20% CPU
# Nginx: ~50-100MB RAM, 1-3% CPU
```

### 11.4 Error Tracking

#### 11.4.1 Error Logging
```javascript
// Global error handler
app.use((error, req, res, next) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    user: req.user?.id
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});
```

#### 11.4.2 Error Alerts
- Critical errors logged to error.log
- Email notifications for critical errors (optional)
- Slack/Discord webhooks for alerts (optional)

### 11.5 Monitoring Commands

```bash
# Check container status
docker-compose ps

# View real-time logs
docker-compose logs -f

# Check resource usage
docker stats

# Check disk space
df -h

# Check memory usage
free -h

# Check network connections
netstat -tulpn

# Check Nginx status
docker exec budget_nginx nginx -t

# Check database connections
docker exec budget_database psql -U budget_admin -d budget_app_prod -c "SELECT count(*) FROM pg_stat_activity;"

# Check application health
curl http://localhost:5001/health
```

---

 

## 12. Troubleshooting

### 12.1 Common Issues

#### 12.1.1 Container Won't Start
**Symptoms**: Container exits immediately or shows "Exited (1)"

**Solutions**:
```bash
# Check logs
docker-compose logs [service_name]

# Common causes:
# 1. Port already in use
sudo lsof -i :5001  # Check if port is in use
sudo kill -9 [PID]  # Kill process using the port

# 2. Environment variables missing
cat .env  # Verify all required variables are set

# 3. Database not ready
docker-compose up database  # Start database first
docker-compose up backend   # Then start backend
```

#### 12.1.2 Database Connection Failed
**Symptoms**: "Connection refused" or "Connection timeout"

**Solutions**:
```bash
# 1. Check database is running
docker-compose ps database

# 2. Check database logs
docker-compose logs database

# 3. Test connection manually
docker exec budget_backend node -e "
const pool = require('./config/database');
pool.query('SELECT 1').then(() => console.log('OK')).catch(err => console.error(err));
"

# 4. Fix authentication
./scripts/fix-production-db-auth.sh

# 5. Restart database
docker-compose restart database
```

#### 12.1.3 Frontend Shows Blank Page
**Symptoms**: White screen, no content

**Solutions**:
```bash
# 1. Check browser console for errors
# Open DevTools (F12) and check Console tab

# 2. Check if API is accessible
curl https://budgetapp.site/api/health

# 3. Check frontend logs
docker-compose logs frontend

# 4. Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend

# 5. Clear browser cache
# Ctrl+Shift+Delete (Chrome/Firefox)
```

#### 12.1.4 CORS Errors
**Symptoms**: "Access-Control-Allow-Origin" error in browser console

**Solutions**:
```bash
# 1. Check ALLOWED_ORIGINS in .env
cat .env | grep ALLOWED_ORIGINS

# 2. Verify origin is in allowed list
# backend/server.js - check allowedOrigins array

# 3. Restart backend
docker-compose restart backend

# 4. Check Nginx configuration
docker exec budget_nginx cat /etc/nginx/nginx.conf | grep -A 10 "CORS"
```

#### 12.1.5 502 Bad Gateway
**Symptoms**: Nginx returns 502 error

**Solutions**:
```bash
# 1. Check backend is running
docker-compose ps backend

# 2. Check backend health
curl http://localhost:5001/health

# 3. Check Nginx logs
docker-compose logs nginx

# 4. Restart services
docker-compose restart backend
docker-compose restart nginx

# 5. Check upstream configuration
docker exec budget_nginx nginx -t
```

#### 12.1.6 Slow Performance
**Symptoms**: Pages load slowly, API responses delayed

**Solutions**:
```bash
# 1. Check resource usage
docker stats

# 2. Check database connections
docker exec budget_database psql -U budget_admin -d budget_app_prod -c "
SELECT count(*) as connections, state 
FROM pg_stat_activity 
GROUP BY state;
"

# 3. Check slow queries
docker-compose logs backend | grep "Slow query"

# 4. Restart services
docker-compose restart

# 5. Check disk space
df -h

# 6. Clear old logs
find ./backend/logs -name "*.log" -mtime +7 -delete
find ./nginx/logs -name "*.log" -mtime +7 -delete
```

### 12.2 Debugging Commands

```bash
# Container debugging
docker-compose ps                    # Check container status
docker-compose logs -f [service]     # View logs
docker exec -it [container] sh       # Enter container shell
docker inspect [container]           # Inspect container details

# Network debugging
docker network ls                    # List networks
docker network inspect budget_network # Inspect network
ping [container_name]                # Test connectivity

# Database debugging
docker exec -it budget_database psql -U budget_admin budget_app_prod
\dt                                  # List tables
\d [table_name]                      # Describe table
SELECT * FROM users LIMIT 5;         # Query data

# Application debugging
docker exec budget_backend node -e "console.log(process.env)"  # Check env vars
docker exec budget_backend ls -la /app                         # List files
docker exec budget_backend cat /app/logs/error.log             # View error log
```

### 12.3 Recovery Procedures

#### 12.3.1 Complete System Reset
```bash
# WARNING: This will delete all data!

# 1. Stop all containers
docker-compose down

# 2. Remove volumes (deletes database data)
docker volume rm budgetapp_postgres_data

# 3. Remove images
docker-compose down --rmi all

# 4. Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d

# 5. Initialize database
docker exec budget_backend node database/migrate.js create
```

#### 12.3.2 Database Recovery from Backup
```bash
# 1. Stop backend
docker-compose stop backend

# 2. Restore database
docker exec -i budget_database psql -U budget_admin budget_app_prod < backup_file.sql

# 3. Restart backend
docker-compose start backend

# 4. Verify data
docker exec budget_backend node -e "
const pool = require('./config/database');
pool.query('SELECT COUNT(*) FROM users').then(r => console.log('Users:', r.rows[0].count));
"
```

#### 12.3.3 Rollback to Previous Version
```bash
# See section 8.5 for detailed rollback procedures

# Quick rollback to TAG01
cd ~/budgetapp
docker-compose down
git reset --hard TAG01
docker-compose build --no-cache
docker-compose up -d
```

---

## 13. Development Workflow

### 13.1 Local Development Setup

#### 13.1.1 Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Git
- Docker & Docker Compose (optional)

#### 13.1.2 Initial Setup
```bash
# 1. Clone repository
git clone https://github.com/EmrahCan/budgetapp.git
cd budgetapp

# 2. Install backend dependencies
cd backend
npm install

# 3. Install frontend dependencies
cd ../frontend
npm install --legacy-peer-deps

# 4. Setup database
# Create database: budget_app_dev
# Run schema: backend/database/schema.sql

# 5. Create .env files
# backend/.env.development
# frontend/.env.development

# 6. Start backend
cd backend
npm run dev  # Runs on port 5001

# 7. Start frontend (in new terminal)
cd frontend
npm start    # Runs on port 3000
```

#### 13.1.3 Development with Docker
```bash
# 1. Clone repository
git clone https://github.com/EmrahCan/budgetapp.git
cd budgetapp

# 2. Create .env file
cp .env.example .env
# Edit .env with your values

# 3. Start all services
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5001
# Database: localhost:5432
```

### 13.2 Git Workflow

#### 13.2.1 Branch Strategy
```
main (production)
  ├── develop (development)
  │   ├── feature/new-feature
  │   ├── bugfix/fix-issue
  │   └── hotfix/critical-fix
```

#### 13.2.2 Commit Convention
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

#### 13.2.3 Pull Request Process
1. Create feature branch from `develop`
2. Make changes and commit
3. Push to GitHub
4. Create Pull Request to `develop`
5. Code review
6. Merge to `develop`
7. Test on development environment
8. Merge to `main` for production deployment

### 13.3 Testing

#### 13.3.1 Backend Testing
```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- accounts.test.js

# Run with coverage
npm test -- --coverage
```

#### 13.3.2 Frontend Testing
```bash
cd frontend

# Run all tests
npm test

# Run specific test
npm test -- Dashboard.test.js

# Run with coverage
npm test -- --coverage --watchAll=false
```

#### 13.3.3 Integration Testing
```bash
# Test API endpoints
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Test with Postman
# Import collection from docs/postman/
```

### 13.4 Code Quality

#### 13.4.1 Linting
```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

#### 13.4.2 Formatting
```bash
# Using Prettier
npm run format

# Check formatting
npm run format:check
```

#### 13.4.3 Code Review Checklist
- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance optimized

---

## 14. Testing

### 14.1 Test Strategy

#### 14.1.1 Test Pyramid
```
        /\
       /  \  E2E Tests (5%)
      /____\
     /      \  Integration Tests (15%)
    /________\
   /          \  Unit Tests (80%)
  /__________\
```

#### 14.1.2 Test Coverage Goals
- Unit Tests: 80% coverage
- Integration Tests: Key user flows
- E2E Tests: Critical paths

### 14.2 Unit Testing

#### 14.2.1 Backend Unit Tests
```javascript
// Example: Account model test
const Account = require('../models/Account');

describe('Account Model', () => {
  test('should create account with valid data', async () => {
    const accountData = {
      userId: 1,
      name: 'Test Account',
      type: 'checking',
      balance: 1000
    };
    
    const account = await Account.create(accountData);
    expect(account.id).toBeDefined();
    expect(account.name).toBe('Test Account');
  });
  
  test('should reject invalid account type', async () => {
    const accountData = {
      userId: 1,
      name: 'Test Account',
      type: 'invalid',
      balance: 1000
    };
    
    await expect(Account.create(accountData)).rejects.toThrow();
  });
});
```

#### 14.2.2 Frontend Unit Tests
```javascript
// Example: Dashboard component test
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

describe('Dashboard Component', () => {
  test('renders dashboard title', () => {
    render(<Dashboard />);
    const titleElement = screen.getByText(/Dashboard/i);
    expect(titleElement).toBeInTheDocument();
  });
  
  test('displays account summary', async () => {
    render(<Dashboard />);
    const summaryElement = await screen.findByText(/Total Balance/i);
    expect(summaryElement).toBeInTheDocument();
  });
});
```

### 14.3 Integration Testing

#### 14.3.1 API Integration Tests
```javascript
const request = require('supertest');
const app = require('../server');

describe('Auth API', () => {
  test('POST /api/auth/login - success', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
  
  test('POST /api/auth/login - invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    
    expect(response.status).toBe(401);
  });
});
```

### 14.4 Manual Testing Checklist

#### 14.4.1 User Authentication
- [ ] User can register with valid data
- [ ] User cannot register with existing email
- [ ] User can login with correct credentials
- [ ] User cannot login with wrong password
- [ ] User can logout successfully
- [ ] Token expires after 24 hours

#### 14.4.2 Account Management
- [ ] User can create new account
- [ ] User can view all accounts
- [ ] User can edit account details
- [ ] User can delete account
- [ ] Account balance updates correctly

#### 14.4.3 Transaction Management
- [ ] User can create income transaction
- [ ] User can create expense transaction
- [ ] User can create transfer between accounts
- [ ] Transaction updates account balance
- [ ] User can filter transactions by date/category

#### 14.4.4 Reports
- [ ] Income vs Expense chart displays correctly
- [ ] Category analysis shows accurate data
- [ ] Monthly trend chart works
- [ ] Excel export generates valid file
- [ ] PDF export generates valid file

---

## 15. Maintenance

### 15.1 Regular Maintenance Tasks

#### 15.1.1 Daily Tasks
```bash
# Check system health
docker-compose ps
curl https://budgetapp.site/api/health

# Review error logs
docker-compose logs --tail=100 backend | grep ERROR
docker-compose logs --tail=100 nginx | grep error

# Check disk space
df -h
```

#### 15.1.2 Weekly Tasks
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check for security updates
sudo apt list --upgradable

# Review application logs
less backend/logs/error.log
less nginx/logs/error.log

# Check database size
docker exec budget_database psql -U budget_admin budget_app_prod -c "
SELECT pg_size_pretty(pg_database_size('budget_app_prod'));
"

# Backup database
./scripts/backup-database.sh
```

#### 15.1.3 Monthly Tasks
```bash
# Update Docker images
docker-compose pull
docker-compose up -d

# Update Node.js dependencies
cd backend && npm audit fix
cd frontend && npm audit fix

# Review and rotate logs
find ./backend/logs -name "*.log" -mtime +30 -delete
find ./nginx/logs -name "*.log" -mtime +30 -delete

# Test backup restore
./scripts/test-backup.sh

# Review security settings
./scripts/security-audit.sh
```

### 15.2 Backup Strategy

#### 15.2.1 Automated Backups
```bash
# Cron job (runs daily at 2 AM)
0 2 * * * /home/obiwan/budgetapp/scripts/backup-database.sh

# Backup script
#!/bin/bash
BACKUP_DIR="/home/obiwan/budgetapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec budget_database pg_dump -U budget_admin budget_app_prod > "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 7 days
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete
```

#### 15.2.2 Backup Verification
```bash
# Test restore on separate database
docker exec budget_database psql -U budget_admin -c "CREATE DATABASE test_restore;"
docker exec -i budget_database psql -U budget_admin test_restore < backup_file.sql
docker exec budget_database psql -U budget_admin -c "DROP DATABASE test_restore;"
```

### 15.3 Performance Optimization

#### 15.3.1 Database Optimization
```sql
-- Analyze tables
ANALYZE;

-- Vacuum tables
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE budget_app_prod;

-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### 15.3.2 Application Optimization
```bash
# Clear old logs
find ./backend/logs -name "*.log" -mtime +7 -delete

# Clear old uploads
find ./backend/uploads -mtime +90 -delete

# Restart services to clear memory
docker-compose restart
```

### 15.4 Monitoring & Alerts

#### 15.4.1 Health Check Script
```bash
#!/bin/bash
# health-check.sh

# Check if all containers are running
if [ $(docker-compose ps -q | wc -l) -ne 4 ]; then
  echo "ERROR: Not all containers are running"
  exit 1
fi

# Check backend health
if ! curl -f http://localhost:5001/health > /dev/null 2>&1; then
  echo "ERROR: Backend health check failed"
  exit 1
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
  echo "WARNING: Disk usage is ${DISK_USAGE}%"
fi

echo "All checks passed"
```

#### 15.4.2 Alert Configuration
```bash
# Send email on critical errors
# Add to crontab:
*/5 * * * * /home/obiwan/budgetapp/scripts/health-check.sh || mail -s "Budget App Alert" admin@example.com
```

### 15.5 Disaster Recovery

#### 15.5.1 Recovery Plan
1. **Identify Issue**: Check logs, health status
2. **Assess Impact**: Determine severity
3. **Restore Service**: Rollback or restore from backup
4. **Verify**: Test all functionality
5. **Document**: Record incident and resolution

#### 15.5.2 Recovery Time Objectives (RTO)
- Critical issues: < 1 hour
- Major issues: < 4 hours
- Minor issues: < 24 hours

#### 15.5.3 Recovery Point Objectives (RPO)
- Database: < 24 hours (daily backups)
- Application: < 1 hour (Git commits)

---

## 16. Appendix

### 16.1 Useful Commands Reference

```bash
# Docker Commands
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose ps                 # List containers
docker-compose logs -f [service]  # View logs
docker-compose restart [service]  # Restart service
docker-compose build --no-cache   # Rebuild images
docker exec -it [container] sh    # Enter container

# Git Commands
git status                        # Check status
git log --oneline -10             # View recent commits
git reset --hard [commit]         # Rollback to commit
git stash                         # Stash changes
git pull origin main              # Pull latest changes

# Database Commands
docker exec budget_database psql -U budget_admin budget_app_prod
\dt                              # List tables
\d [table]                       # Describe table
\q                               # Quit

# System Commands
df -h                            # Check disk space
free -h                          # Check memory
top                              # Check processes
netstat -tulpn                   # Check ports
```

### 16.2 Contact Information

**Development Team**:
- Lead Developer: [Your Name]
- Email: [your-email@example.com]
- GitHub: https://github.com/EmrahCan/budgetapp

**Support**:
- Issues: https://github.com/EmrahCan/budgetapp/issues
- Documentation: https://github.com/EmrahCan/budgetapp/wiki

### 16.3 Additional Resources

- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Material-UI Documentation](https://mui.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Document Version**: 1.0  
**Last Updated**: December 2, 2024  
**Status**: Complete

This documentation should be reviewed and updated regularly as the system evolves.

