# Test VM Manual Fix Guide
## Problem: Login çalışmıyor - Mixed Content Error

### Sorunlar:
1. Frontend HTTPS üzerinden yükleniyor ama HTTP API'ye istek atıyor
2. Frontend build dosyası eksik (default.conf.nginx)
3. Backend OCR route dosyası eksik

### Çözüm Adımları:

#### 1. Test VM'ye Bağlan
```bash
ssh obiwan@20.224.194.131
cd /home/obiwan/budget-app
```

#### 2. Eksik Dosyaları Kopyala

**Local makineden (başka bir terminal):**

```bash
# Frontend nginx config
scp budget/frontend/default.conf.nginx obiwan@20.224.194.131:/home/obiwan/budget-app/frontend/

# Backend OCR dosyaları
scp budget/backend/routes/ocr.js obiwan@20.224.194.131:/home/obiwan/budget-app/backend/routes/
scp budget/backend/controllers/ocrController.js obiwan@20.224.194.131:/home/obiwan/budget-app/backend/controllers/
scp budget/backend/services/ocrService.js obiwan@20.224.194.131:/home/obiwan/budget-app/backend/services/

# Updated server.js with CORS fix
scp budget/backend/server.js obiwan@20.224.194.131:/home/obiwan/budget-app/backend/
```

#### 3. .env Dosyasını Güncelle

**Test VM'de:**

```bash
cd /home/obiwan/budget-app

# Backup
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# API URL'lerini güncelle
nano .env
```

**Şu satırları bul ve değiştir:**
```bash
# ESKİ (yanlış):
FRONTEND_URL=http://20.224.194.131
REACT_APP_API_URL=http://20.224.194.131/api
ALLOWED_ORIGINS=http://20.224.194.131,https://20.224.194.131

# YENİ (doğru):
FRONTEND_URL=https://test.budgetapp.site
REACT_APP_API_URL=https://test.budgetapp.site/api
ALLOWED_ORIGINS=https://test.budgetapp.site,http://test.budgetapp.site,http://20.224.194.131,https://20.224.194.131
```

#### 4. Container'ları Yeniden Build Et

```bash
cd /home/obiwan/budget-app

# Tüm container'ları durdur
docker-compose down

# Backend'i rebuild et
docker-compose build --no-cache backend

# Frontend'i rebuild et
docker-compose build --no-cache frontend

# Tümünü başlat
docker-compose up -d

# Logları kontrol et
docker logs budget_backend_test -f
# Ctrl+C ile çık

docker logs budget_frontend_test -f
# Ctrl+C ile çık
```

#### 5. Kontrol Et

```bash
# Backend health check
curl http://localhost/api/health

# Container durumları
docker-compose ps

# Tüm container'lar "healthy" olmalı
```

#### 6. Test Et

1. Tarayıcıda: https://test.budgetapp.site
2. Cache'i temizle: Ctrl+Shift+R (hard refresh)
3. Login dene
4. Browser console'da "Mixed Content" hatası olmamalı

### Hata Ayıklama:

**Backend başlamıyorsa:**
```bash
docker logs budget_backend_test --tail 50
```

**Frontend başlamıyorsa:**
```bash
docker logs budget_frontend_test --tail 50
```

**Nginx hatası varsa:**
```bash
docker logs budget_nginx_test --tail 50
```

### Beklenen Sonuç:

```bash
$ docker-compose ps
NAME                   STATUS
budget_backend_test    Up (healthy)
budget_database_test   Up (healthy)
budget_frontend_test   Up (healthy)
budget_nginx_test      Up (healthy)
```

### Notlar:

- Cloudflare HTTPS'i handle ediyor, nginx HTTP üzerinden serve ediyor
- Frontend build sırasında `REACT_APP_API_URL` environment variable'ı kullanılıyor
- Backend CORS'da `https://test.budgetapp.site` olmalı
- Mixed Content hatası browser tarafından engelleniyor, backend/nginx sorunu değil

