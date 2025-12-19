#!/bin/bash

# Quick Fix for Test VM - Single Command Solution
# Run this from your local machine

set -e

VM="obiwan@20.224.194.131"
DIR="/home/obiwan/budget-app"

echo "🚀 Quick Fix for Test VM"
echo "========================"
echo ""

# Create a temporary fix script
cat > /tmp/test-vm-fix.sh << 'FIXSCRIPT'
#!/bin/bash
cd /home/obiwan/budget-app

echo "📝 Step 1: Updating .env file..."
# Backup
cp .env .env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Remove old URL settings
sed -i '/^FRONTEND_URL=/d' .env 2>/dev/null || true
sed -i '/^REACT_APP_API_URL=/d' .env 2>/dev/null || true  
sed -i '/^ALLOWED_ORIGINS=/d' .env 2>/dev/null || true

# Add correct HTTPS URLs
cat >> .env << 'EOF'

# URLs - HTTPS via Cloudflare
FRONTEND_URL=https://test.budgetapp.site
REACT_APP_API_URL=https://test.budgetapp.site/api
ALLOWED_ORIGINS=https://test.budgetapp.site,http://test.budgetapp.site,http://20.224.194.131
EOF

echo "✅ .env updated"
echo ""

echo "📝 Step 2: Checking required files..."
# Check if default.conf.nginx exists
if [ ! -f frontend/default.conf.nginx ]; then
    echo "⚠️  default.conf.nginx missing - will be copied"
fi

# Check if OCR files exist
if [ ! -f backend/routes/ocr.js ]; then
    echo "⚠️  OCR route missing - will be copied"
fi

echo ""
echo "🔨 Step 3: Rebuilding containers..."
docker-compose down
docker-compose build --no-cache backend frontend
docker-compose up -d

echo ""
echo "⏳ Waiting 20 seconds for services..."
sleep 20

echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "🔍 Backend Health:"
docker logs budget_backend_test --tail 5

echo ""
echo "✅ Fix complete!"
FIXSCRIPT

chmod +x /tmp/test-vm-fix.sh

echo "📦 Step 1: Copying required files..."

# Copy files
scp budget/frontend/default.conf.nginx ${VM}:${DIR}/frontend/ 2>/dev/null || echo "  ⚠️  default.conf.nginx copy failed"
scp budget/backend/routes/ocr.js ${VM}:${DIR}/backend/routes/ 2>/dev/null || echo "  ⚠️  ocr.js copy failed"
scp budget/backend/controllers/ocrController.js ${VM}:${DIR}/backend/controllers/ 2>/dev/null || echo "  ⚠️  ocrController.js copy failed"
scp budget/backend/services/ocrService.js ${VM}:${DIR}/backend/services/ 2>/dev/null || echo "  ⚠️  ocrService.js copy failed"
scp budget/backend/server.js ${VM}:${DIR}/backend/ 2>/dev/null || echo "  ⚠️  server.js copy failed"

echo ""
echo "🚀 Step 2: Running fix on Test VM..."

# Copy and run fix script
scp /tmp/test-vm-fix.sh ${VM}:/tmp/
ssh ${VM} "bash /tmp/test-vm-fix.sh"

echo ""
echo "🎉 Done!"
echo ""
echo "📝 Test now:"
echo "  1. Open: https://test.budgetapp.site"
echo "  2. Hard refresh: Ctrl+Shift+R"
echo "  3. Try login"
echo ""
echo "🔍 Check logs if needed:"
echo "  ssh ${VM} 'docker logs budget_backend_test -f'"
echo ""

# Cleanup
rm /tmp/test-vm-fix.sh

