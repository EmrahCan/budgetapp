#!/bin/bash

# =============================================================================
# Test VM Yeni Kurulum ve Konfigürasyon Scripti
# =============================================================================
# Bu script yeni test VM'i (20.224.194.131) tamamen yapılandırır
# Production clone'undan gelen ayarları test ortamına uygun hale getirir

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfigürasyon
TEST_VM_IP="20.224.194.131"
TEST_VM_USER="obiwan"
PROJECT_DIR="/home/obiwan/budget-app"
BACKUP_DIR="/home/obiwan/backups"

echo -e "${BLUE}🚀 Test VM Yeni Kurulum Başlatılıyor...${NC}"
echo -e "${YELLOW}VM: ${TEST_VM_IP}${NC}"
echo -e "${YELLOW}User: ${TEST_VM_USER}${NC}"
echo -e "${YELLOW}Project Dir: ${PROJECT_DIR}${NC}"
echo ""

# =============================================================================
# 1. VM Bağlantı Testi
# =============================================================================
echo -e "${BLUE}📡 1. VM Bağlantı Testi${NC}"
if ssh -o ConnectTimeout=10 ${TEST_VM_USER}@${TEST_VM_IP} "echo 'Bağlantı başarılı'" 2>/dev/null; then
    echo -e "${GREEN}✅ VM bağlantısı başarılı${NC}"
else
    echo -e "${RED}❌ VM'e bağlanılamıyor!${NC}"
    echo "SSH komutu: ssh ${TEST_VM_USER}@${TEST_VM_IP}"
    exit 1
fi

# =============================================================================
# 2. Sistem Durumu Kontrolü
# =============================================================================
echo -e "\n${BLUE}🔍 2. Sistem Durumu Kontrolü${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << 'EOF'
echo "📊 Sistem Bilgileri:"
echo "  - OS: $(lsb_release -d | cut -f2)"
echo "  - Kernel: $(uname -r)"
echo "  - Uptime: $(uptime -p)"
echo "  - Disk: $(df -h / | tail -1 | awk '{print $4}') free"
echo "  - Memory: $(free -h | grep Mem | awk '{print $7}') free"
echo ""

echo "🐳 Docker Durumu:"
if command -v docker &> /dev/null; then
    echo "  - Docker: $(docker --version)"
    echo "  - Docker Compose: $(docker-compose --version)"
    echo "  - Running containers: $(docker ps --format 'table {{.Names}}\t{{.Status}}' | tail -n +2 | wc -l)"
else
    echo "  - Docker: Yüklü değil"
fi
EOF

# =============================================================================
# 3. Mevcut Proje Durumu
# =============================================================================
echo -e "\n${BLUE}📁 3. Mevcut Proje Durumu${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
if [ -d "${PROJECT_DIR}" ]; then
    echo "✅ Proje dizini mevcut: ${PROJECT_DIR}"
    cd ${PROJECT_DIR}
    
    echo "📂 Dizin içeriği:"
    ls -la
    
    echo ""
    echo "🐳 Docker container'ları:"
    if command -v docker &> /dev/null; then
        docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    fi
    
    echo ""
    echo "🔧 Mevcut .env dosyası:"
    if [ -f ".env" ]; then
        echo "  - .env dosyası mevcut"
        grep -E "NODE_ENV|FRONTEND_URL|REACT_APP_API_URL" .env || echo "  - Temel değişkenler bulunamadı"
    else
        echo "  - .env dosyası yok"
    fi
else
    echo "❌ Proje dizini bulunamadı: ${PROJECT_DIR}"
fi
EOF

# =============================================================================
# 4. Backup Oluştur
# =============================================================================
echo -e "\n${BLUE}💾 4. Mevcut Konfigürasyon Backup${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
# Backup dizini oluştur
mkdir -p ${BACKUP_DIR}/\$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/\$(date +%Y%m%d_%H%M%S)"

