#!/bin/bash

# =============================================================================
# Yeni Test VM'e Kod Deployment Scripti
# =============================================================================

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Konfigürasyon
TEST_VM_IP="20.224.194.131"
TEST_VM_USER="obiwan"
PROJECT_DIR="/home/obiwan/budget-app"
LOCAL_PROJECT_DIR="$(pwd)"

echo -e "${BLUE}🚀 Test VM Deployment Başlatılıyor${NC}"
echo -e "${YELLOW}Source: ${LOCAL_PROJECT_DIR}${NC}"
echo -e "${YELLOW}Target: ${TEST_VM_USER}@${TEST_VM_IP}:${PROJECT_DIR}${NC}"
echo ""

# =============================================================================
# 1. Ön Kontroller
# =============================================================================
echo -e "${BLUE}🔍 1. Ön Kontroller${NC}"

# Local git durumu
if [ -d ".git" ]; then
    CURRENT_BRANCH=$(git branch --show-current)
    LAST_COMMIT=$(git log -1 --oneline)
    echo "  - Git Branch: ${CURRENT_BRANCH}"
    echo "  - Last Commit: ${LAST_COMMIT}"
else
    echo "  - Git: Repository bulunamadı"
fi

# VM bağlantı testi
echo -n "  - VM Connection: "
if ssh -o ConnectTimeout=10 ${TEST_VM_USER}@${TEST_VM_IP} "echo 'OK'" 2>/dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    exit 1
fi

# =============================================================================
# 2. Deployment Package Hazırla
# =============================================================================
echo -e "\n${BLUE}📦 2. Deployment Package Hazırlama${NC}"

DEPLOY_DIR="deploy-$(date +%Y%m%d_%H%M%S)"
mkdir -p ${DEPLOY_DIR}

echo "  - Package dizini: ${DEPLOY_DIR}"

