# Budget App - Genel Mimari Bakış

## 📋 İçindekiler
1. [Proje Özeti](#proje-özeti)
2. [Teknoloji Stack](#teknoloji-stack)
3. [Mimari Diyagram](#mimari-diyagram)
4. [Ortamlar](#ortamlar)
5. [Temel Özellikler](#temel-özellikler)

---

## Proje Özeti

**Budget App**, kullanıcıların finansal durumlarını yönetmelerine yardımcı olan kapsamlı bir bütçe yönetim uygulamasıdır.

### Versiyon Bilgileri
- **Backend Version:** 2.0.0
- **Frontend Version:** 2.0.0
- **Database:** PostgreSQL 15
- **Node.js:** 18.x LTS
- **React:** 18.2.0

### Repository
- **GitHub:** https://github.com/EmrahCan/budgetapp
- **Main Branch:** Production
- **Develop Branch:** Test/Staging

---

## Teknoloji Stack

### Backend
```
Framework:      Express.js 4.18.2
Language:       Node.js 18.x
Database:       PostgreSQL 15
ORM:            pg (node-postgres)
Authentication: JWT (jsonwebtoken)
Validation:     express-validator, Joi
Security:       helmet, bcryptjs, express-rate-limit
AI:             Google Gemini API (@google/generative-ai)
Jobs:           bull (Redis queue)
Cron:           node-cron
Logging:        winston
File Upload:    multer
i18n:           i18n
```

### Frontend
```
Framework:      React 18.2.0
UI Library:     Material-UI (MUI) 5.14.20
Routing:        react-router-dom 6.20.1
State:          React Context API
Forms:          react-hook-form 7.48.2
Validation:     yup 1.3.3
Charts:         Chart.js 4.5.1, recharts 3.3.0
Date:           date-fns 2.30.0
HTTP:           axios 1.6.2
i18n:           i18next 25.6.2, react-i18next 16.3.3
PDF:            jspdf 3.0.3
Excel:          exceljs 4.4.0
Drag & Drop:    react-dnd 16.0.1
```

### Infrastructure
```
Containerization:   Docker & Docker Compose
Web Server:         Nginx (Alpine)
Reverse Proxy:      Nginx
SSL:                Cloudflare (Proxy)
CI/CD:              GitHub Actions
Cloud:              Azure VMs
DNS:                Cloudflare
Monitoring:         Custom scripts + Docker logs
Backup:             PostgreSQL pg_dump
```

### Development Tools
```
Testing:        Jest, Supertest, React Testing Library
Linting:        ESLint
Version Control: Git
Package Manager: npm
```

---

## Mimari Diyagram

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         INTERNET                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE CDN                            │
│  • DDoS Protection                                           │
│  • SSL/TLS Termination                                       │
│  • DNS Management                                            │
│  • Caching                                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AZURE VM (Ubuntu 22.04)                   │
│  IP: 4.210.196.73 (Production)                              │
│  IP: 20.224.194.131 (Test)                                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              NGINX (Port 80/443)                       │ │
│  │  • Reverse Proxy                                       │ │
│  │  • Load Balancing                                      │ │
│  │  • Static File Serving                                 │ │
│  │  • Request Routing                                     │ │
│  └──────────┬─────────────────────┬───────────────────────┘ │
│             │                     │                          │
│             ▼                     ▼                          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   FRONTEND       │  │    BACKEND       │                │
│  │   (React)        │  │   (Express.js)   │                │
│  │   Port: 3000     │  │   Port: 5001     │                │
│  │                  │  │                  │                │
│  │  • SPA           │  │  • REST API      │                │
│  │  • Material-UI   │  │  • JWT Auth      │                │
│  │  • i18n          │  │  • AI Features   │                │
│  │  • Charts        │  │  • File Upload   │                │
│  └──────────────────┘  └────────┬─────────┘                │
│                                  │                          │
│                                  ▼                          │
│                       ┌──────────────────┐                 │
│                       │   POSTGRESQL     │                 │
│                       │   Port: 5432     │                 │
│                       │                  │                 │
│                       │  • Database      │                 │
│                       │  • Persistent    │                 │
│                       │    Storage       │                 │
│                       └──────────────────┘                 │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              DOCKER NETWORK                            │ │
│  │              (budget_network - 172.20.0.0/16)          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                            │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   nginx      │  │   frontend   │  │   backend    │     │
│  │              │  │              │  │              │     │
│  │  Image:      │  │  Build:      │  │  Build:      │     │
│  │  nginx:alpine│  │  Dockerfile  │  │  Dockerfile  │     │
│  │              │  │              │  │              │     │
│  │  Ports:      │  │  Internal:   │  │  Internal:   │     │
│  │  80, 443     │  │  3000        │  │  5001        │     │
│  │              │  │              │  │              │     │
│  │  Volumes:    │  │  Volumes:    │  │  Volumes:    │     │
│  │  - config    │  │  None        │  │  - logs      │     │
│  │  - ssl       │  │              │  │  - uploads   │     │
│  │  - logs      │  │              │  │              │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                │
│                           ▼                                │
│                  ┌──────────────┐                          │
│                  │   database   │                          │
│                  │              │                          │
│                  │  Image:      │                          │
│                  │  postgres:15 │                          │
│                  │              │                          │
│                  │  Internal:   │                          │
│                  │  5432        │                          │
│                  │              │                          │
│                  │  Volumes:    │                          │
│                  │  - postgres_ │                          │
│                  │    data      │                          │
│                  │  - schema.sql│                          │
│                  └──────────────┘                          │
│                                                              │
│  Network: budget_network (bridge)                           │
│  Subnet: 172.20.0.0/16                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Ortamlar

### Test Environment (Vm01)
```
Domain:     test.budgetapp.site (planlanan)
IP:         20.224.194.131
VM Name:    Vm01
Username:   obiwan
Password:   Eben2010++**
Branch:     develop
Database:   budget_app_test
Purpose:    Testing, staging, development
```

### Production Environment (Vm02)
```
Domain:     budgetapp.site
IP:         4.210.196.73
VM Name:    Vm02
Username:   obiwan
Password:   Eben2010++**
Branch:     main
Database:   budget_app_prod
Purpose:    Live production
```

### Local Development
```
Domain:     localhost
Backend:    http://localhost:5001
Frontend:   http://localhost:3000
Database:   localhost:5432
Purpose:    Development
```

---

## Temel Özellikler

### 1. Kullanıcı Yönetimi
- ✅ Kayıt olma (Register)
- ✅ Giriş yapma (Login)
- ✅ JWT tabanlı authentication
- ✅ Rol bazlı yetkilendirme (user, admin)
- ✅ Profil yönetimi
- ✅ Şifre güvenliği (bcrypt)

### 2. Hesap Yönetimi
- ✅ Banka hesapları (checking, savings)
- ✅ Nakit hesapları (cash)
- ✅ Yatırım hesapları (investment)
- ✅ Kredili mevduat hesapları (overdraft)
- ✅ Bakiye takibi
- ✅ Çoklu para birimi desteği

### 3. Kredi Kartı Yönetimi
- ✅ Kredi kartı ekleme/düzenleme
- ✅ Limit takibi
- ✅ Borç takibi
- ✅ Faiz hesaplama
- ✅ Minimum ödeme hesaplama
- ✅ Ödeme tarihi hatırlatmaları

### 4. İşlem Yönetimi (Transactions)
- ✅ Gelir kaydı (income)
- ✅ Gider kaydı (expense)
- ✅ Transfer işlemleri
- ✅ Kredi kartı ödemeleri
- ✅ Kategori bazlı takip
- ✅ Tarih bazlı filtreleme

### 5. Sabit Ödemeler
- ✅ Aylık tekrarlayan ödemeler
- ✅ Fatura takibi
- ✅ Ödeme tarihi hatırlatmaları
- ✅ Kategori bazlı organizasyon

### 6. Taksitli Ödemeler
- ✅ Taksit planı oluşturma
- ✅ Taksit takibi
- ✅ Ödeme geçmişi
- ✅ Kalan taksit hesaplama

### 7. Bütçe Yönetimi
- ✅ Kategori bazlı bütçe belirleme
- ✅ Aylık limit takibi
- ✅ Harcama analizi
- ✅ Bütçe aşım uyarıları

### 8. Raporlama ve Analiz
- ✅ Gelir-gider raporları
- ✅ Kategori bazlı analizler
- ✅ Trend grafikleri
- ✅ Aylık/yıllık karşılaştırmalar
- ✅ PDF export
- ✅ Excel export

### 9. Bildirimler (Notifications)
- ✅ Akıllı bildirim sistemi
- ✅ Ödeme hatırlatmaları
- ✅ Bütçe uyarıları
- ✅ Kredi kartı limit uyarıları
- ✅ Taksit ödeme hatırlatmaları

### 10. AI Özellikleri (Gemini API)
- ✅ Otomatik kategori önerisi
- ✅ Harcama analizi
- ✅ Finansal öneriler
- ✅ Doğal dil sorguları
- ✅ Akıllı içgörüler

### 11. Çoklu Dil Desteği (i18n)
- ✅ Türkçe (TR)
- ✅ İngilizce (EN)
- ✅ Dinamik dil değiştirme
- ✅ Tam çeviri desteği

### 12. Tema Desteği
- ✅ Light mode
- ✅ Dark mode
- ✅ Kullanıcı tercihi kaydetme

### 13. Responsive Design
- ✅ Mobile-first approach
- ✅ Tablet optimizasyonu
- ✅ Desktop optimizasyonu
- ✅ Touch-friendly interface

### 14. Güvenlik
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting
- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection protection
- ✅ XSS protection

### 15. Performance
- ✅ Database indexing
- ✅ Query optimization
- ✅ Caching strategies
- ✅ Lazy loading
- ✅ Code splitting
- ✅ Image optimization

---

## Proje Yapısı

```
budgetapp/
├── backend/                    # Backend (Node.js/Express)
│   ├── config/                # Konfigürasyon dosyaları
│   ├── controllers/           # Route controller'ları
│   ├── database/              # Database schema ve migrations
│   ├── jobs/                  # Background jobs
│   ├── middleware/            # Express middleware'ler
│   ├── models/                # Database modelleri
│   ├── routes/                # API route tanımları
│   ├── services/              # Business logic
│   ├── utils/                 # Utility fonksiyonlar
│   ├── logs/                  # Log dosyaları
│   ├── uploads/               # Upload edilen dosyalar
│   ├── Dockerfile             # Backend Docker image
│   ├── package.json           # Backend dependencies
│   └── server.js              # Backend entry point
│
├── frontend/                   # Frontend (React)
│   ├── public/                # Static files
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom hooks
│   │   ├── i18n/              # Internationalization
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── utils/             # Utility functions
│   │   ├── App.js             # Main app component
│   │   └── index.js           # Entry point
│   ├── Dockerfile             # Frontend Docker image
│   └── package.json           # Frontend dependencies
│
├── nginx/                      # Nginx configuration
│   ├── nginx.conf             # Main nginx config
│   ├── ssl/                   # SSL certificates
│   └── logs/                  # Nginx logs
│
├── scripts/                    # Deployment & utility scripts
│   ├── vm-setup.sh            # VM initial setup
│   ├── deploy-test.sh         # Test deployment
│   ├── deploy-production.sh   # Production deployment
│   ├── backup-database.sh     # Database backup
│   ├── restore-database.sh    # Database restore
│   └── monitor-resources.sh   # Resource monitoring
│
├── docs/                       # Documentation
│   ├── MIMARI/                # Architecture docs (THIS)
│   ├── DEPLOYMENT_*.md        # Deployment guides
│   ├── TROUBLESHOOTING.md     # Troubleshooting guide
│   └── *.md                   # Other documentation
│
├── .github/                    # GitHub specific
│   └── workflows/             # GitHub Actions
│       ├── deploy-test.yml    # Test deployment workflow
│       └── deploy-prod.yml    # Production deployment workflow
│
├── docker-compose.yml          # Docker Compose configuration
├── .env.production.template    # Production env template
├── .env.test.template          # Test env template
└── README.md                   # Project README
```

---

## Veri Akışı

### 1. Kullanıcı İsteği (User Request)
```
User Browser
    ↓
Cloudflare CDN (SSL, DDoS Protection)
    ↓
Azure VM (Nginx - Port 80/443)
    ↓
Frontend Container (React - Port 3000)
    ↓
Backend Container (Express - Port 5001)
    ↓
Database Container (PostgreSQL - Port 5432)
    ↓
Response back through same chain
```

### 2. Authentication Flow
```
1. User submits login form
2. Frontend sends POST /api/auth/login
3. Backend validates credentials
4. Backend generates JWT token
5. Frontend stores token in localStorage
6. Frontend includes token in Authorization header
7. Backend validates token on each request
8. Backend returns user data or error
```

### 3. Transaction Creation Flow
```
1. User fills transaction form
2. Frontend validates input
3. Frontend sends POST /api/transactions
4. Backend validates JWT token
5. Backend validates transaction data
6. Backend starts database transaction
7. Backend updates account balance
8. Backend creates transaction record
9. Backend commits transaction
10. Backend returns success response
11. Frontend updates UI
12. Frontend shows success notification
```

---

## Deployment Pipeline

### GitHub Actions CI/CD

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPER                                 │
│                                                              │
│  git commit -m "feature: new feature"                       │
│  git push origin main                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB                                    │
│                                                              │
│  • Code pushed to repository                                │
│  • GitHub Actions triggered                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              GITHUB ACTIONS WORKFLOW                         │
│                                                              │
│  1. Checkout code                                           │
│  2. SSH to VM                                               │
│  3. Pull latest code                                        │
│  4. Build Docker images                                     │
│  5. Run database migrations                                 │
│  6. Start containers                                        │
│  7. Health check                                            │
│  8. Notify on success/failure                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    AZURE VM                                  │
│                                                              │
│  • Containers updated                                       │
│  • Application running                                      │
│  • Health checks passing                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Monitoring ve Logging

### Log Dosyaları
```
backend/logs/
├── app.log              # Application logs
├── error.log            # Error logs
└── combined.log         # Combined logs

nginx/logs/
├── access.log           # Access logs
└── error.log            # Error logs

Docker logs:
docker logs budget_backend
docker logs budget_frontend
docker logs budget_database
docker logs budget_nginx
```

### Health Checks
```
Frontend:  http://localhost:3000/
Backend:   http://localhost:5001/health
Database:  pg_isready command
Nginx:     nginx -t command
```

### Resource Monitoring
```bash
# CPU, Memory, Disk usage
docker stats

# System resources
htop
df -h
free -h
```

---

## Backup ve Recovery

### Otomatik Backup
- **Frequency:** Günlük (Daily)
- **Time:** 02:00 AM
- **Retention:** 7 gün
- **Location:** `/home/obiwan/budgetapp/backups/`
- **Format:** SQL dump (gzip compressed)

### Manuel Backup
```bash
./scripts/backup-database.sh
```

### Restore
```bash
./scripts/restore-database.sh
```

---

## Güvenlik Önlemleri

### Network Security
- ✅ UFW Firewall (ports 22, 80, 443)
- ✅ fail2ban (SSH brute force protection)
- ✅ Cloudflare DDoS protection
- ✅ Rate limiting on API endpoints

### Application Security
- ✅ JWT token authentication
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ Input validation (express-validator, Joi)
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection (helmet.js)
- ✅ CORS configuration
- ✅ Secure headers (helmet.js)

### Data Security
- ✅ Encrypted passwords
- ✅ Secure environment variables
- ✅ Database access control
- ✅ Regular backups
- ✅ SSL/TLS encryption (Cloudflare)

---

## Performance Optimizations

### Backend
- Database connection pooling
- Query optimization with indexes
- Caching strategies (Redis ready)
- Compression middleware
- Rate limiting

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Minification
- Gzip compression
- CDN (Cloudflare)

### Database
- Proper indexing
- Query optimization
- Connection pooling
- Regular VACUUM
- Statistics updates

---

## Sıradaki Adımlar

### Kısa Vadeli (1-2 Hafta)
- [ ] SSL sertifikası kurulumu (Let's Encrypt)
- [ ] Monitoring dashboard kurulumu
- [ ] Automated backup verification
- [ ] Performance testing
- [ ] Load testing

### Orta Vadeli (1-2 Ay)
- [ ] Redis cache implementation
- [ ] Email notification system
- [ ] Mobile app development
- [ ] Advanced analytics
- [ ] Multi-currency support

### Uzun Vadeli (3-6 Ay)
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Advanced AI features
- [ ] Third-party integrations
- [ ] White-label solution

---

**Hazırlayan:** Kiro AI  
**Tarih:** 2 Aralık 2024  
**Versiyon:** 1.0  
**Son Güncelleme:** 2 Aralık 2024