if [ -d "${PROJECT_DIR}" ]; then
    echo "📦 Backup oluşturuluyor: \$BACKUP_PATH"
    
    # Önemli dosyaları backup'la
    if [ -f "${PROJECT_DIR}/.env" ]; then
        cp "${PROJECT_DIR}/.env" "\$BACKUP_PATH/.env.backup"
        echo "  - .env backup'landı"
    fi
    
    if [ -f "${PROJECT_DIR}/docker-compose.yml" ]; then
        cp "${PROJECT_DIR}/docker-compose.yml" "\$BACKUP_PATH/docker-compose.yml.backup"
        echo "  - docker-compose.yml backup'landı"
    fi
    
    # Nginx config
    if [ -f "${PROJECT_DIR}/frontend/default.conf.nginx" ]; then
        cp "${PROJECT_DIR}/frontend/default.conf.nginx" "\$BACKUP_PATH/nginx.conf.backup"
        echo "  - nginx config backup'landı"
    fi
    
    echo "✅ Backup tamamlandı: \$BACKUP_PATH"
else
    echo "⚠️  Proje dizini yok, backup atlanıyor"
fi
EOF

# =============================================================================
# 5. Container'ları Durdur
# =============================================================================
echo -e "\n${BLUE}🛑 5. Mevcut Container'ları Durdur${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
if [ -d "${PROJECT_DIR}" ]; then
    cd ${PROJECT_DIR}
    
    echo "🐳 Container'ları durduruluyor..."
    if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
        docker-compose down || echo "  - docker-compose down başarısız"
    fi
    
    # Tüm budget container'larını durdur
    echo "🧹 Budget container'larını temizle..."
    docker ps -a --filter "name=budget" --format "{{.Names}}" | xargs -r docker rm -f || echo "  - Container temizleme tamamlandı"
    
    echo "✅ Container'lar durduruldu"
else
    echo "⚠️  Proje dizini yok, container durdurma atlanıyor"
fi
EOF

# =============================================================================
# 6. Proje Dizinini Hazırla
# =============================================================================
echo -e "\n${BLUE}📁 6. Proje Dizinini Hazırla${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
# Proje dizinini oluştur
mkdir -p ${PROJECT_DIR}
cd ${PROJECT_DIR}

echo "📂 Proje dizini hazırlandı: ${PROJECT_DIR}"

# Git repository kontrolü
if [ -d ".git" ]; then
    echo "📋 Git repository mevcut"
    echo "  - Branch: \$(git branch --show-current 2>/dev/null || echo 'unknown')"
    echo "  - Last commit: \$(git log -1 --oneline 2>/dev/null || echo 'unknown')"
else
    echo "⚠️  Git repository yok"
fi
EOF

# =============================================================================
# 7. Test Ortamı .env Dosyası Oluştur
# =============================================================================
echo -e "\n${BLUE}⚙️  7. Test Ortamı .env Dosyası Oluştur${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
cd ${PROJECT_DIR}

echo "📝 Test ortamı .env dosyası oluşturuluyor..."

cat > .env << 'ENVEOF'
# =============================================================================
# Budget App - Test Environment Configuration
# Generated: \$(date)
# VM: ${TEST_VM_IP}
# =============================================================================

# Environment
NODE_ENV=test
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_app_test
DB_USER=budget_admin
DB_PASSWORD=budget123

# JWT Configuration
JWT_SECRET=test_jwt_secret_key_2024_very_secure_test_environment
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=https://test.budgetapp.site
REACT_APP_API_URL=https://test.budgetapp.site/api
ALLOWED_ORIGINS=https://test.budgetapp.site,http://test.budgetapp.site,http://20.224.194.131,https://20.224.194.131

# Email Configuration (Test - Disabled)
EMAIL_ENABLED=false
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=test@example.com
EMAIL_PASSWORD=test_password
EMAIL_FROM=test@budgetapp.site

# AI Configuration (Test)
GEMINI_API_KEY=test_gemini_key
AI_ENABLED=false