# Backend dosyalarını kopyala
echo "  - Backend dosyaları kopyalanıyor..."
mkdir -p ${DEPLOY_DIR}/backend
cp -r backend/* ${DEPLOY_DIR}/backend/ 2>/dev/null || echo "    Backend dizini bulunamadı"

# Frontend dosyalarını kopyala
echo "  - Frontend dosyaları kopyalanıyor..."
mkdir -p ${DEPLOY_DIR}/frontend
if [ -d "frontend" ]; then
    cp -r frontend/* ${DEPLOY_DIR}/frontend/ 2>/dev/null || true
fi

# Konfigürasyon dosyalarını kopyala
echo "  - Konfigürasyon dosyaları kopyalanıyor..."
[ -f "docker-compose.yml" ] && cp docker-compose.yml ${DEPLOY_DIR}/
[ -f "docker-compose.test.yml" ] && cp docker-compose.test.yml ${DEPLOY_DIR}/
[ -f ".env.test.template" ] && cp .env.test.template ${DEPLOY_DIR}/

# Scripts kopyala
echo "  - Scripts kopyalanıyor..."
mkdir -p ${DEPLOY_DIR}/scripts
cp scripts/setup-new-test-vm.sh ${DEPLOY_DIR}/scripts/ 2>/dev/null || true

# Package oluştur
echo "  - Package arşivleniyor..."
tar -czf ${DEPLOY_DIR}.tar.gz ${DEPLOY_DIR}
echo -e "${GREEN}  ✅ Package hazır: ${DEPLOY_DIR}.tar.gz${NC}"

# =============================================================================
# 3. VM'e Upload
# =============================================================================
echo -e "\n${BLUE}📤 3. VM'e Upload${NC}"

echo "  - Package upload ediliyor..."
scp ${DEPLOY_DIR}.tar.gz ${TEST_VM_USER}@${TEST_VM_IP}:/tmp/

echo -e "${GREEN}  ✅ Upload tamamlandı${NC}"

# =============================================================================
# 4. VM'de Deployment
# =============================================================================
echo -e "\n${BLUE}🔧 4. VM'de Deployment${NC}"

ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
set -e

echo "📦 Package extract ediliyor..."
cd /tmp
tar -xzf ${DEPLOY_DIR}.tar.gz

echo "🛑 Mevcut servisleri durdur..."
if [ -d "${PROJECT_DIR}" ]; then
    cd ${PROJECT_DIR}
    docker-compose down --remove-orphans 2>/dev/null || true
fi

echo "📁 Backup oluştur..."
if [ -d "${PROJECT_DIR}" ]; then
    BACKUP_NAME="backup-\$(date +%Y%m%d_%H%M%S)"
    mkdir -p /home/obiwan/backups
    cp -r ${PROJECT_DIR} /home/obiwan/backups/\${BACKUP_NAME}
    echo "  Backup: /home/obiwan/backups/\${BACKUP_NAME}"
fi

echo "🔄 Yeni dosyaları kopyala..."
mkdir -p ${PROJECT_DIR}
cp -r /tmp/${DEPLOY_DIR}/* ${PROJECT_DIR}/

echo "⚙️  Konfigürasyon ayarla..."
cd ${PROJECT_DIR}

# .env dosyası oluştur
if [ ! -f ".env" ]; then
    cat > .env << 'ENVEOF'
# Budget App - Test Environment
NODE_ENV=test
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_app_test
DB_USER=budget_admin
DB_PASSWORD=budget123

# JWT
JWT_SECRET=test_jwt_secret_key_2024_very_secure_test_environment
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=https://test.budgetapp.site
REACT_APP_API_URL=https://test.budgetapp.site/api
ALLOWED_ORIGINS=https://test.budgetapp.site,http://test.budgetapp.site,http://20.224.194.131,https://20.224.194.131

# Email (Disabled for test)
EMAIL_ENABLED=false

# AI (Disabled for test)
AI_ENABLED=false
GEMINI_API_KEY=test_key

# OCR (Disabled for test)
OCR_ENABLED=false

# Logging
LOG_LEVEL=debug
ENVEOF
    echo "  .env dosyası oluşturuldu"
fi

# docker-compose.yml kontrol
if [ ! -f "docker-compose.yml" ]; then
    echo "  docker-compose.yml bulunamadı, varsayılan oluşturuluyor..."
    # Varsayılan docker-compose.yml oluştur
fi

echo "🚀 Servisleri başlat..."
docker-compose up -d --build

echo "⏳ Servislerin hazır olmasını bekle..."
sleep 30

echo "🔍 Servis durumunu kontrol et..."
docker-compose ps

echo "✅ Deployment tamamlandı!"
echo ""
echo "📋 Erişim bilgileri:"
echo "  - Frontend: http://20.224.194.131"
echo "  - API: http://20.224.194.131/api/health"
echo "  - SSH: ssh obiwan@20.224.194.131"

# Cleanup
rm -rf /tmp/${DEPLOY_DIR}*
EOF

# =============================================================================
# 5. Deployment Doğrulama
# =============================================================================
echo -e "\n${BLUE}✅ 5. Deployment Doğrulama${NC}"

sleep 10

echo -n "  - Frontend: "
if curl -s -o /dev/null -w "%{http_code}" http://${TEST_VM_IP} | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

echo -n "  - Backend API: "
if curl -s -o /dev/null -w "%{http_code}" http://${TEST_VM_IP}/api/health | grep -q "200"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

# =============================================================================
# 6. Cleanup ve Özet
# =============================================================================
echo -e "\n${BLUE}🧹 6. Cleanup${NC}"
rm -rf ${DEPLOY_DIR}*
echo "  - Local package temizlendi"

echo -e "\n${GREEN}🎉 Deployment Tamamlandı!${NC}"
echo ""
echo -e "${YELLOW}📋 Özet:${NC}"
echo "  - Target VM: ${TEST_VM_IP}"
echo "  - Project Dir: ${PROJECT_DIR}"
echo "  - Deployment Time: $(date)"
echo ""
echo -e "${YELLOW}🔗 Erişim:${NC}"
echo "  - Frontend: http://${TEST_VM_IP}"
echo "  - API Health: http://${TEST_VM_IP}/api/health"
echo "  - SSH: ssh ${TEST_VM_USER}@${TEST_VM_IP}"
echo ""
echo -e "${YELLOW}🛠️  Yönetim:${NC}"
echo "  - Loglar: ssh ${TEST_VM_USER}@${TEST_VM_IP} 'cd ${PROJECT_DIR} && docker-compose logs -f'"
echo "  - Restart: ssh ${TEST_VM_USER}@${TEST_VM_IP} 'cd ${PROJECT_DIR} && docker-compose restart'"
echo "  - Stop: ssh ${TEST_VM_USER}@${TEST_VM_IP} 'cd ${PROJECT_DIR} && docker-compose down'"