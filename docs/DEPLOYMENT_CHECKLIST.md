# Deployment Checklist

Use this checklist to ensure all steps are completed for deployment.

## Pre-Deployment

### Repository Setup
- [ ] Code pushed to GitHub
- [ ] All tests passing locally
- [ ] No secrets in code
- [ ] .gitignore configured correctly

### GitHub Secrets
- [ ] PROD_VM_HOST set
- [ ] PROD_VM_USER set
- [ ] PROD_VM_PASSWORD set
- [ ] TEST_VM_HOST set
- [ ] TEST_VM_USER set
- [ ] TEST_VM_PASSWORD set

### VM Preparation
- [ ] VMs created and accessible
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] fail2ban installed and configured

### Environment Files
- [ ] .env.test prepared
- [ ] .env.production prepared
- [ ] Strong passwords generated
- [ ] JWT secrets generated
- [ ] API keys obtained (if needed)

### Cloudflare Setup
- [ ] Domain added to Cloudflare
- [ ] Nameservers updated
- [ ] DNS records created (test.budgetapp.site, budgetapp.site)
- [ ] SSL/TLS mode set to "Flexible"
- [ ] "Always Use HTTPS" enabled

## Test Environment Deployment

### Initial Setup
- [ ] SSH into test VM
- [ ] Clone repository
- [ ] Create .env file
- [ ] Secure .env file (chmod 600)
- [ ] Setup log directories
- [ ] Make scripts executable

### Docker Deployment
- [ ] Pull Docker images
- [ ] Build containers
- [ ] Start all services
- [ ] Verify 4 containers running
- [ ] Check container logs

### Health Verification
- [ ] Run health check script
- [ ] Test local endpoints (localhost)
- [ ] All services responding

### Automation Setup
- [ ] Setup cron jobs
- [ ] Setup log rotation
- [ ] Create initial backup
- [ ] Verify cron jobs installed

### External Access
- [ ] DNS propagated
- [ ] HTTPS working
- [ ] Application accessible via domain
- [ ] SSL certificate valid

### Testing
- [ ] Run smoke tests
- [ ] Register test user
- [ ] Login works
- [ ] Create transaction
- [ ] View reports
- [ ] Test all major features

### Monitoring
- [ ] Resource monitoring active
- [ ] Health checks running
- [ ] Logs being written
- [ ] Backups working

### 24-Hour Monitoring
- [ ] No errors in logs
- [ ] All services stable
- [ ] Resources within limits
- [ ] Backups successful

## Production Environment Deployment

### Pre-Production
- [ ] Test environment stable for 24+ hours
- [ ] All issues resolved
- [ ] Documentation updated
- [ ] Rollback procedure tested

### Initial Setup
- [ ] SSH into production VM
- [ ] Clone repository
- [ ] Create .env.production file
- [ ] Secure .env file
- [ ] Setup log directories
- [ ] Make scripts executable

### Docker Deployment
- [ ] Pull Docker images
- [ ] Build containers
- [ ] Start all services
- [ ] Verify 4 containers running
- [ ] Check container logs

### Health Verification
- [ ] Run health check script
- [ ] Test local endpoints
- [ ] All services responding

### Automation Setup
- [ ] Setup cron jobs
- [ ] Setup log rotation
- [ ] Create initial backup
- [ ] Verify automation

### External Access
- [ ] DNS propagated
- [ ] HTTPS working
- [ ] Application accessible via budgetapp.site
- [ ] SSL certificate valid

### Testing
- [ ] Run smoke tests
- [ ] Test all features
- [ ] Performance acceptable
- [ ] No errors

### Monitoring
- [ ] Resource monitoring active
- [ ] Health checks running
- [ ] Logs being written
- [ ] Backups working
- [ ] Alerts configured

## CI/CD Pipeline Testing

### Test Environment Pipeline
- [ ] Push to develop branch
- [ ] GitHub Actions triggered
- [ ] Tests run successfully
- [ ] Deployment to test VM succeeds
- [ ] Health checks pass
- [ ] Application updated

### Production Environment Pipeline
- [ ] Push to main branch
- [ ] GitHub Actions triggered
- [ ] Tests run successfully
- [ ] Deployment to production VM succeeds
- [ ] Zero-downtime deployment
- [ ] Health checks pass
- [ ] Application updated

### Rollback Testing
- [ ] Test rollback on test environment
- [ ] Verify rollback works
- [ ] Application restored to previous version
- [ ] Document rollback procedure

## Security Hardening

### Firewall
- [ ] UFW active
- [ ] Only ports 22, 80, 443 open
- [ ] Default deny incoming
- [ ] Default allow outgoing

### SSH
- [ ] Password authentication disabled (optional)
- [ ] SSH keys configured (optional)
- [ ] fail2ban active
- [ ] No root login

### Docker
- [ ] Containers run as non-root
- [ ] Resource limits set
- [ ] Images scanned for vulnerabilities
- [ ] No secrets in images

### Application
- [ ] No secrets in code
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS prevention

### Cloudflare
- [ ] DDoS protection active
- [ ] WAF enabled
- [ ] Bot protection enabled
- [ ] Security level set

## Performance Testing

### Load Testing
- [ ] Install load testing tool
- [ ] Run load test (100 concurrent users)
- [ ] Monitor CPU usage
- [ ] Monitor memory usage
- [ ] Monitor response times
- [ ] Identify bottlenecks
- [ ] Document baseline performance

### Optimization
- [ ] Database indexes added
- [ ] Caching implemented (if needed)
- [ ] Static assets optimized
- [ ] Gzip compression enabled

## Final Verification

### Functionality
- [ ] All features working
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Cross-browser compatible

### Monitoring
- [ ] All monitoring active
- [ ] Alerts configured
- [ ] Logs accessible
- [ ] Backups verified

### Documentation
- [ ] README updated
- [ ] Deployment guide complete
- [ ] Troubleshooting guide available
- [ ] Runbooks created

### Backup & Recovery
- [ ] Automated backups working
- [ ] Backup restoration tested
- [ ] Backup retention configured
- [ ] Backup monitoring active

### Team Readiness
- [ ] Team trained on deployment
- [ ] Team trained on monitoring
- [ ] Team trained on troubleshooting
- [ ] On-call rotation established

## Production Launch

### Pre-Launch
- [ ] All checklist items complete
- [ ] Stakeholder approval obtained
- [ ] Launch plan documented
- [ ] Rollback plan ready

### Launch
- [ ] DNS switched to production
- [ ] Monitor for issues
- [ ] Verify all features
- [ ] Check performance
- [ ] Monitor logs

### Post-Launch (First 24 Hours)
- [ ] Monitor continuously
- [ ] Check logs every hour
- [ ] Verify backups
- [ ] Check performance
- [ ] Address any issues immediately

### Post-Launch (First Week)
- [ ] Daily monitoring
- [ ] Review logs daily
- [ ] Check backups daily
- [ ] Monitor performance
- [ ] Gather user feedback

## Ongoing Maintenance

### Daily
- [ ] Check monitoring dashboard
- [ ] Review error logs
- [ ] Verify backups
- [ ] Check system resources

### Weekly
- [ ] Review performance metrics
- [ ] Analyze traffic patterns
- [ ] Check security logs
- [ ] Update dependencies

### Monthly
- [ ] Security audit
- [ ] Performance review
- [ ] Backup restoration test
- [ ] Documentation update
- [ ] Team retrospective