# OCR Configuration (Test)
OCR_ENABLED=false

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Test Specific
TEST_MODE=true
SKIP_AUTH_FOR_TESTS=false
ENVEOF

echo "✅ .env dosyası oluşturuldu"
echo ""
echo "📋 .env içeriği:"
head -20 .env
echo "..."
EOF

# =============================================================================
# 8. Docker Compose Test Konfigürasyonu
# =============================================================================
echo -e "\n${BLUE}🐳 8. Docker Compose Test Konfigürasyonu${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
cd ${PROJECT_DIR}

echo "📝 Test ortamı docker-compose.yml oluşturuluyor..."

cat > docker-compose.yml << 'DOCKEREOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: budget_postgres_test
    environment:
      POSTGRES_DB: budget_app_test
      POSTGRES_USER: budget_admin
      POSTGRES_PASSWORD: budget123
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=C"
    volumes:
      - postgres_data_test:/var/lib/postgresql/data
      - ./backend/database/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - budget_network_test
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U budget_admin -d budget_app_test"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    container_name: budget_backend_test
    environment:
      - NODE_ENV=test
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=budget_app_test
      - DB_USER=budget_admin
      - DB_PASSWORD=budget123
    volumes:
      - ./backend:/app
      - /app/node_modules
      - ./logs:/app/logs
    ports:
      - "5000:5000"
    networks:
      - budget_network_test
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend (Nginx)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: budget_frontend_test
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend/default.conf.nginx:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    networks:
      - budget_network_test
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data_test:
    driver: local

networks:
  budget_network_test:
    driver: bridge
DOCKEREOF

echo "✅ docker-compose.yml oluşturuldu"
EOF

# =============================================================================
# 9. Nginx Test Konfigürasyonu
# =============================================================================
echo -e "\n${BLUE}🌐 9. Nginx Test Konfigürasyonu${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
cd ${PROJECT_DIR}

# Frontend dizini oluştur
mkdir -p frontend

echo "📝 Nginx test konfigürasyonu oluşturuluyor..."

cat > frontend/default.conf.nginx << 'NGINXEOF'
# Budget App - Test Environment Nginx Configuration
# Generated: \$(date)

# Upstream backend
upstream backend {
    server backend:5000;
}

# HTTP Server (Port 80)
server {
    listen 80;
    server_name test.budgetapp.site 20.224.194.131;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Root directory
    root /usr/share/nginx/html;
    index index.html index.htm;
    
    # API proxy
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
        
        # CORS headers for API
        add_header Access-Control-Allow-Origin "https://test.budgetapp.site" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;
        add_header Access-Control-Allow-Credentials "true" always;
        
        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://test.budgetapp.site";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
            add_header Access-Control-Allow-Credentials "true";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://backend/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Security - deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log|conf)\$ {
        deny all;
    }
}
NGINXEOF

echo "✅ Nginx konfigürasyonu oluşturuldu"
EOF

# =============================================================================
# 10. Database Initialization Script
# =============================================================================
echo -e "\n${BLUE}🗄️  10. Database Initialization Script${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
cd ${PROJECT_DIR}

# Backend database dizini oluştur
mkdir -p backend/database/init

echo "📝 Database initialization script oluşturuluyor..."

cat > backend/database/init/01-init-test-db.sql << 'SQLEOF'
-- Budget App Test Database Initialization
-- Generated: \$(date)

-- Create test database if not exists
SELECT 'CREATE DATABASE budget_app_test' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'budget_app_test');

-- Connect to test database
\c budget_app_test;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'Europe/Istanbul';

-- Create test user with limited permissions
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'budget_test_user') THEN
        CREATE ROLE budget_test_user WITH LOGIN PASSWORD 'test_password_123';
    END IF;
END
\$\$;

-- Grant permissions
GRANT CONNECT ON DATABASE budget_app_test TO budget_test_user;
GRANT USAGE ON SCHEMA public TO budget_test_user;
GRANT CREATE ON SCHEMA public TO budget_test_user;

