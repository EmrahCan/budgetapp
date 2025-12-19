#!/bin/bash

# =============================================================================
# Test VM Sağlık Kontrolü ve Doğrulama Scripti
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

echo -e "${BLUE}🔍 Test VM Sağlık Kontrolü${NC}"
echo -e "${YELLOW}VM: ${TEST_VM_IP}${NC}"
echo -e "${YELLOW}Time: $(date)${NC}"
echo ""

# =============================================================================
# 1. VM Bağlantı Testi
# =============================================================================
echo -e "${BLUE}📡 1. VM Bağlantı Testi${NC}"
if ssh -o ConnectTimeout=10 ${TEST_VM_USER}@${TEST_VM_IP} "echo 'OK'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH bağlantısı başarılı${NC}"
else
    echo -e "${RED}❌ SSH bağlantısı başarısız${NC}"
    exit 1
fi

# =============================================================================
# 2. Sistem Durumu
# =============================================================================
echo -e "\n${BLUE}🖥️  2. Sistem Durumu${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << 'EOF'
echo "📊 Sistem Bilgileri:"
echo "  - Uptime: $(uptime -p)"
echo "  - Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "  - Memory: $(free -h | grep Mem | awk '{print $3 "/" $2 " (" int($3/$2*100) "%)"}')"
echo "  - Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 ")"}')"
echo "  - Docker: $(docker --version 2>/dev/null || echo 'Not installed')"
EOF

# =============================================================================
# 3. Docker Container Durumu
# =============================================================================
echo -e "\n${BLUE}🐳 3. Docker Container Durumu${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
if [ -d "${PROJECT_DIR}" ]; then
    cd ${PROJECT_DIR}
    
    echo "📦 Container Status:"
    if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
        docker-compose ps 2>/dev/null || echo "  - No containers running"
    else
        echo "  - docker-compose.yml not found"
    fi
    
    echo ""
    echo "🐳 All Docker Containers:"
    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || echo "  - No containers"
else
    echo "❌ Project directory not found: ${PROJECT_DIR}"
fi
EOF

# =============================================================================
# 4. Servis Sağlık Kontrolleri
# =============================================================================
echo -e "\n${BLUE}🔍 4. Servis Sağlık Kontrolleri${NC}"

# Frontend kontrolü
echo -n "  - Frontend (Port 80): "
if curl -s -o /dev/null -w "%{http_code}" http://${TEST_VM_IP} | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

# Backend API kontrolü
echo -n "  - Backend API (/api/health): "
if curl -s -o /dev/null -w "%{http_code}" http://${TEST_VM_IP}/api/health | grep -q "200"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

# Database kontrolü (SSH üzerinden)
echo -n "  - Database: "
ssh ${TEST_VM_USER}@${TEST_VM_IP} << 'EOF' 2>/dev/null
if docker exec budget_postgres_test pg_isready -U budget_admin -d budget_app_test &>/dev/null; then
    echo "✅ OK"
else
    echo "❌ FAIL"
fi
EOF

# =============================================================================
# 5. Konfigürasyon Kontrolü
# =============================================================================
echo -e "\n${BLUE}⚙️  5. Konfigürasyon Kontrolü${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
if [ -d "${PROJECT_DIR}" ]; then
    cd ${PROJECT_DIR}
    
    echo "📝 Configuration Files:"
    
    # .env kontrolü
    if [ -f ".env" ]; then
        echo "  - .env: ✅ Exists"
        echo "    NODE_ENV: \$(grep NODE_ENV .env | cut -d'=' -f2 || echo 'Not set')"
        echo "    DB_NAME: \$(grep DB_NAME .env | cut -d'=' -f2 || echo 'Not set')"
        echo "    FRONTEND_URL: \$(grep FRONTEND_URL .env | cut -d'=' -f2 || echo 'Not set')"
    else
        echo "  - .env: ❌ Missing"
    fi
    
    # docker-compose.yml kontrolü
    if [ -f "docker-compose.yml" ]; then
        echo "  - docker-compose.yml: ✅ Exists"
    else
        echo "  - docker-compose.yml: ❌ Missing"
    fi
    
    # Nginx config kontrolü
    if [ -f "frontend/default.conf.nginx" ]; then
        echo "  - nginx config: ✅ Exists"
    else
        echo "  - nginx config: ❌ Missing"
    fi
