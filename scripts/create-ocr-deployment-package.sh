#!/bin/bash

# Create OCR Deployment Package
# This script creates a deployment package that can be manually uploaded to Test VM

set -e

echo "📦 Creating OCR Deployment Package..."
echo "======================================"

# Create deployment directory
DEPLOY_DIR="ocr-deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

echo "📁 Created deployment directory: $DEPLOY_DIR"

# Create directory structure
mkdir -p "$DEPLOY_DIR/backend/services"
mkdir -p "$DEPLOY_DIR/backend/controllers"
mkdir -p "$DEPLOY_DIR/backend/routes"
mkdir -p "$DEPLOY_DIR/frontend/src/components/ocr"
mkdir -p "$DEPLOY_DIR/frontend/src/components/transactions"
mkdir -p "$DEPLOY_DIR/config"
mkdir -p "$DEPLOY_DIR/scripts"

echo "📋 Copying files..."

# Backend files
cp ../backend/services/ocrService.js "$DEPLOY_DIR/backend/services/"
cp ../backend/controllers/ocrController.js "$DEPLOY_DIR/backend/controllers/"
cp ../backend/routes/ocr.js "$DEPLOY_DIR/backend/routes/"
cp ../backend/server.js "$DEPLOY_DIR/backend/"

# Frontend files
cp ../frontend/src/components/ocr/ReceiptScanner.js "$DEPLOY_DIR/frontend/src/components/ocr/"
cp ../frontend/src/components/ocr/ReceiptScanner.css "$DEPLOY_DIR/frontend/src/components/ocr/"
cp ../frontend/src/components/transactions/SmartTransactionForm.js "$DEPLOY_DIR/frontend/src/components/transactions/"

# Configuration files
cp ../docker-compose.test.yml "$DEPLOY_DIR/config/docker-compose.yml"
cp ../.env.test.template "$DEPLOY_DIR/config/.env.template"
cp ../.env.example "$DEPLOY_DIR/config/.env.example"

# Create deployment instructions
cat > "$DEPLOY_DIR/DEPLOYMENT_INSTRUCTIONS.md" << 'EOF'
# OCR Feature Deployment Instructions

## 📋 Prerequisites
- SSH access to Test VM (20.224.194.131)
- Docker and Docker Compose installed on Test VM
- Gemini API key

## 🚀 Deployment Steps

### 1. Upload Package to Test VM
```bash
scp -r ocr-deployment-* emrah@20.224.194.131:/home/emrah/
```

### 2. SSH into Test VM
```bash
ssh emrah@20.224.194.131
```

### 3. Navigate to Project Directory
```bash
cd /home/emrah/budget-app
```

### 4. Backup Current Files
```bash
mkdir -p backups/$(date +%Y%m%d-%H%M%S)
cp backend/server.js backups/$(date +%Y%m%d-%H%M%S)/
cp -r frontend/src/components/transactions backups/$(date +%Y%m%d-%H%M%S)/
```

### 5. Copy New Files
```bash
# Backend
cp ~/ocr-deployment-*/backend/services/ocrService.js backend/services/
cp ~/ocr-deployment-*/backend/controllers/ocrController.js backend/controllers/
cp ~/ocr-deployment-*/backend/routes/ocr.js backend/routes/
cp ~/ocr-deployment-*/backend/server.js backend/

# Frontend
mkdir -p frontend/src/components/ocr
cp ~/ocr-deployment-*/frontend/src/components/ocr/* frontend/src/components/ocr/
cp ~/ocr-deployment-*/frontend/src/components/transactions/SmartTransactionForm.js frontend/src/components/transactions/

# Configuration
cp ~/ocr-deployment-*/config/docker-compose.yml docker-compose.yml
```

### 6. Update Environment Variables
```bash
# Add OCR configuration to .env
cat >> .env << 'ENVEOF'

# OCR Configuration
OCR_ENABLED=true
OCR_MAX_FILE_SIZE=5242880
OCR_RATE_LIMIT=20
OCR_RATE_LIMIT_WINDOW=900000
ENVEOF
```

### 7. Rebuild and Restart Containers
```bash
# Stop containers
docker-compose down

# Rebuild
docker-compose build backend frontend

# Start containers
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f backend
```

### 8. Verify Deployment
```bash
# Check backend health
curl http://localhost/api/health

# Check OCR endpoint (requires auth token)
curl http://localhost/api/ocr/supported-formats

# Check frontend
curl http://localhost/
```