-- Log initialization
INSERT INTO pg_stat_statements_info (dealloc) VALUES (0) ON CONFLICT DO NOTHING;

SQLEOF

echo "✅ Database initialization script oluşturuldu"
EOF

# =============================================================================
# 11. Test Ortamı için Backend Dockerfile
# =============================================================================
echo -e "\n${BLUE}🐳 11. Backend Dockerfile (Test)${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
cd ${PROJECT_DIR}

mkdir -p backend

echo "📝 Backend Dockerfile oluşturuluyor..."

cat > backend/Dockerfile << 'DOCKERFILEEOF'
# Budget App Backend - Test Environment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    postgresql-client

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S budget -u 1001 -G nodejs

# Change ownership
RUN chown -R budget:nodejs /app

# Switch to non-root user
USER budget

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Expose port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
DOCKERFILEEOF

echo "✅ Backend Dockerfile oluşturuldu"
EOF

# =============================================================================
# 12. Frontend Dockerfile (Test)
# =============================================================================
echo -e "\n${BLUE}🌐 12. Frontend Dockerfile (Test)${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
cd ${PROJECT_DIR}

echo "📝 Frontend Dockerfile oluşturuluyor..."

cat > frontend/Dockerfile << 'DOCKERFILEEOF'
# Budget App Frontend - Test Environment
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY default.conf.nginx /etc/nginx/conf.d/default.conf

