# Production Readiness Checklist

## ✅ Test Ortamında Çözülen Sorunlar

### 1. Frontend Build
- [x] TypeScript dependency conflict çözüldü
- [x] `--legacy-peer-deps` flag eklendi
- [x] Build başarıyla tamamlanıyor

### 2. Nginx Configuration
- [x] Duplicate `/health` location kaldırıldı
- [x] HTTP-only mode (Cloudflare SSL için)
- [x] Cloudflare IP ranges eklendi
- [x] Rate limiting yapılandırıldı

### 3. Deploy Script
- [x] Health check düzeltildi (sadece `/health`)
- [x] SSL cleanup eklendi
- [x] Proper error handling

## 🔧 Production'a Geçmeden Önce Yapılacaklar

### Environment Configuration
- [ ] Production `.env` dosyası oluştur
  - [ ] Güçlü DB_PASSWORD
  - [ ] Güçlü JWT_SECRET
  - [ ] FRONTEND_URL=https://budgetapp.site
  - [ ] ALLOWED_ORIGINS=https://budgetapp.site
  - [ ] REACT_APP_API_URL=https://budgetapp.site/api

### DNS Configuration
- [ ] Cloudflare'de A record ekle
  - Type: A
  - Name: @ (root domain)
  - IPv4: 4.210.196.73 (Production VM IP)
  - Proxy: ✅ Enabled (orange cloud)

### VM Setup
- [ ] Production VM'ye SSH erişimi test et
- [ ] Docker ve Docker Compose kurulu mu kontrol et
- [ ] Firewall kuralları (80, 443, 22)
- [ ] fail2ban kurulu mu kontrol et

### GitHub Secrets
- [ ] PROD_SSH_HOST (4.210.196.73)
- [ ] PROD_SSH_USER (obiwan)
- [ ] PROD_SSH_PASSWORD
- [ ] Secrets doğru mu test et

### Database
- [ ] Production database backup stratejisi
- [ ] Database migration planı
- [ ] Test verilerini production'a taşıma (opsiyonel)

### Monitoring
- [ ] Log rotation yapılandırması
- [ ] Disk space monitoring
- [ ] Health check monitoring
- [ ] Backup monitoring

## 🚨 Production'da Dikkat Edilecekler

### 1. Zero-Downtime Deployment
- Deploy sırasında kullanıcılar etkilenmemeli
- Health check'ler geçmezse rollback

### 2. Database Backup
- Her deploy öncesi otomatik backup
- Backup'lar 7 gün saklanmalı

### 3. SSL/TLS
- Cloudflare SSL/TLS mode: Full (strict) olmalı
- Always Use HTTPS enabled olmalı

### 4. Security
- Güçlü şifreler kullan
- SSH key-based auth (opsiyonel ama önerilen)
- Rate limiting aktif
- fail2ban aktif

## 📊 Test Ortamı vs Production Farkları

| Özellik | Test | Production |
|---------|------|------------|
| Domain | test.budgetapp.site | budgetapp.site |
| VM IP | 20.224.194.131 | 4.210.196.73 |
| Branch | develop | main |
| Database | budget_app_test | budget_app_prod |
| Backup | Opsiyonel | Zorunlu |
| Monitoring | Basic | Full |

## 🎯 Production Deploy Adımları

### 1. Pre-Deployment
```bash
# Production VM'ye bağlan
ssh obiwan@4.210.196.73

# Proje dizini oluştur
mkdir -p ~/budgetapp
cd ~/budgetapp

# Repository clone
git clone https://github.com/EmrahCan/budgetapp.git .
git checkout main

# .env dosyası oluştur
nano .env
# (Güçlü şifreler kullan!)

# Dosya izinlerini ayarla
chmod 600 .env
```

### 2. GitHub Actions ile Deploy
- Main branch'e push yap
- GitHub Actions otomatik çalışacak
- Health check'leri izle

### 3. Post-Deployment
```bash
# Servisleri kontrol et
docker ps

# Logları kontrol et
docker logs budget_nginx
docker logs budget_backend
docker logs budget_frontend
docker logs budget_database

# Health check
curl https://budgetapp.site/health

# Tarayıcıda test et
# https://budgetapp.site
```

### 4. Rollback Planı
```bash
# Eğer sorun olursa
cd ~/budgetapp
git log --oneline -5  # Son 5 commit'i gör
git reset --hard <previous-commit-hash>
docker-compose down
docker-compose up -d --build
```

## ✅ Production Başarı Kriterleri

- [ ] https://budgetapp.site açılıyor
- [ ] Login çalışıyor
- [ ] Transaction oluşturma çalışıyor
- [ ] Tüm sayfalar yükleniyor
- [ ] API response time < 500ms
- [ ] Nginx access logs yazılıyor
- [ ] Database bağlantısı stabil
- [ ] SSL sertifikası geçerli (Cloudflare)
- [ ] Health check passing

## 🔄 Sürekli İyileştirme

### Monitoring
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic, DataDog)

### Backup
- [ ] Otomatik günlük backup
- [ ] Backup restore testi
- [ ] Off-site backup (Azure Blob, S3)

### Security
- [ ] SSL Labs test (A+ rating)
- [ ] Security headers test
- [ ] Vulnerability scanning
- [ ] Dependency updates

## 📞 Sorun Giderme

### Nginx Başlamıyor
```bash
docker logs budget_nginx
# SSL hatası varsa: rm -rf nginx/ssl
# Config hatası varsa: nginx -t
```

### Frontend 404 Veriyor
```bash
docker logs budget_frontend
# Build hatası varsa: docker-compose build --no-cache frontend
```

### Backend Bağlanamıyor
```bash
docker logs budget_backend
# Database bağlantı hatası varsa: .env dosyasını kontrol et
```

### Database Bağlantı Hatası
```bash
docker logs budget_database
# Volume sorunuysa: docker volume ls
```

## 🎓 Öğrenilen Dersler (Test'ten)

1. **Frontend Dockerfile'da `--legacy-peer-deps` kullan**
2. **Nginx config'de duplicate location'ları kontrol et**
3. **Health check endpoint'lerini doğrula**
4. **Deploy script'leri test ortamında test et**
5. **Cloudflare SSL için HTTP-only nginx config**
6. **Environment-specific değişkenleri .env'de tut**

## 📝 Notlar

- Test ortamı başarıyla çalışıyor ✅
- Tüm sorunlar çözüldü ✅
- Production deploy için hazır ✅
- GitHub Actions pipeline çalışıyor ✅

---

**Son Güncelleme:** 2024-11-29
**Durum:** Test Başarılı, Production'a Hazır
