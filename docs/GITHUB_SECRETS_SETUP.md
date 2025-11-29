# GitHub Secrets Setup Guide

## Overview
This guide explains how to configure GitHub Secrets for automated deployments.

## Required Secrets

### Repository Secrets (Settings → Secrets and variables → Actions → Repository secrets)

These secrets are used by GitHub Actions workflows:

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `VM_USER` | SSH username for VM | `obiwan` |
| `VM_PASSWORD` | SSH password for VM | `your-vm-password` |
| `VM_HOST` | Production VM IP address | `4.180.255.34` |
| `DB_PASSWORD` | Database password | `Prod_DB_P@ssw0rd_2024_Secure_Random_Key_9Ht03GrRP7iK` |
| `JWT_SECRET` | JWT secret key | `prod_jwt_secret_key_2024_very_secure_random_string_xK9mP2nQ5wR8tY` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g` |
| `FRONTEND_URL` | Frontend URL | `http://4.180.255.34` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://4.180.255.34,http://localhost` |
| `REACT_APP_API_URL` | API URL for frontend | `http://4.180.255.34/api` |

## How to Add Secrets

### Step 1: Go to Repository Settings
1. Navigate to your GitHub repository: https://github.com/EmrahCan/budgetapp
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Add Repository Secrets
For each secret listed above:

1. Click **New repository secret**
2. Enter the **Name** (exactly as shown in the table)
3. Enter the **Value**
4. Click **Add secret**

### Step 3: Verify Secrets
After adding all secrets, you should see them listed (values will be hidden).

## Environment-Specific Secrets (Optional)

If you want different values for test and production:

### Step 1: Create Environments
1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Create two environments:
   - `test`
   - `production`

### Step 2: Add Environment Secrets
For each environment:
1. Click on the environment name
2. Click **Add secret**
3. Add environment-specific values

## Current Configuration

### Production Environment
- **VM IP:** 4.180.255.34
- **Database:** budget_app_prod
- **User:** budget_admin

### Test Environment
- **VM IP:** 108.141.152.224
- **Database:** budget_app_test
- **User:** budget_admin

## Security Best Practices

1. ✅ **Never commit secrets to Git**
2. ✅ **Use strong, random passwords**
3. ✅ **Rotate secrets regularly**
4. ✅ **Use environment-specific secrets**
5. ✅ **Limit secret access to necessary workflows**

## Troubleshooting

### Deployment fails with "secret not found"
- Verify the secret name matches exactly (case-sensitive)
- Check that the secret is added to the correct repository
- Ensure the workflow has access to the secret

### Environment variables not loading
- Check that `.env` file is created on VM
- Verify Docker Compose is reading the `.env` file
- Restart containers: `docker-compose down && docker-compose up -d`

### Database connection fails
- Verify `DB_PASSWORD` secret matches the database password
- Check that database user exists: `docker exec -it budget_database psql -U budget_admin -d budget_app_prod`

## Automated .env File Creation

The GitHub Actions workflow automatically creates the `.env` file on the VM during deployment using the secrets. You don't need to manually create or update this file.

### What Happens During Deployment

1. GitHub Actions connects to VM via SSH
2. Creates `.env` file with values from GitHub Secrets
3. Runs deployment script
4. Docker Compose reads `.env` file
5. Containers start with correct environment variables

## Testing the Setup

After adding all secrets, trigger a deployment:

```bash
# Make a small change and push
git commit --allow-empty -m "test: Trigger deployment"
git push origin main
```

Monitor the deployment:
1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Check each step for errors

## Next Steps

After setting up secrets:
1. ✅ Add all required secrets to GitHub
2. ✅ Test deployment by pushing to main branch
3. ✅ Verify application works at https://budgetapp.site
4. ✅ Monitor logs for any issues

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. SSH into VM and check Docker logs: `docker logs budget_backend`
3. Verify `.env` file exists: `cat ~/budgetapp/.env`
4. Check environment variables: `docker exec budget_backend env`
