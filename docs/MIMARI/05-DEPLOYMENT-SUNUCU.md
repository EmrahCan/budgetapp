# Deployment ve Sunucu Kurulum Dokümantasyonu

## 📋 İçindekiler
1. [Sunucu Bilgileri](#sunucu-bilgileri)
2. [İlk Kurulum](#ilk-kurulum)
3. [Docker Deployment](#docker-deployment)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [SSL Sertifikası](#ssl-sertifikası)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Sunucu Bilgileri

### Test Environment (Vm01)
```
Provider:       Azure
Region:         West Europe
OS:             Ubuntu 22.04 LTS
Size:           Standard B2s (2 vCPU, 4 GB RAM)
IP Address:     20.224.194.131
Domain:         test.budgetapp.site (planlanan)
Username:       obiwan
Password:       Eben2010++**
SSH Port:       22
```

### Production Environment (Vm02)
```
Provider:       Azure
Region:         West Europe
OS:             Ubuntu 22.04 LTS
Size:           Standard B2s (2 vCPU, 4 GB RAM)
IP Address:     4.210.196.73
Domain:         budgetapp.site
Username:       obiwan
Password:       Eben2010++**
SSH Port:       22
```

### Cloudflare DNS
```
Domain:         budgetapp.site
Nameservers:    Cloudflare
DNS Records:
  - Type: A
  - Name: @
  - Content: 4.210.196.73
  - Proxy: Enabled (Orange Cloud)
  - TTL: Auto
```

---

## İlk Kurulum

### 1. SSH Bağlantısı
```bash
# Test sunucusuna bağlan
ssh obiwan@20.224.194.131

# Production sunucusuna bağlan
ssh obiwan@4.210.196.73

# Password: Eben2010++**
```

### 2. Sistem Güncellemesi
```bash
# Paket listesini güncelle
sudo apt update

# Sistemdeki paketleri güncelle
sudo apt upgrade -y

# Gereksiz paketleri temizle
sudo apt autoremove -y
```

### 3. Gerekli Paketlerin Kurulumu
```bash
# Temel araçlar
sudo apt install -y \
  curl \
  wget \
  git \
  vim \
  htop \
  net-tools \
  ufw \
  fail2ban

# Build tools
sudo apt install -y \
  build-essential \
  software-properties-common
```

### 4. Docker Kurulumu
```bash
# Docker GPG key ekle
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Docker repository ekle
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker kur
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Docker Compose kur
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Kullanıcıyı docker grubuna ekle
sudo usermod -aG docker obiwan

# Logout ve login gerekli
exit
ssh obiwan@<IP_ADDRESS>

# Docker versiyonlarını kontrol et
docker --version
docker-compose --version
```

### 5. Firewall Kurulumu (UFW)
```bash
# UFW'yi etkinleştir
sudo ufw enable

# SSH portunu aç
sudo ufw allow 22/tcp

# HTTP ve HTTPS portlarını aç
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Firewall durumunu kontrol et
sudo ufw status verbose
```

### 6. fail2ban Kurulumu
```bash
# fail2ban kur
sudo apt install -y fail2ban

# Konfigürasyon dosyası oluştur
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# SSH koruması aktif et
sudo nano /etc/fail2ban/jail.local
```

fail2ban konfigürasyonu:
```ini
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
findtime = 600
```

```bash
# fail2ban'ı başlat
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Durumu kontrol et
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

### 7. SSH Güvenlik Ayarları
```bash
# SSH config dosyasını düzenle
sudo nano /etc/ssh/sshd_config
```

Önerilen ayarlar:
```
# Root login'i kapat
PermitRootLogin no

# Password authentication (şimdilik açık, SSH key kurulunca kapatılacak)
PasswordAuthentication yes

# Public key authentication
PubkeyAuthentication yes

# Empty passwords
PermitEmptyPasswords no

# X11 forwarding
X11Forwarding no

# Max auth tries
MaxAuthTries 3

# Login grace time
LoginGraceTime 60
```

```bash
# SSH servisini yeniden başlat
sudo systemctl restart sshd
```

---

## Docker Deployment

### 1. Repository Clone
```bash
# Home dizinine git
cd ~

# Proje dizini oluştur
mkdir -p budgetapp
cd budgetapp

# Repository'yi clone et
git clone https://github.com/EmrahCan/budgetapp.git .

# Branch seç
# Test için:
git checkout develop

# Production için:
git checkout main
```

### 2. Environment Dosyası Oluşturma

#### Test Environment
```bash
# .env dosyası oluştur
nano .env
```

.env içeriği (TEST):
```env
# Node Environment
NODE_ENV=test

# Database Configuration
DB_HOST=database
DB_PORT=5432
DB_NAME=budget_app_test
DB_USER=budget_admin
DB_PASSWORD=TestDB2024SecurePassword123!@#

# JWT Secret
JWT_SECRET=TestJWT2024SecureSecretKey456$%^&*()

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro

# AI Features
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

# Frontend URL
FRONTEND_URL=http://20.224.194.131
ALLOWED_ORIGINS=http://20.224.194.131

# React App
REACT_APP_API_URL=http://20.224.194.131/api
```

#### Production Environment
```bash
# .env dosyası oluştur
nano .env
```

.env içeriği (PRODUCTION):
```env
# Node Environment
NODE_ENV=production

# Database Configuration
DB_HOST=database
DB_PORT=5432
DB_NAME=budget_app_prod
DB_USER=budget_admin
DB_PASSWORD=ProdDB2024VerySecurePassword789!@#$%^

# JWT Secret
JWT_SECRET=ProdJWT2024VerySecureSecretKey012$%^&*()_+

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro

# AI Features
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

# Frontend URL
FRONTEND_URL=https://budgetapp.site
ALLOWED_ORIGINS=https://budgetapp.site

# React App
REACT_APP_API_URL=https://budgetapp.site/api
```

```bash
# Dosya izinlerini ayarla
chmod 600 .env

# Dosyayı kontrol et
cat .env
```

### 3. Güçlü Şifre Oluşturma
```bash
# Database password (32 karakter)
openssl rand -base64 32

# JWT secret (48 karakter)
openssl rand -base64 48
```

### 4. Log Dizinlerini Oluşturma
```bash
# Gerekli dizinleri oluştur
mkdir -p logs
mkdir -p backend/logs
mkdir -p nginx/logs
mkdir -p backups
mkdir -p backend/uploads

# İzinleri ayarla
chmod 755 logs backend/logs nginx/logs backups backend/uploads
```

### 5. Docker Compose ile Deployment
```bash
# İlk deployment (build ile)
docker-compose up -d --build

# Logları izle
docker-compose logs -f

# Container durumlarını kontrol et
docker ps

# Tüm container'lar çalışıyor mu?
docker-compose ps
```

### 6. Health Check
```bash
# Nginx health check
curl http://localhost/health

# Backend health check
curl http://localhost/api/health

# Frontend check
curl http://localhost/

# Database check
docker exec budget_database pg_isready -U budget_admin -d budget_app_prod
```

### 7. Database İlk Kurulum
```bash
# Database loglarını kontrol et
docker logs budget_database

# Database'e bağlan
docker exec -it budget_database psql -U budget_admin -d budget_app_prod

# Tabloları listele
\dt

# Çıkış
\q
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

#### Test Deployment (.github/workflows/deploy-test.yml)
```yaml
name: Deploy to Test

on:
  push:
    branches: [ develop ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to Test VM
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.TEST_SSH_HOST }}
        username: ${{ secrets.TEST_SSH_USER }}
        password: ${{ secrets.TEST_SSH_PASSWORD }}
        script: |
          cd ~/budgetapp
          git pull origin develop
          docker-compose down
          docker-compose up -d --build
          docker-compose ps
```

#### Production Deployment (.github/workflows/deploy-prod.yml)
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to Production VM
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.PROD_SSH_HOST }}
        username: ${{ secrets.PROD_SSH_USER }}
        password: ${{ secrets.PROD_SSH_PASSWORD }}
        script: |
          cd ~/budgetapp
          git pull origin main
          docker-compose down
          docker-compose up -d --build
          docker-compose ps
```

### GitHub Secrets Kurulumu

1. GitHub repository'ye git: https://github.com/EmrahCan/budgetapp
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret** tıkla

#### Test Secrets
```
TEST_SSH_HOST = 20.224.194.131
TEST_SSH_USER = obiwan
TEST_SSH_PASSWORD = Eben2010++**
```

#### Production Secrets
```
PROD_SSH_HOST = 4.210.196.73
PROD_SSH_USER = obiwan
PROD_SSH_PASSWORD = Eben2010++**
```

### Deployment Trigger
```bash
# Local'de (Mac'te)
cd ~/ButceAPP\ TEST/budget

# Test deployment
git checkout develop
git add .
git commit -m "feat: new feature"
git push origin develop

# Production deployment
git checkout main
git merge develop
git push origin main

# GitHub Actions'ı izle
# https://github.com/EmrahCan/budgetapp/actions
```

---

## SSL Sertifikası

### Cloudflare SSL (Mevcut)
```
SSL Type:       Full (strict)
Status:         Active
Certificate:    Cloudflare Universal SSL
Encryption:     TLS 1.2+
HTTPS:          Forced (Always Use HTTPS)
```

### Let's Encrypt (Opsiyonel)
```bash
# Certbot kur
sudo apt install -y certbot python3-certbot-nginx

# Sertifika al
sudo certbot --nginx -d budgetapp.site -d www.budgetapp.site

# Otomatik yenileme test et
sudo certbot renew --dry-run

# Cron job ekle (otomatik yenileme)
sudo crontab -e

# Her gün 2:30'da kontrol et
30 2 * * * certbot renew --quiet
```

---

## Monitoring

### 1. Container Monitoring
```bash
# Container durumları
docker ps

# Container logları
docker logs budget_backend --tail=100 -f
docker logs budget_frontend --tail=100 -f
docker logs budget_database --tail=100 -f
docker logs budget_nginx --tail=100 -f

# Tüm container logları
docker-compose logs -f

# Resource kullanımı
docker stats
```

### 2. System Monitoring
```bash
# CPU ve Memory
htop

# Disk kullanımı
df -h

# Memory kullanımı
free -h

# Network bağlantıları
netstat -tulpn

# Process listesi
ps aux | grep node
ps aux | grep nginx
ps aux | grep postgres
```

### 3. Application Logs
```bash
# Backend logs
tail -f backend/logs/app.log
tail -f backend/logs/error.log

# Nginx logs
tail -f nginx/logs/access.log
tail -f nginx/logs/error.log
```

### 4. Database Monitoring
```bash
# Database bağlantıları
docker exec budget_database psql -U budget_admin -d budget_app_prod -c "SELECT count(*) FROM pg_stat_activity;"

# Database boyutu
docker exec budget_database psql -U budget_admin -d budget_app_prod -c "SELECT pg_size_pretty(pg_database_size('budget_app_prod'));"

# Tablo boyutları
docker exec budget_database psql -U budget_admin -d budget_app_prod -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### 5. Health Check Script
```bash
#!/bin/bash
# scripts/check-health.sh

echo "=== Health Check ==="
echo ""

# Nginx
echo "Nginx:"
curl -s http://localhost/health || echo "FAILED"
echo ""

# Backend
echo "Backend:"
curl -s http://localhost/api/health || echo "FAILED"
echo ""

# Database
echo "Database:"
docker exec budget_database pg_isready -U budget_admin -d budget_app_prod || echo "FAILED"
echo ""

# Containers
echo "Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}"
echo ""

# Disk
echo "Disk Usage:"
df -h / | tail -1
echo ""

# Memory
echo "Memory Usage:"
free -h | grep Mem
echo ""
```

```bash
# Script'i çalıştırılabilir yap
chmod +x scripts/check-health.sh

# Çalıştır
./scripts/check-health.sh
```

---

## Troubleshooting

### Container Başlamıyor

#### 1. Logları Kontrol Et
```bash
docker logs budget_backend
docker logs budget_frontend
docker logs budget_database
docker logs budget_nginx
```

#### 2. Container'ı Yeniden Başlat
```bash
# Tek container
docker restart budget_backend

# Tüm container'lar
docker-compose restart

# Tamamen yeniden başlat
docker-compose down
docker-compose up -d
```

#### 3. Port Çakışması
```bash
# Port 80 kullanımda mı?
sudo lsof -i :80

# Port 5001 kullanımda mı?
sudo lsof -i :5001

# Process'i öldür
sudo kill -9 <PID>
```

### Database Bağlantı Hatası

#### 1. Database Container Çalışıyor mu?
```bash
docker ps | grep database

# Çalışmıyorsa başlat
docker start budget_database
```

#### 2. Database Logları
```bash
docker logs budget_database --tail=50
```

#### 3. Database'e Bağlan
```bash
docker exec -it budget_database psql -U budget_admin -d budget_app_prod

# Bağlantı başarısız ise .env dosyasını kontrol et
cat .env | grep DB_
```

#### 4. Database Reset
```bash
# DİKKAT: Tüm veriyi siler!
docker-compose down -v
docker-compose up -d
```

### Frontend Build Hatası

#### 1. Build Loglarını Kontrol Et
```bash
docker logs budget_frontend
```

#### 2. Manuel Build
```bash
cd frontend
npm install
npm run build
```

#### 3. Cache Temizle
```bash
docker-compose down
docker system prune -a
docker-compose up -d --build
```

### Nginx 502 Bad Gateway

#### 1. Backend Çalışıyor mu?
```bash
docker ps | grep backend
curl http://localhost:5001/health
```

#### 2. Nginx Config Test
```bash
docker exec budget_nginx nginx -t
```

#### 3. Nginx Logları
```bash
docker logs budget_nginx
tail -f nginx/logs/error.log
```

#### 4. Nginx Restart
```bash
docker restart budget_nginx
```

### Disk Dolu

#### 1. Disk Kullanımını Kontrol Et
```bash
df -h
```

#### 2. Docker Temizliği
```bash
# Kullanılmayan image'ları sil
docker image prune -a

# Kullanılmayan volume'ları sil
docker volume prune

# Kullanılmayan network'leri sil
docker network prune

# Hepsini temizle
docker system prune -a --volumes
```

#### 3. Log Dosyalarını Temizle
```bash
# Eski logları sil
find logs/ -name "*.log" -mtime +7 -delete
find backend/logs/ -name "*.log" -mtime +7 -delete
find nginx/logs/ -name "*.log" -mtime +7 -delete

# Eski backup'ları sil
find backups/ -name "*.sql.gz" -mtime +7 -delete
```

### Memory Yetersiz

#### 1. Memory Kullanımını Kontrol Et
```bash
free -h
docker stats
```

#### 2. Container'ları Yeniden Başlat
```bash
docker-compose restart
```

#### 3. Swap Ekle
```bash
# 2GB swap oluştur
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Kalıcı yap
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### GitHub Actions Deployment Başarısız

#### 1. Secrets Kontrolü
```bash
# GitHub'da secrets doğru mu?
# Settings → Secrets and variables → Actions
```

#### 2. SSH Bağlantısı Test
```bash
# Local'den test et
ssh obiwan@4.210.196.73
```

#### 3. Git Pull Hatası
```bash
# VM'de
cd ~/budgetapp
git status
git pull origin main

# Conflict varsa
git stash
git pull origin main
```

#### 4. Workflow Logları
```bash
# GitHub Actions sayfasında logları kontrol et
# https://github.com/EmrahCan/budgetapp/actions
```

---

## Maintenance

### Günlük Kontroller
```bash
# Health check
./scripts/check-health.sh

# Disk kullanımı
df -h

# Container durumu
docker ps

# Logları kontrol et
tail -f backend/logs/error.log
```

### Haftalık Kontroller
```bash
# Sistem güncellemeleri
sudo apt update
sudo apt upgrade -y

# Docker image güncellemeleri
docker-compose pull
docker-compose up -d

# Backup kontrolü
ls -lh backups/
```

### Aylık Kontroller
```bash
# Database maintenance
docker exec budget_database psql -U budget_admin -d budget_app_prod -c "VACUUM ANALYZE;"

# Log rotation
find logs/ -name "*.log" -mtime +30 -delete

# Backup cleanup
find backups/ -name "*.sql.gz" -mtime +30 -delete
```

---

**Hazırlayan:** Kiro AI  
**Tarih:** 2 Aralık 2024  
**Versiyon:** 1.0
