#!/bin/bash

# Update Gemini API Key on Test VM
# This script helps you update the GEMINI_API_KEY in .env file

set -e

echo "🔑 Gemini API Key Update Script"
echo "================================"
echo ""

# Check if API key is provided as argument
if [ -z "$1" ]; then
    echo "❌ Error: Gemini API key not provided"
    echo ""
    echo "Usage:"
    echo "  ./update-gemini-key.sh YOUR_GEMINI_API_KEY"
    echo ""
    echo "Example:"
    echo "  ./update-gemini-key.sh AIzaSyC..."
    echo ""
    echo "📝 To get your Gemini API key:"
    echo "  1. Go to: https://makersuite.google.com/app/apikey"
    echo "  2. Click 'Create API Key'"
    echo "  3. Copy the key"
    echo "  4. Run this script with the key"
    echo ""
    exit 1
fi

GEMINI_KEY="$1"
TEST_VM_IP="20.224.194.131"
TEST_VM_USER="obiwan"
PROJECT_DIR="/home/obiwan/budget-app"

echo "📋 Configuration:"
echo "  Test VM: $TEST_VM_IP"
echo "  User: $TEST_VM_USER"
echo "  Project: $PROJECT_DIR"
echo "  API Key: ${GEMINI_KEY:0:20}..." # Show only first 20 chars
echo ""

# Confirm
read -p "❓ Update Gemini API key on Test VM? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo "🔄 Updating Gemini API key..."

# Update .env file on Test VM
ssh ${TEST_VM_USER}@${TEST_VM_IP} << EOF
cd ${PROJECT_DIR}

# Backup current .env
cp .env .env.backup-\$(date +%Y%m%d-%H%M%S)

# Update GEMINI_API_KEY
if grep -q "^GEMINI_API_KEY=" .env; then
    # Replace existing key
    sed -i "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=${GEMINI_KEY}|" .env
    echo "✅ Updated existing GEMINI_API_KEY"
else
    # Add new key
    echo "" >> .env
    echo "# Gemini API Configuration" >> .env
    echo "GEMINI_API_KEY=${GEMINI_KEY}" >> .env
    echo "✅ Added new GEMINI_API_KEY"
fi

# Verify
echo ""
echo "📋 Current Gemini configuration:"
grep "GEMINI" .env | grep -v "^#"
EOF

echo ""
echo "🔄 Restarting backend container..."
ssh ${TEST_VM_USER}@${TEST_VM_IP} "cd ${PROJECT_DIR} && docker-compose restart backend"

echo ""
echo "⏳ Waiting for backend to be ready..."
sleep 5

echo ""
echo "✅ Gemini API key updated successfully!"
echo ""
echo "📊 Verify backend logs:"
echo "  ssh ${TEST_VM_USER}@${TEST_VM_IP} 'docker logs budget_backend --tail 20'"
echo ""
echo "🧪 Test OCR endpoint:"
echo "  curl http://${TEST_VM_IP}/api/ocr/health"
echo ""
