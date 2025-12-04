# Database Detaylı Dokümantasyon

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Database Schema](#database-schema)
3. [İlişkiler (Relationships)](#ilişkiler)
4. [İndeksler (Indexes)](#indeksler)
5. [Constraints](#constraints)
6. [Migrations](#migrations)
7. [Backup & Restore](#backup--restore)
8. [Performance Optimization](#performance-optimization)

---

## Genel Bakış

### Database Bilgileri
```
DBMS:           PostgreSQL 15
Port:           5432
Encoding:       UTF8
Locale:         en_US.UTF-8
Connection Pool: 10-20 connections
```

### Ortam Bilgileri

#### Test Environment
```
Database Name:  budget_app_test
Username:       budget_admin
Password:       [.env dosyasında]
Host:           database (Docker network)
```

#### Production Environment
```
Database Name:  budget_app_prod
Username:       budget_admin
Password:       [.env dosyasında]
Host:           database (Docker network)
```

---

## Database Schema

### Tablo Listesi
1. users - Kullanıcı bilgileri
2. accounts - Hesap bilgileri
3. credit_cards - Kredi kartı bilgileri
4. transactions - İşlem kayıtları
5. fixed_payments - Sabit ödemeler
6. installment_payments - Taksitli ödemeler
7. budgets - Bütçe tanımları
8. smart_notifications - Bildirimler
9. land_payments - Arsa ödemeleri

---

### 1. users Tablosu
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

**Açıklama:**
- Kullanıcı authentication ve profil bilgileri
- Email unique constraint ile tekil
- Password bcrypt ile hash'lenmiş
- Role-based access control (user/admin)

**İndeksler:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```

---

### 2. accounts Tablosu
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

**Açıklama:**
- Kullanıcının banka hesapları, nakit, yatırım hesapları
- Kredili mevduat (overdraft) desteği
- Çoklu para birimi desteği
- Cascade delete: Kullanıcı silinince hesapları da silinir

**İndeksler:**
```sql
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_is_active ON accounts(is_active);
```

---

### 3. credit_cards Tablosu
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

**Açıklama:**
- Kredi kartı bilgileri ve limitleri
- Faiz oranı ve minimum ödeme oranı
- Ödeme tarihi (ayın günü)
- Mevcut borç takibi

**İndeksler:**
```sql
CREATE INDEX idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX idx_credit_cards_is_active ON credit_cards(is_active);
CREATE INDEX idx_credit_cards_payment_due_date ON credit_cards(payment_due_date);
```

---

### 4. transactions Tablosu
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

**Açıklama:**
- Tüm finansal işlemler (gelir, gider, transfer, ödeme)
- Hesap veya kredi kartı ile ilişkili
- Kategori bazlı takip
- Constraint: İşlem ya hesaba ya da kredi kartına bağlı olmalı

**İndeksler:**
```sql
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_credit_card_id ON transactions(credit_card_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date);
```

---

### 5. fixed_payments Tablosu
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

**Açıklama:**
- Aylık tekrarlayan ödemeler (kira, fatura, abonelik)
- Ödeme günü (ayın kaçı)
- Kategori bazlı organizasyon

**İndeksler:**
```sql
CREATE INDEX idx_fixed_payments_user_id ON fixed_payments(user_id);
CREATE INDEX idx_fixed_payments_due_day ON fixed_payments(due_day);
CREATE INDEX idx_fixed_payments_is_active ON fixed_payments(is_active);
```

---

### 6. installment_payments Tablosu
```sql
CREATE TABLE installment_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
    installment_count INTEGER NOT NULL CHECK (installment_count > 0),
    installment_amount DECIMAL(12,2) NOT NULL CHECK (installment_amount > 0),
    paid_installments INTEGER DEFAULT 0 CHECK (paid_installments >= 0),
    start_date DATE NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Açıklama:**
- Taksitli alışverişler ve ödemeler
- Toplam tutar ve taksit sayısı
- Ödenen taksit takibi
- Başlangıç tarihi

**İndeksler:**
```sql
CREATE INDEX idx_installment_payments_user_id ON installment_payments(user_id);
CREATE INDEX idx_installment_payments_is_active ON installment_payments(is_active);
CREATE INDEX idx_installment_payments_start_date ON installment_payments(start_date);
```

---

### 7. budgets Tablosu
```sql
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    monthly_limit DECIMAL(12,2) NOT NULL CHECK (monthly_limit > 0),
    current_spent DECIMAL(12,2) DEFAULT 0.00 CHECK (current_spent >= 0),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category, month, year)
);
```

**Açıklama:**
- Kategori bazlı aylık bütçe limitleri
- Mevcut harcama takibi
- Unique constraint: Kullanıcı + kategori + ay + yıl

**İndeksler:**
```sql
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category ON budgets(category);
CREATE INDEX idx_budgets_month_year ON budgets(month, year);
CREATE UNIQUE INDEX idx_budgets_unique ON budgets(user_id, category, month, year);
```

---

### 8. smart_notifications Tablosu
```sql
CREATE TABLE smart_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    related_entity_type VARCHAR(50),
    related_entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Açıklama:**
- Akıllı bildirim sistemi
- Öncelik seviyeleri
- İlişkili entity bilgisi (ödeme, bütçe, vb.)
- Okundu/okunmadı durumu

**İndeksler:**
```sql
CREATE INDEX idx_notifications_user_id ON smart_notifications(user_id);
CREATE INDEX idx_notifications_is_read ON smart_notifications(is_read);
CREATE INDEX idx_notifications_type ON smart_notifications(notification_type);
CREATE INDEX idx_notifications_priority ON smart_notifications(priority);
CREATE INDEX idx_notifications_created_at ON smart_notifications(created_at);
```

---

### 9. land_payments Tablosu
```sql
CREATE TABLE land_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    land_name VARCHAR(100) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL CHECK (total_price > 0),
    down_payment DECIMAL(12,2) NOT NULL CHECK (down_payment >= 0),
    remaining_amount DECIMAL(12,2) NOT NULL CHECK (remaining_amount >= 0),
    monthly_payment DECIMAL(12,2) NOT NULL CHECK (monthly_payment > 0),
    payment_day INTEGER NOT NULL CHECK (payment_day >= 1 AND payment_day <= 31),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Açıklama:**
- Arsa/taşınmaz ödemeleri
- Peşinat ve kalan tutar
- Aylık ödeme planı
- Başlangıç ve bitiş tarihleri

**İndeksler:**
```sql
CREATE INDEX idx_land_payments_user_id ON land_payments(user_id);
CREATE INDEX idx_land_payments_is_active ON land_payments(is_active);
CREATE INDEX idx_land_payments_payment_day ON land_payments(payment_day);
```

---

## İlişkiler (Relationships)

### Entity Relationship Diagram (ERD)

```
users (1) ──────< (N) accounts
users (1) ──────< (N) credit_cards
users (1) ──────< (N) transactions
users (1) ──────< (N) fixed_payments
users (1) ──────< (N) installment_payments
users (1) ──────< (N) budgets
users (1) ──────< (N) smart_notifications
users (1) ──────< (N) land_payments

accounts (1) ────< (N) transactions
credit_cards (1) ─< (N) transactions
```

### Foreign Key Constraints

#### CASCADE DELETE
Kullanıcı silindiğinde tüm ilişkili kayıtlar silinir:
- accounts
- credit_cards
- transactions
- fixed_payments
- installment_payments
- budgets
- smart_notifications
- land_payments

#### SET NULL
İşlem kaydı silindiğinde transaction'daki referans NULL olur:
- transactions.account_id
- transactions.credit_card_id

---

## İndeksler (Indexes)

### Primary Key Indexes
Her tabloda otomatik oluşturulur:
```sql
users_pkey ON users(id)
accounts_pkey ON accounts(id)
credit_cards_pkey ON credit_cards(id)
transactions_pkey ON transactions(id)
...
```

### Foreign Key Indexes
İlişkili sorgular için:
```sql
idx_accounts_user_id ON accounts(user_id)
idx_credit_cards_user_id ON credit_cards(user_id)
idx_transactions_user_id ON transactions(user_id)
idx_transactions_account_id ON transactions(account_id)
idx_transactions_credit_card_id ON transactions(credit_card_id)
...
```

### Query Optimization Indexes
Sık kullanılan sorgular için:
```sql
-- Transaction queries by date
idx_transactions_date ON transactions(transaction_date)
idx_transactions_user_date ON transactions(user_id, transaction_date)

-- Budget queries
idx_budgets_month_year ON budgets(month, year)

-- Notification queries
idx_notifications_is_read ON smart_notifications(is_read)
idx_notifications_created_at ON smart_notifications(created_at)
```

### Unique Indexes
Veri bütünlüğü için:
```sql
users_email_key ON users(email)
idx_budgets_unique ON budgets(user_id, category, month, year)
```

---

## Constraints

### CHECK Constraints

#### Pozitif Değerler
```sql
CHECK (amount > 0)
CHECK (credit_limit > 0)
CHECK (monthly_limit > 0)
CHECK (overdraft_limit >= 0)
```

#### Yüzde Değerleri
```sql
CHECK (interest_rate >= 0 AND interest_rate <= 100)
CHECK (minimum_payment_rate > 0 AND minimum_payment_rate <= 100)
```

#### Tarih Değerleri
```sql
CHECK (due_day >= 1 AND due_day <= 31)
CHECK (payment_day >= 1 AND payment_day <= 31)
CHECK (month >= 1 AND month <= 12)
CHECK (year >= 2020)
```

#### Enum Değerleri
```sql
CHECK (role IN ('user', 'admin'))
CHECK (type IN ('checking', 'savings', 'cash', 'investment', 'overdraft'))
CHECK (type IN ('income', 'expense', 'transfer', 'payment'))
CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
```

### UNIQUE Constraints
```sql
UNIQUE(email) ON users
UNIQUE(user_id, category, month, year) ON budgets
```

### NOT NULL Constraints
Kritik alanlar için:
```sql
email NOT NULL
password_hash NOT NULL
first_name NOT NULL
last_name NOT NULL
name NOT NULL
amount NOT NULL
transaction_date NOT NULL
```

---

## Migrations

### Migration Script
```bash
# Database migration script
./backend/database/migrate.js

# Commands:
node migrate.js create  # Create database and schema
node migrate.js seed    # Seed initial data
node migrate.js reset   # Reset database
node migrate.js check   # Check database status
```

### Initial Setup
```sql
-- 1. Create database
CREATE DATABASE budget_app_prod;

-- 2. Connect to database
\c budget_app_prod

-- 3. Run schema.sql
\i /path/to/schema.sql

-- 4. Verify tables
\dt

-- 5. Check indexes
\di
```

### Schema Updates
```sql
-- Add new column
ALTER TABLE accounts 
ADD COLUMN last_transaction_date TIMESTAMP;

-- Add index
CREATE INDEX idx_accounts_last_transaction 
ON accounts(last_transaction_date);

-- Update constraint
ALTER TABLE transactions 
ADD CONSTRAINT check_positive_amount 
CHECK (amount > 0);
```

---

## Backup & Restore

### Automated Backup
```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="/home/obiwan/budgetapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="budget_app_backup_${DATE}.sql.gz"

# Create backup
docker exec budget_database pg_dump \
  -U budget_admin \
  -d budget_app_prod \
  | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Keep only last 7 days
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}"
```

### Manual Backup
```bash
# Full database backup
docker exec budget_database pg_dump \
  -U budget_admin \
  -d budget_app_prod \
  > backup_$(date +%Y%m%d).sql

# Compressed backup
docker exec budget_database pg_dump \
  -U budget_admin \
  -d budget_app_prod \
  | gzip > backup_$(date +%Y%m%d).sql.gz

# Specific table backup
docker exec budget_database pg_dump \
  -U budget_admin \
  -d budget_app_prod \
  -t transactions \
  > transactions_backup.sql
```

### Restore
```bash
# Restore from backup
gunzip < backup_20241202.sql.gz | \
docker exec -i budget_database psql \
  -U budget_admin \
  -d budget_app_prod

# Restore specific table
docker exec -i budget_database psql \
  -U budget_admin \
  -d budget_app_prod \
  < transactions_backup.sql
```

### Cron Job for Automated Backup
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /home/obiwan/budgetapp/scripts/backup-database.sh
```

---

## Performance Optimization

### Query Optimization

#### Use Indexes
```sql
-- Bad: Full table scan
SELECT * FROM transactions WHERE user_id = 1;

-- Good: Uses index
SELECT * FROM transactions 
WHERE user_id = 1 
AND transaction_date >= '2024-01-01';
```

#### Limit Results
```sql
-- Bad: Returns all rows
SELECT * FROM transactions WHERE user_id = 1;

-- Good: Paginated
SELECT * FROM transactions 
WHERE user_id = 1 
ORDER BY transaction_date DESC 
LIMIT 50 OFFSET 0;
```

#### Use Specific Columns
```sql
-- Bad: Selects all columns
SELECT * FROM transactions WHERE user_id = 1;

-- Good: Selects only needed columns
SELECT id, amount, description, transaction_date 
FROM transactions 
WHERE user_id = 1;
```

### Connection Pooling
```javascript
// backend/database/pool.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout after 2s
});

module.exports = pool;
```

### Database Maintenance

#### VACUUM
```sql
-- Reclaim storage and update statistics
VACUUM ANALYZE;

-- Full vacuum (requires exclusive lock)
VACUUM FULL;

-- Vacuum specific table
VACUUM ANALYZE transactions;
```

#### REINDEX
```sql
-- Rebuild all indexes
REINDEX DATABASE budget_app_prod;

-- Rebuild table indexes
REINDEX TABLE transactions;

-- Rebuild specific index
REINDEX INDEX idx_transactions_user_date;
```

#### ANALYZE
```sql
-- Update statistics for query planner
ANALYZE;

-- Analyze specific table
ANALYZE transactions;
```

### Monitoring Queries

#### Slow Queries
```sql
-- Enable slow query logging
ALTER DATABASE budget_app_prod 
SET log_min_duration_statement = 1000; -- Log queries > 1s

-- View slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### Active Connections
```sql
-- View active connections
SELECT pid, usename, application_name, client_addr, state, query
FROM pg_stat_activity
WHERE datname = 'budget_app_prod';

-- Kill connection
SELECT pg_terminate_backend(pid);
```

#### Table Sizes
```sql
-- View table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

**Hazırlayan:** Kiro AI  
**Tarih:** 2 Aralık 2024  
**Versiyon:** 1.0
