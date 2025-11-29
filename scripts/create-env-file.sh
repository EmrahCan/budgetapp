#!/bin/bash

# Create .env file with environment variables
# This script is called by GitHub Actions

cat > .env << EOF
# Database Configuration
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=budget_app_prod
DB_USER=budget_admin

# JWT Configuration
JWT_SECRET=${JWT_SECRET}

# AI Configuration
GEMINI_API_KEY=${GEMINI_API_KEY}

# Frontend Configuration
FRONTEND_URL=${FRONTEND_URL}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
REACT_APP_API_URL=${REACT_APP_API_URL}
EOF

echo "✅ .env file created successfully"
