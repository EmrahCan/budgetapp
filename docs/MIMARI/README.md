# Budget App - Mimari Dokümantasyon

## 📚 Dokümantasyon İndeksi

Bu klasör, Budget App uygulamasının tüm mimari, teknik ve operasyonel dokümantasyonunu içerir.

---

## 📋 Dokümantasyon Listesi

### 1. [Genel Bakış](./01-GENEL-BAKIS.md)
**Konu:** Proje genel bakış, teknoloji stack, mimari diyagram

**İçerik:**
- Proje özeti ve versiyon bilgileri
- Teknoloji stack (Backend, Frontend, Infrastructure)
- High-level mimari diyagram
- Container architecture
- Ortam bilgileri (Test, Production, Local)
- Temel özellikler listesi
- Proje yapısı
- Veri akışı
- Deployment pipeline
- Monitoring ve logging
- Backup ve recovery
- Güvenlik önlemleri
- Performance optimizations

**Hedef Kitle:** Tüm ekip üyeleri, yeni geliştiriciler, proje yöneticileri

---

### 2. [Backend Detay](./02-BACKEND-DETAY.md)
**Konu:** Backend (Node.js/Express) detaylı dokümantasyon

**İçerik:**
- Teknoloji stack ve dependencies
- Proje yapısı (controllers, models, routes, services)
- API endpoints (tüm endpoint'ler ve örnekler)
- Database schema
- Authentication (JWT)
- Middleware (auth, validation, error handling, rate limiting)
- Services (AI, notification, email)
- Error handling
- Logging (Winston)

**Hedef Kitle:** Backend geliştiriciler, API entegrasyon yapacaklar

---

### 3. [Frontend Detay](./03-FRONTEND-DETAY.md)
**Konu:** Frontend (React) detaylı dokümantasyon

**İçerik:**
- Teknoloji stack ve dependencies
- Proje yapısı (components, pages, contexts, hooks)
- Component architecture
- State management (Context API)
- Routing (React Router)
- API integration (Axios)
- Styling (Material-UI)
- i18n (Internationalization)
- Performance optimizations

**Hedef Kitle:** Frontend geliştiriciler, UI/UX tasarımcılar

---

### 4. [Database Detay](./04-DATABASE-DETAY.md)
**Konu:** PostgreSQL database detaylı dokümantasyon

**İçerik:**
- Database bilgileri ve ortamlar
- Tüm tablolar ve schema'lar
- İlişkiler (Relationships)
- İndeksler (Indexes)
- Constraints (CHECK, UNIQUE, NOT NULL)
- Migrations
- Backup & Restore prosedürleri
- Performance optimization
- Query optimization
- Database maintenance

**Hedef Kitle:** Database yöneticileri, backend geliştiriciler

---

### 5. [Deployment ve Sunucu](./05-DEPLOYMENT-SUNUCU.md)
**Konu:** Sunucu kurulumu ve deployment prosedürleri

**İçerik:**
- Sunucu bilgileri (Test ve Production)
- İlk kurulum adımları
- Docker deployment
- CI/CD pipeline (GitHub Actions)
- SSL sertifikası
- Monitoring
- Troubleshooting
- Maintenance prosedürleri

**Hedef Kitle:** DevOps, sistem yöneticileri, deployment yapacaklar

---

### 6. [Environment ve Güvenlik](./06-ENVIRONMENT-GUVENLIK.md)
**Konu:** Environment variables ve güvenlik dokümantasyonu

**İçerik:**
- Environment variables (Backend, Frontend, Docker)
- Güvenlik önlemleri (Network, Application, Database, Docker)
- Şifre politikaları
- API keys yönetimi
- Backup stratejisi
- Disaster recovery plan
- Security checklist

**Hedef Kitle:** Tüm ekip, güvenlik sorumluları, sistem yöneticileri

---

## 🎯 Kullanım Senaryoları

### Yeni Geliştirici Onboarding
1. [Genel Bakış](./01-GENEL-BAKIS.md) - Projeyi tanı
2. [Backend Detay](./02-BACKEND-DETAY.md) veya [Frontend Detay](./03-FRONTEND-DETAY.md) - Çalışacağın alanı öğren
3. [Database Detay](./04-DATABASE-DETAY.md) - Database yapısını anla
4. Local development environment kur

### Deployment Yapacaklar
1. [Deployment ve Sunucu](./05-DEPLOYMENT-SUNUCU.md) - Deployment prosedürlerini öğren
2. [Environment ve Güvenlik](./06-ENVIRONMENT-GUVENLIK.md) - Environment variables'ı ayarla
3. [Database Detay](./04-DATABASE-DETAY.md) - Database kurulumunu yap

### Troubleshooting
1. [Deployment ve Sunucu](./05-DEPLOYMENT-SUNUCU.md) - Troubleshooting bölümü
2. [Backend Detay](./02-BACKEND-DETAY.md) - API ve backend sorunları
3. [Database Detay](./04-DATABASE-DETAY.md) - Database sorunları

### Güvenlik Audit
1. [Environment ve Güvenlik](./06-ENVIRONMENT-GUVENLIK.md) - Tüm güvenlik önlemleri
2. [Deployment ve Sunucu](./05-DEPLOYMENT-SUNUCU.md) - Sunucu güvenliği
3. [Database Detay](./04-DATABASE-DETAY.md) - Database güvenliği

---

## 🔍 Hızlı Referans

### Sunucu Bilgileri
```
Test:       20.224.194.131 (obiwan / Eben2010++**)
Production: 4.210.196.73 (obiwan / Eben2010++**)
Domain:     budgetapp.site
```

### Önemli Komutlar
```bash
# SSH bağlantısı
ssh obiwan@4.210.196.73

# Container durumu
docker ps

# Logları görüntüle
docker-compose logs -f

# Health check
curl http://localhost/health

# Backup al
./scripts/backup-database.sh

# Deployment
git push origin main  # GitHub Actions otomatik deploy eder
```

### Önemli Dosyalar
```
.env                    # Environment variables
docker-compose.yml      # Container configuration
backend/database/schema.sql  # Database schema
nginx/nginx.conf        # Nginx configuration
```

### Önemli URL'ler
```
Production:  https://budgetapp.site
API:         https://budgetapp.site/api
Health:      https://budgetapp.site/health
GitHub:      https://github.com/EmrahCan/budgetapp
Cloudflare:  https://dash.cloudflare.com
```

---

## 📝 Dokümantasyon Güncellemeleri

### Versiyon 1.0 (2 Aralık 2024)
- İlk dokümantasyon oluşturuldu
- Tüm bölümler tamamlandı
- Örnekler ve kod snippet'leri eklendi

### Gelecek Güncellemeler
- [ ] Redis cache dokümantasyonu
- [ ] Email service dokümantasyonu
- [ ] Advanced monitoring setup
- [ ] Performance tuning guide
- [ ] API versioning strategy
- [ ] Microservices migration plan

---

## 🤝 Katkıda Bulunma

Bu dokümantasyonu güncel tutmak için:

1. Yeni özellik eklendiğinde ilgili dokümantasyonu güncelle
2. Bug fix'lerde troubleshooting bölümünü güncelle
3. Deployment değişikliklerinde deployment dokümanını güncelle
4. Güvenlik güncellemelerinde güvenlik dokümanını güncelle

---

## 📞 Destek

Sorularınız için:
- GitHub Issues: https://github.com/EmrahCan/budgetapp/issues
- Email: admin@budgetapp.site

---

## 📄 Lisans

Bu dokümantasyon Budget App projesi ile aynı lisansa sahiptir.

---

**Hazırlayan:** Kiro AI  
**Tarih:** 2 Aralık 2024  
**Versiyon:** 1.0  
**Son Güncelleme:** 2 Aralık 2024

---

## 🎉 Teşekkürler

Bu dokümantasyon, Budget App projesinin sürdürülebilirliği ve yeni geliştiricilerin hızlı onboarding'i için hazırlanmıştır.

**Mutlu kodlamalar! 🚀**