else
    echo "❌ Project directory not found"
fi
EOF

# =============================================================================
# 6. Log Kontrolü
# =============================================================================
echo -e "\n${BLUE}📋 6. Son Loglar${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
if [ -d "${PROJECT_DIR}" ]; then
    cd ${PROJECT_DIR}
    
    echo "📊 Container Logs (Son 5 satır):"
    
    # Backend logs
    echo "  Backend:"
    docker logs budget_backend_test --tail 5 2>/dev/null | sed 's/^/    /' || echo "    - No backend logs"
    
    # Frontend logs
    echo "  Frontend:"
    docker logs budget_frontend_test --tail 5 2>/dev/null | sed 's/^/    /' || echo "    - No frontend logs"
    
    # Database logs
    echo "  Database:"
    docker logs budget_postgres_test --tail 5 2>/dev/null | sed 's/^/    /' || echo "    - No database logs"
fi
EOF

# =============================================================================
# 7. Network ve Port Kontrolü
# =============================================================================
echo -e "\n${BLUE}🌐 7. Network ve Port Kontrolü${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << 'EOF'
echo "🔌 Listening Ports:"
netstat -tlnp 2>/dev/null | grep -E ":(80|443|5000|5432)" | while read line; do
    port=$(echo $line | awk '{print $4}' | cut -d':' -f2)
    echo "  - Port $port: ✅ Open"
done

echo ""
echo "🔥 Firewall Status:"
if command -v ufw &> /dev/null; then
    ufw status | head -5
else
    echo "  - UFW not installed"
fi
EOF

# =============================================================================
# 8. Disk ve Kaynak Kullanımı
# =============================================================================
echo -e "\n${BLUE}💾 8. Kaynak Kullanımı${NC}"
ssh ${TEST_VM_USER}@${TEST_VM_IP} << 'EOF'
echo "📊 Resource Usage:"
echo "  - CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)% used"
echo "  - Memory: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "  - Disk /: $(df / | tail -1 | awk '{print $5}')"

echo ""
echo "🐳 Docker Usage:"
if command -v docker &> /dev/null; then
    echo "  - Images: $(docker images -q | wc -l)"
    echo "  - Containers: $(docker ps -a -q | wc -l)"
    echo "  - Networks: $(docker network ls -q | wc -l)"
    echo "  - Volumes: $(docker volume ls -q | wc -l)"
fi
EOF

# =============================================================================
# 9. Özet Rapor
# =============================================================================
echo -e "\n${BLUE}📋 9. Sağlık Kontrolü Özeti${NC}"

# Genel durum kontrolü
OVERALL_STATUS="OK"

# Frontend kontrolü
if ! curl -s -o /dev/null -w "%{http_code}" http://${TEST_VM_IP} | grep -q "200\|301\|302"; then
    OVERALL_STATUS="ISSUES"
fi

# Backend kontrolü
if ! curl -s -o /dev/null -w "%{http_code}" http://${TEST_VM_IP}/api/health | grep -q "200"; then
    OVERALL_STATUS="ISSUES"
fi

if [ "$OVERALL_STATUS" = "OK" ]; then
    echo -e "${GREEN}✅ Test VM durumu: SAĞLIKLI${NC}"
    echo -e "${GREEN}   Tüm servisler çalışıyor${NC}"
else
    echo -e "${YELLOW}⚠️  Test VM durumu: SORUNLU${NC}"
    echo -e "${YELLOW}   Bazı servisler çalışmıyor${NC}"
fi

echo ""
echo -e "${BLUE}🔗 Erişim Linkleri:${NC}"
echo "  - Frontend: http://${TEST_VM_IP}"
echo "  - API Health: http://${TEST_VM_IP}/api/health"
echo "  - SSH: ssh ${TEST_VM_USER}@${TEST_VM_IP}"
echo ""
echo -e "${BLUE}📅 Kontrol Zamanı: $(date)${NC}"