# Test VM Frontend Fix

## Problem
test.budgetapp.site "Index of build/" hatası veriyor.

## Sebep
Frontend container'ı `serve` komutu ile çalışıyor ve directory listing gösteriyor. Nginx ile değiştirmemiz gerekiyor.

## Çözüm

### 1. Test VM'ine Bağlan
```bash
ssh obiwan@108.141.152.224
```

### 2. Budget Dizinine Git
```bash
cd /root/budgetapp  # veya /root/budget
```

### 3. Güncel Kodu Çek
```bash
git pull origin develop
```

### 4. Fix Script'ini Çalıştır
```bash
chmod +x scripts/fix-test-vm-frontend.sh
./scripts/fix-test-vm-frontend.sh
```

### 5. Test Et
Tarayıcıda aç: https://test.budgetapp.site

## Manuel Adımlar (Script Çalışmazsa)

### 1. Frontend Container'ı Durdur
```bash
docker-compose stop frontend
docker-compose rm -f frontend
```

### 2. Frontend Image'ı Sil
```bash
docker rmi budgetapp-frontend 2>/dev/null || true
docker rmi budget_frontend 2>/dev/null || true
```

### 3. Yeniden Build Et
```bash
docker-compose build --no-cache frontend
```

### 4. Başlat
```bash
docker-compose up -d frontend
```

### 5. Kontrol Et
```bash
# Container durumunu kontrol et
docker-compose ps

# Nginx html dizinini kontrol et
docker exec budget_frontend ls -la /usr/share/nginx/html/

# index.html var mı?
docker exec budget_frontend test -f /usr/share/nginx/html/index.html && echo "OK" || echo "MISSING"

# Frontend'e istek at
curl -I http://localhost/
```

### 6. Logları İncele
```bash
docker-compose logs -f frontend
```

## Doğrulama

✅ Container çalışıyor: `docker-compose ps frontend`
✅ index.html mevcut: `/usr/share/nginx/html/index.html`
✅ Nginx çalışıyor: Port 3000'de dinliyor
✅ Site açılıyor: https://test.budgetapp.site

## Notlar

- Test VM'de Dockerfile ve default.conf güncellenmiş olmalı
- Frontend artık nginx ile çalışıyor (serve değil)
- Port 3000'de nginx dinliyor
- Ana nginx (port 80) frontend container'a proxy yapıyor