# Copy static files (will be mounted as volume in production)
# For now, create a simple index.html
RUN echo '<!DOCTYPE html>
<html>
<head>
    <title>Budget App - Test Environment</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; }
        .status { padding: 20px; border-radius: 8px; margin: 20px 0; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏦 Budget App</h1>
        <div class="info">
            <h2>Test Environment</h2>
            <p>VM: 20.224.194.131</p>
            <p>Domain: test.budgetapp.site</p>
        </div>
        <div class="success">
            <p>✅ Frontend container is running</p>
            <p>API Health: <span id="api-status">Checking...</span></p>
        </div>
        <div>
            <a href="/api/health" target="_blank">API Health Check</a>
        </div>
    </div>
    
    <script>
        // Check API health
        fetch("/api/health")
            .then(response => response.json())
            .then(data => {
                document.getElementById("api-status").textContent = 
                    data.success ? "✅ " + data.status : "❌ Error";
            })
            .catch(error => {
                document.getElementById("api-status").textContent = "❌ Unreachable";
            });
    </script>
</body>
</html>' > /usr/share/nginx/html/index.html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost || exit 1

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
DOCKERFILEEOF

echo "✅ Frontend Dockerfile oluşturuldu"
EOF

# =============================================================================
# 13. Test Ortamı Başlatma Scripti
# =============================================================================
echo -e "\n${BLUE}🚀 13. Test Ortamı Başlatma Scripti${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
cd ${PROJECT_DIR}

echo "📝 Test ortamı başlatma scripti oluşturuluyor..."

cat > start-test-environment.sh << 'STARTEOF'
#!/bin/bash

# Budget App Test Environment Starter
# Generated: \$(date)

set -e

echo "🚀 Budget App Test Environment Starting..."
echo "VM: 20.224.194.131"
echo "Time: \$(date)"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed!"
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans || true

# Clean up old containers and images
echo "🧹 Cleaning up..."
docker system prune -f || true

# Build and start services
echo "🏗️  Building and starting services..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check database
echo -n "  - Database: "
if docker-compose exec -T postgres pg_isready -U budget_admin -d budget_app_test &>/dev/null; then
    echo "✅ Ready"
else
    echo "❌ Not ready"
fi

# Check backend
echo -n "  - Backend: "
if curl -s http://localhost:5000/health &>/dev/null; then
    echo "✅ Ready"
else
    echo "❌ Not ready"
fi

# Check frontend
echo -n "  - Frontend: "
if curl -s http://localhost &>/dev/null; then
    echo "✅ Ready"
else
    echo "❌ Not ready"
fi

echo ""
echo "🎉 Test environment started!"
echo ""
echo "📋 Access URLs:"
echo "  - Frontend: http://20.224.194.131"
echo "  - API: http://20.224.194.131/api/health"
echo "  - Domain: https://test.budgetapp.site (if DNS configured)"
echo ""
echo "🐳 Container Status:"
docker-compose ps

echo ""
echo "📊 System Resources:"
echo "  - Memory: \$(free -h | grep Mem | awk '{print \$3 "/" \$2}')"
echo "  - Disk: \$(df -h / | tail -1 | awk '{print \$3 "/" \$2 " (" \$5 " used)"}')"
echo ""
STARTEOF

chmod +x start-test-environment.sh
echo "✅ Başlatma scripti oluşturuldu ve çalıştırılabilir yapıldı"
EOF

# =============================================================================
# 14. Test Ortamını Başlat
# =============================================================================
echo -e "\n${BLUE}🚀 14. Test Ortamını Başlat${NC}"
read -p "Test ortamını şimdi başlatmak istiyor musunuz? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Test ortamı başlatılıyor...${NC}"
    
    ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
cd ${PROJECT_DIR}
echo "🚀 Test ortamı başlatılıyor..."
./start-test-environment.sh
EOF
    
    echo -e "${GREEN}✅ Test ortamı başlatıldı!${NC}"
else
    echo -e "${YELLOW}⏸️  Test ortamı başlatma atlandı${NC}"
    echo "Manuel başlatmak için:"
    echo "  ssh ${TEST_VM_USER}@${TEST_VM_IP}"
    echo "  cd ${PROJECT_DIR}"
    echo "  ./start-test-environment.sh"
fi

# =============================================================================
# 15. Özet ve Sonraki Adımlar
# =============================================================================
echo -e "\n${BLUE}📋 15. Kurulum Özeti${NC}"
echo -e "${GREEN}✅ Test VM kurulumu tamamlandı!${NC}"
echo ""
echo -e "${YELLOW}📊 Kurulum Detayları:${NC}"
echo "  - VM IP: ${TEST_VM_IP}"
echo "  - Proje Dizini: ${PROJECT_DIR}"
echo "  - Environment: Test"
echo "  - Database: budget_app_test"
echo "  - Ports: 80 (Frontend), 5000 (Backend), 5432 (Database)"
echo ""
echo -e "${YELLOW}🌐 Erişim URL'leri:${NC}"
echo "  - Frontend: http://${TEST_VM_IP}"
echo "  - API Health: http://${TEST_VM_IP}/api/health"
echo "  - Domain: https://test.budgetapp.site (DNS yapılandırması gerekli)"
echo ""
echo -e "${YELLOW}🔧 Sonraki Adımlar:${NC}"
echo "  1. DNS kayıtlarını kontrol edin (test.budgetapp.site → ${TEST_VM_IP})"
echo "  2. SSL sertifikası yapılandırın (Let's Encrypt)"
echo "  3. Firewall kurallarını kontrol edin (80, 443, 22 portları)"
echo "  4. Monitoring ve logging yapılandırın"
echo "  5. Backup stratejisi oluşturun"
echo ""
echo -e "${YELLOW}🛠️  Yönetim Komutları:${NC}"
echo "  - Bağlan: ssh ${TEST_VM_USER}@${TEST_VM_IP}"
echo "  - Başlat: cd ${PROJECT_DIR} && ./start-test-environment.sh"
echo "  - Durdur: cd ${PROJECT_DIR} && docker-compose down"
echo "  - Loglar: cd ${PROJECT_DIR} && docker-compose logs -f"
echo "  - Status: cd ${PROJECT_DIR} && docker-compose ps"
echo ""
echo -e "${GREEN}🎉 Test VM hazır!${NC}"