# Budget App - Bütçe Yönetim Sistemi

Modern, kullanıcı dostu bir bütçe yönetim uygulaması.

## 🚀 Özellikler

- 💰 Gelir/Gider Takibi
- 💳 Kredi Kartı Yönetimi
- 📊 Finansal Raporlar ve Grafikler
- 🔔 Akıllı Bildirimler
- 🤖 AI Destekli Kategorizasyon
- 🌍 Çoklu Dil Desteği (TR/EN)
- 🌙 Dark Mode
- 📱 Responsive Tasarım

## 📋 Gereksinimler

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15 (Docker ile gelir)

## 🛠️ Kurulum

### 1. Repository'yi Klonlayın
```bash
git clone <repository-url>
cd budget
```

### 2. Backend Konfigürasyonu
```bash
cd backend
cp .env.example .env.local-prod
# .env.local-prod dosyasını düzenleyin
```

### 3. Frontend Konfigürasyonu
```bash
cd frontend
cp .env.example .env
# .env dosyasını düzenleyin
```

Örnek `.env`:
```env
PORT=3008
REACT_APP_API_URL=http://localhost:5008/api
```

### 4. Servisleri Başlatın

#### Backend ve Database (Docker)
```bash
./scripts/local/start-local-dev.sh
```

#### Frontend (npm)
```bash
cd frontend
npm install
npm start
```

## 🌐 Erişim

- **Frontend**: http://localhost:3008
- **Backend API**: http://localhost:5008
- **Database**: localhost:5434

## 📚 Dokümanlar

- [Local Development Guide](LOCAL_DEVELOPMENT_GUIDE.md)
- [Project Specifications](PROJECT_SPECIFICATIONS.md)
- [Deployment Guide](docs/archive/DEPLOYMENT_GUIDE_v2.4.0.md)

## 🔧 Yararlı Komutlar

### Database Backup
```bash
./scripts/local/backup-database.sh
```

### Kullanıcı Şifresi Sıfırlama
```bash
./scripts/local/reset-user-password.sh user@example.com NewPass123
```

### Servisleri Durdurma
```bash
./scripts/local/stop-local-dev.sh
```

### Docker Logları
```bash
# Backend logs
docker logs -f budget_backend_local_prod

# Database logs
docker logs -f budget_database_local_prod
```

## 🏗️ Proje Yapısı

```
budget/
├── backend/              # Node.js/Express backend
│   ├── controllers/      # API controllers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   └── database/        # Database migrations & init
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   └── utils/       # Utility functions
│   └── public/          # Static files
├── scripts/             # Utility scripts
│   ├── local/          # Local development scripts
│   └── production/     # Production scripts
└── docs/               # Documentation
    └── archive/        # Archived documentation
```

## 🔐 Varsayılan Kullanıcı

**Email**: admin@budgetapp.com  
**Şifre**: Admin123

> ⚠️ Production'da mutlaka değiştirin!

## 🐛 Sorun Giderme

### Backend Başlamıyor
```bash
# Container'ları yeniden başlat
docker-compose -f docker-compose.local-prod.yml down
docker-compose -f docker-compose.local-prod.yml up -d --build
```

### Frontend API'ye Bağlanamıyor
1. Backend'in çalıştığını kontrol edin: `docker ps`
2. `.env` dosyasında `REACT_APP_API_URL` değerini kontrol edin
3. Browser cache'ini temizleyin (Cmd+Shift+R)
4. Frontend'i yeniden başlatın

### Database Bağlantı Hatası
```bash
# Database container'ını kontrol et
docker exec budget_database_local_prod psql -U postgres -d budget_app_local_prod -c "SELECT 1;"
```

## 📝 Lisans

[LICENSE](LICENSE) dosyasına bakın.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📧 İletişim

Sorularınız için issue açabilirsiniz.

---

**Version**: 2.4.0  
**Last Updated**: 27 Kasım 2024