## 🧪 Testing

1. Open browser: http://20.224.194.131
2. Login to the application
3. Go to Transactions > Add Transaction
4. Click "📷 Fiş Tara (OCR)" button
5. Upload a receipt image or take a photo
6. Verify extracted data (amount, date, merchant)

## 📊 Monitoring

```bash
# Backend logs
docker logs budget_backend_test -f

# Frontend logs
docker logs budget_frontend_test -f

# Nginx logs
docker logs budget_nginx_test -f
```

## ⚠️ Troubleshooting

### OCR Not Working
1. Check GEMINI_API_KEY in .env
2. Check backend logs: `docker logs budget_backend_test`
3. Verify Gemini API quota

### Frontend Not Showing OCR Button
1. Check frontend build: `docker logs budget_frontend_test`
2. Clear browser cache
3. Check browser console for errors

### File Upload Fails
1. Check file size (max 5MB)
2. Check file format (JPEG, PNG only)
3. Check backend logs for errors

## 🔄 Rollback

If something goes wrong:
```bash
cd /home/emrah/budget-app
docker-compose down
# Restore from backup
cp backups/TIMESTAMP/server.js backend/
cp -r backups/TIMESTAMP/transactions frontend/src/components/
docker-compose up -d
```
EOF

# Create quick deployment script
cat > "$DEPLOY_DIR/scripts/deploy.sh" << 'EOF'
#!/bin/bash
# Quick deployment script for Test VM

set -e

echo "🚀 Deploying OCR Feature..."

# Navigate to project directory
cd /home/emrah/budget-app

# Backup
echo "📦 Creating backup..."
mkdir -p backups/$(date +%Y%m%d-%H%M%S)
cp backend/server.js backups/$(date +%Y%m%d-%H%M%S)/ 2>/dev/null || true

# Copy files
echo "📋 Copying files..."
DEPLOY_DIR=$(ls -td ~/ocr-deployment-* | head -1)

cp $DEPLOY_DIR/backend/services/ocrService.js backend/services/
cp $DEPLOY_DIR/backend/controllers/ocrController.js backend/controllers/
cp $DEPLOY_DIR/backend/routes/ocr.js backend/routes/
cp $DEPLOY_DIR/backend/server.js backend/

mkdir -p frontend/src/components/ocr
cp $DEPLOY_DIR/frontend/src/components/ocr/* frontend/src/components/ocr/
cp $DEPLOY_DIR/frontend/src/components/transactions/SmartTransactionForm.js frontend/src/components/transactions/

cp $DEPLOY_DIR/config/docker-compose.yml docker-compose.yml

# Update .env
echo "⚙️  Updating environment..."
if ! grep -q "OCR_ENABLED" .env; then
    cat >> .env << 'ENVEOF'

# OCR Configuration
OCR_ENABLED=true
OCR_MAX_FILE_SIZE=5242880
OCR_RATE_LIMIT=20
OCR_RATE_LIMIT_WINDOW=900000
ENVEOF
fi

# Rebuild and restart
echo "🔨 Rebuilding containers..."
docker-compose down
docker-compose build backend frontend
docker-compose up -d

echo "✅ Deployment complete!"
echo "📊 Check status: docker-compose ps"
echo "📝 Check logs: docker-compose logs -f backend"
EOF

chmod +x "$DEPLOY_DIR/scripts/deploy.sh"

# Create archive
echo "🗜️  Creating archive..."
tar -czf "${DEPLOY_DIR}.tar.gz" "$DEPLOY_DIR"

echo ""
echo "✅ Deployment package created successfully!"
echo ""
echo "📦 Package: ${DEPLOY_DIR}.tar.gz"
echo "📁 Directory: $DEPLOY_DIR"
echo ""
echo "📤 Next steps:"
echo "  1. Upload to Test VM:"
echo "     scp ${DEPLOY_DIR}.tar.gz emrah@20.224.194.131:/home/emrah/"
echo ""
echo "  2. SSH to Test VM and extract:"
echo "     ssh emrah@20.224.194.131"
echo "     tar -xzf ${DEPLOY_DIR}.tar.gz"
echo "     cd ${DEPLOY_DIR}"
echo "     cat DEPLOYMENT_INSTRUCTIONS.md"
echo ""
echo "  3. Run deployment script:"
echo "     chmod +x scripts/deploy.sh"
echo "     ./scripts/deploy.sh"
echo ""
