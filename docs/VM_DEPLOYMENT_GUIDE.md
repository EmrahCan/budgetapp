# VM Deployment Guide

This guide explains how to deploy the Budget App to Test and Production VMs.

## VM Information

### Test VM (Vm01)
- **IP:** 108.141.152.224
- **Username:** obiwan
- **Environment:** test
- **Purpose:** Testing and staging

### Production VM (Vm02)
- **IP:** 4.210.196.73
- **Username:** obiwan
- **Environment:** production
- **Purpose:** Live production environment

## Prerequisites

Both VMs should have:
- ✅ Docker installed
- ✅ Docker Compose installed
- ✅ UFW firewall configured (ports 22, 80, 443)
- ✅ fail2ban configured
- ✅ Git installed

## Deployment Steps

### Step 1: SSH to VM

**Test VM:**
```bash
ssh obiwan@108.141.152.224
```

**Production VM:**
```bash
ssh obiwan@4.210.196.73
```

### Step 2: Clone Repository

```bash
cd ~
git clone https://github.com/EmrahCan/budgetapp.git
cd budgetapp
```

### Step 3: Create Environment File

**For Test VM:**
```bash
# Copy test template
cp .env.test.template .env

# Edit the file
nano .env
```

Update these values in `.env`:
```bash
DB_PASSWORD=your_strong_test_password_here_min16chars
JWT_SECRET=your_strong_test_jwt_secret_min32chars
GEMINI_API_KEY=your_actual_gemini_api_key
```

**For Production VM:**
```bash
# Copy production template
cp .env.production.template .env

# Edit the file
nano .env
```

Update these values in `.env`:
```bash
DB_PASSWORD=your_strong_prod_password_here_min16chars
JWT_SECRET=your_strong_prod_jwt_secret_min32chars
GEMINI_API_KEY=your_actual_gemini_api_key
```

### Step 4: Generate Strong Passwords

Use these commands to generate strong passwords:

```bash
# Generate database password (16+ characters)
openssl rand -base64 24

# Generate JWT secret (32+ characters)
openssl rand -base64 48
```

### Step 5: Start the Application

```bash
# Pull latest images and start services
docker-compose up -d

# Check if all containers are running
docker-compose ps

# Check logs
docker-compose logs -f
```

### Step 6: Verify Deployment

**Check container health:**
```bash
docker-compose ps
```

All services should show "Up" and "healthy" status.

**Test endpoints:**
```bash
# Health check
curl http://localhost/health

# API health check
curl http://localhost/api/health

# Frontend (should return HTML)
curl http://localhost/
```

**From your local machine:**

Test VM:
```bash
curl http://108.141.152.224/health
```

Production VM:
```bash
curl http://4.210.196.73/health
```

### Step 7: Initialize Database

The database schema will be automatically initialized on first run. To verify:

```bash
# Check database logs
docker-compose logs database

# Connect to database
docker-compose exec database psql -U budget_admin -d budget_app_test
# or for production:
docker-compose exec database psql -U budget_admin -d budget_app_prod

# List tables
\dt

# Exit
\q
```

## Updating the Application

### Pull Latest Changes

```bash
cd ~/budgetapp
git pull origin main  # for production
# or
git pull origin develop  # for test
```

### Rebuild and Restart

```bash
# Rebuild images
docker-compose build

# Restart services with zero downtime
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend

# Or restart all services
docker-compose down
docker-compose up -d
```

## Troubleshooting

### Containers Not Starting

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend
docker-compose logs database
docker-compose logs frontend
docker-compose logs nginx
```

### Database Connection Issues

```bash
# Check if database is healthy
docker-compose ps database

# Check database logs
docker-compose logs database

# Restart database
docker-compose restart database
```

### Port Already in Use

```bash
# Check what's using port 80
sudo lsof -i :80

# Stop the service
sudo systemctl stop apache2  # if Apache is running
```

### Reset Everything

```bash
# Stop and remove all containers, networks, volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## Backup and Restore

### Create Backup

```bash
# Run backup script
./scripts/backup-database.sh

# Backups are stored in ./backups/
ls -lh backups/
```

### Restore from Backup

```bash
# Run restore script
./scripts/restore-database.sh

# Follow the prompts to select a backup file
```

## Monitoring

### Check Resource Usage

```bash
# Check Docker stats
docker stats

# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

## Security Checklist

- [ ] Strong database password set (16+ characters)
- [ ] Strong JWT secret set (32+ characters)
- [ ] Firewall configured (UFW)
- [ ] fail2ban running
- [ ] SSH password authentication disabled
- [ ] SSL certificates configured (for production)
- [ ] Regular backups scheduled
- [ ] Monitoring configured

## Next Steps

1. **Test Environment:**
   - Deploy application
   - Test all features
   - Verify backups work
   - Test rollback procedure

2. **Production Environment:**
   - Deploy application
   - Configure DNS (point domain to 4.210.196.73)
   - Set up SSL certificates
   - Configure automated backups
   - Set up monitoring

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Check GitHub Issues: https://github.com/EmrahCan/budgetapp/issues
- Review documentation in `docs/` folder
