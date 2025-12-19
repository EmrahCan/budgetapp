#!/bin/bash

# Test all endpoints on Test VM

echo "🧪 Testing Test VM Endpoints"
echo "============================="
echo ""

BASE_URL="https://test.budgetapp.site"

echo "1️⃣ Testing Frontend..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/)
if [ "$STATUS" = "200" ]; then
    echo "   ✅ Frontend: OK ($STATUS)"
else
    echo "   ❌ Frontend: FAIL ($STATUS)"
fi

echo ""
echo "2️⃣ Testing Nginx Health..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/health)
if [ "$STATUS" = "200" ]; then
    echo "   ✅ Nginx Health: OK ($STATUS)"
else
    echo "   ❌ Nginx Health: FAIL ($STATUS)"
fi

echo ""
echo "3️⃣ Testing Backend Health..."
RESPONSE=$(curl -s $BASE_URL/api/health)
if echo "$RESPONSE" | grep -q "Budget App Backend"; then
    echo "   ✅ Backend Health: OK"
    echo "   Response: $(echo $RESPONSE | jq -r '.message' 2>/dev/null || echo $RESPONSE)"
else
    echo "   ❌ Backend Health: FAIL"
    echo "   Response: $RESPONSE"
fi

echo ""
echo "4️⃣ Testing Auth Endpoint..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}')
if echo "$RESPONSE" | grep -q "success"; then
    echo "   ✅ Auth Endpoint: OK (responding)"
    echo "   Response: $(echo $RESPONSE | jq -r '.message' 2>/dev/null || echo $RESPONSE)"
else
    echo "   ❌ Auth Endpoint: FAIL"
    echo "   Response: $RESPONSE"
fi

echo ""
echo "5️⃣ Testing OCR Endpoint..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/ocr/supported-formats)
if [ "$STATUS" = "401" ] || [ "$STATUS" = "200" ]; then
    echo "   ✅ OCR Endpoint: OK (requires auth: $STATUS)"
else
    echo "   ⚠️  OCR Endpoint: $STATUS"
fi

echo ""
echo "============================="
echo "✅ Test Complete!"
echo ""
echo "🌐 Access the app at: $BASE_URL"
