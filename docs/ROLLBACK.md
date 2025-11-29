# Rollback Procedure

This document describes how to rollback the Budget App to a previous version in case of deployment issues.

## When to Rollback

Consider rolling back when:
- ❌ New deployment causes critical bugs
- ❌ Services fail to start after deployment
- ❌ Database migration fails
- ❌ Performance degradation is severe
- ❌ Security vulnerability is discovered

## Rollback Methods

### Method 1: Automated Rollback Script (Recommended)

The fastest way to rollback is using the automated script:

```bash
cd ~/budgetapp
./scripts/rollback.sh
```

This script will:
1. Create a database backup (safety measure)
2. Checkout the previous commit
3. Rebuild Docker images
4. Restart all services
5. Verify health checks
6. Clean up old images

**Follow the prompts carefully!**

### Method 2: Manual Rollback

If the automated script fails, follow these manual steps:

#### Step 1: Create Database Backup

```bash
cd ~/budgetapp
./scripts/backup-database.sh
```

#### Step 2: Identify Previous Commit

```bash
# View recent commits
git log --oneline -10

# Note the commit hash you want to rollback to
```

#### Step 3: Checkout Previous Version

```bash
# Checkout specific commit
git checkout <commit-hash>

# Or rollback one commit
git checkout HEAD~1
```

#### Step 4: Rebuild and Restart

```bash
# Stop all services
docker-compose down

# Rebuild images
docker-compose build --no-cache

# Start services
docker-compose up -d
```

#### Step 5: Verify Services

```bash
# Wait for services to start
sleep 20

# Check health
curl http://localhost/health
curl http://localhost/api/health

# Check logs if needed
docker-compose logs -f
```

#### Step 6: Make Rollback Permanent (Optional)

If you want to make the rollback permanent:

```bash
# Get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Reset branch to current commit
git checkout main  # or develop for test
git reset --hard <commit-hash>

# Force push (DANGEROUS - coordinate with team!)
git push origin main --force
```

## Rollback Scenarios

### Scenario 1: Backend Deployment Failed

If only backend failed:

```bash
cd ~/budgetapp

# Checkout previous version
git checkout HEAD~1

# Rebuild only backend
docker-compose build --no-cache backend

# Restart backend
docker-compose up -d --no-deps backend

# Verify
curl http://localhost/api/health
```

### Scenario 2: Frontend Deployment Failed

If only frontend failed:

```bash
cd ~/budgetapp

# Checkout previous version
git checkout HEAD~1

# Rebuild only frontend
docker-compose build --no-cache frontend

# Restart frontend
docker-compose up -d --no-deps frontend

# Verify
curl http://localhost/
```

### Scenario 3: Database Migration Failed

If database migration caused issues:

```bash
cd ~/budgetapp

# List available backups
ls -lh backups/

# Restore from backup
./scripts/restore-database.sh backups/budget_db_YYYYMMDD_HHMMSS.sql.gz

# Rollback code
git checkout HEAD~1
docker-compose build --no-cache
docker-compose up -d
```

### Scenario 4: Complete System Failure

If everything is broken:

```bash
cd ~/budgetapp

# Stop everything
docker-compose down

# Restore database from backup
./scripts/restore-database.sh backups/budget_db_YYYYMMDD_HHMMSS.sql.gz

# Checkout previous version
git checkout HEAD~1

# Remove all images and start fresh
docker-compose down --rmi all
docker-compose build --no-cache
docker-compose up -d

# Monitor logs
docker-compose logs -f
```

## Verification Checklist

After rollback, verify:

- [ ] All containers are running: `docker-compose ps`
- [ ] Health endpoints respond:
  - [ ] `curl http://localhost/health`
  - [ ] `curl http://localhost/api/health`
- [ ] Frontend loads: `curl http://localhost/`
- [ ] Database is accessible: `docker-compose exec database psql -U budget_admin -d budget_app_prod -c "SELECT 1"`
- [ ] Login works (test in browser)
- [ ] Critical features work (test manually)
- [ ] No errors in logs: `docker-compose logs --tail=100`

## Post-Rollback Actions

### 1. Notify Team

Inform the team about the rollback:
- What was rolled back
- Why it was rolled back
- Current system status
- Next steps

### 2. Investigate Root Cause

```bash
# Check logs from failed deployment
docker-compose logs --tail=500 > rollback_logs.txt

# Review recent commits
git log --oneline -10

# Check for differences
git diff HEAD HEAD~1
```

### 3. Document Issues

Create a post-mortem document:
- What went wrong
- Why it went wrong
- How to prevent it
- Lessons learned

### 4. Plan Fix

Before redeploying:
- Fix the root cause
- Test thoroughly in test environment
- Review changes with team
- Plan deployment timing

## Emergency Contacts

If rollback fails or you need help:

1. **Check Documentation**: Review all docs in `docs/` folder
2. **Check Logs**: `docker-compose logs`
3. **Check GitHub Issues**: https://github.com/EmrahCan/budgetapp/issues
4. **Contact Team**: [Add team contact info]

## Rollback Testing

Test rollback procedure regularly in test environment:

```bash
# On test VM (108.141.152.224)
ssh obiwan@108.141.152.224
cd ~/budgetapp

# Test rollback
./scripts/rollback.sh

# Verify everything works
# Then deploy latest version again
git checkout develop
git pull origin develop
docker-compose build --no-cache
docker-compose up -d
```

## Prevention Tips

To minimize need for rollbacks:

1. **Always test in test environment first**
2. **Use feature flags for risky changes**
3. **Deploy during low-traffic periods**
4. **Have team member on standby during deployment**
5. **Monitor logs during and after deployment**
6. **Keep database backups recent**
7. **Document all changes**
8. **Use semantic versioning**
9. **Run smoke tests after deployment**
10. **Have rollback plan ready before deploying**

## Rollback Time Estimates

- **Automated script**: 2-5 minutes
- **Manual rollback**: 5-10 minutes
- **With database restore**: 10-20 minutes
- **Complete system rebuild**: 15-30 minutes

## Important Notes

⚠️ **Rollback does NOT automatically:**
- Restore database (unless you explicitly restore from backup)
- Notify users of downtime
- Update DNS records
- Revert external service configurations

⚠️ **After rollback:**
- System will be in "detached HEAD" state
- Need to decide: make permanent or temporary
- Coordinate with team before force pushing

⚠️ **Database considerations:**
- Rollback code ≠ Rollback database
- Database migrations may be irreversible
- Always backup before rollback
- Test database restore procedure regularly

## Success Criteria

Rollback is successful when:
- ✅ All services are running and healthy
- ✅ Application is accessible
- ✅ No errors in logs
- ✅ Critical features work
- ✅ Performance is acceptable
- ✅ Team is notified
- ✅ Root cause is identified
- ✅ Fix is planned
