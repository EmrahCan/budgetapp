# Environment Variables ve Güvenlik Dokümantasyonu

## 📋 İçindekiler
1. [Environment Variables](#environment-variables)
2. [Güvenlik Önlemleri](#güvenlik-önlemleri)
3. [Şifre Politikaları](#şifre-politikaları)
4. [API Keys](#api-keys)
5. [Backup Stratejisi](#backup-stratejisi)
6. [Disaster Recovery](#disaster-recovery)

---

## Environment Variables

### Backend Environment Variables

#### Zorunlu Değişkenler
```env
# Node Environment
NODE_ENV=production              # production | test | development

# Database Configuration
DB_HOST=database                 # Docker network'te 'database'
DB_PORT=5432                     # PostgreSQL default port
DB_NAME=budget_app_prod          # Database adı
DB_USER=budget_admin             # Database kullanıcısı
DB_PASSWORD=<STRONG_PASSWORD>    # Güçlü şifre (min 16 karakter)

# JWT Configuration
JWT_SECRET=<STRONG_SECRET>       # JWT secret key (min 32 karakter)

# Frontend Configuration
FRONTEND_URL=https://budgetapp.site
ALLOWED_ORIGINS=https://budgetapp.site
```

#### AI Configuration (Opsiyonel)
```env
# Gemini AI
GEMINI_API_KEY=<YOUR_API_KEY>    # Google Gemini API key
GEMINI_MODEL=gemini-1.5-pro      # Model versiyonu

# AI Features
AI_CATEGORIZATION_ENABLED=true   # Otomatik kategori önerisi
AI_INSIGHTS_ENABLED=true         # Finansal içgörüler
AI_RECOMMENDATIONS_ENABLED=true  # Öneriler
AI_NL_QUERIES_ENABLED=true       # Doğal dil sorguları
AI_USE_MOCK_DATA=false           # Mock data kullan (test için)
AI_RATE_LIMIT=60                 # Dakikada max istek
AI_CACHE_ENABLED=true            # Cache aktif
AI_CACHE_TTL=3600                # Cache süresi (saniye)
AI_ENABLE_LOGGING=true           # AI logları
AI_CATEGORIZATION_MIN_CONFIDENCE=70  # Min güven skoru
AI_INSIGHT_MIN_CONFIDENCE=60
AI_RECOMMENDATION_MIN_CONFIDENCE=75
```

### Frontend Environment Variables

```env
# API Configuration
REACT_APP_API_URL=https://budgetapp.site/api

# Optional
REACT_APP_ENV=production
REACT_APP_VERSION=2.0.0
```

### Docker Compose Environment Variables

```env
# Database
POSTGRES_DB=budget_app_prod
POSTGRES_USER=budget_admin
POSTGRES_PASSWORD=<STRONG_PASSWORD>

# Backend
NODE_ENV=production
PORT=5001

# Frontend
REACT_APP_API_URL=https://budgetapp.site/api
```

---

## Güvenlik Önlemleri

### 1. Network Security

#### Firewall (UFW)
```bash
# Sadece gerekli portlar açık
sudo ufw status

# Açık portlar:
22/tcp    # SSH
80/tcp    # HTTP
443/tcp   # HTTPS

# Diğer tüm portlar kapalı
```

#### fail2ban
```bash
# SSH brute force koruması
sudo fail2ban-client status sshd

# Ayarlar:
maxretry = 5      # 5 başarısız deneme
bantime = 3600    # 1 saat ban
findtime = 600    # 10 dakika içinde
```

#### Cloudflare Protection
```
✅ DDoS Protection
✅ WAF (Web Application Firewall)
✅ Rate Limiting
✅ Bot Protection
✅ SSL/TLS Encryption
```

### 2. Application Security

#### JWT Authentication
```javascript
// Token expiration
expiresIn: '24h'

// Token structure
{
  userId: number,
  email: string,
  role: 'user' | 'admin',
  iat: timestamp,
  exp: timestamp
}

// Token storage
localStorage.setItem('token', token)

// Token validation
jwt.verify(token, process.env.JWT_SECRET)
```

#### Password Security
```javascript
// Bcrypt hashing
const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash(password, salt);

// Password requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
```

#### Input Validation
```javascript
// express-validator
body('email').isEmail().normalizeEmail()
body('password').isLength({ min: 8 })
body('amount').isNumeric().isFloat({ min: 0 })

// Joi validation
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  amount: Joi.number().positive().required()
});
```

#### SQL Injection Protection
```javascript
// Parameterized queries
const query = 'SELECT * FROM users WHERE email = $1';
const result = await pool.query(query, [email]);

// NEVER do this:
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

#### XSS Protection
```javascript
// Helmet.js
app.use(helmet());

// Content Security Policy
helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"]
  }
});
```

#### CORS Configuration
```javascript
// Strict CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

#### Rate Limiting
```javascript
// API rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests'
});

app.use('/api/', limiter);

// Login rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts
  skipSuccessfulRequests: true
});

app.post('/api/auth/login', loginLimiter, loginController);
```

### 3. Database Security

#### Connection Security
```javascript
// SSL connection (production)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});
```

#### User Permissions
```sql
-- Database user sadece gerekli izinlere sahip
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO budget_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO budget_admin;

-- Superuser değil
ALTER USER budget_admin WITH NOSUPERUSER;
```

#### Backup Encryption
```bash
# Encrypted backup
pg_dump -U budget_admin budget_app_prod | \
  gpg --encrypt --recipient admin@budgetapp.site | \
  gzip > backup_encrypted.sql.gz.gpg
```

### 4. Docker Security

#### Container Isolation
```yaml
# docker-compose.yml
services:
  database:
    # Internal network only
    networks:
      - budget_network
    # No external ports
    # ports: []
```

#### Non-root User
```dockerfile
# Dockerfile
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Switch to non-root user
USER nodejs
```

#### Read-only Filesystem
```yaml
# docker-compose.yml
services:
  backend:
    read_only: true
    tmpfs:
      - /tmp
      - /app/logs
```

#### Resource Limits
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

---

## Şifre Politikaları

### Güçlü Şifre Gereksinimleri

#### Database Password
```
Minimum: 16 karakter
Önerilen: 32 karakter
Format: Büyük harf + Küçük harf + Rakam + Özel karakter
Örnek: ProdDB2024VerySecurePassword789!@#$%^

Oluşturma:
openssl rand -base64 32
```

#### JWT Secret
```
Minimum: 32 karakter
Önerilen: 48 karakter
Format: Random base64 string
Örnek: ProdJWT2024VerySecureSecretKey012$%^&*()_+

Oluşturma:
openssl rand -base64 48
```

#### User Passwords
```
Minimum: 8 karakter
Gereksinimler:
- En az 1 büyük harf
- En az 1 küçük harf
- En az 1 rakam
- En az 1 özel karakter (!@#$%^&*)

Validation regex:
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$
```

### Şifre Saklama

#### .env Dosyası
```bash
# Dosya izinleri
chmod 600 .env

# Sadece owner okuyabilir/yazabilir
-rw------- 1 obiwan obiwan .env

# Git'e commit edilmemeli
echo ".env" >> .gitignore
```

#### Şifre Değiştirme
```bash
# 1. Yeni şifre oluştur
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. .env dosyasını güncelle
nano .env

# 3. Container'ları yeniden başlat
docker-compose down
docker-compose up -d

# 4. Eski şifreyi sil
unset NEW_PASSWORD
```

---

## API Keys

### Gemini API Key

#### Alma
1. https://makersuite.google.com/app/apikey adresine git
2. "Create API Key" tıkla
3. API key'i kopyala
4. .env dosyasına ekle

#### Güvenlik
```env
# .env dosyasında sakla
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Git'e commit etme
echo ".env" >> .gitignore

# Rate limiting kullan
AI_RATE_LIMIT=60

# Cache kullan
AI_CACHE_ENABLED=true
AI_CACHE_TTL=3600
```

#### Kullanım Limitleri
```
Free Tier:
- 60 requests per minute
- 1,500 requests per day

Monitoring:
- API kullanımını takip et
- Limit aşımlarını logla
- Hata durumlarını handle et
```

---

## Backup Stratejisi

### Otomatik Backup

#### Günlük Backup
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

#### Cron Job
```bash
# Crontab ekle
crontab -e

# Her gün saat 02:00'de backup al
0 2 * * * /home/obiwan/budgetapp/scripts/backup-database.sh >> /home/obiwan/budgetapp/logs/backup.log 2>&1
```

### Backup Verification
```bash
#!/bin/bash
# scripts/verify-backup.sh

LATEST_BACKUP=$(ls -t backups/*.sql.gz | head -1)

echo "Verifying backup: ${LATEST_BACKUP}"

# Test restore to temporary database
gunzip < "${LATEST_BACKUP}" | \
docker exec -i budget_database psql \
  -U budget_admin \
  -d postgres \
  -c "CREATE DATABASE backup_test;"

gunzip < "${LATEST_BACKUP}" | \
docker exec -i budget_database psql \
  -U budget_admin \
  -d backup_test

# Check table count
TABLE_COUNT=$(docker exec budget_database psql \
  -U budget_admin \
  -d backup_test \
  -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")

echo "Tables found: ${TABLE_COUNT}"

# Cleanup
docker exec budget_database psql \
  -U budget_admin \
  -d postgres \
  -c "DROP DATABASE backup_test;"

if [ "${TABLE_COUNT}" -gt 0 ]; then
  echo "✅ Backup verification successful"
else
  echo "❌ Backup verification failed"
  exit 1
fi
```

### Off-site Backup
```bash
# Azure Blob Storage'a yükle
az storage blob upload \
  --account-name budgetappbackups \
  --container-name database-backups \
  --name "backup_$(date +%Y%m%d).sql.gz" \
  --file "${BACKUP_FILE}"

# AWS S3'e yükle
aws s3 cp "${BACKUP_FILE}" \
  s3://budgetapp-backups/database/

# Google Cloud Storage'a yükle
gsutil cp "${BACKUP_FILE}" \
  gs://budgetapp-backups/database/
```

---

## Disaster Recovery

### Recovery Time Objective (RTO)
```
Target: 1 saat
- Backup'tan restore: 15 dakika
- Container'ları başlatma: 5 dakika
- Health check ve test: 10 dakika
- DNS propagation: 30 dakika
```

### Recovery Point Objective (RPO)
```
Target: 24 saat
- Günlük backup: Son 24 saatin verisi
- Transaction logs: Real-time
```

### Disaster Recovery Plan

#### 1. Database Failure
```bash
# 1. Stop containers
docker-compose down

# 2. Restore from latest backup
LATEST_BACKUP=$(ls -t backups/*.sql.gz | head -1)
gunzip < "${LATEST_BACKUP}" | \
docker exec -i budget_database psql \
  -U budget_admin \
  -d budget_app_prod

# 3. Start containers
docker-compose up -d

# 4. Verify
curl http://localhost/health
```

#### 2. Complete Server Failure
```bash
# 1. Provision new VM
# Azure Portal'dan yeni VM oluştur

# 2. Initial setup
ssh obiwan@<NEW_IP>
./scripts/vm-setup.sh

# 3. Clone repository
git clone https://github.com/EmrahCan/budgetapp.git
cd budgetapp

# 4. Restore .env file
# Backup'tan veya password manager'dan

# 5. Restore database
# Off-site backup'tan indir
# Restore et

# 6. Start application
docker-compose up -d

# 7. Update DNS
# Cloudflare'de IP adresini güncelle

# 8. Verify
curl https://budgetapp.site/health
```

#### 3. Data Corruption
```bash
# 1. Identify corruption
docker exec budget_database psql \
  -U budget_admin \
  -d budget_app_prod \
  -c "SELECT * FROM users LIMIT 10;"

# 2. Stop application
docker-compose down

# 3. Backup current state
docker exec budget_database pg_dump \
  -U budget_admin \
  -d budget_app_prod \
  > corrupted_backup.sql

# 4. Restore from clean backup
# En son temiz backup'ı bul
# Restore et

# 5. Verify data integrity
# Test queries çalıştır

# 6. Start application
docker-compose up -d
```

### Disaster Recovery Testing

#### Quarterly DR Test
```bash
#!/bin/bash
# scripts/dr-test.sh

echo "=== Disaster Recovery Test ==="
echo "Date: $(date)"
echo ""

# 1. Create test backup
echo "1. Creating test backup..."
./scripts/backup-database.sh

# 2. Simulate failure
echo "2. Simulating failure..."
docker-compose down

# 3. Restore from backup
echo "3. Restoring from backup..."
LATEST_BACKUP=$(ls -t backups/*.sql.gz | head -1)
gunzip < "${LATEST_BACKUP}" | \
docker exec -i budget_database psql \
  -U budget_admin \
  -d budget_app_prod

# 4. Start application
echo "4. Starting application..."
docker-compose up -d

# 5. Wait for health
echo "5. Waiting for health check..."
sleep 30

# 6. Verify
echo "6. Verifying..."
HEALTH=$(curl -s http://localhost/health)
if [ "${HEALTH}" == "healthy" ]; then
  echo "✅ DR Test Successful"
else
  echo "❌ DR Test Failed"
  exit 1
fi

echo ""
echo "=== DR Test Complete ==="
```

---

## Security Checklist

### Pre-deployment
- [ ] Güçlü şifreler oluşturuldu (DB, JWT)
- [ ] .env dosyası oluşturuldu ve izinleri ayarlandı (600)
- [ ] .env dosyası .gitignore'a eklendi
- [ ] API keys alındı ve .env'e eklendi
- [ ] Firewall yapılandırıldı (UFW)
- [ ] fail2ban kuruldu ve yapılandırıldı
- [ ] SSH güvenlik ayarları yapıldı

### Post-deployment
- [ ] SSL sertifikası aktif (Cloudflare)
- [ ] Health check'ler passing
- [ ] Backup script çalışıyor
- [ ] Cron jobs kuruldu
- [ ] Monitoring aktif
- [ ] Log rotation yapılandırıldı
- [ ] Rate limiting test edildi
- [ ] CORS ayarları doğrulandı

### Monthly
- [ ] Şifreleri rotate et
- [ ] Backup'ları verify et
- [ ] DR test yap
- [ ] Security updates yap
- [ ] Log'ları review et
- [ ] Access log'ları kontrol et

---

**Hazırlayan:** Kiro AI  
**Tarih:** 2 Aralık 2024  
**Versiyon:** 1.0
