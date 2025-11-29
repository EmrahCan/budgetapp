-- Budget Management App Database Schema

-- Create database (run this manually)
-- CREATE DATABASE budget_app;

-- Users table
CREATE TABLE IF NOT EXISTS users (
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

-- Accounts table (bank accounts, cash, etc.)
CREATE TABLE IF NOT EXISTS accounts (
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

-- Credit cards table
CREATE TABLE IF NOT EXISTS credit_cards (
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

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
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

-- Fixed payments table (recurring monthly payments)
CREATE TABLE IF NOT EXISTS fixed_payments (
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

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
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

-- Land payments table (Arsa ödemeleri)
CREATE TABLE IF NOT EXISTS land_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    land_name VARCHAR(200) NOT NULL,
    location VARCHAR(300),
    ada_no VARCHAR(50),
    parsel_no VARCHAR(50),
    total_price DECIMAL(15,2) NOT NULL CHECK (total_price > 0),
    paid_amount DECIMAL(15,2) DEFAULT 0.00 CHECK (paid_amount >= 0),
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_price - paid_amount) STORED,
    monthly_installment DECIMAL(12,2) NOT NULL CHECK (monthly_installment > 0),
    installment_count INTEGER NOT NULL CHECK (installment_count > 0),
    paid_installments INTEGER DEFAULT 0 CHECK (paid_installments >= 0),
    remaining_installments INTEGER GENERATED ALWAYS AS (installment_count - paid_installments) STORED,
    interest_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (interest_rate >= 0),
    start_date DATE NOT NULL,
    next_payment_date DATE,
    contract_number VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Land payment transactions table (Arsa ödeme geçmişi)
CREATE TABLE IF NOT EXISTS land_payment_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    land_payment_id INTEGER REFERENCES land_payments(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    installment_number INTEGER NOT NULL,
    description TEXT,
    receipt_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Installment payments table (Taksitli ödemeler)
CREATE TABLE IF NOT EXISTS installment_payments (
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

-- Installment payment transactions table (Taksit ödeme geçmişi)
CREATE TABLE IF NOT EXISTS installment_payment_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    installment_payment_id INTEGER REFERENCES installment_payments(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    installment_number INTEGER NOT NULL,
    description TEXT,
    receipt_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('payment_due', 'budget_exceeded', 'low_balance', 'info')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_fixed_payments_user_id ON fixed_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_land_payments_user_id ON land_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_land_payments_next_payment ON land_payments(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_land_payment_transactions_user_id ON land_payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_land_payment_transactions_land_id ON land_payment_transactions(land_payment_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_user_id ON installment_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_next_payment ON installment_payments(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_installment_payments_category ON installment_payments(category);
CREATE INDEX IF NOT EXISTS idx_installment_payment_transactions_user_id ON installment_payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_installment_payment_transactions_installment_id ON installment_payment_transactions(installment_payment_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON credit_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fixed_payments_updated_at BEFORE UPDATE ON fixed_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_land_payments_updated_at BEFORE UPDATE ON land_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_land_payment_transactions_updated_at BEFORE UPDATE ON land_payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installment_payments_updated_at BEFORE UPDATE ON installment_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installment_payment_transactions_updated_at BEFORE UPDATE ON installment_payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 
Smart Notifications table
CREATE TABLE IF NOT EXISTS smart_notifications (
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

-- Create indexes for smart_notifications
CREATE INDEX IF NOT EXISTS idx_smart_notifications_user_id ON smart_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_notifications_type ON smart_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_smart_notifications_priority ON smart_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_smart_notifications_created_at ON smart_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_notifications_is_read ON smart_notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_smart_notifications_is_dismissed ON smart_notifications(is_dismissed) WHERE is_dismissed = false;
CREATE INDEX IF NOT EXISTS idx_smart_notifications_entity ON smart_notifications(related_entity_type, related_entity_id);

-- Fixed Payment History table
CREATE TABLE IF NOT EXISTS fixed_payment_history (
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

-- Create indexes for fixed_payment_history
CREATE INDEX IF NOT EXISTS idx_fixed_payment_history_user_id ON fixed_payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_payment_history_fixed_payment_id ON fixed_payment_history(fixed_payment_id);
CREATE INDEX IF NOT EXISTS idx_fixed_payment_history_month_year ON fixed_payment_history(payment_month, payment_year);
CREATE INDEX IF NOT EXISTS idx_fixed_payment_history_is_paid ON fixed_payment_history(is_paid);
CREATE INDEX IF NOT EXISTS idx_fixed_payment_history_paid_date ON fixed_payment_history(paid_date);

-- Create trigger for fixed_payment_history
CREATE TRIGGER update_fixed_payment_history_updated_at 
    BEFORE UPDATE ON fixed_payment_history
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
